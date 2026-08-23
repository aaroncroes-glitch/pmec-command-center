import type { ThemeMode } from "@/lib/lumen-theme";

export type TaskPriority = "high" | "medium" | "low";
export type ProjectStatus = "active" | "paused" | "complete";
export type MotionMode = "full" | "reduced";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export type Project = { id: string; name: string; color: string; status: ProjectStatus; description: string; createdAt: string };
export type Task = { id: string; title: string; projectId: string; dueDate: string; priority: TaskPriority; completed: boolean; createdAt: string; completedAt?: string; tags?: string[]; recurrence?: Recurrence; reminderAt?: string; notificationId?: string; recurrenceSourceId?: string };
export type WorkspaceState = { projects: Project[]; tasks: Task[]; activeDate: string; themeMode: ThemeMode; motionMode: MotionMode; activePriority?: TaskPriority | "all"; activeTag?: string };
export type NewTask = { title: string; projectId: string; dueDate: string; priority: TaskPriority; tags: string[]; recurrence: Recurrence; reminderAt?: string };
export type NewProject = Pick<Project, "name" | "description">;
