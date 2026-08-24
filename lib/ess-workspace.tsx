import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { initialEssState } from "@/lib/ess-data";
import type { ActivityItem, ClockInSelection, EssState, LeaveRequest, PersonalEvent, ProjectTaskStatus } from "@/lib/ess-types";
import { toDateKey } from "@/lib/lumen-utils";

const STORAGE_KEY = "lumen.ess.v1";

type EssWorkspace = EssState & {
  ready: boolean;
  isAuthenticated: boolean;
  completeOnboarding: () => void;
  signIn: (employeeNumber: string, pin: string) => boolean;
  signOut: () => void;
  clockIn: (selection: ClockInSelection) => void;
  clockOut: () => void;
  updateProjectTask: (projectId: string, phaseId: string, taskId: string, status: ProjectTaskStatus) => void;
  addLeaveRequest: (request: Omit<LeaveRequest, "id" | "status">) => void;
  addEvent: (event: Omit<PersonalEvent, "id">) => void;
  updatePin: (pin: string) => void;
  resetEssDemo: () => void;
  todayAttendance?: EssState["attendance"][number];
};

const EssContext = createContext<EssWorkspace | null>(null);
const isEssState = (value: unknown): value is EssState => Boolean(value && typeof value === "object" && Array.isArray((value as EssState).projects) && Array.isArray((value as EssState).attendance));
const makeActivity = (title: string, detail: string, tone: ActivityItem["tone"] = "neutral"): ActivityItem => ({ id: `activity-${Date.now()}`, title, detail, tone, createdAt: toDateKey(new Date()) });

export function EssWorkspaceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<EssState>(initialEssState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as unknown;
          if (isEssState(parsed)) setState({ ...initialEssState, ...parsed });
        }
      } finally {
        setReady(true);
      }
    };
    void restore();
  }, []);

  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [ready, state]);

  const completeOnboarding = useCallback(() => setState((current: EssState) => ({ ...current, onboarded: true })), []);
  const signIn = useCallback((employeeNumber: string, pin: string) => {
    const valid = employeeNumber.trim() === initialEssState.employee.employeeNumber && pin === state.employee.pin;
    if (valid) setState((current: EssState) => ({ ...current, sessionEmployeeId: current.employee.id }));
    return valid;
  }, [state.employee.pin]);
  const signOut = useCallback(() => setState((current: EssState) => ({ ...current, sessionEmployeeId: undefined })), []);

  const clockIn = useCallback((selection: ClockInSelection) => setState((current: EssState) => {
    const date = toDateKey(new Date());
    if (current.attendance.find((record) => record.date === date)?.clockIn) return current;
    const project = current.projects.find((item) => item.id === selection.projectId);
    return {
      ...current,
      attendance: [{ id: `attendance-${Date.now()}`, date, clockIn: new Date().toISOString(), projectId: selection.projectId, phaseId: selection.phaseId, taskId: selection.taskId, late: new Date().getHours() >= 9 }, ...current.attendance],
      activity: [makeActivity("Clocked in", project?.name ?? "Project work", "success"), ...current.activity],
    };
  }), []);

  const clockOut = useCallback(() => setState((current: EssState) => {
    const date = toDateKey(new Date());
    return {
      ...current,
      attendance: current.attendance.map((record) => record.date === date && record.clockIn && !record.clockOut ? { ...record, clockOut: new Date().toISOString() } : record),
      activity: [makeActivity("Clocked out", "Attendance recorded for today"), ...current.activity],
    };
  }), []);

  const updateProjectTask = useCallback((projectId: string, phaseId: string, taskId: string, status: ProjectTaskStatus) => setState((current: EssState) => ({
    ...current,
    projects: current.projects.map((project) => {
      if (project.id !== projectId) return project;
      return { ...project, phases: project.phases.map((phase) => phase.id !== phaseId ? phase : { ...phase, tasks: phase.tasks.map((task) => task.id === taskId ? { ...task, status } : task) }) };
    }),
    activity: [makeActivity("Project task updated", `Status changed to ${status.replace("_", " ")}`, "accent"), ...current.activity],
  })), []);

  const addLeaveRequest = useCallback((request: Omit<LeaveRequest, "id" | "status">) => setState((current: EssState) => ({
    ...current,
    leaveRequests: [{ ...request, id: `leave-${Date.now()}`, status: "pending" }, ...current.leaveRequests],
    activity: [makeActivity("Leave request submitted", `${request.type} · ${request.startDate}`, "accent"), ...current.activity],
  })), []);
  const addEvent = useCallback((event: Omit<PersonalEvent, "id">) => setState((current: EssState) => ({ ...current, events: [{ ...event, id: `event-${Date.now()}` }, ...current.events] })), []);
  const updatePin = useCallback((pin: string) => { if (/^\d{4}$/.test(pin)) setState((current: EssState) => ({ ...current, employee: { ...current.employee, pin } })); }, []);
  const resetEssDemo = useCallback(() => { void AsyncStorage.removeItem(STORAGE_KEY); setState(initialEssState); }, []);

  const value = useMemo<EssWorkspace>(() => ({
    ...state,
    ready,
    isAuthenticated: Boolean(state.sessionEmployeeId),
    completeOnboarding, signIn, signOut, clockIn, clockOut, updateProjectTask, addLeaveRequest, addEvent, updatePin, resetEssDemo,
    todayAttendance: state.attendance.find((record) => record.date === toDateKey(new Date())),
  }), [state, ready, completeOnboarding, signIn, signOut, clockIn, clockOut, updateProjectTask, addLeaveRequest, addEvent, updatePin, resetEssDemo]);

  return <EssContext.Provider value={value}>{children}</EssContext.Provider>;
}

export function useEss() {
  const workspace = useContext(EssContext);
  if (!workspace) throw new Error("useEss must be used within EssWorkspaceProvider");
  return workspace;
}
