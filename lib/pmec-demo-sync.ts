import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { getApiBaseUrl } from "@/constants/oauth";
import { resolveConflict, type DemoEnvelope } from "@/lib/pmec-demo-merge";
import { showcaseMode } from "@/lib/pmec-showcase";

/**
 * Keeps a showcase workspace in step across devices and across portal., hr. and pm.
 *
 * Browser storage and its `storage` event already connect two windows on one address. They
 * cannot connect the employee's phone to HR's laptop, or portal.pmec.group to
 * hr.pmec.group, because those are separate browser origins. This adds the server
 * (server/pmec-demo-sync.ts) as the one copy every device agrees on.
 *
 * Three rules keep a live demo from losing anything:
 *  1. The server is the truth. A device's own stored copy may be days old, so nothing this
 *     device holds is written until it has first read the server. An empty server is seeded
 *     with the demo's starting data, never with a device's leftovers.
 *  2. Every write says which version it was based on. If another device wrote first the
 *     server refuses, and the two copies are merged record by record before trying again.
 *  3. "Reset demo data" starts a new generation that overrides everything older.
 *
 * With no server to reach (local dev without a store, or a preview with no database) it
 * stays out of the way and the workspace keeps syncing within one browser as before.
 */

const POLL_MS = 1500;
const ROOM_STORAGE_KEY = "pmec.demo.room";
const ROOM = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_RETRIES = 3;

export type DemoSyncStatus = "off" | "connecting" | "live" | "offline";

type Options = {
  /** One of the two keys server/pmec-demo-sync.ts accepts. */
  key: string;
  /** False until the workspace has finished reading its own stored copy. */
  ready: boolean;
  /** The demo's starting data, used to seed an empty server and for a reset. */
  initialRaw: string;
  /** The workspace's own handler for an incoming copy. */
  apply: (raw: string) => void;
  merge: (server: never, mine: never) => unknown;
};

/**
 * The room this device demos in. `?room=acme` on any page picks it and it is remembered,
 * so two presentations running at once do not overwrite each other.
 */
function currentRoom(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("room")?.toLowerCase();
    if (fromUrl && ROOM.test(fromUrl)) {
      window.localStorage.setItem(ROOM_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const saved = window.localStorage.getItem(ROOM_STORAGE_KEY);
    return saved && ROOM.test(saved) ? saved : "showcase";
  } catch {
    return "showcase";
  }
}

type Envelope = DemoEnvelope<unknown>;

export function useDemoSync({ key, ready, initialRaw, apply, merge }: Options) {
  const enabled = showcaseMode && Platform.OS === "web" && typeof window !== "undefined";
  const [status, setStatus] = useState<DemoSyncStatus>(enabled ? "connecting" : "off");

  // Latest values without restarting the engine every render.
  const readyRef = useRef(ready);
  const applyRef = useRef(apply);
  const mergeRef = useRef(merge);
  const initialRef = useRef(initialRaw);
  readyRef.current = ready;
  applyRef.current = apply;
  mergeRef.current = merge;
  initialRef.current = initialRaw;

  const engine = useRef<{ push: (raw: string) => void; reset: () => void; onReady: () => void } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const base = getApiBaseUrl();
    const room = currentRoom();

    let phase: "probing" | "local" | "synced" = "probing";
    let version = 0;
    let epoch = 0;
    let inflight = false;
    let queued: { raw: string; force: boolean } | null = null;
    // Last copy this device applied or sent, so its own echo is never written back.
    let lastRaw: string | null = null;
    let pendingApply: string | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const endpoint = (path: string) => `${base}/api/demo-sync/${path}`;

    const show = (raw: string) => {
      lastRaw = raw;
      applyRef.current(raw);
      // Keep this device's own copy warm so a reload does not flash old data first.
      void AsyncStorage.setItem(key, raw);
    };
    // Writes are only accepted once the server's copy is actually on screen. The workspace
    // announces "ready" in the same commit as its save effect, and that save carries the old
    // copy this device read from its own storage. The workspace calls this hook *after* its
    // save effect, and React runs effects in declaration order, so that stale save arrives
    // while we are still not live and is dropped, before the server's copy is shown.
    let listening = false;
    const goLive = (raw: string) => {
      show(raw);
      if (phase === "synced") return;
      phase = "synced";
      setStatus("live");
      if (!listening) {
        listening = true;
        window.addEventListener("focus", nudge);
        document.addEventListener("visibilitychange", nudge);
        timer = setTimeout(poll, POLL_MS);
      }
    };
    // A copy from the server waits until the workspace has read its own storage; showing it
    // earlier would let that slower, older local read land on top of it.
    const adopt = (raw: string) => {
      if (phase === "synced") show(raw);
      else if (readyRef.current) goLive(raw);
      else pendingApply = raw;
    };

    const parse = (raw: string) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return null;
      }
    };

    const put = (raw: string, force: boolean) =>
      fetch(endpoint("value"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, key, value: { epoch, data: parse(raw) }, baseVersion: version, force }),
      });

    async function send(raw: string, force: boolean) {
      if (inflight) {
        queued = { raw, force: force || Boolean(queued?.force) };
        return;
      }
      inflight = true;
      lastRaw = raw;
      try {
        let current = raw;
        let forceNow = force;
        for (let attempt = 0; attempt <= MAX_RETRIES && !stopped; attempt += 1) {
          const res = await put(current, forceNow);
          if (res.ok) {
            version = ((await res.json()) as { version: number }).version;
            break;
          }
          if (res.status !== 409) break; // Unreachable for now; polling reconciles later.
          const body = (await res.json()) as { value: Envelope | null; version: number };
          version = body.version;
          if (!body.value) continue; // Cleared in between; retry at the new version.
          const { next, writeBack } = resolveConflict<unknown>(
            body.value,
            { epoch, data: parse(current) },
            mergeRef.current as (server: unknown, mine: unknown) => unknown,
          );
          epoch = next.epoch;
          const nextRaw = JSON.stringify(next.data);
          if (nextRaw !== current) show(nextRaw);
          if (!writeBack) break;
          current = nextRaw;
          lastRaw = current;
          forceNow = false;
        }
      } catch {
        // Network blip: the next poll brings this device back in line.
      } finally {
        inflight = false;
      }
      if (queued && !stopped) {
        const next = queued;
        queued = null;
        if (next.force || next.raw !== lastRaw) void send(next.raw, next.force);
      }
    }

    // One poll at a time. Focusing a window nudges a poll immediately; without this, a nudge
    // landing mid-poll would start a second loop, and every window switch in a demo would
    // add another.
    let polling = false;
    async function poll() {
      if (stopped || phase !== "synced" || polling) return;
      polling = true;
      if (timer) clearTimeout(timer);
      if (!inflight && document.visibilityState === "visible") {
        try {
          const res = await fetch(`${endpoint("versions")}?room=${encodeURIComponent(room)}`, { cache: "no-store" });
          if (res.ok) {
            const remote = ((await res.json()) as { versions: Record<string, number> }).versions[key] ?? 0;
            if (remote > version) {
              const valueRes = await fetch(`${endpoint("value")}?room=${encodeURIComponent(room)}&key=${encodeURIComponent(key)}`, { cache: "no-store" });
              // A write may have started while this was on the wire; it wins, and the next
              // poll catches up.
              if (valueRes.ok && !inflight) {
                const body = (await valueRes.json()) as { value: Envelope | null; version: number };
                if (body.value && body.version > version) {
                  version = body.version;
                  epoch = body.value.epoch;
                  const raw = JSON.stringify(body.value.data);
                  if (raw !== lastRaw) adopt(raw);
                }
              }
            }
            setStatus("live");
          } else {
            setStatus("offline");
          }
        } catch {
          setStatus("offline");
        }
      }
      polling = false;
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    }

    // Switching to this device should show the other device's change at once, not after
    // the next tick.
    const nudge = () => void poll();

    async function probe() {
      try {
        const res = await fetch(`${endpoint("value")}?room=${encodeURIComponent(room)}&key=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { value: Envelope | null; version: number };
        if (stopped) return;
        if (body.value) {
          version = body.version;
          epoch = body.value.epoch;
          adopt(JSON.stringify(body.value.data));
        } else {
          // Seed with the demo's starting data. If another device seeded first, take theirs.
          const seed = initialRef.current;
          const seeded = await put(seed, false);
          if (seeded.ok) {
            version = ((await seeded.json()) as { version: number }).version;
            adopt(seed);
          } else if (seeded.status === 409) {
            const theirs = (await seeded.json()) as { value: Envelope | null; version: number };
            version = theirs.version;
            if (theirs.value) {
              epoch = theirs.value.epoch;
              adopt(JSON.stringify(theirs.value.data));
            }
          } else {
            throw new Error(String(seeded.status));
          }
        }
      } catch {
        if (stopped) return;
        phase = "local";
        setStatus("offline");
      }
    }

    engine.current = {
      push(raw) {
        // Until the server has been read, this device's copy is not trusted to write.
        if (phase !== "synced" || raw === lastRaw) return;
        void send(raw, false);
      },
      reset() {
        epoch += 1;
        const raw = initialRef.current;
        show(raw);
        if (phase === "synced") void send(raw, true);
      },
      onReady() {
        if (pendingApply !== null) {
          const raw = pendingApply;
          pendingApply = null;
          goLive(raw);
        }
      },
    };

    void probe();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", nudge);
      document.removeEventListener("visibilitychange", nudge);
      engine.current = null;
    };
  }, [enabled, key]);

  useEffect(() => {
    if (ready) engine.current?.onReady();
  }, [ready]);

  const push = useCallback((raw: string) => engine.current?.push(raw), []);
  const reset = useCallback(() => engine.current?.reset(), []);
  return { push, reset, status };
}
