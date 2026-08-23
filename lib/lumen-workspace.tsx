import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialWorkspace } from "@/lib/lumen-data";
import { lumenPalettes } from "@/lib/lumen-theme";
import type { MotionMode, NewProject, NewTask, Project, Task, WorkspaceState } from "@/lib/lumen-types";
import type { ThemeMode } from "@/lib/lumen-theme";
import { compareTasks } from "@/lib/lumen-utils";

const STORAGE_KEY = "lumen.workspace.v1";
const projectColors = ["#FF5A1F", "#3A7563", "#96734C", "#6059A8", "#B54E70"];
type LumenWorkspace = WorkspaceState & { ready: boolean; palette: (typeof lumenPalettes)[ThemeMode]; toggleTask: (taskId: string) => void; addTask: (draft: NewTask) => void; addProject: (draft: NewProject) => void; setActiveDate: (dateKey: string) => void; setThemeMode: (mode: ThemeMode) => void; setMotionMode: (mode: MotionMode) => void; resetWorkspace: () => void; tasksForDate: (dateKey: string) => Task[]; tasksForProject: (projectId: string) => Task[]; projectForTask: (projectId: string) => Project | undefined };
const WorkspaceContext = createContext<LumenWorkspace | null>(null);
function isWorkspaceState(value: unknown): value is WorkspaceState { if (!value || typeof value !== "object") return false; const candidate = value as WorkspaceState; return Array.isArray(candidate.projects) && Array.isArray(candidate.tasks) && typeof candidate.activeDate === "string"; }

export function LumenWorkspaceProvider({ children }: PropsWithChildren) {
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [ready, setReady] = useState(false);
  useEffect(() => { const restore = async () => { try { const stored = await AsyncStorage.getItem(STORAGE_KEY); if (stored) { const parsed = JSON.parse(stored) as unknown; if (isWorkspaceState(parsed)) setWorkspace({ ...initialWorkspace, ...parsed }); } } finally { setReady(true); } }; void restore(); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); }, [ready, workspace]);
  const toggleTask = useCallback((taskId: string) => setWorkspace((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed, completedAt: task.completed ? undefined : new Date().toISOString() } : task) })), []);
  const addTask = useCallback((draft: NewTask) => { const title = draft.title.trim(); if (!title) return; setWorkspace((current) => ({ ...current, tasks: [{ id: `task-${Date.now()}`, title, projectId: draft.projectId, dueDate: draft.dueDate, priority: draft.priority, completed: false, createdAt: new Date().toISOString() }, ...current.tasks] })); }, []);
  const addProject = useCallback((draft: NewProject) => { const name = draft.name.trim(); if (!name) return; setWorkspace((current) => ({ ...current, projects: [...current.projects, { id: `project-${Date.now()}`, name, description: draft.description.trim() || "A focused body of work.", color: projectColors[current.projects.length % projectColors.length], status: "active", createdAt: new Date().toISOString() }] })); }, []);
  const setActiveDate = useCallback((activeDate: string) => setWorkspace((current) => ({ ...current, activeDate })), []);
  const setThemeMode = useCallback((themeMode: ThemeMode) => setWorkspace((current) => ({ ...current, themeMode })), []);
  const setMotionMode = useCallback((motionMode: MotionMode) => setWorkspace((current) => ({ ...current, motionMode })), []);
  const resetWorkspace = useCallback(() => { void AsyncStorage.removeItem(STORAGE_KEY); setWorkspace(initialWorkspace); }, []);
  const value = useMemo<LumenWorkspace>(() => ({ ...workspace, ready, palette: lumenPalettes[workspace.themeMode], toggleTask, addTask, addProject, setActiveDate, setThemeMode, setMotionMode, resetWorkspace, tasksForDate: (dateKey) => workspace.tasks.filter((task) => task.dueDate === dateKey).sort(compareTasks), tasksForProject: (projectId) => workspace.tasks.filter((task) => task.projectId === projectId).sort(compareTasks), projectForTask: (projectId) => workspace.projects.find((project) => project.id === projectId) }), [workspace, ready, toggleTask, addTask, addProject, setActiveDate, setThemeMode, setMotionMode, resetWorkspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useLumen() { const workspace = useContext(WorkspaceContext); if (!workspace) throw new Error("useLumen must be used within LumenWorkspaceProvider"); return workspace; }
