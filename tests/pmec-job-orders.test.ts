import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { COST_DOCUMENT_APPROVAL_LABELS, COST_DOCUMENT_APPROVAL_STATUSES, COST_DOCUMENT_CATEGORY_TAGS, COST_DOCUMENT_PENDING_WARNING_HOURS, applyBulkCostDocumentApproval, budgetAlertStatus, budgetVariance, completedTaskCount, contingencyAmount, groupCurrencyTotals, initialPmeJobOrders, isCostDocumentApprovalOverdue, jobOrderProgress, jobOrderSpent, matchesProjectSearch, pendingApprovalAgeHours, pendingApprovalAgeLabel, remainingAuthorized, totalAuthorized } from "../lib/pmec-job-orders";

const byId = (id: string) => initialPmeJobOrders.find((job) => job.id === id)!;
const documents = initialPmeJobOrders.flatMap((job) => job.costDocuments);
const pending = documents.filter((document) => document.approvalStatus === "PENDING");
const approved = documents.filter((document) => document.approvalStatus === "APPROVED");

describe("PMEC job-order module", () => {
  it("ships a multi-region, multi-currency portfolio across the delivery stages", () => {
    expect(initialPmeJobOrders.length).toBeGreaterThanOrEqual(6);
    expect(new Set(initialPmeJobOrders.map((job) => job.currency))).toEqual(new Set(["AWG", "EGP", "USD"]));
    expect(new Set(initialPmeJobOrders.map((job) => job.region))).toEqual(new Set(["ARUBA", "EGYPT", "PANAMA"]));
    expect([...new Set(initialPmeJobOrders.map((job) => job.phase))]).toEqual(expect.arrayContaining(["PLANNING", "DESIGN", "EXECUTION", "QA_INSPECTION", "COMPLETED"]));
  });

  it("derives task-average progress, spend, contingency, and remaining authorized value", () => {
    const job = byId("jo-coastal-substation");
    expect(jobOrderProgress(job)).toBe(51);
    expect(completedTaskCount(job)).toBe(2);
    expect(contingencyAmount(job)).toBe(22200);
    expect(totalAuthorized(job)).toBe(207200);
    expect(jobOrderSpent(job)).toBe(156920);
    expect(remainingAuthorized(job)).toBe(totalAuthorized(job) - jobOrderSpent(job));
  });

  it("groups portfolio amounts by job-order currency without blending currencies", () => {
    const grouped = groupCurrencyTotals(initialPmeJobOrders, (job) => job.budget);
    expect(grouped).toContainEqual({ currency: "AWG", total: 1736000 });
    expect(grouped).toContainEqual({ currency: "EGP", total: 4200000 });
    expect(grouped).toContainEqual({ currency: "USD", total: 310000 });
  });

  it("shows every budget state and matches projects by delivery context", () => {
    const base = byId("jo-coastal-substation");
    const atRisk = { ...base, tasks: base.tasks.map((task, index) => (index === 0 ? { ...task, laborCost: task.laborCost + 20000 } : task)) };
    const overBudget = { ...base, tasks: base.tasks.map((task, index) => (index === 0 ? { ...task, laborCost: task.laborCost + 50000 } : task)) };
    expect(new Set(initialPmeJobOrders.map(budgetAlertStatus))).toEqual(new Set(["ON_TRACK", "WATCH", "AT_RISK", "OVER_BUDGET"]));
    expect(budgetAlertStatus(base)).toBe("WATCH");
    expect(budgetAlertStatus(byId("jo-water-treatment"))).toBe("ON_TRACK");
    expect(budgetAlertStatus(byId("jo-electrical-install"))).toBe("OVER_BUDGET");
    expect(budgetAlertStatus(atRisk)).toBe("AT_RISK");
    expect(budgetAlertStatus(overBudget)).toBe("OVER_BUDGET");
    expect(budgetVariance(base)).toBeLessThan(0);
    expect(matchesProjectSearch(base, "WEB Aruba")).toBe(true);
    expect(matchesProjectSearch(byId("jo-water-treatment"), "substation")).toBe(false);
  });

  it("ships pending and approved cost documents of every type, with an audit trail", () => {
    expect(COST_DOCUMENT_APPROVAL_STATUSES).toEqual(["PENDING", "APPROVED"]);
    expect(COST_DOCUMENT_APPROVAL_LABELS.APPROVED).toBe("Approved");
    expect(COST_DOCUMENT_CATEGORY_TAGS).toContain("Contract");
    expect(approved.length).toBeGreaterThanOrEqual(5);
    expect(pending.length).toBeGreaterThanOrEqual(5);
    expect(approved.every((document) => document.approvalHistory?.at(-1)?.status === "APPROVED")).toBe(true);
    expect(documents.every((document) => (document.tags?.length ?? 0) > 0)).toBe(true);
    expect(new Set(documents.map((document) => document.documentType))).toEqual(new Set(["PURCHASE_RECEIPT", "CONTRACT", "SUBCONTRACTOR_INVOICE", "CHANGE_ORDER", "OTHER"]));
  });

  it("defines cost-document approval-history entries for local decision auditing", () => {
    const model = readFileSync("lib/pmec-job-orders.ts", "utf8");

    expect(model).toContain("CostDocumentApprovalHistoryEntry");
    expect(model).toContain("approvalHistory?: CostDocumentApprovalHistoryEntry[]");
  });

  it("flags only pending cost documents that have exceeded the 48-hour review window", () => {
    const document = pending[0]!;
    const referenceTime = new Date(Date.parse(document.uploadedAt) + 49 * 3_600_000);

    expect(COST_DOCUMENT_PENDING_WARNING_HOURS).toBe(48);
    expect(pendingApprovalAgeHours(document, referenceTime)).toBe(49);
    expect(pendingApprovalAgeLabel(49)).toBe("2D 1H");
    expect(isCostDocumentApprovalOverdue(document, referenceTime)).toBe(true);
    expect(isCostDocumentApprovalOverdue(approved[0]!, referenceTime)).toBe(false);
  });

  it("keeps some pending documents inside the review window and some past it", () => {
    const overdue = pending.filter((document) => isCostDocumentApprovalOverdue(document));

    expect(overdue.length).toBeGreaterThanOrEqual(3);
    expect(pending.length - overdue.length).toBeGreaterThanOrEqual(2);
  });

  it("records one shared-rationale approval history event per selected pending document", () => {
    const targets = initialPmeJobOrders.flatMap((job) => job.costDocuments.filter((document) => document.approvalStatus === "PENDING").map((document) => ({ jobOrderId: job.id, documentId: document.id })));
    const updated = applyBulkCostDocumentApproval(initialPmeJobOrders, targets, {
      changedAt: new Date().toISOString(),
      changedBy: "PMEC Project Manager",
      reviewNote: "Batch review completed against approved vendor scope.",
    });
    const selected = updated.flatMap((job) => job.costDocuments).filter((document) => targets.some((target) => target.documentId === document.id));

    expect(selected).toHaveLength(pending.length);
    expect(selected.every((document) => document.approvalStatus === "APPROVED")).toBe(true);
    expect(selected.every((document) => document.reviewNote === "Batch review completed against approved vendor scope.")).toBe(true);
    expect(selected.every((document) => document.approvalHistory?.at(-1)?.changedBy === "PMEC Project Manager")).toBe(true);
  });
});
