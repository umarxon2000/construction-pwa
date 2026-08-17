"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CurrencyInput } from "@/components/currency-input"; // Yangi input komponenti

// Raqamlarni vergul bilan chiroyli formatda ko'rsatish
const money = (n: number) => new Intl.NumberFormat("en-US").format(n) + " so'm";

export default function ProjectsPage() {
  const { projects, expenses, fetchAll, addProject } = useAppStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Yangi loyiha qo'shish funksiyasi
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    
    await addProject({
      clientName: String(f.get("clientName")),
      location: String(f.get("location")),
      clientPhone: String(f.get("clientPhone")),
      totalEarned: Number(f.get("totalEarned")),
      advances: 0,
      contractType: f.get("contractType") as "labor_only" | "labor_and_materials",
    });
    
    e.currentTarget.reset();
    setOpen(false);
  };

  // Faqat aktiv loyihalarni ajratib olish
  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <>
      {/* Sarlavha va Yangi qo'shish tugmasi */}
      <div className="mb-5 flex justify-between items-center">
        <div>
          <p className="text-sm text-zinc-500">Barcha qurilish obyektlari</p>
          <h1 className="text-2xl font-bold">Loyihalar</h1>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-[#FFD700] dark:border dark:border-[#FFD700]/50"
        >
          <Plus size={17} /> Yangi
        </button>
      </div>

      {/* Yangi loyiha qo'shish formasi (agar tugma bosilsa ochiladi) */}
      {open && (
        <form
          onSubmit={save}
          className="mb-5 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#FFD700]/25 dark:bg-zinc-950"
        >
          <input
            required
            name="clientName"
            placeholder="Mijoz ismi, masalan: Ali Valiyev"
            className="field"
          />
          <input
            required
            name="location"
            placeholder="Obyekt manzili"
            className="field"
          />
          <input
            required
            name="clientPhone"
            placeholder="Mijoz telefon raqami"
            className="field"
          />
          
          {/* Vergul bilan raqam yozish uchun maxsus input */}
          <CurrencyInput
            required
            name="totalEarned"
            placeholder="Mijoz bilan kelishilgan jami summa"
            className="field"
          />
          
          <select name="contractType" className="field">
            <option value="labor_only">Faqat ish haqi — materialni mijoz oladi</option>
            <option value="labor_and_materials">Ish haqi + material — materialni biz olamiz</option>
          </select>
          
          <button className="rounded-xl bg-[#FFD700] py-3 font-bold text-black">
            Loyihani saqlash
          </button>
        </form>
      )}

      {/* Loyihalar ro'yxati */}
      <div className="grid gap-3">
        {activeProjects.map((p) => {
          // Shu loyihaga qilingan jami xarajatlarni hisoblash
          const spent = expenses
            .filter((e) => e.projectId === p.id)
            .reduce((s, e) => s + e.amount, 0);

          return (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#C0C0C0]/25 dark:bg-zinc-950 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex justify-between">
                <b>{p.clientName}</b>
                <b className="text-amber-600 dark:text-[#FFD700]">
                  {money(p.totalEarned - spent)}
                </b>
              </div>
              <p className="mt-2 flex gap-1 text-sm text-zinc-500">
                <MapPin size={14} />
                {p.location}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {p.contractType === "labor_and_materials"
                  ? "Ish haqi + material"
                  : "Faqat ish haqi"}
              </p>
            </Link>
          );
        })}

        {/* Agar faol loyiha bo'lmasa */}
        {!activeProjects.length && (
          <p className="text-zinc-500 text-center mt-5">Faol loyiha yo‘q.</p>
        )}
      </div>
    </>
  );
}