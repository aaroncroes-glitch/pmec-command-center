import type { Express, Request, Response } from "express";

/**
 * The project manager's side of the client delivery portal.
 *
 * What a client sees lives in its own Supabase project ("PMEC Client Delivery"), read by
 * the portal on pmec.group under row-level security. The Command Center never exposes that
 * database to the browser: these routes call a handful of database functions with a token
 * that only this server holds (PMEC_PORTAL_PM_TOKEN), and the database refuses anything
 * without it.
 *
 * Staff sign-in is off while the Command Center runs as a showcase, so these routes only
 * write to projects whose client is flagged as a demonstration. A real client's project
 * cannot be published from here until staff sign-in is back and gates these routes.
 */

const PROJECT_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MILESTONE_STATUS = new Set(["complete", "active", "upcoming"]);

export type PortalRpc = <T>(fn: string, args: Record<string, unknown>) => Promise<T>;

export class PortalRpcError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

export function createPortalRpc(url: string, publishableKey: string, token: string): PortalRpc {
  return async <T>(fn: string, args: Record<string, unknown>) => {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token, ...args }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      throw new PortalRpcError(body.message ?? `supabase ${fn} ${res.status}`, res.status, body.code);
    }
    return (await res.json()) as T;
  };
}

/** Picks the connection for this process, or null when the portal is not configured. */
export function resolvePortalRpc(env: NodeJS.ProcessEnv = process.env): PortalRpc | null {
  const { PMEC_PORTAL_SUPABASE_URL: url, PMEC_PORTAL_SUPABASE_KEY: key, PMEC_PORTAL_PM_TOKEN: token } = env;
  if (!url || !key || !token) {
    console.warn("[client-portal] not configured — PMEC_PORTAL_SUPABASE_URL/KEY/PM_TOKEN missing, answering 503");
    return null;
  }
  return createPortalRpc(url, key, token);
}

// ── Input shaping ─────────────────────────────────────────────────────────────────────
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const date = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
const money = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) / 100 : null);

export type PublishInput = {
  project: {
    name: string;
    location?: string;
    discipline?: string;
    currency: string;
    originalContractValue: number;
    invoicedToDate: number;
    progress: number;
    statusLabel: string;
    headline?: string;
    startDate?: string;
    targetEndDate?: string;
  };
  milestones: { id: string; code: string; title: string; detail?: string; targetDate?: string; status: string }[];
  publishedBy: string;
};

/** Validates a publish request; returns the database payload or an error message. */
export function shapePublish(projectId: string, body: unknown): { ok: true; project: Record<string, unknown>; milestones: Record<string, unknown>[]; publishedBy: string } | { ok: false; error: string } {
  const input = body as Partial<PublishInput> | null;
  const p = input?.project;
  if (!p) return { ok: false, error: "missing project" };
  const name = text(p.name, 200);
  if (!name) return { ok: false, error: "missing name" };
  const currency = text(p.currency, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "bad currency" };
  const contract = money(p.originalContractValue);
  const invoiced = money(p.invoicedToDate);
  if (contract === null || contract < 0) return { ok: false, error: "bad contract value" };
  if (invoiced === null || invoiced < 0) return { ok: false, error: "bad invoiced value" };
  if (!Number.isInteger(p.progress) || (p.progress as number) < 0 || (p.progress as number) > 100) return { ok: false, error: "bad progress" };
  const milestones = Array.isArray(input?.milestones) ? input.milestones : [];
  if (milestones.length > 60) return { ok: false, error: "too many milestones" };
  const shapedMilestones: Record<string, unknown>[] = [];
  for (const m of milestones) {
    const id = text(m?.id, 80);
    const title = text(m?.title, 200);
    if (!id || !title || !MILESTONE_STATUS.has(m?.status)) return { ok: false, error: "bad milestone" };
    shapedMilestones.push({ id, code: text(m.code, 12) || id.toUpperCase(), title, detail: text(m.detail, 1000) || null, target_date: date(m.targetDate), status: m.status });
  }
  return {
    ok: true,
    project: {
      id: projectId,
      name,
      location: text(p.location, 200) || null,
      discipline: text(p.discipline, 120) || null,
      currency,
      original_contract_value: contract,
      invoiced_to_date: invoiced,
      progress: p.progress,
      status_label: text(p.statusLabel, 60) || "On programme",
      headline: text(p.headline, 400) || null,
      start_date: date(p.startDate),
      target_end_date: date(p.targetEndDate),
    },
    milestones: shapedMilestones,
    publishedBy: text(input?.publishedBy, 200) || "PMEC project management",
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────────────
export function registerClientPortalRoutes(app: Express, getRpc: () => PortalRpc | null) {
  let rpc: PortalRpc | null | undefined;
  const current = () => (rpc === undefined ? (rpc = getRpc()) : rpc);

  const fail = (res: Response, error: unknown) => {
    if (error instanceof PortalRpcError) {
      // Database refusals carry a meaning the PM should see; everything else is ours.
      if (error.code === "55000") return res.status(409).json({ error: error.message });
      if (error.code === "P0002") return res.status(404).json({ error: error.message });
      if (error.code === "22023" || error.code === "23514") return res.status(400).json({ error: error.message });
    }
    console.error("[client-portal] error:", error instanceof Error ? error.message : String(error));
    return res.status(502).json({ error: "client portal unavailable" });
  };

  /** Resolves the store and checks this project may be written from here. */
  async function guard(req: Request, res: Response): Promise<{ call: PortalRpc; projectId: string } | null> {
    res.setHeader("Cache-Control", "no-store");
    const call = current();
    if (!call) {
      res.status(503).json({ error: "client portal not configured" });
      return null;
    }
    const projectId = String(req.params.projectId ?? "");
    if (!PROJECT_ID.test(projectId)) {
      res.status(400).json({ error: "bad project" });
      return null;
    }
    try {
      const scope = await call<{ exists: boolean; is_demo?: boolean; client?: string }>("pm_project_scope", { p_project: projectId });
      if (!scope.exists) {
        res.status(404).json({ error: "not linked to a client", linked: false });
        return null;
      }
      if (!scope.is_demo) {
        res.status(403).json({ error: "real client projects need staff sign-in" });
        return null;
      }
    } catch (error) {
      fail(res, error);
      return null;
    }
    return { call, projectId };
  }

  app.get("/api/client-portal/:projectId", async (req, res) => {
    const ok = await guard(req, res);
    if (!ok) return;
    try {
      res.json(await ok.call("pm_project_state", { p_project: ok.projectId }));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/client-portal/:projectId/publish", async (req, res) => {
    const ok = await guard(req, res);
    if (!ok) return;
    const shaped = shapePublish(ok.projectId, req.body);
    if (!shaped.ok) return res.status(400).json({ error: shaped.error });
    try {
      res.json(await ok.call("pm_publish_project", { p_project: shaped.project, p_milestones: shaped.milestones, p_published_by: shaped.publishedBy }));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/client-portal/:projectId/change-orders", async (req, res) => {
    const ok = await guard(req, res);
    if (!ok) return;
    const title = text(req.body?.title, 200);
    const reason = text(req.body?.reason, 4000);
    const amount = money(req.body?.amount);
    if (!title || !reason) return res.status(400).json({ error: "title and reason are required" });
    if (amount === null || amount === 0 || Math.abs(amount) > 1e11) return res.status(400).json({ error: "bad amount" });
    try {
      res.json(await ok.call("pm_raise_change_order", { p_project: ok.projectId, p_title: title, p_reason: reason, p_amount: amount, p_raised_by: text(req.body?.raisedBy, 200) || "PMEC project management" }));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/client-portal/:projectId/change-orders/:id/withdraw", async (req, res) => {
    const ok = await guard(req, res);
    if (!ok) return;
    const id = String(req.params.id ?? "");
    if (!UUID.test(id)) return res.status(400).json({ error: "bad change order" });
    try {
      res.json(await ok.call("pm_withdraw_change_order", { p_id: id }));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/client-portal/:projectId/updates", async (req, res) => {
    const ok = await guard(req, res);
    if (!ok) return;
    const title = text(req.body?.title, 200);
    if (!title) return res.status(400).json({ error: "title is required" });
    try {
      res.json(await ok.call("pm_post_update", { p_project: ok.projectId, p_title: title, p_detail: text(req.body?.detail, 2000) }));
    } catch (error) {
      fail(res, error);
    }
  });
}
