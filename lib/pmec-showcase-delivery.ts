import { addDays } from "./lumen-utils";
import { initialAssignments, initialLogs } from "./pmec-control-seeds";
import { demoDay } from "./pmec-demo-dates";
import { initialPmeJobOrders } from "./pmec-demo-job-orders";
import type { NotificationPreferences, SharedAssignment, SharedNotification, SharedTimeLog } from "./pmec-delivery-sync";
import { DISCIPLINE_LABELS, type WorkPackageStatus } from "./pmec-job-orders";

/**
 * An employee's delivery queue in the showcase: the work packages the portfolio assigns to
 * them, the hours they logged against those packages, and the notifications both would
 * have produced. Without an account nothing can be fetched, so the employee app runs on this.
 */

export type ShowcaseDelivery = { assignments: SharedAssignment[]; timeLogs: SharedTimeLog[]; notifications: SharedNotification[]; archivedNotifications: SharedNotification[]; preferences: NotificationPreferences };

const STATUS: Record<WorkPackageStatus, SharedAssignment["status"]> = { NOT_STARTED: "assigned", IN_PROGRESS: "in_progress", UNDER_REVIEW: "in_progress", BLOCKED: "blocked", COMPLETED: "complete" };
const localIso = (dateKey: string, time: string) => new Date(`${dateKey}T${time}:00`).toISOString();
const mondayOf = (dateKey: string) => addDays(dateKey, -((new Date(`${dateKey}T12:00:00`).getDay() + 6) % 7));
const shortDate = (dateKey: string) => new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function showcaseDelivery(employeeId: string, employeeName: string): ShowcaseDelivery {
  const own = initialAssignments.filter((assignment) => assignment.employeeId === employeeId);
  const assignments = own.flatMap((assignment): SharedAssignment[] => {
    const job = initialPmeJobOrders.find((item) => item.id === assignment.jobOrderId);
    const task = job?.tasks.find((item) => item.id === assignment.taskId);
    if (!job || !task) return [];
    return [{ id: assignment.id, jobOrderId: job.id, jobOrderTitle: job.title, taskId: task.id, taskTitle: task.title, employeeId, employeeName, discipline: DISCIPLINE_LABELS[task.discipline], status: STATUS[task.status], progress: task.progress, assignedBy: job.projectManagerName, dueDate: task.dueDate ?? null }];
  });
  const timeLogs = initialLogs
    .filter((log) => log.employeeId === employeeId)
    .map((log): SharedTimeLog => ({ id: log.id, assignmentId: `assign-${log.taskId}`, employeeId, employeeName, jobOrderId: log.jobOrderId, taskId: log.taskId, workDate: log.date, minutes: Math.round(log.hours * 60), note: log.note, status: log.status === "Approved" ? "approved" : "submitted", reviewerNote: log.status === "Approved" ? "Approved in PMEC Control Center" : null }));

  // One "hours approved" update per finished week with a real week of approved time in it.
  const thisMonday = mondayOf(demoDay(0));
  const approvedByWeek = new Map<string, number>();
  for (const log of timeLogs) {
    const monday = mondayOf(log.workDate);
    if (log.status === "approved" && monday < thisMonday) approvedByWeek.set(monday, (approvedByWeek.get(monday) ?? 0) + log.minutes / 60);
  }
  const assignmentUpdates = own.map((assignment): SharedNotification => {
    const item = assignments.find((entry) => entry.id === assignment.id);
    return { id: `notification-${assignment.id}`, employeeId, type: "assignment", title: "New work package assigned", body: item ? `${item.taskTitle} · ${item.jobOrderTitle}` : "A work package was assigned to you.", route: "/assigned-work", readAt: null, archivedAt: null, createdAt: localIso(assignment.assignedAt, "09:30") };
  });
  const hoursUpdates = [...approvedByWeek.entries()]
    .filter(([, hours]) => hours >= 16)
    .map(([monday, hours]): SharedNotification => ({ id: `notification-hours-${monday}`, employeeId, type: "time_approved", title: "Hours approved", body: `${hours.toFixed(1)} h for the week of ${shortDate(monday)}`, route: "/assigned-work", readAt: null, archivedAt: null, createdAt: localIso(addDays(monday, 7), "10:15") }));
  // The two newest stay unread, so Home and the notification list both have something new.
  const notifications = [...assignmentUpdates, ...hoursUpdates]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((item, index) => (index < 2 ? item : { ...item, readAt: item.createdAt }));
  const archivedNotifications: SharedNotification[] = [{ id: "notification-welcome", employeeId, type: "assignment", title: "Welcome to PMEC delivery", body: "Work your project manager assigns to you, and the hours you log against it, show up here.", route: "/assigned-work", readAt: localIso(demoDay(-40), "08:10"), archivedAt: localIso(demoDay(-30), "08:15"), createdAt: localIso(demoDay(-40), "08:00") }];

  return { assignments, timeLogs, notifications, archivedNotifications, preferences: { assignmentsEnabled: true, timeApprovedEnabled: true } };
}
