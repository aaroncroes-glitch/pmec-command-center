import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC Project Manager project-detail routing", () => {
  it("keeps the tracker PM-only and opens selected project detail with phases, budget, status, and work packages", () => {
    const tracker = readFileSync(resolve(process.cwd(), "app/job-orders/index.tsx"), "utf8");
    const controlCenter = readFileSync(resolve(process.cwd(), "app/control-center/index.tsx"), "utf8");

    expect(tracker).toContain('if (hostWorkspace === "portal") return <Redirect href="/(tabs)" />;');
    expect(tracker).toContain('if (hostWorkspace === "hr" || !access.can("delivery")) return <Redirect href="/control-center" />;');
    expect(tracker).toContain("useLocalSearchParams");
    expect(tracker).toContain("selectedProjectId");
    expect(tracker).toContain("BUDGET UTILIZATION");
    expect(tracker).toContain("MILESTONES");
    expect(tracker).toContain("WORK BREAKDOWN");
    expect(tracker).toContain("COST DOCUMENTS");
    expect(controlCenter).toContain("OPEN PROJECT DETAIL →");
    expect(controlCenter).toContain("VIEW PHASES, BUDGET & STATUS →");
    expect(controlCenter).toContain("/job-orders?projectId=");
  });
});
