import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from "react";

import { useEss } from "@/lib/ess-workspace";
import { trpc } from "@/lib/trpc";

export type SharedAssignment = { id: string; jobOrderId: string; jobOrderTitle: string; taskId: string; taskTitle: string; employeeId: string; employeeName: string; discipline: string; status: "assigned" | "in_progress" | "blocked" | "complete"; progress: number; assignedBy: string; dueDate: string | null };
export type SharedTimeLog = { id: string; assignmentId: string; employeeId: string; employeeName: string; jobOrderId: string; taskId: string; workDate: string; minutes: number; note: string; status: "submitted" | "approved" | "rejected"; reviewerNote: string | null };
export type SharedNotification = { id: string; employeeId: string; type: "assignment" | "time_approved"; title: string; body: string; route: string; readAt: Date | string | null; archivedAt: Date | string | null; createdAt: Date | string };
export type NotificationPreferences = { assignmentsEnabled: boolean; timeApprovedEnabled: boolean };
type SyncContext = { ready: boolean; employeeId: string; employeeName: string; employeeAssignments: SharedAssignment[]; allAssignments: SharedAssignment[]; employeeTimeLogs: SharedTimeLog[]; allTimeLogs: SharedTimeLog[]; notifications: SharedNotification[]; archivedNotifications: SharedNotification[]; unreadNotifications: number; notificationPreferences: NotificationPreferences; assign: (input: Omit<SharedAssignment, "id"> & { id?: string }) => Promise<void>; updateAssignment: (id: string, update: Pick<SharedAssignment, "status" | "progress">) => Promise<void>; submitTime: (input: Omit<SharedTimeLog, "id" | "employeeId" | "employeeName" | "status" | "reviewerNote">) => Promise<void>; reviewTime: (id: string, status: "approved" | "rejected", reviewerNote?: string) => Promise<void>; markNotificationRead: (id: string) => Promise<void>; archiveNotification: (id: string) => Promise<void>; restoreNotification: (id: string) => Promise<void>; updateNotificationPreferences: (update: NotificationPreferences) => Promise<void>; refresh: () => Promise<void> };
const DeliveryContext = createContext<SyncContext | null>(null);

export function PmecDeliverySyncProvider({ children }: PropsWithChildren) {
  const { employee } = useEss();
  const employeeId = employee.id;
  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const utils = trpc.useUtils();
  const allAssignments = trpc.pmecDelivery.assignments.useQuery(undefined, { refetchInterval: 12_000 });
  const employeeAssignments = trpc.pmecDelivery.assignments.useQuery({ employeeId }, { refetchInterval: 12_000 });
  const allTimeLogs = trpc.pmecDelivery.timeLogs.useQuery(undefined, { refetchInterval: 12_000 });
  const employeeTimeLogs = trpc.pmecDelivery.timeLogs.useQuery({ employeeId }, { refetchInterval: 12_000 });
  const notifications = trpc.pmecDelivery.notifications.useQuery({ employeeId }, { refetchInterval: 12_000 }); const archivedNotifications = trpc.pmecDelivery.notifications.useQuery({ employeeId, archived: true }, { refetchInterval: 12_000 }); const preferences = trpc.pmecDelivery.notificationPreferences.useQuery({ employeeId });
  const assignMutation = trpc.pmecDelivery.assign.useMutation();
  const updateMutation = trpc.pmecDelivery.updateAssignment.useMutation();
  const submitMutation = trpc.pmecDelivery.submitTime.useMutation();
  const reviewMutation = trpc.pmecDelivery.reviewTime.useMutation();
  const markNotificationMutation = trpc.pmecDelivery.markNotificationRead.useMutation(); const archiveNotificationMutation = trpc.pmecDelivery.archiveNotification.useMutation(); const restoreNotificationMutation = trpc.pmecDelivery.restoreNotification.useMutation(); const preferencesMutation = trpc.pmecDelivery.updateNotificationPreferences.useMutation();
  const refresh = useCallback(async () => { await Promise.all([utils.pmecDelivery.assignments.invalidate(), utils.pmecDelivery.timeLogs.invalidate(), utils.pmecDelivery.notifications.invalidate(), utils.pmecDelivery.notificationPreferences.invalidate()]); }, [utils]);
  const assign = useCallback(async (input: Omit<SharedAssignment, "id"> & { id?: string }) => { await assignMutation.mutateAsync({ ...input, id: input.id ?? `pmec-assignment-${input.jobOrderId}-${input.taskId}`, dueDate: input.dueDate ?? undefined }); await refresh(); }, [assignMutation, refresh]);
  const updateAssignment = useCallback(async (id: string, update: Pick<SharedAssignment, "status" | "progress">) => { await updateMutation.mutateAsync({ id, ...update }); await refresh(); }, [refresh, updateMutation]);
  const submitTime = useCallback(async (input: Omit<SharedTimeLog, "id" | "employeeId" | "employeeName" | "status" | "reviewerNote">) => { await submitMutation.mutateAsync({ ...input, id: `pmec-time-${Date.now()}`, employeeId, employeeName }); await refresh(); }, [employeeId, employeeName, refresh, submitMutation]);
  const reviewTime = useCallback(async (id: string, status: "approved" | "rejected", reviewerNote?: string) => { await reviewMutation.mutateAsync({ id, status, reviewerNote }); await refresh(); }, [refresh, reviewMutation]);
  const markNotificationRead = useCallback(async (id: string) => { await markNotificationMutation.mutateAsync({ id }); await refresh(); }, [markNotificationMutation, refresh]);
  const archiveNotification = useCallback(async (id: string) => { await archiveNotificationMutation.mutateAsync({ id }); await refresh(); }, [archiveNotificationMutation, refresh]); const restoreNotification = useCallback(async (id: string) => { await restoreNotificationMutation.mutateAsync({ id }); await refresh(); }, [refresh, restoreNotificationMutation]); const updateNotificationPreferences = useCallback(async (update: NotificationPreferences) => { await preferencesMutation.mutateAsync({ employeeId, ...update }); await refresh(); }, [employeeId, preferencesMutation, refresh]);
  const sharedNotifications = (notifications.data ?? []) as SharedNotification[]; const sharedArchivedNotifications = (archivedNotifications.data ?? []) as SharedNotification[]; const sharedPreferences = (preferences.data ?? { assignmentsEnabled: true, timeApprovedEnabled: true }) as NotificationPreferences;
  const value = useMemo<SyncContext>(() => ({ ready: !allAssignments.isLoading && !allTimeLogs.isLoading && !notifications.isLoading && !archivedNotifications.isLoading && !preferences.isLoading, employeeId, employeeName, employeeAssignments: (employeeAssignments.data ?? []) as SharedAssignment[], allAssignments: (allAssignments.data ?? []) as SharedAssignment[], employeeTimeLogs: (employeeTimeLogs.data ?? []) as SharedTimeLog[], allTimeLogs: (allTimeLogs.data ?? []) as SharedTimeLog[], notifications: sharedNotifications, archivedNotifications: sharedArchivedNotifications, unreadNotifications: sharedNotifications.filter((item) => !item.readAt).length, notificationPreferences: sharedPreferences, assign, updateAssignment, submitTime, reviewTime, markNotificationRead, archiveNotification, restoreNotification, updateNotificationPreferences, refresh }), [allAssignments.data, allAssignments.isLoading, allTimeLogs.data, allTimeLogs.isLoading, archiveNotification, archivedNotifications.isLoading, assign, employeeAssignments.data, employeeId, employeeName, employeeTimeLogs.data, markNotificationRead, notifications.isLoading, preferences.isLoading, refresh, restoreNotification, reviewTime, sharedArchivedNotifications, sharedNotifications, sharedPreferences, submitTime, updateAssignment, updateNotificationPreferences]);
  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function usePmecDeliverySync() { const context = useContext(DeliveryContext); if (!context) throw new Error("usePmecDeliverySync must be used inside PmecDeliverySyncProvider"); return context; }
