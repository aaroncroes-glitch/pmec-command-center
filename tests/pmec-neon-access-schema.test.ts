import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("PMEC Neon access schema", () => {
  it("contains the dedicated HR payroll-review permission", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString, "NEON_DATABASE_URL must be configured").toBeTruthy();

    const sql = neon(connectionString!);
    const rows = await sql`SELECT role::text AS role, permission FROM pmec.role_permissions WHERE role = 'hr_manager' AND permission = 'payroll.review'`;

    expect(rows).toEqual([{ role: "hr_manager", permission: "payroll.review" }]);
  }, 20_000);
});
