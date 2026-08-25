import { describe, expect, it } from "vitest";

import { assertPayrollReviewPermission, hasPmecPermission, type PmecClerkPrincipal } from "../server/pmec-clerk-access";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const principal = (permissions: string[]): PmecClerkPrincipal => ({
  clerkUserId: "user_test",
  personId: "person_test",
  roles: permissions.includes("payroll.review") ? ["hr_manager"] : ["project_manager"],
  permissions,
});

describe("PMEC Clerk payroll access policy", () => {
  it("accepts only a principal with the Neon-backed payroll review permission", () => {
    const hr = principal(["people.read_organization", "payroll.review"]);

    expect(hasPmecPermission(hr, "payroll.review")).toBe(true);
    expect(assertPayrollReviewPermission(hr)).toBe(hr);
  });

  it("rejects project-manager and employee permission sets", () => {
    expect(() => assertPayrollReviewPermission(principal(["assignment.manage_assigned"]))).toThrow("verified HR payroll membership");
    expect(() => assertPayrollReviewPermission(principal(["assignment.read_own"]))).toThrow("verified HR payroll membership");
  });

  it("rejects the payroll endpoint before any draft payroll data can be returned without a Clerk bearer token", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(appRouter.createCaller(ctx).pmecPayroll.access()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Sign in with Clerk to continue.",
    });
  });
});
