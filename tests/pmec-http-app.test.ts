import { describe, expect, it } from "vitest";

import { isAllowedPmecOrigin } from "../server/pmec-http-app";

describe("PMEC production API origin policy", () => {
  it("allows only approved PMEC web origins and local development origins", () => {
    expect(isAllowedPmecOrigin("https://portal.pmec.group")).toBe(true);
    expect(isAllowedPmecOrigin("https://hr.pmec.group")).toBe(true);
    expect(isAllowedPmecOrigin("https://pm.pmec.group")).toBe(true);
    expect(isAllowedPmecOrigin("http://localhost:8081")).toBe(true);
  });

  it("does not reflect arbitrary production origins", () => {
    expect(isAllowedPmecOrigin("https://untrusted.example")).toBe(false);
    expect(isAllowedPmecOrigin(undefined)).toBe(true);
  });
});
