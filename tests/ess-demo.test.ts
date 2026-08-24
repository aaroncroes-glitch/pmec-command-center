import { describe, expect, it } from "vitest";

import { initialEssState } from "../lib/ess-data";

describe("local employee self-service demo", () => {
  it("ships the documented employee-number and PIN demo profile", () => {
    expect(initialEssState.employee.employeeNumber).toBe("76");
    expect(initialEssState.employee.pin).toBe("1234");
    expect(initialEssState.employee.firstName).toBe("Percy");
  });

  it("includes four local projects with trackable phases and tasks", () => {
    expect(initialEssState.projects).toHaveLength(4);
    initialEssState.projects.forEach((project) => {
      expect(project.phases).toHaveLength(4);
      expect(project.phases.flatMap((phase) => phase.tasks).length).toBeGreaterThan(0);
    });
  });

  it("includes local attendance, leave, payslip, event, and activity records", () => {
    expect(initialEssState.attendance.length).toBeGreaterThan(0);
    expect(initialEssState.leaveRequests.length).toBeGreaterThan(0);
    expect(initialEssState.payslips).toHaveLength(3);
    expect(initialEssState.events.length).toBeGreaterThan(0);
    expect(initialEssState.activity.length).toBeGreaterThan(0);
  });
});
