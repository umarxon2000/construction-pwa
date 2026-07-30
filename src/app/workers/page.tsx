"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Check, Pencil, WalletCards } from "lucide-react";
import { useAppStore } from "@/lib/store";

const money = (value: number) => new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
const fractions = [
  { value: 1, label: "To‘liq kun" },
  { value: 0.75, label: "0.75 kun" },
  { value: 0.5, label: "Yarim kun" },
  { value: 0.25, label: "0.25 kun" },
] as const;

export default function WorkersPage() {
  const { workers, projects, attendance, fetchAll, addWorker, checkInWorker, checkOutWorker, editAttendance } = useAppStore();
  const [projectId, setProjectId] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (!projectId && projects.find((project) => project.status === "active")?.id) setProjectId(projects.find((project) => project.status === "active")!.id!); }, [projects, projectId]);

  const addNewWorker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await addWorker({ name: String(form.get("name")), dailyWage: Number(form.get("dailyWage")) });
    event.currentTarget.reset();
  };

  const dayAttendance = attendance.filter((item) => item.date === date && item.projectId === projectId);

  return <div className="grid gap-5">
    <div><h1 className="text-2xl font-bold">Ishchilar davomatı</h1><p className="text-sm text-zinc-500">Sana va obyektni tanlang, keyin kelgan ishchilarni belgilang.</p></div>

    <form onSubmit={addNewWorker} className="grid grid-cols-[1fr_110px_auto] gap-2">
      <input required name="name" placeholder="Ishchi ismi, masalan: Jasur" className="field" />
      <input required min="0" type="number" name="dailyWage" placeholder="Kunlik so‘m" className="field" />
      <button className="rounded-xl bg-[#FFD700] px-3 font-bold text-black">Qo‘shish</button>
    </form>

    <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-[#FFD700]/25 dark:bg-zinc-950">
      <label className="text-sm font-semibold"><CalendarDays className="mr-1 inline" size={16}/>Davomat sanasi</label>
      <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="field" />
      <select value={projectId} onChange={(event) => setProjectId(Number(event.target.value))} className="field">
        <option value="0">Obyektni tanlang</option>
        {projects.filter((project) => project.status === "active").map((project) => <option key={project.id} value={project.id}>{project.clientName} — {project.location}</option>)}
      </select>
    </div>

    <div className="grid gap-3">
      {workers.filter((worker) => worker.status === "active").map((worker) => {
        const record = dayAttendance.find((item) => item.workerId === worker.id);
        const accumulated = attendance.filter((item) => item.workerId === worker.id).reduce((sum, item) => sum + worker.dailyWage * item.multiplier, 0);
        return <article key={worker.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#C0C0C0]/25 dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{worker.name}</h2><p className="text-sm text-zinc-500">Kunlik: {money(worker.dailyWage)}</p></div><p className="text-right text-xs text-zinc-500">Hisoblangan jami<br /><b className="text-sm text-amber-600 dark:text-[#FFD700]">{money(accumulated)}</b></p></div>
          {record ? <div className="mt-3 grid gap-2 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"><Check className="mr-1 inline" size={16}/>Belgilangan: {record.status === "arrived" ? "Obyektda" : "Ketgan"}</p>
            <div className="flex flex-wrap gap-2">{fractions.map((fraction) => <button key={fraction.value} onClick={() => editAttendance(record.id!, fraction.value, record.status)} className={`rounded-lg border px-2 py-1.5 text-xs ${record.multiplier === fraction.value ? "border-[#FFD700] bg-[#FFD700] text-black" : "border-zinc-300 dark:border-[#FFD700]/40"}`}><Pencil className="mr-1 inline" size={12}/>{fraction.label}</button>)}</div>
            {record.status === "arrived" && <button onClick={() => checkOutWorker(record.id!)} className="justify-self-start rounded-lg border border-red-500 px-3 py-2 text-sm text-red-500">Ketdi deb belgilash</button>}
          </div> : <div className="mt-3 flex flex-wrap gap-2">{fractions.map((fraction) => <button disabled={!projectId} key={fraction.value} onClick={() => checkInWorker(worker.id!, projectId, fraction.value, date)} className="rounded-lg border border-[#FFD700]/50 px-2 py-2 text-xs disabled:opacity-40 dark:text-[#FFD700]">Keldi — {fraction.label}</button>)}</div>}
        </article>;
      })}
    </div>
  </div>;
}