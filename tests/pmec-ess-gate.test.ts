import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { essGateTarget } from "../lib/ess-gate";

describe("essGateTarget", () => {
  it("decides nothing until saved state has loaded", () => {
    // Deciding early reads the defaults, and bounced returning employees to the intro.
    expect(essGateTarget({ ready: false, onboarded: false, isAuthenticated: false })).toBe("wait");
    expect(essGateTarget({ ready: false, onboarded: true, isAuthenticated: true })).toBe("wait");
  });

  it("sends a first-time employee to onboarding", () => {
    expect(essGateTarget({ ready: true, onboarded: false, isAuthenticated: false })).toBe(
      "/ess/onboarding",
    );
  });

  it("sends an onboarded, signed-out employee to sign in", () => {
    expect(essGateTarget({ ready: true, onboarded: true, isAuthenticated: false })).toBe(
      "/ess/login",
    );
  });

  it("lets an onboarded, signed-in employee through", () => {
    expect(essGateTarget({ ready: true, onboarded: true, isAuthenticated: true })).toBeNull();
  });

  it("can check sign-in alone", () => {
    expect(
      essGateTarget(
        { ready: true, onboarded: false, isAuthenticated: true },
        { requireOnboarded: false },
      ),
    ).toBeNull();
  });
});

describe("employee screens wait for saved state", () => {
  it.each([
    "app/(tabs)/index.tsx",
    "app/(tabs)/work.tsx",
    "app/(tabs)/projects.tsx",
    "app/notifications.tsx",
    "app/notification-settings.tsx",
    "app/assigned-work.tsx",
  ])("%s decides through the gate", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    expect(source).toContain("useEssGate(");
    expect(source).not.toMatch(/if\s*\(!(onboarded|isAuthenticated)\)\s*return\s*<Redirect/);
  });
});
