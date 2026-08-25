import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { pmecAssignments, pmecNotificationPreferences, pmecNotifications, pmecTimeLogs } from "../drizzle/schema";
import { roleCan } from "../lib/pmec-access";

const deliveryRouter = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

describe("PMEC shared delivery contract", () => {
  it("stores assignment identity, employee routing, and delivery progress", () => {
    expect(Object.keys(getTableColumns(pmecAssignments))).toEqual(expect.arrayContaining(["id", "jobOrderId", "taskId", "employeeId", "employeeName", "status", "progress", "assignedBy"]));
  });

  it("stores employee time logs with assignment routing and review state", () => {
    expect(Object.keys(getTableColumns(pmecTimeLogs))).toEqual(expect.arrayContaining(["id", "assignmentId", "employeeId", "jobOrderId", "taskId", "workDate", "minutes", "note", "status"]));
  });

  it("stores employee notification routing, read state, and archive state", () => {
    expect(Object.keys(getTableColumns(pmecNotifications))).toEqual(expect.arrayContaining(["id", "employeeId", "type", "title", "body", "route", "readAt", "archivedAt", "createdAt"]));
  });

  it("stores employee-specific notification preference controls", () => {
    expect(Object.keys(getTableColumns(pmecNotificationPreferences))).toEqual(expect.arrayContaining(["employeeId", "assignmentsEnabled", "timeApprovedEnabled", "updatedAt"]));
  });

  it("keeps delivery authority with PM while reserving people and leave review for HR", () => {
    expect(roleCan("pm", "assign")).toBe(true);
    expect(roleCan("pm", "leaveReview")).toBe(false);
    expect(roleCan("hr", "people")).toBe(true);
    expect(roleCan("hr", "hoursApprove")).toBe(false);
    expect(roleCan("hr", "hrPlanning")).toBe(true);
  });

  it("keeps server-side assignment writes PM-only while HR receives only organization time-log read access", () => {
    expect(deliveryRouter).toContain('const assignmentManagerPermissions = ["assignment.manage_assigned"]');
    expect(deliveryRouter).toContain('const organizationTimeReadPermissions = ["time_log.approve_assigned", "time_log.read_organization"]');
    expect(deliveryRouter).not.toContain("people.read_organization");
  });

  it("shows access boundaries in the employee and control-center dashboards while using a server-side Clerk principal", () => {
    const employeeScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
    const controlCenter = readFileSync(resolve(process.cwd(), "app/control-center/index.tsx"), "utf8");
    expect(deliveryRouter).toContain("pmecAccess");
    expect(deliveryRouter).toContain("resolvePmecClerkPrincipal(ctx.req)");
    expect(employeeScreen).toContain("YOUR PMEC ACCESS · EMPLOYEE");
    expect(controlCenter).toContain("ACCESS BOUNDARIES");
    expect(controlCenter).toContain("Local role preview never expands server authority");
  });
});
