import { describe, expect, it } from "vitest";

import { buildRoleComparisonMetrics } from "../lib/pmec-role-comparison";

describe("PMEC dual-role comparison", () => {
  it("keeps delivery and workforce summaries distinct while using shared PMEC state", () => {
    const metrics = buildRoleComparisonMetrics({
      workforce: [
        { allocation: 90, status: "Active", weeklyCapacity: 40 },
        { allocation: 50, status: "Away", weeklyCapacity: 40 },
      ],
      leaveRequests: [{ status: "pending" }, { status: "approved" }],
      timeLogs: [{ hours: 7.5, status: "Submitted" }, { hours: 8, status: "Approved" }],
      jobOrders: [{ phase: "IN_PROGRESS" }, { phase: "COMPLETED" }, { phase: "PLANNING" }],
      assignmentCount: 4,
    });

    expect(metrics.projectManager).toEqual({ activeJobOrders: 2, hoursAwaitingApproval: 7.5, capacityWatch: 1, assignmentCount: 4 });
    expect(metrics.humanResources).toEqual({ workforceCount: 2, pendingLeave: 1, availabilityFlags: 1, weeklyOpenCapacity: 24 });
  });
});
