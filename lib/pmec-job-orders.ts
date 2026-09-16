export const JOB_ORDER_PHASES = ["PLANNING", "DESIGN", "PROCUREMENT", "EXECUTION", "QA_INSPECTION", "PUNCH_LIST", "CLIENT_SIGNOFF", "COMPLETED"] as const;
export const JOB_ORDER_PHASE_LABELS: Record<JobOrderPhase, string> = { PLANNING: "Planning", DESIGN: "Design", PROCUREMENT: "Procurement", EXECUTION: "Execution", QA_INSPECTION: "QA / inspection", PUNCH_LIST: "Punch list", CLIENT_SIGNOFF: "Client sign-off", ON_HOLD: "On hold", COMPLETED: "Completed", CANCELLED: "Cancelled" };
export const DISCIPLINES = ["CIVIL_STRUCTURAL", "MECHANICAL", "ELECTRICAL", "PROCESS_INSTRUMENTATION", "ENVIRONMENTAL", "PROJECT_MANAGEMENT", "QUALITY_SAFETY"] as const;
export const DISCIPLINE_LABELS: Record<EngineeringDiscipline, string> = { CIVIL_STRUCTURAL: "Civil / structural", MECHANICAL: "Mechanical", ELECTRICAL: "Electrical", PROCESS_INSTRUMENTATION: "Process / instrumentation", ENVIRONMENTAL: "Environmental", PROJECT_MANAGEMENT: "Project management", QUALITY_SAFETY: "Quality / safety" };
export const WORK_PACKAGE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "UNDER_REVIEW", "COMPLETED"] as const;
export const WORK_PACKAGE_STATUS_LABELS: Record<WorkPackageStatus, string> = { NOT_STARTED: "Not started", IN_PROGRESS: "In progress", BLOCKED: "Blocked", UNDER_REVIEW: "Under review", COMPLETED: "Completed" };

export type JobOrderPhase = "PLANNING" | "DESIGN" | "PROCUREMENT" | "EXECUTION" | "QA_INSPECTION" | "PUNCH_LIST" | "CLIENT_SIGNOFF" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type EngineeringDiscipline = typeof DISCIPLINES[number];
export type WorkPackageStatus = typeof WORK_PACKAGE_STATUSES[number];
export type JobOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type BudgetAlertStatus = "ON_TRACK" | "WATCH" | "AT_RISK" | "OVER_BUDGET";
export type CostDocumentType = "SUBCONTRACTOR_INVOICE" | "PURCHASE_RECEIPT" | "CONTRACT" | "CHANGE_ORDER" | "OTHER";
export const COST_DOCUMENT_APPROVAL_STATUSES = ["PENDING", "APPROVED"] as const;
export type CostDocumentApprovalStatus = typeof COST_DOCUMENT_APPROVAL_STATUSES[number];
export const COST_DOCUMENT_APPROVAL_LABELS: Record<CostDocumentApprovalStatus, string> = { PENDING: "Pending approval", APPROVED: "Approved" };
export const COST_DOCUMENT_CATEGORY_TAGS = ["Invoice", "Receipt", "Contract", "Change order", "Compliance", "Vendor quote"] as const;
export function costDocumentCategoryTags(documentType: CostDocumentType): string[] { return documentType === "SUBCONTRACTOR_INVOICE" ? ["Invoice"] : documentType === "PURCHASE_RECEIPT" ? ["Receipt"] : documentType === "CONTRACT" ? ["Contract"] : documentType === "CHANGE_ORDER" ? ["Change order"] : []; }
export const COST_DOCUMENT_PENDING_WARNING_HOURS = 48;
export function pendingApprovalAgeHours(document: CostDocument, now = new Date()) {
  if ((document.approvalStatus ?? "PENDING") !== "PENDING") return 0;
  const latestPendingDecision = [...(document.approvalHistory ?? [])].sort((a, b) => b.changedAt.localeCompare(a.changedAt)).find((entry) => entry.status === "PENDING");
  const pendingSince = Date.parse(latestPendingDecision?.changedAt ?? document.uploadedAt);
  return Number.isFinite(pendingSince) ? Math.max(0, Math.floor((now.getTime() - pendingSince) / (60 * 60 * 1000))) : 0;
}
export function isCostDocumentApprovalOverdue(document: CostDocument, now = new Date()) { return pendingApprovalAgeHours(document, now) > COST_DOCUMENT_PENDING_WARNING_HOURS; }
export function pendingApprovalAgeLabel(hours: number) { return hours >= 48 ? `${Math.floor(hours / 24)}D ${hours % 24}H` : `${hours}H`; }
export type CostDocumentApprovalHistoryEntry = { id: string; status: CostDocumentApprovalStatus; reviewNote?: string; changedAt: string; changedBy: string };
export type PmecRegion = "EGYPT" | "ARUBA" | "VENEZUELA" | "PANAMA" | "OTHER";

export type CostLineItem = { name: string; quantity: number; unit: string; unitCost: number };
export type WorkPackageTask = { id: string; title: string; description: string; discipline: EngineeringDiscipline; status: WorkPackageStatus; progress: number; assignedTo: string; laborCost: number; materialCost: number; materials: CostLineItem[]; startDate?: string; dueDate?: string; completedDate?: string; notes?: string; wbsPhase?: string };
export type JobOrderMilestone = { id: string; label: string; targetDate: string; achieved: boolean; achievedDate?: string };
export type CostDocument = { id: string; url: string; description: string; documentType: CostDocumentType; approvalStatus?: CostDocumentApprovalStatus; reviewNote?: string; approvalHistory?: CostDocumentApprovalHistoryEntry[]; tags?: string[]; amount?: number; uploadedAt: string; uploadedBy: string; fileName?: string; mimeType?: string; sizeBytes?: number };
export type JobOrder = { id: string; title: string; description: string; clientName: string; discipline: EngineeringDiscipline; phase: JobOrderPhase; priority: JobOrderPriority; currency: string; budget: number; contingencyPct: number; quotationId?: string; netLaborMultiplier?: number; subcontractorName?: string; projectManagerName: string; region: PmecRegion; startDate: string; targetEndDate: string; actualEndDate?: string; clientApprovalDate?: string; clientApprovedBy?: string; tasks: WorkPackageTask[]; milestones: JobOrderMilestone[]; costDocuments: CostDocument[]; createdAt: string; updatedAt: string; tags: string[] };
export type NewJobOrder = Pick<JobOrder, "title" | "description" | "clientName" | "discipline" | "priority" | "currency" | "budget" | "contingencyPct" | "projectManagerName" | "region" | "startDate" | "targetEndDate" | "subcontractorName" | "quotationId" | "tags">;
export type CostDocumentBulkApprovalTarget = { jobOrderId: string; documentId: string };
export type CostDocumentBulkApprovalDecision = { changedAt: string; changedBy: string; reviewNote?: string };

export function applyBulkCostDocumentApproval(jobOrders: JobOrder[], targets: CostDocumentBulkApprovalTarget[], decision: CostDocumentBulkApprovalDecision): JobOrder[] {
  const targetKeys = new Set(targets.map((target) => `${target.jobOrderId}:${target.documentId}`));
  if (!targetKeys.size) return jobOrders;
  const reviewNote = decision.reviewNote?.trim() || undefined;
  return jobOrders.map((jobOrder) => {
    let affected = false;
    const costDocuments = jobOrder.costDocuments.map((document) => {
      if (!targetKeys.has(`${jobOrder.id}:${document.id}`) || (document.approvalStatus ?? "PENDING") !== "PENDING") return document;
      affected = true;
      const history = document.approvalHistory?.length ? document.approvalHistory : [{
        id: `history-${document.id}-initial`, status: document.approvalStatus ?? "PENDING", reviewNote: document.reviewNote, changedAt: document.uploadedAt, changedBy: document.uploadedBy,
      }];
      return {
        ...document,
        approvalStatus: "APPROVED" as const,
        reviewNote,
        approvalHistory: [...history, {
          id: `history-${document.id}-${decision.changedAt}`,
          status: "APPROVED" as const,
          reviewNote,
          changedAt: decision.changedAt,
          changedBy: decision.changedBy,
        }],
      };
    });
    return affected ? { ...jobOrder, costDocuments, updatedAt: decision.changedAt } : jobOrder;
  });
}

export { initialPmeJobOrders } from "./pmec-demo-job-orders";

export function lineItemTotal(item: CostLineItem) { return item.quantity * item.unitCost; }
export function taskTotalCost(taskItem: WorkPackageTask) { return taskItem.laborCost + taskItem.materialCost; }
export function jobOrderProgress(job: JobOrder) { return job.tasks.length ? Math.round(job.tasks.reduce((sum, item) => sum + item.progress, 0) / job.tasks.length) : 0; }
export function jobOrderSpent(job: JobOrder) { return job.tasks.reduce((sum, item) => sum + taskTotalCost(item), 0); }
export function contingencyAmount(job: JobOrder) { return Math.round(job.budget * job.contingencyPct / 100); }
export function totalAuthorized(job: JobOrder) { return job.budget + contingencyAmount(job); }
export function actualSpentPctOfBudget(job: JobOrder) { return job.budget ? Math.round(jobOrderSpent(job) / job.budget * 100) : 0; }
export function spentPctOfBudget(job: JobOrder) { return Math.min(actualSpentPctOfBudget(job), 100); }
export function remainingAuthorized(job: JobOrder) { return Math.max(0, totalAuthorized(job) - jobOrderSpent(job)); }
export function isOverBudget(job: JobOrder) { return jobOrderSpent(job) > job.budget; }
export const BUDGET_ALERT_LABELS: Record<BudgetAlertStatus, string> = { ON_TRACK: "On track", WATCH: "Budget watch", AT_RISK: "Budget at risk", OVER_BUDGET: "Over budget" };
export function budgetAlertStatus(job: JobOrder): BudgetAlertStatus { const burn = actualSpentPctOfBudget(job); return burn > 100 ? "OVER_BUDGET" : burn >= 90 ? "AT_RISK" : burn >= 75 ? "WATCH" : "ON_TRACK"; }
export function budgetVariance(job: JobOrder) { return jobOrderSpent(job) - job.budget; }
export function matchesProjectSearch(job: JobOrder, query: string) { const normalized = query.trim().toLocaleLowerCase(); if (!normalized) return true; return [job.title, job.clientName, job.projectManagerName, job.region, job.discipline, job.phase, ...job.tags].join(" ").toLocaleLowerCase().includes(normalized); }
export function completedTaskCount(job: JobOrder) { return job.tasks.filter((item) => item.status === "COMPLETED").length; }
export function impliedLaborMultiplier(job: JobOrder) { const laborSpent = job.tasks.reduce((sum, item) => sum + item.laborCost, 0); return laborSpent && job.budget ? Math.round(job.budget / laborSpent * 100) / 100 : null; }
export function formatMoney(currency: string, value: number) { return `${currency} ${Math.round(value).toLocaleString("en-US")}`; }
export function groupCurrencyTotals(jobs: JobOrder[], value: (job: JobOrder) => number) { return Object.entries(jobs.reduce<Record<string, number>>((result, job) => ({ ...result, [job.currency]: (result[job.currency] ?? 0) + value(job) }), {})).map(([currency, total]) => ({ currency, total })); }
export function nextJobOrderPhase(phase: JobOrderPhase): JobOrderPhase | null { const index = JOB_ORDER_PHASES.indexOf(phase as typeof JOB_ORDER_PHASES[number]); return index >= 0 && index < JOB_ORDER_PHASES.length - 1 ? JOB_ORDER_PHASES[index + 1] : null; }
export function groupWorkPackages(job: JobOrder) { return Object.entries(job.tasks.reduce<Record<string, WorkPackageTask[]>>((groups, item) => ({ ...groups, [item.wbsPhase ?? "General"]: [...(groups[item.wbsPhase ?? "General"] ?? []), item] }), {})); }
