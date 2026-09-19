import { describe, expect, it } from "vitest";

import { applyClientChangeOrder, initialPmeJobOrders } from "../lib/pmec-job-orders";

const job = initialPmeJobOrders.find((item) => item.id === "jo-hotel-renovation")!;
const order = { id: "0f8fad5b-d9cb-469f-a165-70867728950e", number: 1, title: "Asbestos lagging removal", amount: 14200, decidedAt: "2026-09-19T10:00:00.000Z", decidedBy: "Renaissance Aruba (demo client)", note: "Keep corridors clear" };

describe("applyClientChangeOrder", () => {
  it("raises the budget and records an approved change-order document", () => {
    const next = applyClientChangeOrder(job, order);
    expect(next.budget).toBe(job.budget + 14200);
    const doc = next.costDocuments.at(-1)!;
    expect(doc.documentType).toBe("CHANGE_ORDER");
    expect(doc.approvalStatus).toBe("APPROVED");
    expect(doc.amount).toBe(14200);
    expect(doc.description).toContain("CO-01");
  });

  it("is idempotent", () => {
    const once = applyClientChangeOrder(job, order);
    expect(applyClientChangeOrder(once, order)).toBe(once);
  });

  it("handles reductions", () => {
    expect(applyClientChangeOrder(job, { ...order, id: "x", amount: -5000 }).budget).toBe(job.budget - 5000);
  });
});
