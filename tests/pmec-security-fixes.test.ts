import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildPmecClerkPrincipal } from "../server/pmec-clerk-access";
import { isLegacyManusAuthEnabled, isPublicDemoApiEnabled } from "../server/pmec-feature-flags";
import { resolvePmecOrganizationId } from "../server/pmec-organization";
import { createRateLimiter, resetRateLimitStateForTests } from "../server/pmec-rate-limit";
import { registerDemoSyncRoutes } from "../server/pmec-demo-sync";
import { createMemoryDemoStore } from "../server/pmec-demo-sync";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { resolveShowcaseMode } from "../lib/pmec-showcase";
import { TRPCError } from "@trpc/server";

const orgA = "11111111-1111-4111-8111-111111111111";
const orgB = "22222222-2222-4222-8222-222222222222";

describe("PMEC security feature flags", () => {
  it("keeps legacy Manus auth off unless explicitly enabled", () => {
    expect(isLegacyManusAuthEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(isLegacyManusAuthEnabled({ NODE_ENV: "test", PMEC_LEGACY_MANUS_AUTH: "1" })).toBe(true);
  });

  it("disables public demo APIs in production by default", () => {
    expect(isPublicDemoApiEnabled({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(false);
    expect(isPublicDemoApiEnabled({ NODE_ENV: "production", PMEC_PUBLIC_DEMO_API: "1" } as NodeJS.ProcessEnv)).toBe(
      true,
    );
    expect(isPublicDemoApiEnabled({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(true);
    expect(isPublicDemoApiEnabled({ NODE_ENV: "development", PMEC_PUBLIC_DEMO_API: "0" } as NodeJS.ProcessEnv)).toBe(
      false,
    );
  });
});

describe("scoped Clerk principal", () => {
  it("never merges permissions across organizations", () => {
    const rows = [
      {
        person_id: "person-a",
        legacy_employee_id: "e-a",
        organization_id: orgA,
        role: "employee",
        permission: "assignment.read_own",
      },
      {
        person_id: "person-b",
        legacy_employee_id: "e-b",
        organization_id: orgB,
        role: "hr_manager",
        permission: "payroll.review",
      },
    ];
    const principal = buildPmecClerkPrincipal("user_x", orgA, rows);
    expect(principal.organizationId).toBe(orgA);
    expect(principal.permissions).toEqual(["assignment.read_own"]);
    expect(principal.permissions).not.toContain("payroll.review");
  });
});

describe("PMEC organization resolution", () => {
  it("rejects header overrides in production", () => {
    const req = { headers: { "x-pmec-organization-id": orgB } } as unknown as import("http").IncomingMessage;
    expect(() =>
      resolvePmecOrganizationId(req, {
        NODE_ENV: "production",
        PMEC_ORGANIZATION_ID: orgA,
      } as NodeJS.ProcessEnv),
    ).toThrowError(TRPCError);
  });
});

describe("demo sync route gating", () => {
  let server: ReturnType<express.Express["listen"]>;
  let base = "";

  beforeEach(async () => {
    process.env.PMEC_PUBLIC_DEMO_API = "0";
    const app = express();
    app.use(express.json());
    registerDemoSyncRoutes(app, () => createMemoryDemoStore());
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(() => {
    server?.close();
    delete process.env.PMEC_PUBLIC_DEMO_API;
  });

  it("returns 404 when public demo API is disabled", async () => {
    const res = await fetch(`${base}/api/demo-sync/versions?room=showcase`);
    expect(res.status).toBe(404);
  });
});

describe("storage proxy with Forge configured", () => {
  const prev = { url: process.env.BUILT_IN_FORGE_API_URL, key: process.env.BUILT_IN_FORGE_API_KEY };

  beforeEach(() => {
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.example/";
    process.env.BUILT_IN_FORGE_API_KEY = "forge-test";
  });

  afterEach(() => {
    process.env.BUILT_IN_FORGE_API_URL = prev.url;
    process.env.BUILT_IN_FORGE_API_KEY = prev.key;
  });

  it("requires a Clerk bearer token before presigning", async () => {
    const app = express();
    registerStorageProxy(app);
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
    const res = await fetch(`http://127.0.0.1:${port}/manus-storage/demo.png`);
    expect(res.status).toBe(401);
    server.close();
  });
});

describe("rate limiter", () => {
  afterEach(() => resetRateLimitStateForTests());

  it("returns 429 after the configured cap", async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, keyPrefix: "test" });
    const calls: number[] = [];
    const app = express();
    app.set("trust proxy", 1);
    app.get("/hit", limiter, (_req, res) => {
      calls.push(1);
      res.status(200).end("ok");
    });
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}`;
    expect((await fetch(`${base}/hit`)).status).toBe(200);
    expect((await fetch(`${base}/hit`)).status).toBe(200);
    expect((await fetch(`${base}/hit`)).status).toBe(429);
    expect(calls).toHaveLength(2);
    server.close();
  });
});

describe("showcase mode defaults", () => {
  it("is off in production unless explicitly enabled", () => {
    expect(resolveShowcaseMode({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(false);
    expect(
      resolveShowcaseMode({ NODE_ENV: "production", EXPO_PUBLIC_PMEC_SHOWCASE: "on" } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(resolveShowcaseMode({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(true);
  });
});