import type { Project, Task } from "@/lib/lumen-types";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function toDateKey(date: Date) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 10); }
export function addDays(dateKey: string, amount: number) { const date = new Date(`${dateKey}T12:00:00`); date.setDate(date.getDate() + amount); return toDateKey(date); }
export function formatWeekday(dateKey: string) { return weekdays[new Date(`${dateKey}T12:00:00`).getDay()]; }
export function formatDate(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return `${months[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`; }
export function formatCompactDate(dateKey: string) { const date = new Date(`${dateKey}T12:00:00`); return `${months[date.getMonth()].slice(0, 3)} ${date.getDate()}`; }
export function dayAbbreviation(dateKey: string) { return formatWeekday(dateKey).slice(0, 3).toUpperCase(); }
export function projectProgress(projectId: string, tasks: Task[]) { const selected = tasks.filter((task) => task.projectId === projectId); return selected.length ? Math.round((selected.filter((task) => task.completed).length / selected.length) * 100) : 0; }
export function getProject(projects: Project[], projectId: string) { return projects.find((project) => project.id === projectId); }
export function compareTasks(a: Task, b: Task) { if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed); return ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]); }
