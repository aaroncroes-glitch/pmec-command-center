import { describe, expect, it } from "vitest";

import { normalizeWorkEmail } from "../shared/pmec-normalize-email";

describe("normalizeWorkEmail", () => {
  it("applies NFKC and casefold for uniqueness", () => {
    expect(normalizeWorkEmail("  User@Example.com  ")).toBe("user@example.com");
    expect(normalizeWorkEmail("Åaron@pmec.group")).toBe("åaron@pmec.group");
  });
});