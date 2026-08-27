import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { costDocumentCategoryTags } from "../lib/pmec-job-orders";

describe("PMEC local cost-document classification migration", () => {
  it("derives clear category tags for legacy local document types", () => {
    expect(costDocumentCategoryTags("SUBCONTRACTOR_INVOICE")).toEqual(["Invoice"]);
    expect(costDocumentCategoryTags("PURCHASE_RECEIPT")).toEqual(["Receipt"]);
    expect(costDocumentCategoryTags("CONTRACT")).toEqual(["Contract"]);
    expect(costDocumentCategoryTags("CHANGE_ORDER")).toEqual(["Change order"]);
  });

  it("normalizes previously stored showcase records to pending approval and semantic tags", () => {
    const workspace = readFileSync(resolve(process.cwd(), "lib/pmec-job-order-workspace.tsx"), "utf8");
    expect(workspace).toContain('approvalStatus: document.approvalStatus ?? "PENDING"');
    expect(workspace).toContain("tags: document.tags?.length ? document.tags : costDocumentCategoryTags(document.documentType)");
    expect(workspace).toContain("updateCostDocument");
  });
});
