import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCrossTabStore } from "@/lib/pmec-cross-tab";
import { mergeJobOrders } from "@/lib/pmec-demo-merge";
import { useDemoSync } from "@/lib/pmec-demo-sync";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  applyBulkCostDocumentApproval,
  costDocumentCategoryTags,
  initialPmeJobOrders,
  lineItemTotal,
  type CostDocument,
  type CostDocumentBulkApprovalTarget,
  type CostDocumentApprovalStatus,
  type JobOrder,
  type JobOrderMilestone,
  type JobOrderPhase,
  type NewJobOrder,
  type WorkPackageTask,
} from "@/lib/pmec-job-orders";

const STORAGE_KEY = "lumen.pmec.job-orders.v2";

type ApprovalDecision = {
  status: CostDocumentApprovalStatus;
  reviewNote?: string;
  changedBy: string;
};

type PmecJobOrderWorkspace = {
  ready: boolean;
  jobOrders: JobOrder[];
  addJobOrder: (input: NewJobOrder) => void;
  updateTask: (jobOrderId: string, taskId: string, updates: Partial<WorkPackageTask>) => void;
  addWorkPackage: (jobOrderId: string, input: Omit<WorkPackageTask, "id" | "materialCost">) => void;
  toggleMilestone: (jobOrderId: string, milestoneId: string) => void;
  addMilestone: (jobOrderId: string, input: Omit<JobOrderMilestone, "id" | "achieved">) => void;
  addCostDocument: (jobOrderId: string, input: Omit<CostDocument, "id" | "uploadedAt" | "approvalHistory">) => void;
  updateCostDocument: (jobOrderId: string, documentId: string, updates: Partial<CostDocument>) => void;
  recordCostDocumentDecision: (jobOrderId: string, documentId: string, decision: ApprovalDecision) => void;
  bulkApproveCostDocuments: (targets: CostDocumentBulkApprovalTarget[], decision: Omit<ApprovalDecision, "status">) => void;
  advancePhase: (jobOrderId: string, phase: JobOrderPhase) => void;
  removeJobOrder: (jobOrderId: string) => void;
  resetDemo: () => void;
};

const PmecJobOrderContext = createContext<PmecJobOrderWorkspace | null>(null);
const stamp = () => new Date().toISOString();

function normalizeDocument(document: CostDocument): CostDocument {
  const approvalStatus = document.approvalStatus ?? "PENDING";
  const tags = document.tags?.length ? document.tags : costDocumentCategoryTags(document.documentType);
  const approvalHistory = Array.isArray(document.approvalHistory) && document.approvalHistory.length
    ? document.approvalHistory
    : [{
      id: `history-${document.id}-initial`,
      status: approvalStatus,
      reviewNote: document.reviewNote,
      changedAt: document.uploadedAt,
      changedBy: document.uploadedBy,
    }];
  return { ...document, approvalStatus, tags, approvalHistory };
}

function normalizeJobOrder(jobOrder: JobOrder): JobOrder {
  return { ...jobOrder, costDocuments: jobOrder.costDocuments.map(normalizeDocument) };
}

const INITIAL_RAW = JSON.stringify(initialPmeJobOrders.map(normalizeJobOrder));

export function PmecJobOrderWorkspaceProvider({ children }: PropsWithChildren) {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => initialPmeJobOrders.map(normalizeJobOrder));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as JobOrder[];
          if (Array.isArray(parsed)) setJobOrders(parsed.map(normalizeJobOrder));
        } catch {
          // Local showcase safely falls back to the seeded demonstration portfolio.
        }
      })
      .finally(() => setReady(true));
  }, []);

  // What this window last wrote or took in, so two open windows cannot answer each other's
  // writes forever: each arriving copy is a new object to React, identical content or not.
  const lastRaw = useRef<string | null>(null);
  // Set by the demo sync below. A ref, because this save effect has to be declared first.
  const pushRef = useRef<(raw: string) => void>(() => undefined);
  useEffect(() => {
    if (!ready) return;
    const raw = JSON.stringify(jobOrders);
    if (raw === lastRaw.current) return;
    lastRaw.current = raw;
    void AsyncStorage.setItem(STORAGE_KEY, raw);
    pushRef.current(raw);
  }, [jobOrders, ready]);

  // Another window of the same showcase writing these projects lands here, so an assignment
  // made in the control center reaches the employee view beside it.
  const applyStored = useCallback((raw: string) => {
    if (raw === lastRaw.current) return;
    lastRaw.current = raw;
    try {
      const parsed = JSON.parse(raw) as JobOrder[];
      if (Array.isArray(parsed)) setJobOrders(parsed.map(normalizeJobOrder));
    } catch {
      // Keep the projects already on screen.
    }
  }, []);
  useCrossTabStore(STORAGE_KEY, applyStored);
  // Across portal., hr., pm. and separate devices. Must come after the save effect above:
  // see the ordering note in lib/pmec-demo-sync.ts.
  const { push: pushDemoSync, reset: resetDemoSync } = useDemoSync({ key: STORAGE_KEY, ready, initialRaw: INITIAL_RAW, apply: applyStored, merge: mergeJobOrders });
  pushRef.current = pushDemoSync;

  const mutate = useCallback(
    (jobOrderId: string, transform: (jobOrder: JobOrder) => JobOrder) => {
      setJobOrders((current) => current.map((jobOrder) => (
        jobOrder.id === jobOrderId ? { ...transform(jobOrder), updatedAt: stamp() } : jobOrder
      )));
    },
    [],
  );

  const addJobOrder = useCallback((input: NewJobOrder) => {
    setJobOrders((current) => [{
      ...input,
      id: `jo-${Date.now()}`,
      phase: "PLANNING",
      tasks: [],
      milestones: [],
      costDocuments: [],
      createdAt: stamp(),
      updatedAt: stamp(),
    }, ...current]);
  }, []);

  const updateTask = useCallback((jobOrderId: string, taskId: string, updates: Partial<WorkPackageTask>) => {
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      tasks: jobOrder.tasks.map((taskItem) => {
        if (taskItem.id !== taskId) return taskItem;
        const materials = updates.materials ?? taskItem.materials;
        const status = updates.status ?? taskItem.status;
        return {
          ...taskItem,
          ...updates,
          materials,
          materialCost: materials.length
            ? materials.reduce((sum, material) => sum + lineItemTotal(material), 0)
            : updates.materialCost ?? taskItem.materialCost,
          completedDate: status === "COMPLETED"
            ? taskItem.completedDate ?? new Date().toISOString().slice(0, 10)
            : taskItem.completedDate,
        };
      }),
    }));
  }, [mutate]);

  const addWorkPackage = useCallback((jobOrderId: string, input: Omit<WorkPackageTask, "id" | "materialCost">) => {
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      tasks: [...jobOrder.tasks, {
        ...input,
        id: `wp-${Date.now()}`,
        materialCost: input.materials.reduce((sum, material) => sum + lineItemTotal(material), 0),
      }],
    }));
  }, [mutate]);

  const toggleMilestone = useCallback((jobOrderId: string, milestoneId: string) => {
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      milestones: jobOrder.milestones.map((milestone) => milestone.id === milestoneId
        ? {
          ...milestone,
          achieved: !milestone.achieved,
          achievedDate: !milestone.achieved ? new Date().toISOString().slice(0, 10) : undefined,
        }
        : milestone),
    }));
  }, [mutate]);

  const addMilestone = useCallback((jobOrderId: string, input: Omit<JobOrderMilestone, "id" | "achieved">) => {
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      milestones: [...jobOrder.milestones, { ...input, id: `milestone-${Date.now()}`, achieved: false }],
    }));
  }, [mutate]);

  const addCostDocument = useCallback((jobOrderId: string, input: Omit<CostDocument, "id" | "uploadedAt" | "approvalHistory">) => {
    const uploadedAt = stamp();
    const approvalStatus = input.approvalStatus ?? "PENDING";
    const reviewNote = input.reviewNote?.trim() || undefined;
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      costDocuments: [...jobOrder.costDocuments, {
        ...input,
        id: `document-${Date.now()}`,
        uploadedAt,
        approvalStatus,
        reviewNote,
        approvalHistory: [{
          id: `history-document-${Date.now()}`,
          status: approvalStatus,
          reviewNote,
          changedAt: uploadedAt,
          changedBy: input.uploadedBy,
        }],
      }],
    }));
  }, [mutate]);

  const updateCostDocument = useCallback((jobOrderId: string, documentId: string, updates: Partial<CostDocument>) => {
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      costDocuments: jobOrder.costDocuments.map((document) => document.id === documentId
        ? { ...document, ...updates }
        : document),
    }));
  }, [mutate]);

  const recordCostDocumentDecision = useCallback((jobOrderId: string, documentId: string, decision: ApprovalDecision) => {
    const changedAt = stamp();
    const reviewNote = decision.reviewNote?.trim() || undefined;
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      costDocuments: jobOrder.costDocuments.map((document) => {
        if (document.id !== documentId) return document;
        const history = normalizeDocument(document).approvalHistory ?? [];
        return {
          ...document,
          approvalStatus: decision.status,
          reviewNote,
          approvalHistory: [...history, {
            id: `history-${document.id}-${Date.now()}`,
            status: decision.status,
            reviewNote,
            changedAt,
            changedBy: decision.changedBy,
          }],
        };
      }),
    }));
  }, [mutate]);

  const bulkApproveCostDocuments = useCallback((targets: CostDocumentBulkApprovalTarget[], decision: Omit<ApprovalDecision, "status">) => {
    setJobOrders((current) => applyBulkCostDocumentApproval(current, targets, { ...decision, changedAt: stamp() }));
  }, []);

  const advancePhase = useCallback((jobOrderId: string, phase: JobOrderPhase) => {
    mutate(jobOrderId, (jobOrder) => ({
      ...jobOrder,
      phase,
      actualEndDate: phase === "COMPLETED" ? new Date().toISOString().slice(0, 10) : jobOrder.actualEndDate,
    }));
  }, [mutate]);

  const removeJobOrder = useCallback((jobOrderId: string) => {
    setJobOrders((current) => current.filter((jobOrder) => jobOrder.id !== jobOrderId));
  }, []);

  const resetDemo = useCallback(() => {
    void AsyncStorage.removeItem(STORAGE_KEY);
    setJobOrders(initialPmeJobOrders.map(normalizeJobOrder));
    resetDemoSync();
  }, [resetDemoSync]);

  const value = useMemo<PmecJobOrderWorkspace>(() => ({
    ready,
    jobOrders,
    addJobOrder,
    updateTask,
    addWorkPackage,
    toggleMilestone,
    addMilestone,
    addCostDocument,
    updateCostDocument,
    recordCostDocumentDecision,
    bulkApproveCostDocuments,
    advancePhase,
    removeJobOrder,
    resetDemo,
  }), [
    ready,
    jobOrders,
    addJobOrder,
    updateTask,
    addWorkPackage,
    toggleMilestone,
    addMilestone,
    addCostDocument,
    updateCostDocument,
    recordCostDocumentDecision,
    bulkApproveCostDocuments,
    advancePhase,
    removeJobOrder,
    resetDemo,
  ]);

  return <PmecJobOrderContext.Provider value={value}>{children}</PmecJobOrderContext.Provider>;
}

export function usePmecJobOrders() {
  const context = useContext(PmecJobOrderContext);
  if (!context) throw new Error("usePmecJobOrders must be used within PmecJobOrderWorkspaceProvider");
  return context;
}
