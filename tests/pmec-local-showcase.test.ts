import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC local client showcase", () => {
  it("routes each role to a no-password local-only presentation state without bypassing Clerk-backed APIs", () => {
    const source = readFileSync(resolve(process.cwd(), "app/demo.tsx"), "utf8");
    expect(source).toContain("SHOWCASE MODE · NO PASSWORD REQUIRED");
    expect(source).toContain("LOCAL SHOWCASE ONLY · DEVICE-LOCAL SAMPLE DATA · NO PRODUCTION API ACCESS");
    expect(source).toContain("completeOnboarding();");
    expect(source).toContain('signIn(employee.employeeNumber, employee.pin)');
    expect(source).toContain('setRole(selected.role)');
    expect(source).toContain('router.replace("/(tabs)")');
    expect(source).toContain('router.replace("/control-center")');
    expect(source).not.toContain("TextInput");
    expect(source).not.toContain("PMEC-Demo-");
    expect(source).not.toContain("trpc.");
  });
});
