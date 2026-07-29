"use client";
import { FormEvent, useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
const money = (n: number) => new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
export default function WorkersPage() {
    const { workers, projects, attendance, fetchAll, addWorker, checkInWorker, checkOutWorker } = useAppStore();
    const [projectId, setProjectId] = useState(0);
    useEffect(() => { fetchAll() }, [fetchAll]);
    useEffect(() => { if (!projectId && projects[0]?.id) setProjectId(projects[0].id) }, [projects, projectId]);
    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        await addWorker({ name: String(f.get("name")), dailyWage: Number(f.get("dailyWage")) }); e.currentTarget.reset()
    };
    const todays = attendance.filter(a => a.date === new Date().toISOString().slice(0, 10));
    return <div className="grid gap-5"><div><h1 className="text-2xl font-bold">Ishchilar</h1><p className="text-sm text-zinc-500">Bugun obyektga kelganlar va ish haqi</p></div><form onSubmit={submit} className="grid grid-cols-[1fr_110px_auto] gap-2"><input required name="name" placeholder="Ism" className="field" /><input required min="0" type="number" name="dailyWage" placeholder="Kunlik" className="field" /><button className="rounded-xl bg-[#FFD700] px-3 font-bold text-black">Qo‘shish</button></form><select value={projectId} onChange={e => setProjectId(Number(e.target.value))} className="field">{projects.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.clientName}</option>)}</select><div className="grid gap-3">{workers.filter(w => w.status === "active").map(w => { const a = todays.find(x => x.workerId === w.id && x.projectId === projectId); const total = attendance.filter(x => x.workerId === w.id).reduce((s, x) => s + w.dailyWage * x.multiplier, 0); return <div key={w.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#C0C0C0]/25 dark:bg-zinc-950"><div className="flex justify-between"><b>{w.name}</b><span className="text-sm text-zinc-500">Jami: {money(total)}</span></div><p className="my-2 text-sm">Kunlik: {money(w.dailyWage)} {a && <span className="text-amber-600 dark:text-[#FFD700]">· {a.status === "arrived" ? "Obyektda" : "Ketdi"}</span>}</p>{a?.status === "arrived" ? <button onClick={() => checkOutWorker(a.id!)} className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-500">Ketdim</button> : <div className="flex gap-2">{([1, .75, .5, .25] as const).map(m => <button key={m} disabled={!projectId} onClick={() => checkInWorker(w.id!, projectId, m)} className="rounded-lg border border-[#FFD700]/50 px-2 py-2 text-xs dark:text-[#FFD700]">Keldim {m}</button>)}</div>}</div> })}</div>
    </div>
}
