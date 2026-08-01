"use client";

import { FormEvent, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { expenseCategories, useAppStore } from "@/lib/store";

// Pullarni O'zbekiston so'mi formatida ko'rsatish uchun yordamchi funksiya
const money = (n: number) => new Intl.NumberFormat("uz-UZ").format(n) + " so'm";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const router = useRouter();

  // Store'dan kerakli ma'lumotlar va funksiyalarni chaqirib olish
  const {
    projects,
    expenses,
    workers,
    attendance,
    payments,
    customerPayments,
    fetchAll,
    addExpense,
    addCustomerPayment,
    finishProject,
  } = useAppStore();

  // Komponent yuklanganda barcha ma'lumotlarni yangilash
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Joriy loyihani topish
  const project = projects.find((p) => p.id === projectId);

  // Agar loyiha topilmasa, yuklanmoqda yozuvini ko'rsatish
  if (!project) return <p>Yuklanmoqda…</p>;

  // Joriy loyihaga tegishli barcha xarajatlar ro'yxati
  const list = expenses.filter((e) => e.projectId === projectId);

  // 1. Material xarajatlarini hisoblash (Faqat "Ish haqi + material" shartnomasida)
  const material =
    project.contractType === "labor_and_materials"
      ? list
          .filter((e) => e.category === "Material")
          .reduce((s, e) => s + e.amount, 0)
      : 0;

  // 2. Boshqa barcha xarajatlarni hisoblash (Materialdan tashqari)
  const other = list
    .filter((e) => e.category !== "Material")
    .reduce((s, e) => s + e.amount, 0);

  // 3. Ishchilarga berilishi kerak bo'lgan umumiy maoshni hisoblash
  const earned = attendance
    .filter((a) => a.projectId === projectId)
    .reduce(
      (s, a) =>
        s +
        (workers.find((w) => w.id === a.workerId)?.dailyWage || 0) *
          a.multiplier,
      0
    );

  // 4. Mijozdan olingan jami to'lovlarni hisoblash
  const received = customerPayments
    .filter((p) => p.projectId === projectId)
    .reduce((s, p) => s + p.amount, 0);

  // --- FORM FUNKSIYALARI ---

  // Xarajat qo'shish formasini yuborish funksiyasi
  const submitExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // Formani o'zgaruvchiga saqlaymiz (xatolikni oldini olish uchun)
    const f = new FormData(form);
    
    await addExpense({
      projectId,
      category: String(f.get("category")) as typeof expenseCategories[number],
      amount: Number(f.get("amount")),
      description: String(f.get("description")),
    });
    
    form.reset(); // Inputlarni tozalash
  };

  // Mijozdan to'lov qabul qilish formasini yuborish funksiyasi
  const receive = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // Formani o'zgaruvchiga saqlaymiz
    const f = new FormData(form);
    
    await addCustomerPayment(
      projectId,
      Number(f.get("amount")),
      String(f.get("note"))
    );
    
    form.reset(); // Inputlarni tozalash
  };

  // --- ISHCHILAR HISOBOTI ---

  // Har bir ishchi uchun ishlagan kunlari va maoshini hisoblab chiqish
  const workerRows = workers
    .map((w) => {
      const rows = attendance.filter(
        (a) => a.projectId === projectId && a.workerId === w.id
      );
      const days = rows.reduce((s, a) => s + a.multiplier, 0);
      const due = days * w.dailyWage; // Berilishi kerak bo'lgan summa
      const paid = payments
        .filter((p) => p.workerId === w.id)
        .reduce((s, p) => s + p.amount, 0); // Berilgan summa
      return { w, days, due, paid };
    })
    .filter((r) => r.days > 0); // Faqat shu obyektdagi ishlaganlarni ajratib olish

  // Foydani hisoblash (Jami kelishuv - materiallar - boshqa xarajatlar - ishchilar haqi)
  const profit = project.totalEarned - material - other - earned;

  return (
    <div className="grid gap-5">
      {/* Loyiha sarlavhasi va ma'lumotlari */}
      <div>
        <p className="text-sm text-zinc-500">
          {project.location} ·{" "}
          {project.contractType === "labor_and_materials"
            ? "Ish haqi + material"
            : "Faqat ish haqi"}
        </p>
        <h1 className="text-2xl font-bold">{project.clientName}</h1>
      </div>

      {/* Asosiy statistikalar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat t="Kelishuv" v={money(project.totalEarned)} />
        <Stat t="Olingan" v={money(received)} />
        <Stat t="Mijoz qarzi" v={money(project.totalEarned - received)} />
      </div>

      {/* Faol loyiha uchun to'lov va xarajat formalar */}
      {project.status === "active" && (
        <>
          <form
            onSubmit={receive}
            className="grid gap-2 rounded-2xl border p-4 dark:border-[#FFD700]/25"
          >
            <b>Mijozdan pul qabul qilish</b>
            <input
              required
              name="amount"
              type="number"
              min="0"
              placeholder="Olingan summa"
              className="field"
            />
            <input
              name="note"
              placeholder="Izoh, masalan: 2-avans"
              className="field"
            />
            <button className="rounded-xl bg-[#FFD700] py-2 font-bold text-black">
              To‘lovni saqlash
            </button>
          </form>

          <form
            onSubmit={submitExpense}
            className="grid gap-2 rounded-2xl border p-4 dark:border-[#FFD700]/25"
          >
            <b>Xarajat qo‘shish</b>
            <select name="category" className="field">
              {expenseCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              required
              name="amount"
              type="number"
              min="0"
              placeholder="Xarajat summasi"
              className="field"
            />
            <input
              name="description"
              placeholder="Izoh yoki chek raqami"
              className="field"
            />
            <button className="rounded-xl border border-[#FFD700] py-2 font-bold dark:text-[#FFD700]">
              Xarajatni saqlash
            </button>
          </form>
        </>
      )}

      {/* Ishchilar ro'yxati va ularning haqi */}
      <section className="rounded-2xl border p-4 dark:border-[#FFD700]/25">
        <h2 className="font-bold">Ishchilar bo‘yicha yakun</h2>
        {workerRows.map(({ w, days, due, paid }) => (
          <div key={w.id} className="border-b py-3 text-sm dark:border-zinc-800">
            <b>{w.name}</b>
            <p>
              {days} kun · Hisoblangan: {money(due)}
            </p>
            <p>
              Berilgan: {money(paid)} ·{" "}
              <span className="text-red-500">
                Berilishi kerak: {money(Math.max(0, due - paid))}
              </span>
            </p>
          </div>
        ))}
      </section>

      {/* Loyiha yakunlanganda chiqadigan yakuniy hisobot */}
      {project.status === "finished" && (
        <section className="rounded-2xl border border-[#FFD700]/50 p-4">
          <h2 className="text-lg font-bold">Yakuniy hisobot</h2>
          <Line t="Kelishilgan mablag‘" v={project.totalEarned} />
          <Line t="Mijozdan olingan" v={received} />
          <Line t="Mijoz qarzdorligi" v={project.totalEarned - received} />
          {project.contractType === "labor_and_materials" && (
            <Line t="Biz olgan materiallar" v={material} />
          )}
          <Line t="Transport va boshqa xarajat" v={other} />
          <Line t="Ishchilar hisoblangan maoshi" v={earned} />
          <Line t="Sof foyda" v={profit} />
          
          {/* Chekni chop etish tugmasi */}
          <button
            onClick={() => window.print()}
            className="mt-3 flex w-full justify-center gap-2 rounded-xl bg-black py-2 text-white dark:bg-[#FFD700] dark:text-black"
          >
            <Printer size={17} />
            Chop etish
          </button>
        </section>
      )}

      {/* Loyihani yakunlash tugmasi */}
      {project.status === "active" && (
        <button
          onClick={async () => {
            await finishProject(projectId);
            router.refresh();
          }}
          className="rounded-xl border border-red-500 py-3 text-red-500"
        >
          Ishni yakunlash
        </button>
      )}
    </div>
  );
}

// --- YORDAMCHI KOMPONENTLAR ---

// Kichik statistika bloklarini chizish uchun komponent
function Stat({ t, v }: { t: string; v: string }) {
  return (
    <div className="rounded-xl bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
      <p className="text-zinc-500">{t}</p>
      <b className="block pt-1 text-[11px]">{v}</b>
    </div>
  );
}

// Yakuniy hisobotdagi qatorlarni chizish uchun komponent
function Line({ t, v }: { t: string; v: number }) {
  return (
    <p className="flex justify-between border-b py-2 text-sm dark:border-zinc-800">
      <span>{t}</span>
      <b>{money(v)}</b>
    </p>
  );
}