import { describe, expect, it } from "vitest";

import { buildDraftArubaPayrollRun, calculateArubaPayroll, type ArubaPayrollProfile } from "../lib/pmec-aruba-payroll";
import { roleCan } from "../lib/pmec-access";

const profile = (overrides: Partial<ArubaPayrollProfile> = {}): ArubaPayrollProfile => ({
  employeeId: "emp-1", personnelNumber: "PMEC-001", grossMonthlySalary: 4_500, age: 30, maritalStatus: "single", socialSecurityEnabled: true, svbRiskPercentage: 2.5, reparatietoeslag: 0, pensionContributionAnnual: 0, savingsFundContributionAnnual: 0, profileStatus: "scenario", ...overrides,
});

describe("PMEC Aruba payroll draft calculations", () => {
  it("preserves the supplied low-salary 2026 fixture with zero wage tax", () => {
    const result = calculateArubaPayroll(profile(), 2026);
    expect(result.employee).toMatchObject({ wageTax: 0, aovAww: 218.75, azv: 70, netSalary: 4_211.25 });
  });

  it("applies multi-bracket wage tax and capped employer premiums", () => {
    const result = calculateArubaPayroll(profile({ grossMonthlySalary: 10_000 }), 2026);
    expect(result.employee).toMatchObject({ wageTax: 1_224, netSalary: 8_308.5 });
    expect(result.employer).toMatchObject({ aovAww: 743.75, azv: 630.42, zv: 155.03 });
  });

  it("applies the 2026 pensioner AOV/AWW exemption and AZV tier", () => {
    const result = calculateArubaPayroll(profile({ grossMonthlySalary: 5_000, age: 66 }), 2026);
    expect(result.metadata.isPensioner).toBe(true);
    expect(result.employee).toMatchObject({ aovAww: 0, azv: 249.38 });
  });

  it("builds a draft run for employees only and uses the following-month DIMP due date", () => {
    const run = buildDraftArubaPayrollRun([
      { id: "emp-1", name: "Employee", role: "Engineer", discipline: "Electrical", type: "Employee", location: "Aruba", status: "Active", allocation: 70, weeklyCapacity: 40, employment: "PMEC employee" },
      { id: "con-1", name: "Contractor", role: "Vendor", discipline: "Electrical", type: "Contractor", location: "Aruba", status: "Active", allocation: 70, weeklyCapacity: 40, employment: "External specialist" },
    ], "2026-04");

    expect(run).toMatchObject({ period: "2026-04", status: "draft", filingDeadline: "2026-05-15" });
    expect(run.lines).toHaveLength(1);
    expect(run.lines[0]).toMatchObject({ employeeId: "emp-1", personnelNumber: "PMEC-001" });
    expect(run.lines[0]?.reviewFlags).toContain("Scenario compensation profile");
  });

  it("limits the payroll workspace permission to HR in the current role-scoped demo", () => {
    expect(roleCan("hr", "payroll")).toBe(true);
    expect(roleCan("pm", "payroll")).toBe(false);
  });
});
