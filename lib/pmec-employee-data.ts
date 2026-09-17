import { useCallback, useMemo } from "react";

import { useEss } from "@/lib/ess-workspace";
import type { AttendanceRecord, LeaveRequest, ProjectTaskStatus, WorkProject } from "@/lib/ess-types";
import { groupWorkPackages, type JobOrder, type WorkPackageStatus } from "@/lib/pmec-job-orders";
import { useLumen } from "@/lib/lumen-workspace";
import { workingDayCount } from "@/lib/lumen-utils";
import { usePmecControl, type ClockInSelection } from "@/lib/pmec-control-workspace";
import { todayKey } from "@/lib/pmec-month-calendar";
import { usePmecDeliverySync, type SharedAssignment, type SharedTimeLog } from "@/lib/pmec-delivery-sync";
import { usePmecJobOrders } from "@/lib/pmec-job-order-workspace";
import { showcaseMode } from "@/lib/pmec-showcase";
import { buildEmployeeDelivery } from "@/lib/pmec-showcase-delivery";

/**
 * What the employee screens read.
 *
 * In a showcase there is no account to sync with, so the employee's work, hours, updates
 * and leave come from the same workspace the project manager and HR use. A request made
 * here lands in HR's queue, and an approval there shows up here. With sign-in restored,
 * every one of these falls back to the server-backed provider and the employee's own store.
 */

/** The employee's delivery queue: assigned work, hours and updates. */
export function useDelivery() {
  const sync = usePmecDeliverySync();
  const control = usePmecControl();
  const { jobOrders, updateTask } = usePmecJobOrders();
  const { employee, updates, markUpdateRead, archiveUpdate, restoreUpdate } = useEss();
  const employeeId = employee.id;
  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const built = useMemo(
    () => buildEmployeeDelivery({ assignments: control.assignments, timeLogs: control.timeLogs, jobOrders, employeeId, employeeName }),
    [control.assignments, control.timeLogs, jobOrders, employeeId, employeeName],
  );
  const updateAssignment = useCallback(async (id: string, update: Pick<SharedAssignment, "status" | "progress">) => {
    const assignment = built.assignments.find((item) => item.id === id);
    if (!assignment) return;
    const status = update.status === "complete" ? "COMPLETED" : update.status === "blocked" ? "BLOCKED" : "IN_PROGRESS";
    updateTask(assignment.jobOrderId, assignment.taskId, { status, progress: update.progress });
  }, [built.assignments, updateTask]);
  const submitTime = useCallback(async (input: Omit<SharedTimeLog, "id" | "employeeId" | "employeeName" | "status" | "reviewerNote">) => {
    control.addTimeLog({ employeeId, jobOrderId: input.jobOrderId, taskId: input.taskId, date: input.workDate, hours: input.minutes / 60, note: input.note });
  }, [control, employeeId]);

  if (!showcaseMode) return sync;

  const read = new Set(updates?.read ?? []);
  const archived = new Set(updates?.archived ?? []);
  const inbox = built.updates.filter((update) => !archived.has(update.id)).map((update) => (read.has(update.id) ? { ...update, readAt: update.createdAt } : update));
  return {
    ...sync,
    ready: true,
    employeeSyncState: "live" as const,
    employeeAssignments: built.assignments,
    employeeTimeLogs: built.timeLogs,
    notifications: inbox,
    archivedNotifications: built.updates.filter((update) => archived.has(update.id)).map((update) => ({ ...update, readAt: update.createdAt, archivedAt: update.createdAt })),
    unreadNotifications: inbox.filter((update) => !update.readAt).length,
    updateAssignment,
    submitTime,
    markNotificationRead: async (id: string) => markUpdateRead(id),
    archiveNotification: async (id: string) => archiveUpdate(id),
    restoreNotification: async (id: string) => restoreUpdate(id),
    refresh: async () => undefined,
  };
}

/** The employee's leave: the same requests HR reviews while a showcase is running. */
export function useEmployeeLeave() {
  const ess = useEss();
  const control = usePmecControl();
  const employeeId = ess.employee.id;
  const holidays = useMemo(() => ess.publicHolidays.map((holiday) => holiday.date), [ess.publicHolidays]);

  const requests: LeaveRequest[] = useMemo(() => {
    if (!showcaseMode) return ess.leaveRequests;
    return control.leaveRequests
      .filter((request) => request.employeeId === employeeId)
      .map((request) => ({
        id: request.id,
        type: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason ?? `${request.type} leave`,
        status: request.status,
        managerNote: request.status === "rejected" ? request.note : undefined,
      }))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [control.leaveRequests, employeeId, ess.leaveRequests]);

  const submit = useCallback((input: { type: LeaveRequest["type"]; startDate: string; endDate: string; reason: string }) => {
    if (!showcaseMode) { ess.addLeaveRequest(input); return; }
    control.requestLeave({ employeeId, type: input.type, startDate: input.startDate, endDate: input.endDate, workDays: workingDayCount(input.startDate, input.endDate, holidays), reason: input.reason });
  }, [control, employeeId, ess, holidays]);

  const review = useCallback((id: string, status: "approved" | "rejected", note?: string) => {
    if (!showcaseMode) { ess.reviewLeaveRequest(id, status, note); return; }
    control.reviewLeave(id, status, note);
  }, [control, ess]);

  return { requests, submit, review };
}

/** Puts every demo workspace in this browser back to its starting data. */
export function useResetDemo() {
  const { resetEssDemo } = useEss();
  const { resetWorkspace } = useLumen();
  const { resetControlDemo } = usePmecControl();
  const { resetDemo } = usePmecJobOrders();
  return useCallback(() => {
    resetControlDemo();
    resetDemo();
    resetEssDemo();
    resetWorkspace();
  }, [resetControlDemo, resetDemo, resetEssDemo, resetWorkspace]);
}

/** The employee's clock-in for today: in a showcase it is the same record HR and PM see live. */
export function useEmployeeAttendance() {
  const ess = useEss();
  const control = usePmecControl();
  const employeeId = ess.employee.id;
  const todayAttendance: AttendanceRecord | undefined = useMemo(() => {
    if (!showcaseMode) return ess.todayAttendance;
    const date = todayKey();
    const record = control.attendance.find((item) => item.employeeId === employeeId && item.date === date);
    return record ? { id: record.id, date: record.date, clockIn: record.clockIn, clockOut: record.clockOut, projectId: record.projectId, phaseId: record.phaseId, taskId: record.taskId, late: record.late } : undefined;
  }, [control.attendance, employeeId, ess.todayAttendance]);
  const clockIn = useCallback((selection: ClockInSelection) => {
    if (!showcaseMode) { ess.clockIn(selection as never); return; }
    control.clockIn(employeeId, selection);
  }, [control, employeeId, ess]);
  const clockOut = useCallback(() => {
    if (!showcaseMode) { ess.clockOut(); return; }
    control.clockOut(employeeId);
  }, [control, employeeId, ess]);
  return { todayAttendance, clockIn, clockOut };
}

const PROJECT_COLORS = ["#FE8503", "#3A7563", "#96734C", "#6059A8", "#2F6690", "#A23B3B"];
const taskStatus = (status: WorkPackageStatus): ProjectTaskStatus => (status === "COMPLETED" ? "done" : status === "NOT_STARTED" ? "todo" : "in_progress");
const packageStatus: Record<ProjectTaskStatus, WorkPackageStatus> = { todo: "NOT_STARTED", in_progress: "IN_PROGRESS", done: "COMPLETED" };

/** The PM's job orders, shaped as the employee's project list. */
export function jobOrdersAsProjects(jobOrders: JobOrder[]): WorkProject[] {
  return jobOrders
    .filter((job) => job.phase !== "CANCELLED")
    .map((job, index) => ({
      id: job.id,
      name: job.title,
      code: job.id.toUpperCase(),
      client: job.clientName,
      color: PROJECT_COLORS[index % PROJECT_COLORS.length],
      status: job.phase === "COMPLETED" ? "completed" : job.phase === "PLANNING" || job.phase === "DESIGN" ? "planning" : "active",
      phases: groupWorkPackages(job).map(([name, tasks]: [string, JobOrder["tasks"]]) => ({
        id: `${job.id}::${name}`,
        name,
        tasks: tasks.map((task) => ({ id: task.id, title: task.title, status: taskStatus(task.status), estimatedHours: 0 })),
      })),
    }));
}

/** The employee's projects: in a showcase these are the PM's live job orders, both ways. */
export function useEmployeeProjects() {
  const ess = useEss();
  const { jobOrders, updateTask } = usePmecJobOrders();
  const projects = useMemo(() => (showcaseMode ? jobOrdersAsProjects(jobOrders) : ess.projects), [jobOrders, ess.projects]);
  const updateProjectTask = useCallback((projectId: string, phaseId: string, taskId: string, status: ProjectTaskStatus) => {
    if (!showcaseMode) { ess.updateProjectTask(projectId, phaseId, taskId, status); return; }
    updateTask(projectId, taskId, { status: packageStatus[status], progress: status === "done" ? 100 : status === "todo" ? 0 : 50 });
  }, [ess, updateTask]);
  return { projects, updateProjectTask };
}
