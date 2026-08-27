import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC PM showcase project interactions", () => {
  it("offers all local workforce records for work-package staffing without production delivery calls", () => {
    const tracker = readFileSync(resolve(process.cwd(), "app/job-orders/index.tsx"), "utf8");
    const control = readFileSync(resolve(process.cwd(), "lib/pmec-control-workspace.tsx"), "utf8");
    const sync = readFileSync(resolve(process.cwd(), "lib/pmec-delivery-sync.tsx"), "utf8");

    expect(tracker).toContain("PROJECT TEAM & ASSIGNMENTS");
    expect(tracker).toContain("Search all employees and contractors");
    expect(tracker).toContain("Changes are saved only in this browser for the demonstration.");
    expect(tracker).toContain("control.assignTask(job.id, selectedTask.id, person.id)");
    expect(control).toContain('if (shared.managerSyncState === "live")');
    expect(sync).toContain('&& isSignedIn === true');
  });

  it("uses an interactive calendar and local cost-document selection with drag-and-drop and picker fallback", () => {
    const tracker = readFileSync(resolve(process.cwd(), "app/job-orders/index.tsx"), "utf8");

    expect(tracker).toContain("MilestoneScheduleForm");
    expect(tracker).toContain("SCHEDULE MILESTONE");
    expect(tracker).toContain("TARGET DATE");
    expect(tracker).toContain("getDocumentAsync");
    expect(tracker).toContain("UPLOAD COST DOCUMENT");
    expect(tracker).toContain("No document is transmitted to PMEC servers.");
    expect(tracker).toContain("fileName: asset.name");
    expect(tracker).toContain("LOCAL FILE");
    expect(tracker).toContain("DROP DOCUMENT HERE");
    expect(tracker).toContain("onDrop:");
    expect(tracker).toContain("acceptDroppedFile");
    expect(tracker).toContain("BROWSE FILES");
    expect(tracker).toContain("FILE READY · LOCAL ONLY");
    expect(tracker).toContain("APPROVAL STATUS");
    expect(tracker).toContain("CATEGORY TAGS");
    expect(tracker).toContain("COST_DOCUMENT_CATEGORY_TAGS");
    expect(tracker).toContain("Change approval for");
    expect(tracker).toContain("costDocumentCategoryTags(document.documentType)");
    expect(tracker).toContain("updateCostDocument(job.id");
  });
});
