import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMemoryDemoStore, registerDemoSyncRoutes, resolveDemoStore } from "../server/pmec-demo-sync";

const KEY = "lumen.pmec.control-center.v2";
let server: Server;
let base = "";

function listen(getStore: Parameters<typeof registerDemoSyncRoutes>[1]) {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  registerDemoSyncRoutes(app, getStore);
  return new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
}
const url = (s: Server, path: string) => `http://127.0.0.1:${(s.address() as AddressInfo).port}${path}`;
const put = (path: string, body: unknown) =>
  fetch(`${base}${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const env = (epoch: number, data: unknown) => ({ epoch, data });

beforeAll(async () => {
  server = await listen(() => createMemoryDemoStore());
  base = url(server, "");
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("demo sync HTTP contract", () => {
  it("starts empty at version 0", async () => {
    const res = await fetch(`${base}/api/demo-sync/value?room=t1&key=${KEY}`);
    expect(await res.json()).toEqual({ value: null, version: 0 });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("accepts a first write and reports the new version", async () => {
    const res = await put("/api/demo-sync/value", { room: "t2", key: KEY, value: env(0, { a: 1 }), baseVersion: 0 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: 1 });
    const versions = await (await fetch(`${base}/api/demo-sync/versions?room=t2`)).json();
    expect(versions.versions[KEY]).toBe(1);
  });

  it("refuses a write based on a version someone else has moved past, and returns their copy", async () => {
    await put("/api/demo-sync/value", { room: "t3", key: KEY, value: env(0, { who: "phone" }), baseVersion: 0 });
    // The laptop still thinks the server is empty.
    const res = await put("/api/demo-sync/value", { room: "t3", key: KEY, value: env(0, { who: "laptop" }), baseVersion: 0 });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ value: env(0, { who: "phone" }), version: 1 });
  });

  it("lets a reset overwrite regardless of version", async () => {
    await put("/api/demo-sync/value", { room: "t4", key: KEY, value: env(0, { n: 1 }), baseVersion: 0 });
    await put("/api/demo-sync/value", { room: "t4", key: KEY, value: env(0, { n: 2 }), baseVersion: 1 });
    const res = await put("/api/demo-sync/value", { room: "t4", key: KEY, value: env(1, { reset: true }), baseVersion: 0, force: true });
    expect(res.status).toBe(200);
    expect((await (await fetch(`${base}/api/demo-sync/value?room=t4&key=${KEY}`)).json()).value).toEqual(env(1, { reset: true }));
  });

  it("keeps rooms apart", async () => {
    await put("/api/demo-sync/value", { room: "acme", key: KEY, value: env(0, { client: "acme" }), baseVersion: 0 });
    const other = await (await fetch(`${base}/api/demo-sync/value?room=globex&key=${KEY}`)).json();
    expect(other.value).toBeNull();
  });

  it("refuses anything outside the two showcase workspaces", async () => {
    expect((await fetch(`${base}/api/demo-sync/value?room=t5&key=lumen.ess.v2`)).status).toBe(400);
    expect((await put("/api/demo-sync/value", { room: "t5", key: "secrets", value: env(0, {}), baseVersion: 0 })).status).toBe(400);
  });

  it("refuses malformed rooms, versions and envelopes", async () => {
    expect((await fetch(`${base}/api/demo-sync/versions?room=../../etc`)).status).toBe(400);
    expect((await put("/api/demo-sync/value", { room: "t6", key: KEY, value: env(0, {}), baseVersion: -1 })).status).toBe(400);
    expect((await put("/api/demo-sync/value", { room: "t6", key: KEY, value: { data: {} }, baseVersion: 0 })).status).toBe(400);
  });

  it("refuses payloads over the cap", async () => {
    const big = "x".repeat(1_100_000);
    expect((await put("/api/demo-sync/value", { room: "t7", key: KEY, value: env(0, { big }), baseVersion: 0 })).status).toBe(413);
  });
});

describe("demo sync with nowhere to store", () => {
  it("answers 503 so the app falls back to syncing within one browser", async () => {
    const bare = await listen(() => null);
    const res = await fetch(url(bare, `/api/demo-sync/versions?room=showcase`));
    expect(res.status).toBe(503);
    await new Promise<void>((resolve) => bare.close(() => resolve()));
  });

  it("never picks the in-memory store on its own", () => {
    expect(resolveDemoStore({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(resolveDemoStore({ PMEC_DEMO_SYNC_MEMORY: "1" } as unknown as NodeJS.ProcessEnv)).not.toBeNull();
  });
});
