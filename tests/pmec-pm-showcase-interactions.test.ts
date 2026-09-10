import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reads a source file with runs of whitespace collapsed.
 *
 * These assertions check that user-facing copy exists, not how the source happens to be
 * wrapped. Prettier splits long JSX text across lines, which changes the source bytes
 * without changing a single rendered character, so matching raw source made formatting a
 * breaking change.
 */
function readNormalized(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

/**
 * Reads a source file with all whitespace removed, for assertions about code shape
 * rather than copy. Prettier wraps long call expressions across lines; the call is the
 * same call, so the assertion should not care where the line breaks fall.
 */
function readDense(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8").replace(/\s+/g, "");
}

describe("PMEC PM showcase project interactions", () => {
  it("offers all local workforce records for work-package staffing without production delivery calls", () => {
    const tracker = readNormalized("app/job-orders/index.tsx");
    const control = readNormalized("lib/pmec-control-workspace.tsx");
    const sync = readNormalized("lib/pmec-delivery-sync.tsx");

    expect(tracker).toContain("PROJECT TEAM & ASSIGNMENTS");
    expect(tracker).toContain("Search all employees and contractors");
    expect(tracker).toContain("Changes are saved only in this browser for the demonstration.");
    expect(tracker).toContain("control.assignTask(job.id, selectedTask.id, person.id)");
    expect(control).toContain('if (shared.managerSyncState === "live")');
    expect(sync).toContain('&& isSignedIn === true');
  });

  it("uses an interactive calendar and local cost-document selection with drag-and-drop and picker fallback", () => {
    const tracker = readNormalized("app/job-orders/index.tsx");
    const workspace = readNormalized("lib/pmec-job-order-workspace.tsx");
    const jobOrderModel = readNormalized("lib/pmec-job-orders.ts");

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
    expect(tracker).toContain("recordCostDocumentDecision(job.id");
    expect(tracker).toContain("REVIEW NOTE");
    expect(tracker).toContain("Explain the approval decision...");
    expect(tracker).toContain("Review note:");
    expect(tracker).toContain("APPROVAL HISTORY");
    expect(tracker).toContain("approvalHistory");
    expect(tracker).toContain("ManagerDecisionSummary");
    // Sentence case in source, uppercased by the label style. The rendered text is
    // unchanged, and screen readers no longer receive an all-caps literal, which some
    // announce letter by letter.
    expect(tracker).toContain("Decision queue");
    expect(tracker).toContain("OPEN PROJECT");
    expect(tracker).toContain("documentValueByCurrency");
    expect(tracker).toContain("formattedDocumentValue");
    expect(tracker).toContain("APPROVAL ATTENTION");
    expect(tracker).toContain("REVIEW OVERDUE");
    expect(tracker).toContain("pendingApprovalAgeHours");
    expect(tracker).toContain("isCostDocumentApprovalOverdue");
    expect(tracker).toContain("BULK APPROVAL");
    expect(tracker).toContain("SELECT ALL PENDING");
    expect(tracker).toContain("APPROVE SELECTED");
    expect(tracker).toContain("Bulk approval review note");
    expect(readDense("app/job-orders/index.tsx")).toContain(
      "bulkApproveCostDocuments(selectedPendingRecords",
    );
    expect(workspace).toContain("bulkApproveCostDocuments");
    expect(workspace).toContain("applyBulkCostDocumentApproval");
    expect(jobOrderModel).toContain('approvalStatus: "APPROVED" as const');
  });
});
