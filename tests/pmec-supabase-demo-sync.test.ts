import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEMO_SYNC_KEYS, createSupabaseDemoStore, resolveDemoStore } from "../server/pmec-demo-sync";

const migration = readFileSync(resolve(process.cwd(), "supabase/20260916_pmec_demo_sync.sql"), "utf8");
afterEach(() => vi.unstubAllGlobals());

describe("Supabase demo sync", () => {
  it("keeps the database allowlist identical to the API's", () => {
    const listed = migration.match(/key in \(([^)]*)\)/)?.[1].split(",").map((p) => p.trim().replace(/'/g, "")) ?? [];
    expect(listed.sort()).toEqual([...DEMO_SYNC_KEYS].sort());
  });

  it("keeps the table private: RLS on, no grants to API roles", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on pmec_demo.demo_state from public, anon, authenticated");
    expect(migration).not.toMatch(/grant\s+[^;]*on\s+(table\s+)?pmec_demo\.demo_state/i);
  });

  it("maps an accepted and a refused write from the RPC", async () => {
    const replies = [{ ok: true, version: 4 }, { ok: false, version: 4, value: { epoch: 0, data: 1 } }];
    const calls: { url: string; body: unknown; apikey: string | null }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)), apikey: new Headers(init.headers).get("apikey") });
      return new Response(JSON.stringify(replies.shift()), { status: 200 });
    });
    const store = createSupabaseDemoStore("https://x.supabase.co/", "pk");
    expect(await store.write("r", DEMO_SYNC_KEYS[0], { epoch: 0, data: 1 }, 3, false)).toEqual({ ok: true, version: 4 });
    expect(await store.write("r", DEMO_SYNC_KEYS[0], { epoch: 0, data: 2 }, 3, false)).toEqual({ ok: false, version: 4, value: { epoch: 0, data: 1 } });
    expect(calls[0].url).toBe("https://x.supabase.co/rest/v1/rpc/pmec_demo_write");
    expect(calls[0].apikey).toBe("pk");
    expect(calls[0].body).toMatchObject({ p_room: "r", p_base: 3, p_force: false });
  });

  it("surfaces an RPC failure as an error, so the route answers 503", async () => {
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 500 }));
    await expect(createSupabaseDemoStore("https://x.supabase.co", "pk").versions("r")).rejects.toThrow(/500/);
  });

  it("picks Supabase only when both URL and key are set", () => {
    expect(resolveDemoStore({ PMEC_DEMO_SUPABASE_URL: "https://x" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(resolveDemoStore({ PMEC_DEMO_SUPABASE_URL: "https://x", PMEC_DEMO_SUPABASE_KEY: "k" } as unknown as NodeJS.ProcessEnv)).not.toBeNull();
  });
});
