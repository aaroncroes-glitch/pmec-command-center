import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useCrossTabStore } from "@/lib/pmec-cross-tab";
import { initialAssignments, initialLeave, initialLogs, workforce } from "@/lib/pmec-control-seeds";
import { usePmecJobOrders } from "@/lib/pmec-job-order-workspace";
import { usePmecDeliverySync } from "@/lib/pmec-delivery-sync";
import type { SharedAssignment } from "@/lib/pmec-delivery-sync";
import { todayKey } from "@/lib/pmec-month-calendar";

export type PmecWorkforcePerson = { id: string; name: string; role: string; discipline: string; type: "Employee" | "Contractor"; location: string; status: "Active" | "Away" | "Pending"; allocation: number; weeklyCapacity: number; employment: string };
export type PmecTimeLog = { id: string; employeeId: string; jobOrderId: string; taskId: string; date: string; hours: number; note: string; status: "Submitted" | "Approved"; synced?: boolean; approvedAt?: string };
export type PmecLeaveRequest = { id: string; employeeId: string; type: "Vacation" | "Sick" | "Personal"; startDate: string; endDate: string; workDays: number; status: "pending" | "approved" | "rejected"; note?: string; reason?: string };
export type TaskAssignment = { id: string; jobOrderId: string; taskId: string; employeeId: string; assignedAt: string };

// v2: the showcase data set. v1 holds the thin April seeds and is not read.
const STORAGE_KEY = "lumen.pmec.control-center.v2";

type ControlState = { assignments: TaskAssignment[]; timeLogs: PmecTimeLog[]; leaveRequests: PmecLeaveRequest[] };
type ControlContextValue = ControlState & { ready: boolean; deliverySyncState: "live" | "demo"; workforce: PmecWorkforcePerson[]; sharedAssignments: SharedAssignment[]; assignTask: (jobOrderId: string, taskId: string, employeeId: string) => void; addTimeLog: (input: Omit<PmecTimeLog, "id" | "status">) => void; approveTimeLog: (id: string) => void; reviewLeave: (id: string, status: "approved" | "rejected", note?: string) => void; requestLeave: (input: Omit<PmecLeaveRequest, "id" | "status">) => void; resetControlDemo: () => void };
const ControlContext = createContext<ControlContextValue | null>(null);
const initialState: ControlState = { assignments: initialAssignments, timeLogs: initialLogs, leaveRequests: initialLeave };

export function PmecControlWorkspaceProvider({ children }: PropsWithChildren) {
  const { jobOrders, updateTask } = usePmecJobOrders();
  const shared = usePmecDeliverySync();
  const [state, setState] = useState<ControlState>(initialState);
  const [ready, setReady] = useState(false);
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((stored) => { if (stored) { try { const parsed = JSON.parse(stored) as ControlState; if (Array.isArray(parsed.assignments) && Array.isArray(parsed.timeLogs) && Array.isArray(parsed.leaveRequests)) setState(parsed); } catch { /* retain seed state */ } } }).finally(() => setReady(true)); }, []);
  // What this window last wrote or took in. Without it two open windows would answer each
  // other's writes forever, because each arriving copy is a new object to React.
  const lastRaw = useRef<string | null>(null);
  useEffect(() => { if (!ready) return; const raw = JSON.stringify(state); if (raw === lastRaw.current) return; lastRaw.current = raw; void AsyncStorage.setItem(STORAGE_KEY, raw); }, [ready, state]);
  // A second window writing this workspace, the employee view beside the control center,
  // lands here, so both screens show the same leave, assignments and hours as they change.
  const applyStored = useCallback((raw: string) => { if (raw === lastRaw.current) return; lastRaw.current = raw; try { const parsed = JSON.parse(raw) as ControlState; if (Array.isArray(parsed.assignments) && Array.isArray(parsed.timeLogs) && Array.isArray(parsed.leaveRequests)) setState(parsed); } catch { /* keep the current state */ } }, []);
  useCrossTabStore(STORAGE_KEY, applyStored);
  const syncedAssignments = shared.allAssignments.map((item) => ({ id: item.id, jobOrderId: item.jobOrderId, taskId: item.taskId, employeeId: item.employeeId, assignedAt: item.dueDate ?? new Date().toISOString().slice(0, 10) }));
  const syncedTimeLogs = shared.allTimeLogs.map((item) => ({ id: item.id, employeeId: item.employeeId, jobOrderId: item.jobOrderId, taskId: item.taskId, date: item.workDate, hours: item.minutes / 60, note: item.note, status: item.status === "approved" ? "Approved" as const : "Submitted" as const, synced: true }));
  const deliverySyncState = shared.managerSyncState === "live" ? "live" as const : "demo" as const;
  const assignments = [...syncedAssignments, ...state.assignments.filter((item) => !syncedAssignments.some((remote) => remote.jobOrderId === item.jobOrderId && remote.taskId === item.taskId))];
  const timeLogs = [...syncedTimeLogs, ...state.timeLogs.filter((item) => !syncedTimeLogs.some((remote) => remote.id === item.id))];
  const assignTask = useCallback((jobOrderId: string, taskId: string, employeeId: string) => { const person = workforce.find((item) => item.id === employeeId); const jobOrder = jobOrders.find((item) => item.id === jobOrderId); const task = jobOrder?.tasks.find((item) => item.id === taskId); if (!person || !jobOrder || !task) return; updateTask(jobOrderId, taskId, { assignedTo: person.name }); if (shared.managerSyncState === "live") { void shared.assign({ jobOrderId, jobOrderTitle: jobOrder.title, taskId, taskTitle: task.title, employeeId, employeeName: person.name, discipline: person.discipline, status: task.progress >= 100 ? "complete" : task.progress > 0 ? "in_progress" : "assigned", progress: task.progress, assignedBy: "Aaron Croes", dueDate: jobOrder.targetEndDate }).catch(() => undefined); } setState((current) => ({ ...current, assignments: [...current.assignments.filter((item) => item.taskId !== taskId || item.jobOrderId !== jobOrderId), { id: `assignment-${Date.now()}`, jobOrderId, taskId, employeeId, assignedAt: new Date().toISOString().slice(0, 10) }] })); }, [jobOrders, shared, updateTask]);
  const addTimeLog = useCallback((input: Omit<PmecTimeLog, "id" | "status">) => { const assignment = assignments.find((item) => item.employeeId === input.employeeId && item.jobOrderId === input.jobOrderId && item.taskId === input.taskId); const person = workforce.find((item) => item.id === input.employeeId); if (assignment && person && shared.employeeSyncState === "live") void shared.submitTime({ assignmentId: assignment.id, jobOrderId: input.jobOrderId, taskId: input.taskId, workDate: input.date, minutes: Math.max(15, Math.round(input.hours * 60)), note: input.note }).catch(() => undefined); setState((current) => ({ ...current, timeLogs: [{ ...input, id: `time-${Date.now()}`, status: "Submitted" }, ...current.timeLogs] })); }, [assignments, shared]);
  const approveTimeLog = useCallback((id: string) => { const remote = syncedTimeLogs.find((item) => item.id === id); if (remote) void shared.reviewTime(id, "approved", "Approved in PMEC Control Center"); setState((current) => ({ ...current, timeLogs: current.timeLogs.map((item) => item.id === id ? { ...item, status: "Approved", approvedAt: new Date().toISOString() } : item) })); }, [shared, syncedTimeLogs]);
  const reviewLeave = useCallback((id: string, status: "approved" | "rejected", note?: string) => setState((current) => ({ ...current, leaveRequests: current.leaveRequests.map((item) => item.id === id ? { ...item, status, note: note?.trim() || item.note } : item) })), []);
  const requestLeave = useCallback((input: Omit<PmecLeaveRequest, "id" | "status">) => setState((current) => ({ ...current, leaveRequests: [{ ...input, id: `leave-${Date.now()}`, status: "pending" as const }, ...current.leaveRequests] })), []);
  const resetControlDemo = useCallback(() => { void AsyncStorage.removeItem(STORAGE_KEY); setState(initialState); }, []);
  // Away follows approved leave, so a decision in HR shows up in People, Capacity and planning.
  const today = todayKey();
  const workforceNow = useMemo(() => { const away = new Set(state.leaveRequests.filter((item) => item.status === "approved" && item.startDate <= today && today <= item.endDate).map((item) => item.employeeId)); return workforce.map((person) => (away.has(person.id) ? { ...person, status: "Away" as const } : person)); }, [state.leaveRequests, today]);
  const value = useMemo<ControlContextValue>(() => ({ ...state, assignments, timeLogs, ready, deliverySyncState, workforce: workforceNow, sharedAssignments: shared.allAssignments, assignTask, addTimeLog, approveTimeLog, reviewLeave, requestLeave, resetControlDemo }), [state, assignments, timeLogs, ready, deliverySyncState, workforceNow, shared.allAssignments, assignTask, addTimeLog, approveTimeLog, reviewLeave, requestLeave, resetControlDemo]);
  return <ControlContext.Provider value={value}>{children}</ControlContext.Provider>;
}
export function usePmecControl() { const context = useContext(ControlContext); if (!context) throw new Error("usePmecControl must be used inside PmecControlWorkspaceProvider"); return context; }
