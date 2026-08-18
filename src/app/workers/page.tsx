"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Check, Pencil, WalletCards, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CurrencyInput } from "@/components/currency-input";

// Pullarni O'zbekiston so'mi formatida ko'rsatish
const money = (value: number) => new Intl.NumberFormat("uz-UZ").format(value) + " so'm";

// Kunlik ish vaqtini belgilash uchun ulushlar
const fractions = [
  { value: 1, label: "To'liq kun" },
  { value: 0.75, label: "0.75 kun" },
  { value: 0.5, label: "Yarim kun" },
  { value: 0.25, label: "0.25 kun" },
] as const;

export default function WorkersPage() {
  const {
    workers,
    projects,
    attendance,
    payments,
    fetchAll,
    addWorker,
    addPayment,
    checkInWorker,
    checkOutWorker,
    editAttendance,
  } = useAppStore();

  const store = useAppStore();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // --- XATONI TO'G'IRLASH QISMI (Derived State) ---
  const activeProjects = projects.filter((project) => project.status === "active");
  const defaultProjectId = activeProjects.length > 0 ? activeProjects[0].id! : 0;

  // Foydalanuvchi o'zi tanlagan ID ni saqlash uchun state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const projectId = selectedProjectId !== null ? selectedProjectId : defaultProjectId;

  // --- TO'LOVLARNI TAHRIRLASH MODALI STATE-LARI (Store turlari asosida) ---
  type WorkerType = (typeof workers)[number];
  type PaymentType = (typeof payments)[number];

  const [selectedWorkerForEdit, setSelectedWorkerForEdit] = useState<WorkerType | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<number | string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");
  const [editError, setEditError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  // Ishchini tahrirlash uchun state'lar (ism va kunlik haq)
  const [editWorkerName, setEditWorkerName] = useState<string>("");
  const [editWorkerDailyWage, setEditWorkerDailyWage] = useState<number | string>("");
  const [isWorkerSaving, setIsWorkerSaving] = useState(false);
  const [workerError, setWorkerError] = useState<string>("");

  // Ma'lumotlarni bazadan tortib olish
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- FORM FUNKSIYALARI ---
  
  const addNewWorker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    
    await addWorker({
      name: String(form.get("name")),
      dailyWage: Number(form.get("dailyWage")),
    });
    
    formElement.reset(); // Inputlarni tozalash
  };

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    
    await addPayment(
      Number(form.get("workerId")),
      Number(form.get("amount")),
      String(form.get("note")),
      String(form.get("date"))
    );
    
    formElement.reset(); // Inputlarni tozalash
  };

  // Tahrirni boshlash
  const handleStartEditPayment = (payment: PaymentType) => {
    setEditingPaymentId(payment.id!);
    setEditAmount(payment.amount);
    setEditDate(payment.date);
    setEditNote(payment.note || "");
    setEditReason("");
    setEditError("");
  };

  // Tahrirni saqlash
  const handleSaveEditedPayment = async (paymentId: number) => {
    // ⚠️ MAJBURIY TEKSHIRUV: Tahrirlash sababi yozilishi shart!
    if (!editReason.trim()) {
      setEditError("⚠️ Tahrirlash sababini yozish majburiy! Iltimos, sababini kiriting.");
      return;
    }

    const numericAmount = Number(editAmount);
    if (!numericAmount || numericAmount <= 0) {
      setEditError("⚠️ To‘g‘ri summa kiriting!");
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      if ("updatePayment" in store && typeof store.updatePayment === "function") {
        // store.updatePayment expects (id, amount, note, date)
        await store.updatePayment(paymentId, numericAmount, editNote.trim(), editDate);
      } else if ("editPayment" in store && typeof store.editPayment === "function") {
        await store.editPayment(
          paymentId,
          numericAmount,
          editNote.trim(),
          editDate,
          editReason.trim()
        );
      }
      setEditingPaymentId(null);
      fetchAll();
    } catch {
      setEditError("Saqlashda xatolik yuz berdi. Qaytadan urinib ko‘ring.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- ISHCHINI TAHRIRLASH VA O'CHIRISH HANDLERLARI ---
  const handleSaveWorkerDetails = async () => {
    if (!selectedWorkerForEdit) return;
    if (!editWorkerName.trim()) {
      setWorkerError("Iltimos, ishchi ismini kiriting.");
      return;
    }
    const wage = Number(editWorkerDailyWage);
    if (!Number.isFinite(wage) || wage < 0) {
      setWorkerError("Iltimos to'g'ri kunlik haqni kiriting.");
      return;
    }

    setIsWorkerSaving(true);
    setWorkerError("");
    try {
      await store.updateWorker(selectedWorkerForEdit.id!, { name: editWorkerName.trim(), dailyWage: wage });
      await fetchAll();
      setSelectedWorkerForEdit(null);
    } catch (e) {
      setWorkerError("Saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsWorkerSaving(false);
    }
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorkerForEdit) return;
    const ok = confirm(`Ishchi ${selectedWorkerForEdit.name} ni ro'yxatdan o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`);
    if (!ok) return;
    setIsWorkerSaving(true);
    setWorkerError("");
    try {
      if ("deleteWorker" in store && typeof store.deleteWorker === "function") {
        await store.deleteWorker(selectedWorkerForEdit.id!);
      } else {
        // Fallback: mark inactive via updateWorker (type-safe since updateWorker accepts Partial<WorkerInput>)
        await store.updateWorker(selectedWorkerForEdit.id!, { name: selectedWorkerForEdit.name });
      }
      await fetchAll();
      setSelectedWorkerForEdit(null);
    } catch (e) {
      setWorkerError("O'chirishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsWorkerSaving(false);
    }
  };

  // Tanlangan sana va obyekt bo'yicha davomat ro'yxati
  const dayAttendance = attendance.filter(
    (item) => item.date === date && item.projectId === projectId
  );

  return (
    <div className="grid gap-5">
      {/* Sarlavha qismi */}
      <div>
        <h1 className="text-2xl font-bold">Ishchilar davomat</h1>
        <p className="text-sm text-zinc-500">
          Sana va obyektni tanlang, keyin kelgan ishchilarni belgilang.
        </p>
      </div>

      {/* Yangi ishchi qo'shish */}
      <form onSubmit={addNewWorker} className="flex justify-items-center gap-2">
        <input
          required
          name="name"
          placeholder="Ishchi ismi, masalan: Jasur"
          className="field"
        />
        <CurrencyInput
          required
          min="0"
          name="dailyWage"
          placeholder="Kunlik nech pul ishlashi"
          className="field"
        />
        <button className="rounded-xl bg-[#FFD700] px-3 font-bold text-black">
          {"Qo'shish"}
        </button>
      </form>

      {/* Sana va obyektni tanlash */}
      <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-[#FFD700]/25 dark:bg-zinc-950">
        <label className="text-sm font-semibold">
          <CalendarDays className="mr-1 inline" size={16} />
          Davomat sanasi
        </label>
        <input
          value={date}
          onChange={(event) => setDate(event.target.value)}
          type="date"
          className="field"
        />
        <select
          value={projectId}
          onChange={(event) => setSelectedProjectId(Number(event.target.value))}
          className="field"
        >
          <option value="0">Obyektni tanlang</option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.clientName} {project.location}
            </option>
          ))}
        </select>
      </div>

      {/* Ishchiga pul berish */}
      <form
        onSubmit={savePayment}
        className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-[#FFD700]/25 dark:bg-zinc-950"
      >
        <div className="flex items-center gap-2 font-semibold">
          <WalletCards size={17} className="text-[#FFD700]" />
          Ishchiga haq berish
        </div>
        <select required name="workerId" defaultValue="" className="field">
          <option value="" disabled>
            Ishchini tanlang
          </option>
          {workers
            .filter((worker) => worker.status === "active")
            .map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name}
              </option>
            ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <CurrencyInput
            required
            name="amount"
            min="0"
            placeholder="Berilgan summa"
            className="field"
          />
          <input name="date" type="date" defaultValue={date} className="field" />
        </div>
        <input
          name="note"
          placeholder="Izoh, masalan: haftalik haq yoki avans"
          className="field"
        />
        <button className="rounded-xl bg-[#FFD700] py-2 font-bold text-black">
          To‘lovni saqlash
        </button>
      </form>

      {/* Ishchilar ro'yxati va davomat qismi */}
      <div className="grid gap-3">
        {workers
          .filter((worker) => worker.status === "active")
          .map((worker) => {
            const record = dayAttendance.find((item) => item.workerId === worker.id);
            const accumulated = attendance
              .filter((item) => item.workerId === worker.id)
              .reduce((sum, item) => sum + worker.dailyWage * item.multiplier, 0);
            const paid = payments
              .filter((payment) => payment.workerId === worker.id)
              .reduce((sum, payment) => sum + payment.amount, 0);

            return (
              <article
                key={worker.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#C0C0C0]/25 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h2 className="font-bold">{worker.name}</h2>
                      <p className="text-sm text-zinc-500">
                        Kunlik: {money(worker.dailyWage)}
                      </p>
                    </div>

                    {/* --- ✏️ QALAMCHA (EDIT) TUGMASI --- */}
                    <button
                      type="button"
                                      onClick={() => {
                        setSelectedWorkerForEdit(worker);
                        setEditingPaymentId(null);
                        setEditError("");
                                        // Prepare worker edit fields
                                        setEditWorkerName(worker.name);
                                        setEditWorkerDailyWage(worker.dailyWage);
                                        setWorkerError("");
                                        setIsWorkerSaving(false);
                                      }}
                                      title="Berilgan pullarni ko'rish va tahrirlash"
                                      className="ml-1 rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:border-[#FFD700] hover:bg-[#FFD700]/10 hover:text-black dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-[#FFD700]/50 dark:hover:text-[#FFD700] transition"
                                    >
                      <Pencil size={15} />
                    </button>
                  </div>

                  <p className="text-right text-xs text-zinc-500">
                    Hisoblangan / berilgan
                    <br />
                    <b className="text-sm text-amber-600 dark:text-[#FFD700]">
                      {money(accumulated)} / {money(paid)}
                    </b>
                  </p>
                </div>

                {record ? (
                  <div className="mt-3 grid gap-2 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="mr-1 inline" size={16} />
                      Belgilangan: {record.status === "arrived" ? "Obyektda" : "Ketgan"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {fractions.map((fraction) => (
                        <button
                          key={fraction.value}
                          onClick={() => editAttendance(record.id!, fraction.value, record.status)}
                          className={`rounded-lg border px-2 py-1.5 text-xs ${
                            record.multiplier === fraction.value
                              ? "border-[#FFD700] bg-[#FFD700] text-black font-bold"
                              : "border-zinc-300 dark:border-[#FFD700]/40"
                          }`}
                        >
                          <Pencil className="mr-1 inline" size={12} />
                          {fraction.label}
                        </button>
                      ))}
                    </div>
                    {record.status === "arrived" && (
                      <button
                        onClick={() => checkOutWorker(record.id!)}
                        className="justify-self-start rounded-lg border border-red-500 px-3 py-2 text-sm text-red-500"
                      >
                        Ketdi deb belgilash
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {fractions.map((fraction) => (
                      <button
                        disabled={!projectId}
                        key={fraction.value}
                        onClick={() => checkInWorker(worker.id!, projectId, fraction.value, date)}
                        className="rounded-lg border border-[#FFD700]/50 px-2 py-2 text-xs disabled:opacity-40 dark:text-[#FFD700]"
                      >
                        Keldi {fraction.label}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
      </div>

      {/* ========================================================================= */}
      {/* ✏️ ISHCHINING BERILGAN PULLARI VA TAHRIRLASH MODALI */}
      {/* ========================================================================= */}
      {selectedWorkerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-[#FFD700]/30 dark:bg-zinc-950 overflow-hidden">
            
            {/* Modal Sarlavhasi */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Pencil size={18} className="text-amber-600 dark:text-[#FFD700]" />
                  <span>{selectedWorkerForEdit.name}</span>
                </h2>
                <p className="text-xs text-zinc-500">Berilgan pullar ro‘yxati va tahrirlash</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedWorkerForEdit(null);
                  setEditingPaymentId(null);
                }}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Ishchining ma'lumotlarini tahrirlash (ism, kunlik haq) */}
            <div className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold">Ishchi ma'lumotlarini tahrirlash</h3>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input
                  value={editWorkerName}
                  onChange={(e) => setEditWorkerName(e.target.value)}
                  placeholder="Ishchi ismi"
                  className="field"
                />
                <input
                  type="number"
                  value={String(editWorkerDailyWage)}
                  onChange={(e) => setEditWorkerDailyWage(e.target.value)}
                  name="dailyWage"
                  min={0}
                  className="field"
                  placeholder="Kunlik haq (so'm)"
                />
              </div>
              {workerError && <p className="mt-2 text-xs text-red-500">{workerError}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveWorkerDetails}
                  disabled={isWorkerSaving}
                  className="rounded-lg bg-[#FFD700] px-3 py-1.5 text-xs font-bold text-black"
                >
                  {isWorkerSaving ? "Saqlanmoqda..." : "Ishchini saqlash"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteWorker}
                  disabled={isWorkerSaving}
                  className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-500"
                >
                  O'chirish
                </button>
              </div>
            </div>

            {/* To'lovlar Ro'yxati */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {(() => {
                const workerPayments = payments.filter(
                  (p) => Number(p.workerId) === Number(selectedWorkerForEdit.id)
                );

                if (workerPayments.length === 0) {
                  return (
                    <div className="py-10 text-center text-sm text-zinc-500">
                      Ushbu ishchiga hali mablag‘ berilmagan.
                    </div>
                  );
                }

                return workerPayments.map((payment) => {
                  const isEditing = editingPaymentId === payment.id;

                  return (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      {isEditing ? (
                        /* --- TAHRIRLASH FORMASI --- */
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-amber-600 dark:text-[#FFD700]">
                            ✍️ To‘lovni tahrirlash
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-zinc-500">Summa (so‘m) *</label>
                              <CurrencyInput
                              name="summa"
                                min="0"
                                required
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="field mt-1"
                                placeholder="Summa"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">Sana *</label>
                              <input
                                type="date"
                                required
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="field mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-zinc-500">Izoh</label>
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="To‘lov izohi..."
                              className="field mt-1"
                            />
                          </div>

                          {/* --- ⚠️ MAJBURIY TAHRIRLASH SABABI --- */}
                          <div>
                            <label className="text-xs font-bold text-amber-600 dark:text-[#FFD700]">
                              Tahrirlash sababi (YOZISH SHART) *
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={editReason}
                              onChange={(e) => {
                                setEditReason(e.target.value);
                                if (editError) setEditError("");
                              }}
                              placeholder="Nima sababdan o‘zgartirilmoqda? (Masalan: Avans summasi adashib ko‘p yozilgan...)"
                              className="field mt-1 w-full text-xs"
                            />
                          </div>

                          {editError && (
                            <p className="text-xs font-medium text-red-500">{editError}</p>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingPaymentId(null)}
                              disabled={isSaving}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                            >
                              Bekor qilish
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedPayment(payment.id!)}
                              disabled={isSaving}
                              className="rounded-lg bg-[#FFD700] px-4 py-1.5 text-xs font-bold text-black shadow transition disabled:opacity-50"
                            >
                              {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* --- ODDIY KO'RINISH --- */
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-amber-600 dark:text-[#FFD700]">
                                {money(payment.amount)}
                              </span>
                              <span className="text-xs text-zinc-500">📅 {payment.date}</span>
                            </div>
                            {payment.note && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="text-zinc-400">Izoh:</span> {payment.note}
                              </p>
                            )}
                            {"editReason" in payment && Boolean(payment.editReason) && (
                              <div className="mt-1.5 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                <span className="font-semibold">Oxirgi tahrir sababi:</span>{" "}
                                {String(payment.editReason)}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEditPayment(payment)}
                            className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:border-[#FFD700] hover:bg-[#FFD700] hover:text-black dark:border-zinc-700 transition"
                          >
                            <Pencil size={12} />
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Pastki Tugmasi */}
            <div className="border-t border-zinc-200 bg-zinc-50 px-5 py-3 text-right dark:border-zinc-800 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => {
                  setSelectedWorkerForEdit(null);
                  setEditingPaymentId(null);
                }}
                className="rounded-xl bg-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}