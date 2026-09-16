import type { Express, Request, Response } from "express";

/**
 * Shared demo workspaces for the showcase.
 *
 * portal., hr. and pm.pmec.group are separate browser origins, so browser storage cannot
 * carry a leave request from the employee's phone to HR's laptop. This keeps the two
 * workspaces the demo depends on in one place every device reads and writes.
 *
 * It is deliberately narrow, because it is unauthenticated:
 *  - only the two showcase workspace keys are accepted, so it cannot become general storage;
 *  - payloads are capped;
 *  - it lives in Supabase, in a private pmec_demo schema reached only through three
 *    functions (supabase/20260916_pmec_demo_sync.sql), never in the delivery tables;
 *  - a room code keeps two demos running at once from overwriting each other.
 * Real, signed-in data still goes through the tRPC router and its authorization.
 */

export const DEMO_SYNC_KEYS = ["lumen.pmec.control-center.v2", "lumen.pmec.job-orders.v2"] as const;
export type DemoSyncKey = (typeof DEMO_SYNC_KEYS)[number];

const MAX_BYTES = 1_000_000;
const ROOM = /^[a-z0-9][a-z0-9-]{0,39}$/;

export type WriteResult = { ok: true; version: number } | { ok: false; value: unknown; version: number };

export interface DemoSyncStore {
  versions(room: string): Promise<Record<string, number>>;
  read(room: string, key: string): Promise<{ value: unknown; version: number }>;
  /** Writes only if the stored version still equals baseVersion, unless force is set. */
  write(room: string, key: string, value: unknown, baseVersion: number, force: boolean): Promise<WriteResult>;
}

/** Single process only. Used by tests and by local dev; never chosen on serverless. */
export function createMemoryDemoStore(): DemoSyncStore {
  const rows = new Map<string, { value: unknown; version: number }>();
  // Rooms are slugs and keys are fixed, so "::" cannot appear inside either.
  const id = (room: string, key: string) => `${room}::${key}`;
  return {
    async versions(room) {
      const out: Record<string, number> = {};
      for (const key of DEMO_SYNC_KEYS) out[key] = rows.get(id(room, key))?.version ?? 0;
      return out;
    },
    async read(room, key) {
      return rows.get(id(room, key)) ?? { value: null, version: 0 };
    },
    async write(room, key, value, baseVersion, force) {
      const current = rows.get(id(room, key));
      const version = current?.version ?? 0;
      if (!force && version !== baseVersion) return { ok: false, value: current?.value ?? null, version };
      rows.set(id(room, key), { value, version: version + 1 });
      return { ok: true, version: version + 1 };
    },
  };
}

/**
 * Supabase store. The table sits in a schema the REST API does not expose, with RLS on and
 * no policies; these RPC functions are the only way in, and they do the atomic upsert with
 * the version check in the database. The key is the project's publishable key — no secret
 * lives in this app.
 */
export function createSupabaseDemoStore(url: string, key: string): DemoSyncStore {
  const rpc = async <T>(fn: string, args: Record<string, unknown>): Promise<T> => {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`supabase ${fn} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()) as T;
  };
  return {
    versions: (room) => rpc<Record<string, number>>("pmec_demo_versions", { p_room: room }),
    read: (room, key) => rpc<{ value: unknown; version: number }>("pmec_demo_read", { p_room: room, p_key: key }),
    async write(room, key, value, baseVersion, force) {
      const out = await rpc<{ ok: boolean; version: number; value?: unknown }>("pmec_demo_write", {
        p_room: room, p_key: key, p_value: value, p_base: baseVersion, p_force: force,
      });
      return out.ok ? { ok: true, version: out.version } : { ok: false, value: out.value ?? null, version: out.version };
    },
  };
}

/** Picks the store for this process, or null when the demo has nowhere to sync. */
export function resolveDemoStore(env: NodeJS.ProcessEnv = process.env): DemoSyncStore | null {
  // Say which store was picked, never the key: a silent 503 in the middle of a demo is
  // otherwise impossible to tell apart from a database error.
  if (env.PMEC_DEMO_SUPABASE_URL && env.PMEC_DEMO_SUPABASE_KEY) {
    console.info("[demo-sync] store: supabase");
    return createSupabaseDemoStore(env.PMEC_DEMO_SUPABASE_URL, env.PMEC_DEMO_SUPABASE_KEY);
  }
  if (env.PMEC_DEMO_SYNC_MEMORY === "1") {
    console.info("[demo-sync] store: memory (single process)");
    return createMemoryDemoStore();
  }
  console.warn("[demo-sync] store: none — PMEC_DEMO_SUPABASE_URL/KEY not set, answering 503");
  return null;
}

function parseRoom(input: unknown) {
  const room = typeof input === "string" && input ? input.toLowerCase() : "showcase";
  return ROOM.test(room) ? room : null;
}
const isKey = (input: unknown): input is DemoSyncKey => DEMO_SYNC_KEYS.includes(input as DemoSyncKey);

export function registerDemoSyncRoutes(app: Express, getStore: () => DemoSyncStore | null) {
  let store: DemoSyncStore | null | undefined;
  const current = () => (store === undefined ? (store = getStore()) : store);

  const unavailable = (res: Response, error?: unknown) => {
    if (error) console.error("[demo-sync] store error:", error instanceof Error ? error.message : String(error));
    return res.status(503).json({ error: "demo sync unavailable" });
  };
  // Every response is live state; a cached poll would show a stale screen.
  const noStore = (res: Response) => res.setHeader("Cache-Control", "no-store");

  app.get("/api/demo-sync/versions", async (req: Request, res: Response) => {
    noStore(res);
    const s = current();
    if (!s) return unavailable(res);
    const room = parseRoom(req.query.room);
    if (!room) return res.status(400).json({ error: "bad room" });
    try {
      res.json({ versions: await s.versions(room) });
    } catch (error) {
      unavailable(res, error);
    }
  });

  app.get("/api/demo-sync/value", async (req: Request, res: Response) => {
    noStore(res);
    const s = current();
    if (!s) return unavailable(res);
    const room = parseRoom(req.query.room);
    if (!room) return res.status(400).json({ error: "bad room" });
    if (!isKey(req.query.key)) return res.status(400).json({ error: "unknown key" });
    try {
      res.json(await s.read(room, req.query.key));
    } catch (error) {
      unavailable(res, error);
    }
  });

  app.put("/api/demo-sync/value", async (req: Request, res: Response) => {
    noStore(res);
    const s = current();
    if (!s) return unavailable(res);
    const { room: rawRoom, key, value, baseVersion, force } = req.body ?? {};
    const room = parseRoom(rawRoom);
    if (!room) return res.status(400).json({ error: "bad room" });
    if (!isKey(key)) return res.status(400).json({ error: "unknown key" });
    if (!Number.isInteger(baseVersion) || baseVersion < 0) return res.status(400).json({ error: "bad baseVersion" });
    const envelope = value as { epoch?: unknown; data?: unknown } | null;
    if (!envelope || !Number.isInteger(envelope.epoch) || envelope.data === undefined) {
      return res.status(400).json({ error: "bad value" });
    }
    if (Buffer.byteLength(JSON.stringify(value)) > MAX_BYTES) return res.status(413).json({ error: "too large" });
    try {
      const result = await s.write(room, key, value, baseVersion, force === true);
      if (result.ok) return res.json({ version: result.version });
      return res.status(409).json({ value: result.value, version: result.version });
    } catch (error) {
      unavailable(res, error);
    }
  });
}
