"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
const money=(n:number)=>new Intl.NumberFormat("uz-UZ").format(n)+" so'm";
export default function ExpensesPage(){const {expenses,projects,fetchAll}=useAppStore();useEffect(()=>{fetchAll()},[fetchAll]);return <><h1 className="mb-5 text-2xl font-bold">Barcha xarajatlar</h1><div className="grid gap-3">{expenses.map(e=><div key={e.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-[#C0C0C0]/25 dark:bg-zinc-950"><div className="flex justify-between"><b>{e.category}</b><b className="text-amber-600 dark:text-[#FFD700]">{money(e.amount)}</b></div><p className="text-sm text-zinc-500">{projects.find(p=>p.id===e.projectId)?.clientName} · {e.date}</p><p className="text-sm">{e.description}</p></div>)}{!expenses.length&&<p className="text-zinc-500">Xarajatlar yo‘q.</p>}</div></>}
