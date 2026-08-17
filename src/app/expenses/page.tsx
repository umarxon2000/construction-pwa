"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAppStore } from "@/lib/store";
import { CurrencyInput } from "@/components/currency-input";
import { Edit2, Save, X } from "lucide-react";
import type { Expense } from "@/lib/db";

const money = (n: number) => new Intl.NumberFormat("en-US").format(n) + " so'm";

// Asl Expense tipiga yangi tahrirlash maydonlarini qo'shamiz
type ExtendedExpense = Expense & { editReason?: string; updatedAt?: string };

export default function ExpensesPage() {
  // Store'dan updateExpense ni ham chaqirib olamiz
  const { expenses, projects, fetchAll, updateExpense } = useAppStore();
  
  // Qaysi xarajat tahrirlanayotganini saqlash uchun State
  const [editItem, setEditItem] = useState<ExtendedExpense | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Modal formasi yuborilganda ishlash mantiqi
  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem?.id) return;

    const f = new FormData(e.currentTarget);
    
    await updateExpense(editItem.id, {
      amount: Number(f.get("amount")),
      date: String(f.get("date")),
      description: String(f.get("description")),
      editReason: String(f.get("editReason")), // Nima uchun o'zgardi?
      updatedAt: new Date().toISOString(),     // Qachon o'zgardi?
    });

    setEditItem(null); // Modalni yopish
  };

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold">Barcha xarajatlar</h1>
      
      <div className="grid gap-3 relative">
        {expenses.map((expense) => {
          const e = expense as ExtendedExpense; // Kengaytirilgan tipga o'tkazish
          const projectName = projects.find((p) => p.id === e.projectId)?.clientName;

          return (
            <div
              key={e.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#C0C0C0]/25 dark:bg-zinc-950 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex justify-between items-start">
                <div>
                  <b className="text-lg">{e.category}</b>
                  <p className="mt-1 text-sm text-zinc-500">
                    {projectName} · {e.date}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <b className="text-amber-600 dark:text-[#FFD700]">
                    {money(e.amount)}
                  </b>
                  {/* Tahrirlash tugmasi */}
                  <button 
                    onClick={() => setEditItem(e)}
                    className="rounded-lg bg-zinc-100 p-2 text-zinc-600 hover:text-amber-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-[#FFD700]"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
              
              {e.description && (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <b>Izoh:</b> {e.description}
                </p>
              )}

              {/* Tahrirlanganlik haqida tarixiy ma'lumot (agar mavjud bo'lsa) */}
              {e.updatedAt && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-900/10 dark:text-amber-200 border border-amber-200 dark:border-amber-900/30">
                  <p className="mb-1 flex justify-between">
                    <b>Tahrirlangan vaqt:</b> 
                    <span>{new Date(e.updatedAt).toLocaleString("uz-UZ")}</span>
                  </p>
                  <p><b>Sabab:</b> {e.editReason}</p>
                </div>
              )}
            </div>
          );
        })}

        {expenses.length === 0 && (
          <p className="mt-5 text-center text-zinc-500">
            Hozircha xarajatlar yo‘q.
          </p>
        )}
      </div>

      {/* TAHRIRLASH MODAL OYNASI */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form 
            onSubmit={handleEditSubmit} 
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:border dark:border-[#FFD700]/30 dark:bg-zinc-950"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Xarajatni tahrirlash</h2>
              <button 
                type="button" 
                onClick={() => setEditItem(null)} 
                className="text-zinc-500 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Sanasi</label>
                <input required name="date" type="date" defaultValue={editItem.date} className="field" />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Summasi</label>
                <CurrencyInput required name="amount" defaultValue={editItem.amount} className="field" />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Asosiy izoh / Chek</label>
                <input name="description" defaultValue={editItem.description} className="field" />
              </div>

              {/* AUDIT UCHUN MUHIM MAYDON */}
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
                <label className="text-xs text-red-600 dark:text-red-400 mb-1 block font-bold">
                 {" Nima uchun o'zgartirilyapti? (Majburiy)"}
                </label>
                <input 
                  required 
                  name="editReason" 
                  placeholder="Masalan: summa adashib kiritilgan" 
                  className="field border-red-200 dark:border-red-900/50" 
                  autoFocus
                />
              </div>

              <button type="submit" className="mt-2 flex w-full justify-center gap-2 rounded-xl bg-[#FFD700] py-3 font-bold text-black">
                <Save size={18} /> {"O'zgarishni saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}