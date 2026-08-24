import { describe, expect, it } from "vitest";

import { completedTaskCount, contingencyAmount, groupCurrencyTotals, initialPmeJobOrders, jobOrderProgress, jobOrderSpent, remainingAuthorized, totalAuthorized } from "../lib/pmec-job-orders";

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
});
