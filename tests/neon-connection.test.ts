import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("Neon Postgres credential", () => {
  it("executes a lightweight read-only connection query", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString, "NEON_DATABASE_URL must be configured").toBeTruthy();

    const sql = neon(connectionString!);
    const rows = await sql`SELECT 1 AS connected`;

    expect(rows[0]).toMatchObject({ connected: 1 });
  }, 20_000);
});
