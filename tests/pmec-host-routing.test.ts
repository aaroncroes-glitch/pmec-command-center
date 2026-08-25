import { describe, expect, it } from "vitest";

import { getPmecHostLockedRole, resolvePmecHostWorkspace } from "../lib/pmec-host-routing";

describe("PMEC host routing", () => {
  it("maps the approved PMEC role-specific hostnames", () => {
    expect(resolvePmecHostWorkspace("portal.pmec.group")).toBe("portal");
    expect(resolvePmecHostWorkspace("hr.pmec.group")).toBe("hr");
    expect(resolvePmecHostWorkspace("pm.pmec.group")).toBe("pm");
  });

  it("locks only dedicated role hosts and fails closed for unknown hosts", () => {
    expect(getPmecHostLockedRole("hr.pmec.group")).toBe("hr");
    expect(getPmecHostLockedRole("pm.pmec.group.")).toBe("pm");
    expect(getPmecHostLockedRole("portal.pmec.group")).toBeNull();
    expect(resolvePmecHostWorkspace("preview.example.test")).toBe("unknown");
  });
});
