import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { initialPmeJobOrders, lineItemTotal, type CostDocument, type JobOrder, type JobOrderMilestone, type JobOrderPhase, type NewJobOrder, type WorkPackageTask } from "@/lib/pmec-job-orders";

const STORAGE_KEY = "lumen.pmec.job-orders.v1";
type PmecJobOrderWorkspace = { ready: boolean; jobOrders: JobOrder[]; addJobOrder: (input: NewJobOrder) => void; updateTask: (jobOrderId: string, taskId: string, updates: Partial<WorkPackageTask>) => void; addWorkPackage: (jobOrderId: string, input: Omit<WorkPackageTask, "id" | "materialCost">) => void; toggleMilestone: (jobOrderId: string, milestoneId: string) => void; addMilestone: (jobOrderId: string, input: Omit<JobOrderMilestone, "id" | "achieved">) => void; addCostDocument: (jobOrderId: string, input: Omit<CostDocument, "id" | "uploadedAt">) => void; advancePhase: (jobOrderId: string, phase: JobOrderPhase) => void; removeJobOrder: (jobOrderId: string) => void; resetDemo: () => void };
const PmecJobOrderContext = createContext<PmecJobOrderWorkspace | null>(null);
const stamp = () => new Date().toISOString();

export function PmecJobOrderWorkspaceProvider({ children }: PropsWithChildren) {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(initialPmeJobOrders);
  const [ready, setReady] = useState(false);
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((stored) => { if (stored) { try { const parsed = JSON.parse(stored) as JobOrder[]; if (Array.isArray(parsed)) setJobOrders(parsed); } catch { /* local demo falls back to seed data */ } } }).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jobOrders)); }, [jobOrders, ready]);
  const mutate = useCallback((jobOrderId: string, transform: (jobOrder: JobOrder) => JobOrder) => setJobOrders((current) => current.map((jobOrder) => jobOrder.id === jobOrderId ? { ...transform(jobOrder), updatedAt: stamp() } : jobOrder)), []);
  const addJobOrder = useCallback((input: NewJobOrder) => setJobOrders((current) => [{ ...input, id: `jo-${Date.now()}`, phase: "PLANNING", tasks: [], milestones: [], costDocuments: [], createdAt: stamp(), updatedAt: stamp() }, ...current]), []);
  const updateTask = useCallback((jobOrderId: string, taskId: string, updates: Partial<WorkPackageTask>) => mutate(jobOrderId, (jobOrder) => ({ ...jobOrder, tasks: jobOrder.tasks.map((taskItem) => { if (taskItem.id !== taskId) return taskItem; const materials = updates.materials ?? taskItem.materials; const status = updates.status ?? taskItem.status; return { ...taskItem, ...updates, materials, materialCost: materials.length ? materials.reduce((sum, material) => sum + lineItemTotal(material), 0) : updates.materialCost ?? taskItem.materialCost, completedDate: status === "COMPLETED" ? taskItem.completedDate ?? new Date().toISOString().slice(0, 10) : taskItem.completedDate }; }) })), [mutate]);
  const addWorkPackage = useCallback((jobOrderId: string, input: Omit<WorkPackageTask, "id" | "materialCost">) => mutate(jobOrderId, (jobOrder) => ({ ...jobOrder, tasks: [...jobOrder.tasks, { ...input, id: `wp-${Date.now()}`, materialCost: input.materials.reduce((sum, material) => sum + lineItemTotal(material), 0) }] })), [mutate]);
  const toggleMilestone = useCallback((jobOrderId: string, milestoneId: string) => mutate(jobOrderId, (jobOrder) => ({ ...jobOrder, milestones: jobOrder.milestones.map((milestone) => milestone.id === milestoneId ? { ...milestone, achieved: !milestone.achieved, achievedDate: !milestone.achieved ? new Date().toISOString().slice(0, 10) : undefined } : milestone) })), [mutate]);
  const addMilestone = useCallback((jobOrderId: string, input: Omit<JobOrderMilestone, "id" | "achieved">) => mutate(jobOrderId, (jobOrder) => ({ ...jobOrder, milestones: [...jobOrder.milestones, { ...input, id: `milestone-${Date.now()}`, achieved: false }] })), [mutate]);
  const addCostDocument = useCallback((jobOrderId: string, input: Omit<CostDocument, "id" | "uploadedAt">) => mutate(jobOrderId, (jobOrder) => ({ ...jobOrder, costDocuments: [...jobOrder.costDocuments, { ...input, id: `document-${Date.now()}`, uploadedAt: stamp() }] })), [mutate]);
  const advancePhase = useCallback((jobOrderId: string, phase: JobOrderPhase) => mutate(jobOrderId, (jobOrder) => ({ ...jobOrder, phase, actualEndDate: phase === "COMPLETED" ? new Date().toISOString().slice(0, 10) : jobOrder.actualEndDate })), [mutate]);
  const removeJobOrder = useCallback((jobOrderId: string) => setJobOrders((current) => current.filter((jobOrder) => jobOrder.id !== jobOrderId)), []);
  const resetDemo = useCallback(() => { void AsyncStorage.removeItem(STORAGE_KEY); setJobOrders(initialPmeJobOrders); }, []);
  const value = useMemo<PmecJobOrderWorkspace>(() => ({ ready, jobOrders, addJobOrder, updateTask, addWorkPackage, toggleMilestone, addMilestone, addCostDocument, advancePhase, removeJobOrder, resetDemo }), [ready, jobOrders, addJobOrder, updateTask, addWorkPackage, toggleMilestone, addMilestone, addCostDocument, advancePhase, removeJobOrder, resetDemo]);
  return <PmecJobOrderContext.Provider value={value}>{children}</PmecJobOrderContext.Provider>;
}
export function usePmecJobOrders() { const context = useContext(PmecJobOrderContext); if (!context) throw new Error("usePmecJobOrders must be used within PmecJobOrderWorkspaceProvider"); return context; }
