import type { Project, Recurrence, Task } from "@/lib/lumen-types";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function toDateKey(date: Date) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 10); }
export function addDays(dateKey: string, amount: number) { const date = new Date(`${dateKey}T12:00:00`); date.setDate(date.getDate() + amount); return toDateKey(date); }
export function formatWeekday(dateKey: string) { return weekdays[new Date(`${dateKey}T12:00:00`).getDay()]; }
export function formatDate(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return `${months[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`; }
export function formatCompactDate(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return `${months[date.getMonth()].slice(0, 3)} ${date.getDate()}`; }
export function formatMonth(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return `${months[date.getMonth()]} ${date.getFullYear()}`; }
export function dayAbbreviation(dateKey: string) { return formatWeekday(dateKey).slice(0, 3).toUpperCase(); }
export function projectProgress(projectId: string, tasks: Task[]) { const selected = tasks.filter((task) => task.projectId === projectId); return selected.length ? Math.round((selected.filter((task) => task.completed).length / selected.length) * 100) : 0; }
export function getProject(projects: Project[], projectId: string) { return projects.find((project) => project.id === projectId); }
export function compareTasks(a: Task, b: Task) { if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed); return ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]); }
export function normalizeTags(input: string[]) { return [...new Set(input.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 8); }
export function nextOccurrenceDate(dateKey: string, recurrence: Recurrence) { if (recurrence === "none") return dateKey; const date = new Date(`${dateKey}T12:00:00`); if (recurrence === "daily") date.setDate(date.getDate() + 1); if (recurrence === "weekly") date.setDate(date.getDate() + 7); if (recurrence === "monthly") date.setMonth(date.getMonth() + 1); return toDateKey(date); }
export function nextOccurrenceReminder(reminderAt: string | undefined, dueDate: string) { if (!reminderAt) return undefined; const source = new Date(reminderAt); if (Number.isNaN(source.getTime())) return undefined; const target = new Date(`${dueDate}T12:00:00`); target.setHours(source.getHours(), source.getMinutes(), 0, 0); return target.toISOString(); }
export function monthCells(monthKey: string) { const month = new Date(`${monthKey.slice(0, 7)}-01T12:00:00`); const first = new Date(month.getFullYear(), month.getMonth(), 1); const start = new Date(first); start.setDate(first.getDate() - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const cell = new Date(start); cell.setDate(start.getDate() + index); return toDateKey(cell); }); }
export function shiftMonth(monthKey: string, direction: number) { const date = new Date(`${monthKey.slice(0, 7)}-01T12:00:00`); date.setMonth(date.getMonth() + direction); return toDateKey(date); }
export function matchesTaskFilters(task: Task, priority: Task["priority"] | "all" = "all", tag?: string) { return (priority === "all" || task.priority === priority) && (!tag || (task.tags ?? []).includes(tag)); }
