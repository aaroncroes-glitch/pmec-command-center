import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { pmecAssignments, pmecNotifications, pmecTimeLogs } from "../drizzle/schema";
import { roleCan } from "../lib/pmec-access";

describe("PMEC shared delivery contract", () => {
  it("stores assignment identity, employee routing, and delivery progress", () => {
    expect(Object.keys(getTableColumns(pmecAssignments))).toEqual(expect.arrayContaining(["id", "jobOrderId", "taskId", "employeeId", "employeeName", "status", "progress", "assignedBy"]));
  });

  it("stores employee time logs with assignment routing and review state", () => {
    expect(Object.keys(getTableColumns(pmecTimeLogs))).toEqual(expect.arrayContaining(["id", "assignmentId", "employeeId", "jobOrderId", "taskId", "workDate", "minutes", "note", "status"]));
  });

  it("stores employee notification routing and read state", () => {
    expect(Object.keys(getTableColumns(pmecNotifications))).toEqual(expect.arrayContaining(["id", "employeeId", "type", "title", "body", "route", "readAt", "createdAt"]));
  });

  it("keeps delivery authority with PM while reserving people and leave review for HR", () => {
    expect(roleCan("pm", "assign")).toBe(true);
    expect(roleCan("pm", "leaveReview")).toBe(false);
    expect(roleCan("hr", "people")).toBe(true);
    expect(roleCan("hr", "hoursApprove")).toBe(false);
  });
});
