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

  it("includes a showcase's worth of attendance, leave, payslips, events, and activity", () => {
    expect(initialEssState.attendance.length).toBeGreaterThanOrEqual(12);
    expect(initialEssState.leaveRequests.length).toBeGreaterThanOrEqual(6);
    expect(initialEssState.payslips).toHaveLength(6);
    expect(initialEssState.events.length).toBeGreaterThanOrEqual(4);
    expect(initialEssState.activity.length).toBeGreaterThanOrEqual(8);
  });
});
