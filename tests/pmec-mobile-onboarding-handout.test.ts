import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("PMEC mobile onboarding handout", () => {
  it("provides a printable credential-free QR handout for the secure Employee mobile entry", () => {
    const handout = readFileSync(resolve(process.cwd(), "app/mobile-onboarding.tsx"), "utf8");
    const rootLayout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");

    expect(rootLayout).toContain('name="mobile-onboarding"');
    expect(handout).toContain('https://portal.pmec.group/ess/login');
    expect(handout).toContain('employee-mobile-launch-qr.png');
    expect(handout).toContain("YOUR SIGN-IN DETAILS ARE PROVIDED SEPARATELY");
    expect(handout).toContain('width < 640');
    expect(handout).toContain("window.print()");
  });
});
