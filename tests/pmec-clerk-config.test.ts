import { describe, expect, it } from "vitest";

import { hasUsableClerkPublishableKey } from "../lib/pmec-clerk-config";

describe("PMEC Clerk publishable key configuration", () => {
  it("rejects malformed publishable keys before Clerk can crash the Control Center", () => {
    expect(hasUsableClerkPublishableKey("pk_test_invalid")).toBe(false);
    expect(hasUsableClerkPublishableKey("")).toBe(false);
  });

  it("accepts a correctly encoded Clerk frontend API key shape", () => {
    const frontendApi = "harbor-moon-10.clerk.accounts.dev";
    const key = `pk_test_${Buffer.from(frontendApi).toString("base64url")}`;

    expect(hasUsableClerkPublishableKey(key)).toBe(true);
  });
});
