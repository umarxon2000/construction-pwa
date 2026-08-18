"use client";
import { create } from "zustand";
import { 
  db, today, type Attendance, type CustomerPayment, 
  type Expense, type ExpenseCategory, type Project, 
  type Worker, type WorkerPayment 
} from "@/lib/db";

type ProjectInput = Omit<Project, "id" | "status" | "createdAt">; 
type ExpenseInput = Omit<Expense, "id" | "date">; 
type WorkerInput = Omit<Worker, "id" | "status">;

interface AppState { 
  projects: Project[]; 
  expenses: Expense[]; 
  workers: Worker[]; 
  attendance: Attendance[]; 
  payments: WorkerPayment[]; 
  customerPayments: CustomerPayment[]; 
  loading: boolean; 
  
  fetchAll: () => Promise<void>; 
  addProject: (input: ProjectInput) => Promise<number>; 
  addExpense: (input: ExpenseInput) => Promise<void>; 
  addWorker: (input: WorkerInput) => Promise<void>; 
  addPayment: (workerId: number, amount: number, note: string, date?: string) => Promise<void>; 
  addCustomerPayment: (projectId: number, amount: number, note: string, date?: string) => Promise<void>; 
  finishProject: (id: number) => Promise<void>; 
  checkInWorker: (workerId: number, projectId: number, multiplier: Attendance["multiplier"], date?: string) => Promise<void>; 
  checkOutWorker: (attendanceId: number) => Promise<void>; 
  editAttendance: (attendanceId: number, multiplier: Attendance["multiplier"], status: Attendance["status"]) => Promise<void>; 
  
  // TAHRIRLASH VA O'CHIRISH FUNKSIYALARI
  updateProject: (id: number, data: Partial<ProjectInput>) => Promise<void>;
  
  // Xarajatni tahrirlash (tarixi bilan birga)
  updateExpense: (id: number, data: Partial<ExpenseInput> & { editHistory?: { updatedAt: string, reason: string }[] }) => Promise<void>;
  
  updateWorker: (id: number, data: Partial<WorkerInput>) => Promise<void>;
  // Yangi funksiya: ishchini royxatdan o'chirish (statusni 'inactive' ga o'zgartiradi)
  deleteWorker: (id: number) => Promise<void>;
  updatePayment: (id: number, amount: number, note: string, date: string) => Promise<void>;
  deletePayment: (id: number) => Promise<void>;
  updateCustomerPayment: (id: number, amount: number, note: string, date: string) => Promise<void>;
  deleteCustomerPayment: (id: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({ 
  projects: [], expenses: [], workers: [], attendance: [], payments: [], customerPayments: [], loading: true,
  
  fetchAll: async () => { 
    const [projects, expenses, workers, attendance, payments, customerPayments] = await Promise.all([
      db.projects.reverse().sortBy("createdAt"), db.expenses.reverse().sortBy("date"), db.workers.toArray(), 
      db.attendance.reverse().sortBy("date"), db.payments.reverse().sortBy("date"), db.customerPayments.reverse().sortBy("date")
    ]); 
    set({ projects, expenses, workers, attendance, payments, customerPayments, loading: false }); 
  },
  
  addProject: async (input) => { 
    const id = await db.projects.add({ ...input, contractType: input.contractType || "labor_only", status: "active", createdAt: new Date().toISOString() }); 
    await get().fetchAll(); return id as number; 
  },
  addExpense: async (input) => { await db.expenses.add({ ...input, date: today() }); await get().fetchAll(); }, 
  addWorker: async (input) => { await db.workers.add({ ...input, status: "active" }); await get().fetchAll(); },
  addPayment: async (workerId, amount, note, date) => { await db.payments.add({ workerId, amount, note, date: date || today(), createdAt: new Date().toISOString() }); await get().fetchAll(); }, 
  addCustomerPayment: async (projectId, amount, note, date) => { await db.customerPayments.add({ projectId, amount, note, date: date || today(), createdAt: new Date().toISOString() }); await get().fetchAll(); },
  finishProject: async (id) => { await db.projects.update(id, { status: "finished", finishedAt: new Date().toISOString() }); await get().fetchAll(); },
  
  checkInWorker: async (workerId, projectId, multiplier, selectedDate) => { 
    const date = selectedDate || today(); 
    const existing = await db.attendance.where("[workerId+projectId+date]").equals([workerId, projectId, date]).first(); 
    if (existing) await db.attendance.update(existing.id!, { multiplier, status: "arrived", checkedInAt: new Date().toISOString(), checkedOutAt: undefined }); 
    else await db.attendance.add({ workerId, projectId, date, multiplier, status: "arrived", checkedInAt: new Date().toISOString() }); 
    await get().fetchAll(); 
  },
  checkOutWorker: async (attendanceId) => { await db.attendance.update(attendanceId, { status: "left", checkedOutAt: new Date().toISOString() }); await get().fetchAll(); }, 
  editAttendance: async (attendanceId, multiplier, status) => { await db.attendance.update(attendanceId, { multiplier, status, checkedOutAt: status === "left" ? new Date().toISOString() : undefined }); await get().fetchAll(); },

  // YANGI QO'SHILGANLAR
  updateProject: async (id, data) => { await db.projects.update(id, data); await get().fetchAll(); },
  updateExpense: async (id, data) => { await db.expenses.update(id, data); await get().fetchAll(); },
  updateWorker: async (id, data) => { await db.workers.update(id, data); await get().fetchAll(); },
  // Ishchini royxatdan o'chirish — statusni 'inactive' ga o'zgartiradi
  deleteWorker: async (id) => { await db.workers.update(id, { status: "inactive" }); await get().fetchAll(); },
  updatePayment: async (id, amount, note, date) => { await db.payments.update(id, { amount, note, date }); await get().fetchAll(); },
  deletePayment: async (id) => { await db.payments.delete(id); await get().fetchAll(); },
  updateCustomerPayment: async (id, amount, note, date) => { await db.customerPayments.update(id, { amount, note, date }); await get().fetchAll(); },
  deleteCustomerPayment: async (id) => { await db.customerPayments.delete(id); await get().fetchAll(); },
}));

export const expenseCategories: ExpenseCategory[] = ["Material", "Transport", "Workers", "Other"];