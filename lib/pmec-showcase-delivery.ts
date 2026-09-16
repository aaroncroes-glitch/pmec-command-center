import { addDays } from "./lumen-utils";
import type { PmecTimeLog, TaskAssignment } from "./pmec-control-workspace";
import type { SharedAssignment, SharedNotification, SharedTimeLog } from "./pmec-delivery-sync";
import { DISCIPLINE_LABELS, type JobOrder, type WorkPackageStatus } from "./pmec-job-orders";

/**
 * One employee's delivery queue, worked out from the shared demo workspace.
 *
 * The project manager's assignments, the hours logged against them and the updates both
 * produce are all derived from the same records the control center reads and writes, so a
 * work package assigned in one window shows up in the employee's queue in the other.
 */

export type EmployeeDelivery = { assignments: SharedAssignment[]; timeLogs: SharedTimeLog[]; updates: SharedNotification[] };

const STATUS: Record<WorkPackageStatus, SharedAssignment["status"]> = { NOT_STARTED: "assigned", IN_PROGRESS: "in_progress", UNDER_REVIEW: "in_progress", BLOCKED: "blocked", COMPLETED: "complete" };
const localIso = (dateKey: string, time: string) => new Date(`${dateKey}T${time}:00`).toISOString();
const mondayOf = (dateKey: string) => addDays(dateKey, -((new Date(`${dateKey}T12:00:00`).getDay() + 6) % 7));
const shortDate = (dateKey: string) => new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** Updates older than this are treated as already read, so only recent ones draw a badge. */
const UNREAD_AGE_DAYS = 4;

export function buildEmployeeDelivery({ assignments, timeLogs, jobOrders, employeeId, employeeName, now = new Date() }: {
  assignments: TaskAssignment[];
  timeLogs: PmecTimeLog[];
  jobOrders: JobOrder[];
  employeeId: string;
  employeeName: string;
  now?: Date;
}): EmployeeDelivery {
  const own = assignments.filter((assignment) => assignment.employeeId === employeeId);
  const mine = own.flatMap((assignment): { assignment: TaskAssignment; shared: SharedAssignment }[] => {
    const job = jobOrders.find((item) => item.id === assignment.jobOrderId);
    const task = job?.tasks.find((item) => item.id === assignment.taskId);
    if (!job || !task) return [];
    return [{
      assignment,
      shared: { id: assignment.id, jobOrderId: job.id, jobOrderTitle: job.title, taskId: task.id, taskTitle: task.title, employeeId, employeeName, discipline: DISCIPLINE_LABELS[task.discipline], status: STATUS[task.status], progress: task.progress, assignedBy: job.projectManagerName, dueDate: task.dueDate ?? null },
    }];
  });
  const logs = timeLogs
    .filter((log) => log.employeeId === employeeId)
    .map((log): SharedTimeLog => ({ id: log.id, assignmentId: `assign-${log.taskId}`, employeeId, employeeName, jobOrderId: log.jobOrderId, taskId: log.taskId, workDate: log.date, minutes: Math.round(log.hours * 60), note: log.note, status: log.status === "Approved" ? "approved" : "submitted", reviewerNote: log.status === "Approved" ? "Approved in PMEC Control Center" : null }));

  const assignmentUpdates = mine.map(({ assignment, shared }): SharedNotification => ({
    id: `notification-${assignment.id}`, employeeId, type: "assignment", title: "New work package assigned",
    body: `${shared.taskTitle} · ${shared.jobOrderTitle}`, route: "/assigned-work", readAt: null, archivedAt: null,
    createdAt: localIso(assignment.assignedAt, "09:30"),
  }));

  // Seeded history is summed per finished week; anything the project manager approves during
  // a showcase carries its own timestamp and becomes an update of its own.
  const thisMonday = mondayOf(new Date(now.getTime()).toISOString().slice(0, 10));
  const approvedByWeek = new Map<string, number>();
  const approvalUpdates: SharedNotification[] = [];
  for (const log of timeLogs.filter((item) => item.employeeId === employeeId && item.status === "Approved")) {
    if (log.approvedAt) {
      approvalUpdates.push({
        id: `notification-approved-${log.id}`, employeeId, type: "time_approved", title: "Hours approved",
        body: `${log.hours.toFixed(1)} h on ${shortDate(log.date)} · ${log.note}`, route: "/assigned-work",
        readAt: null, archivedAt: null, createdAt: log.approvedAt,
      });
      continue;
    }
    const monday = mondayOf(log.date);
    if (monday < thisMonday) approvedByWeek.set(monday, (approvedByWeek.get(monday) ?? 0) + log.hours);
  }
  for (const [monday, hours] of approvedByWeek) {
    if (hours < 16) continue;
    approvalUpdates.push({
      id: `notification-hours-${monday}`, employeeId, type: "time_approved", title: "Hours approved",
      body: `${hours.toFixed(1)} h for the week of ${shortDate(monday)}`, route: "/assigned-work",
      readAt: null, archivedAt: null, createdAt: localIso(addDays(monday, 7), "10:15"),
    });
  }

  const fresh = new Date(now.getTime() - UNREAD_AGE_DAYS * 86_400_000).toISOString();
  const updates = [...assignmentUpdates, ...approvalUpdates]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((update) => (String(update.createdAt) >= fresh ? update : { ...update, readAt: update.createdAt }));

  return { assignments: mine.map((item) => item.shared), timeLogs: logs, updates };
}
