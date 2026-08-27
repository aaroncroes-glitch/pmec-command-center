import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC local client showcase", () => {
  it("routes Employee to mobile showcase and PM/HR to their separate no-password desktop Control Centers without bypassing Clerk-backed APIs", () => {
    const source = readFileSync(resolve(process.cwd(), "app/demo.tsx"), "utf8");
    expect(source).toContain("MOBILE SHOWCASE · NO PASSWORD REQUIRED");
    expect(source).toContain("DESKTOP CONTROL CENTER · NO PASSWORD REQUIRED");
    expect(source).toContain("SHOWCASE DATA ONLY · DEVICE-LOCAL SAMPLE DATA · NO PRODUCTION API ACCESS");
    expect(source).toContain("completeOnboarding();");
    expect(source).toContain('signIn(employee.employeeNumber, employee.pin)');
    expect(source).toContain('"https://pm.pmec.group/control-center"');
    expect(source).toContain('"https://hr.pmec.group/control-center"');
    expect(source).toContain("window.location.assign(selected.destinationUrl)");
    expect(source).toContain('router.replace("/(tabs)")');
    expect(source).toContain('router.replace("/control-center")');
    expect(source).not.toContain("TextInput");
    expect(source).not.toContain("PMEC-Demo-");
    expect(source).not.toContain("trpc.");
  });
});
