import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC demo employee Clerk entry", () => {
  it("uses Clerk sign-in as the production showcase path and only opens the employee workspace for employee-scoped permission", () => {
    const source = readFileSync(resolve(process.cwd(), "app/ess/login.tsx"), "utf8");
    expect(source).toContain("SIGN IN WITH CLERK");
    expect(source).toContain('permissions.includes("assignment.read_own")');
    expect(source).toContain("This Clerk account is not an employee demo account");
    expect(source).toContain("OPEN LOCAL PROTOTYPE");
  });
});
