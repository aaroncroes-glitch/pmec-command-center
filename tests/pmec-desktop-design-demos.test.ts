import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("PMEC isolated desktop UI/UX demos", () => {
  it("registers distinct PM and HR design routes without importing live workspace providers", () => {
    const layout = source("app/_layout.tsx");
    const pmDemo = source("app/pm-ui-demo.tsx");
    const hrDemo = source("app/hr-ui-demo.tsx");
    const shell = source("components/pmec-desktop-demo-kit.tsx");

    expect(layout).toContain('<Stack.Screen name="pm-ui-demo" />');
    expect(layout).toContain('<Stack.Screen name="hr-ui-demo" />');
    expect(pmDemo).toContain('title="Delivery pulse."');
    expect(pmDemo).toContain("TODAY’S DECISIONS");
    expect(pmDemo).toContain("PROJECT FOCUS");
    expect(hrDemo).toContain('title="Workforce clarity."');
    expect(hrDemo).toContain("NEXT 7 DAYS · CAPACITY");
    expect(hrDemo).toContain("PENDING PEOPLE DECISIONS");
    expect(shell).toContain('if (width < 760)');
    expect(shell).toContain("ISOLATED DEMO · NOT LIVE");
    expect(shell).toContain("This page is intentionally isolated from the production PMEC workspaces");
    expect(pmDemo).not.toContain("pmec-control-workspace");
    expect(hrDemo).not.toContain("pmec-control-workspace");
    expect(pmDemo).not.toContain("pmec-job-order-workspace");
    expect(hrDemo).not.toContain("pmec-job-order-workspace");
  });
});
