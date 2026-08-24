import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { pmecAssignments, pmecTimeLogs } from "../drizzle/schema";

describe("PMEC shared delivery contract", () => {
  it("stores assignment identity, employee routing, and delivery progress", () => {
    expect(Object.keys(getTableColumns(pmecAssignments))).toEqual(expect.arrayContaining(["id", "jobOrderId", "taskId", "employeeId", "employeeName", "status", "progress", "assignedBy"]));
  });

  it("stores employee time logs with assignment routing and review state", () => {
    expect(Object.keys(getTableColumns(pmecTimeLogs))).toEqual(expect.arrayContaining(["id", "assignmentId", "employeeId", "jobOrderId", "taskId", "workDate", "minutes", "note", "status"]));
  });
});
