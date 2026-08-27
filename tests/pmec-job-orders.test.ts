import { describe, expect, it } from "vitest";

import { COST_DOCUMENT_APPROVAL_LABELS, COST_DOCUMENT_APPROVAL_STATUSES, COST_DOCUMENT_CATEGORY_TAGS, budgetAlertStatus, budgetVariance, completedTaskCount, contingencyAmount, groupCurrencyTotals, initialPmeJobOrders, jobOrderProgress, jobOrderSpent, matchesProjectSearch, remainingAuthorized, totalAuthorized } from "../lib/pmec-job-orders";

describe("PMEC job-order module", () => {
  it("ships the required multi-region, multi-currency project-manager portfolio", () => {
    expect(initialPmeJobOrders).toHaveLength(3);
    expect(new Set(initialPmeJobOrders.map((job) => job.currency))).toEqual(new Set(["AWG", "EGP", "USD"]));
    expect(new Set(initialPmeJobOrders.map((job) => job.region))).toEqual(new Set(["ARUBA", "EGYPT", "PANAMA"]));
  });

  it("derives task-average progress, spend, contingency, and remaining authorized value", () => {
    const job = initialPmeJobOrders[0];
    expect(jobOrderProgress(job)).toBe(40);
    expect(completedTaskCount(job)).toBe(1);
    expect(contingencyAmount(job)).toBe(22200);
    expect(totalAuthorized(job)).toBe(207200);
    expect(jobOrderSpent(job)).toBeGreaterThan(0);
    expect(remainingAuthorized(job)).toBe(totalAuthorized(job) - jobOrderSpent(job));
  });

  it("groups portfolio amounts by job-order currency without blending currencies", () => {
    const grouped = groupCurrencyTotals(initialPmeJobOrders, (job) => job.budget);
    expect(grouped).toContainEqual({ currency: "AWG", total: 185000 });
    expect(grouped).toContainEqual({ currency: "EGP", total: 4200000 });
    expect(grouped).toContainEqual({ currency: "USD", total: 310000 });
  });

  it("classifies budget variance at operational thresholds and matches projects by delivery context", () => {
    const base = initialPmeJobOrders[0];
    const atRisk = { ...base, tasks: base.tasks.map((task, index) => index === 0 ? { ...task, laborCost: task.laborCost + 20000 } : task) };
    const overBudget = { ...base, tasks: base.tasks.map((task, index) => index === 0 ? { ...task, laborCost: task.laborCost + 50000 } : task) };
    expect(budgetAlertStatus(initialPmeJobOrders[0])).toBe("WATCH");
    expect(budgetAlertStatus(initialPmeJobOrders[1])).toBe("ON_TRACK");
    expect(budgetAlertStatus(atRisk)).toBe("AT_RISK");
    expect(budgetAlertStatus(overBudget)).toBe("OVER_BUDGET");
    expect(budgetVariance(initialPmeJobOrders[0])).toBeLessThan(0);
    expect(matchesProjectSearch(initialPmeJobOrders[0], "WEB Aruba")).toBe(true);
    expect(matchesProjectSearch(initialPmeJobOrders[1], "substation")).toBe(false);
  });

  it("ships pending and approved cost-document states with clear category tags", () => {
    const approvedDocument = initialPmeJobOrders[0].costDocuments[0];
    const pendingDocument = initialPmeJobOrders[2].costDocuments[0];

    expect(COST_DOCUMENT_APPROVAL_STATUSES).toEqual(["PENDING", "APPROVED"]);
    expect(COST_DOCUMENT_APPROVAL_LABELS.APPROVED).toBe("Approved");
    expect(COST_DOCUMENT_CATEGORY_TAGS).toContain("Contract");
    expect(approvedDocument.approvalStatus).toBe("APPROVED");
    expect(approvedDocument.tags).toContain("Receipt");
    expect(pendingDocument.approvalStatus).toBe("PENDING");
    expect(pendingDocument.tags).toContain("Invoice");
  });
});
