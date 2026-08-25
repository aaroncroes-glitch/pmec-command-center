import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC local client showcase", () => {
  it("routes each demo role to local-only presentation state without bypassing Clerk-backed APIs", () => {
    const source = readFileSync(resolve(process.cwd(), "app/demo.tsx"), "utf8");
    expect(source).toContain("LOCAL SHOWCASE ONLY · NO PRODUCTION DELIVERY OR PAYROLL ACCESS");
    expect(source).toContain("completeOnboarding();");
    expect(source).toContain('signIn(employee.employeeNumber, employee.pin)');
    expect(source).toContain('setRole(account.role)');
    expect(source).toContain('router.replace("/(tabs)")');
    expect(source).toContain('router.replace("/control-center")');
    expect(source).not.toContain("trpc.");
  });
});
