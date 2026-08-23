import type { Project, Task, WorkspaceState } from "@/lib/lumen-types";
import { addDays, toDateKey } from "@/lib/lumen-utils";

const today = toDateKey(new Date());
export const starterProjects: Project[] = [
  { id: "project-raia", name: "RAIA Agency", color: "#FF5A1F", status: "active", description: "AI systems, delivery, and client strategy.", createdAt: today },
  { id: "project-moresco", name: "Moresco", color: "#3A7563", status: "active", description: "Real estate operations and client experience.", createdAt: today },
  { id: "project-skyfall", name: "Skyfall", color: "#96734C", status: "active", description: "Marketing strategy and campaign direction.", createdAt: today },
];
export const starterTasks: Task[] = [
  { id: "task-raia-roadmap", title: "Shape the Q3 AI delivery roadmap", projectId: "project-raia", dueDate: today, priority: "high", completed: false, createdAt: today },
  { id: "task-moresco-listing", title: "Review the new listing presentation", projectId: "project-moresco", dueDate: today, priority: "high", completed: false, createdAt: today },
  { id: "task-skyfall-brief", title: "Refine the Skyfall campaign brief", projectId: "project-skyfall", dueDate: today, priority: "medium", completed: false, createdAt: today },
  { id: "task-raia-review", title: "Send client systems review", projectId: "project-raia", dueDate: addDays(today, 1), priority: "medium", completed: false, createdAt: today },
  { id: "task-moresco-notes", title: "Prepare property team notes", projectId: "project-moresco", dueDate: addDays(today, 2), priority: "low", completed: false, createdAt: today },
  { id: "task-skyfall-archive", title: "Archive approved creative directions", projectId: "project-skyfall", dueDate: addDays(today, -1), priority: "low", completed: true, completedAt: today, createdAt: addDays(today, -2) },
];
export const initialWorkspace: WorkspaceState = { projects: starterProjects, tasks: starterTasks, activeDate: today, themeMode: "light", motionMode: "full" };
