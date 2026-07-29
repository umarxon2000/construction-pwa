import Dexie, { type EntityTable } from "dexie";

export type ProjectStatus = "active" | "finished";
export type ExpenseCategory = "Material" | "Transport" | "Workers" | "Other";
export type AttendanceStatus = "arrived" | "left";
export interface Project { id?: number; clientName: string; location: string; clientPhone: string; totalEarned: number; advances: number; status: ProjectStatus; createdAt: string; finishedAt?: string; }
export interface Expense { id?: number; projectId: number; category: ExpenseCategory; amount: number; description: string; date: string; }
export interface Worker { id?: number; name: string; dailyWage: number; status: "active" | "inactive"; }
export interface Attendance { id?: number; workerId: number; projectId: number; date: string; multiplier: 1 | 0.75 | 0.5 | 0.25; status: AttendanceStatus; checkedInAt: string; checkedOutAt?: string; }
export interface WorkerPayment { id?: number; workerId: number; amount: number; note: string; date: string; createdAt: string; }
class ConstructionDB extends Dexie {
  projects!: EntityTable<Project, "id">; expenses!: EntityTable<Expense, "id">; workers!: EntityTable<Worker, "id">; attendance!: EntityTable<Attendance, "id">; payments!: EntityTable<WorkerPayment, "id">;
  constructor() { super("ustaProDB"); this.version(1).stores({ projects: "++id, status, createdAt", expenses: "++id, projectId, category, date", workers: "++id, status, name", attendance: "++id, workerId, projectId, date, status, [workerId+projectId+date]" }); this.version(2).stores({ projects: "++id, status, createdAt", expenses: "++id, projectId, category, date", workers: "++id, status, name", attendance: "++id, workerId, projectId, date, status, [workerId+projectId+date]", payments: "++id, workerId, date" }); }
}
export const db = new ConstructionDB();
export const today = () => new Date().toISOString().slice(0, 10);
