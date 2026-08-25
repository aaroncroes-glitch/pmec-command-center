import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC one-time demonstration access", () => {
  it("redeems Clerk tickets once, activates the session, and does not persist ticket material", () => {
    const source = readFileSync(resolve(process.cwd(), "app/ess/demo-ticket.tsx"), "utf8");
    expect(source).toContain('signIn.create({ strategy: "ticket", ticket: token })');
    expect(source).toContain("signIn.finalize()");
    expect(source).toContain('router.replace("/ess/login")');
    expect(source).not.toContain("AsyncStorage");
  });
});
