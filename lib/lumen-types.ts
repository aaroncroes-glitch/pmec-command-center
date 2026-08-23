import type { ThemeMode } from "@/lib/lumen-theme";

export type TaskPriority = "high" | "medium" | "low";
export type ProjectStatus = "active" | "paused" | "complete";
export type MotionMode = "full" | "reduced";

export type Project = { id: string; name: string; color: string; status: ProjectStatus; description: string; createdAt: string };
export type Task = { id: string; title: string; projectId: string; dueDate: string; priority: TaskPriority; completed: boolean; createdAt: string; completedAt?: string };
export type WorkspaceState = { projects: Project[]; tasks: Task[]; activeDate: string; themeMode: ThemeMode; motionMode: MotionMode };
export type NewTask = Pick<Task, "title" | "projectId" | "dueDate" | "priority">;
export type NewProject = Pick<Project, "name" | "description">;
