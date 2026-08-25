import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const migration = readFileSync(resolve(process.cwd(), "neon/20260825_pmec_delivery.sql"), "utf8");
const repository = readFileSync(resolve(process.cwd(), "server/pmec-delivery-store.ts"), "utf8");

describe("PMEC Neon delivery migration", () => {
  it("creates organization-scoped delivery tables and grants only required runtime access", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS pmec.delivery_assignments");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS pmec.delivery_time_logs");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS pmec.delivery_notifications");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS pmec.delivery_notification_preferences");
    expect(migration).toContain("organization_id uuid NOT NULL REFERENCES pmec.organizations(id)");
    expect(migration).toContain("GRANT SELECT, INSERT, UPDATE ON TABLE");
    expect(migration).not.toContain("GRANT DELETE");
  });

  it("scopes reads and writes to an organization instead of relying on client-supplied records alone", () => {
    expect(repository).toContain("WHERE organization_id = $1 AND employee_id = $2");
    expect(repository).toContain("WHERE organization_id = $1 AND id = $2");
    expect(repository).toContain("WHERE pmec.delivery_assignments.organization_id = EXCLUDED.organization_id");
  });

  it("rejects unauthenticated delivery access before querying Neon", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(appRouter.createCaller(ctx).pmecDelivery.assignments()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Sign in with Clerk to continue.",
    });
  });
});
