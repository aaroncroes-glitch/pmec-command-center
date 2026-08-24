import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from "react";

import { useEss } from "@/lib/ess-workspace";
import { trpc } from "@/lib/trpc";

export type SharedAssignment = { id: string; jobOrderId: string; jobOrderTitle: string; taskId: string; taskTitle: string; employeeId: string; employeeName: string; discipline: string; status: "assigned" | "in_progress" | "blocked" | "complete"; progress: number; assignedBy: string; dueDate: string | null };
export type SharedTimeLog = { id: string; assignmentId: string; employeeId: string; employeeName: string; jobOrderId: string; taskId: string; workDate: string; minutes: number; note: string; status: "submitted" | "approved" | "rejected"; reviewerNote: string | null };
type SyncContext = { ready: boolean; employeeId: string; employeeName: string; employeeAssignments: SharedAssignment[]; allAssignments: SharedAssignment[]; employeeTimeLogs: SharedTimeLog[]; allTimeLogs: SharedTimeLog[]; assign: (input: Omit<SharedAssignment, "id"> & { id?: string }) => Promise<void>; updateAssignment: (id: string, update: Pick<SharedAssignment, "status" | "progress">) => Promise<void>; submitTime: (input: Omit<SharedTimeLog, "id" | "employeeId" | "employeeName" | "status" | "reviewerNote">) => Promise<void>; reviewTime: (id: string, status: "approved" | "rejected", reviewerNote?: string) => Promise<void>; refresh: () => Promise<void> };
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
  const assignMutation = trpc.pmecDelivery.assign.useMutation();
  const updateMutation = trpc.pmecDelivery.updateAssignment.useMutation();
  const submitMutation = trpc.pmecDelivery.submitTime.useMutation();
  const reviewMutation = trpc.pmecDelivery.reviewTime.useMutation();
  const refresh = useCallback(async () => { await Promise.all([utils.pmecDelivery.assignments.invalidate(), utils.pmecDelivery.timeLogs.invalidate()]); }, [utils]);
  const assign = useCallback(async (input: Omit<SharedAssignment, "id"> & { id?: string }) => { await assignMutation.mutateAsync({ ...input, id: input.id ?? `pmec-assignment-${input.jobOrderId}-${input.taskId}`, dueDate: input.dueDate ?? undefined }); await refresh(); }, [assignMutation, refresh]);
  const updateAssignment = useCallback(async (id: string, update: Pick<SharedAssignment, "status" | "progress">) => { await updateMutation.mutateAsync({ id, ...update }); await refresh(); }, [refresh, updateMutation]);
  const submitTime = useCallback(async (input: Omit<SharedTimeLog, "id" | "employeeId" | "employeeName" | "status" | "reviewerNote">) => { await submitMutation.mutateAsync({ ...input, id: `pmec-time-${Date.now()}`, employeeId, employeeName }); await refresh(); }, [employeeId, employeeName, refresh, submitMutation]);
  const reviewTime = useCallback(async (id: string, status: "approved" | "rejected", reviewerNote?: string) => { await reviewMutation.mutateAsync({ id, status, reviewerNote }); await refresh(); }, [refresh, reviewMutation]);
  const value = useMemo<SyncContext>(() => ({ ready: !allAssignments.isLoading && !allTimeLogs.isLoading, employeeId, employeeName, employeeAssignments: (employeeAssignments.data ?? []) as SharedAssignment[], allAssignments: (allAssignments.data ?? []) as SharedAssignment[], employeeTimeLogs: (employeeTimeLogs.data ?? []) as SharedTimeLog[], allTimeLogs: (allTimeLogs.data ?? []) as SharedTimeLog[], assign, updateAssignment, submitTime, reviewTime, refresh }), [allAssignments.data, allAssignments.isLoading, allTimeLogs.data, allTimeLogs.isLoading, assign, employeeAssignments.data, employeeId, employeeName, employeeTimeLogs.data, refresh, reviewTime, submitTime, updateAssignment]);
  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function usePmecDeliverySync() { const context = useContext(DeliveryContext); if (!context) throw new Error("usePmecDeliverySync must be used inside PmecDeliverySyncProvider"); return context; }
