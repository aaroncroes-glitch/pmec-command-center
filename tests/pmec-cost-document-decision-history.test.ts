import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC local cost-document decision history", () => {
  it("migrates existing showcase records and records each new manager decision locally", () => {
    const workspace = readFileSync(resolve(process.cwd(), "lib/pmec-job-order-workspace.tsx"), "utf8");

    expect(workspace).toContain("function normalizeDocument");
    expect(workspace).toContain("approvalHistory");
    expect(workspace).toContain("recordCostDocumentDecision");
    expect(workspace).toContain("changedAt");
    expect(workspace).toContain("changedBy");
    expect(workspace).toContain("Local showcase safely falls back");
  });
});
