import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { allowedSurfaceForRole, MAPPABLE_ROLES } from "../server/pmec-identity-admin";
import { assertMembershipManagePermission, type PmecClerkPrincipal } from "../server/pmec-clerk-access";

function principal(permissions: string[]): PmecClerkPrincipal {
  return {
    clerkUserId: "user_test",
    personId: "person_test",
    organizationId: "org_test",
    legacyEmployeeId: null,
    roles: ["organization_admin"],
    permissions,
  };
}

describe("PMEC production identity administration", () => {
  it("maps only employee, PM, and HR memberships to their correct client surfaces", () => {
    expect(MAPPABLE_ROLES).toEqual(["employee", "project_manager", "hr_manager"]);
    expect(allowedSurfaceForRole("employee")).toBe("employee_mobile");
    expect(allowedSurfaceForRole("project_manager")).toBe("operations_web");
    expect(allowedSurfaceForRole("hr_manager")).toBe("operations_web");
  });

  it("requires membership management rather than payroll or PM permissions", () => {
    expect(() => assertMembershipManagePermission(principal(["membership.manage"]))).not.toThrow();
    expect(() => assertMembershipManagePermission(principal(["payroll.review"]))).toThrow(/organization administrator/i);
    expect(() => assertMembershipManagePermission(principal(["assignment.manage_assigned"]))).toThrow(/organization administrator/i);
  });

  it("keeps the dedicated identity-admin database role separate from delivery and payroll data", () => {
    const migration = readFileSync(join(process.cwd(), "neon/20260825_pmec_identity_admin.sql"), "utf8");
    expect(migration).toContain("pmec_identity_admin_20260825");
    expect(migration).toContain("pmec.people");
    expect(migration).toContain("pmec.auth_identities");
    expect(migration).toContain("pmec.memberships");
    expect(migration).toContain("pmec.audit_events");
    expect(migration).not.toContain("delivery_assignments");
    expect(migration).not.toContain("pmec.payroll");
  });

  it("pins the admin UI and API to membership.manage, excluding payroll authority", () => {
    const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");
    const ui = readFileSync(join(process.cwd(), "components/pmec-identity-admin.tsx"), "utf8");
    expect(router).toContain("pmecIdentityAdmin");
    expect(router).toContain("assertMembershipManagePermission");
    expect(ui).toContain("Payroll authority is never granted from this workspace");
    expect(ui).toContain("organization-admin or payroll permissions here");
  });
});
