"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Check, Pencil, WalletCards } from "lucide-react";
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

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // --- XATONI TO'G'IRLASH QISMI (Derived State) ---
  // useEffect o'rniga, aktiv loyihalarni render vaqtida ajratib olamiz
  const activeProjects = projects.filter((project) => project.status === "active");
  const defaultProjectId = activeProjects.length > 0 ? activeProjects[0].id! : 0;

  // Foydalanuvchi o'zi tanlagan ID ni saqlash uchun state (boshida null bo'ladi)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Asosiy ishlatiladigan loyiha ID si:
  // Agar foydalanuvchi biror narsa tanlagan bo'lsa (selectedProjectId), shuni oladi,
  // Agar hali tanlamagan bo'lsa (null), avtomatik birinchi aktiv loyihani (defaultProjectId) oladi.
  const projectId = selectedProjectId !== null ? selectedProjectId : defaultProjectId;

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
          value={projectId} // Yuqorida hisoblangan projectId ni ulaymiz
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
                  <div>
                    <h2 className="font-bold">{worker.name}</h2>
                    <p className="text-sm text-zinc-500">
                      Kunlik: {money(worker.dailyWage)}
                    </p>
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
                              ? "border-[#FFD700] bg-[#FFD700] text-black"
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
    </div>
  );
}