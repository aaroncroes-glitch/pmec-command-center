import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DEMO_SYNC_KEYS } from "../server/pmec-demo-sync";

const migration = readFileSync(resolve(process.cwd(), "neon/20260916_pmec_demo_sync.sql"), "utf8");
const store = readFileSync(resolve(process.cwd(), "server/pmec-demo-sync.ts"), "utf8");

describe("PMEC Neon demo sync migration", () => {
  it("creates the demo table in the pmec schema and grants only what the store uses", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS pmec.demo_state");
    expect(migration).toContain("GRANT SELECT, INSERT, UPDATE ON TABLE pmec.demo_state TO pmec_runtime_20260825");
    expect(migration).not.toContain("GRANT DELETE");
    expect(migration).not.toMatch(/GRANT\s+ALL/i);
  });

  it("repeats the API's key allowlist in the database, so the two cannot drift apart", () => {
    for (const key of DEMO_SYNC_KEYS) expect(migration).toContain(`'${key}'`);
    const listed = migration.match(/key IN \(([^)]*)\)/)?.[1].split(",").map((part) => part.trim().replace(/'/g, "")) ?? [];
    expect(listed.sort()).toEqual([...DEMO_SYNC_KEYS].sort());
  });

  it("never attempts DDL at runtime, because the runtime role cannot create tables", () => {
    // Case-sensitive: SQL here is uppercase, and prose saying "cannot create tables" must not count.
    expect(store).not.toMatch(/CREATE\s+TABLE/);
    expect(store).toContain("pmec.demo_state");
    expect(store).not.toMatch(/\bpublic\./);
  });
});
