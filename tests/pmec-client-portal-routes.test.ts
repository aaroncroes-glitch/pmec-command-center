import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { PortalRpcError, registerClientPortalRoutes, shapeLines, shapePublish, type PortalRpc } from "../server/pmec-client-portal";

type Call = { fn: string; args: Record<string, unknown> };

function fakeRpc(scope: { exists: boolean; is_demo?: boolean }, fail?: PortalRpcError) {
  const calls: Call[] = [];
  const rpc: PortalRpc = async <T,>(fn: string, args: Record<string, unknown>) => {
    calls.push({ fn, args });
    if (fn === "pm_project_scope") return scope as T;
    if (fail) throw fail;
    return { ok: fn } as T;
  };
  return { rpc, calls };
}

let server: ReturnType<express.Express["listen"]> | null = null;
async function start(rpc: PortalRpc | null) {
  const app = express();
  app.use(express.json());
  registerClientPortalRoutes(app, () => rpc);
  server = app.listen(0);
  await new Promise((resolve) => server!.once("listening", resolve));
  return `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
}
afterEach(() => { server?.close(); server = null; });

const post = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const publishBody = {
  project: { name: "Hotel Renovation", currency: "awg", originalContractValue: 820000, invoicedToDate: 312000, progress: 48, statusLabel: "On programme" },
  milestones: [{ id: "m1", code: "M01", title: "Client approval", status: "complete", targetDate: "2026-07-05" }],
  publishedBy: "Victor Quant",
};

describe("client portal routes", () => {
  it("answers 503 when the portal is not configured", async () => {
    const base = await start(null);
    expect((await fetch(`${base}/api/client-portal/jo-hotel-renovation`)).status).toBe(503);
  });

  it("refuses a job order that is not linked to a client", async () => {
    const base = await start(fakeRpc({ exists: false }).rpc);
    expect((await fetch(`${base}/api/client-portal/jo-unknown`)).status).toBe(404);
  });

  it("refuses to write a real client's project from the showcase", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: false });
    const base = await start(rpc);
    expect((await post(`${base}/api/client-portal/jo-real/publish`, publishBody)).status).toBe(403);
    expect(calls.map((c) => c.fn)).toEqual(["pm_project_scope"]);
  });

  it("rejects a malformed project id before touching the database", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: true });
    const base = await start(rpc);
    expect((await fetch(`${base}/api/client-portal/Bad%20Id`)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("publishes a demo project with a shaped payload", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: true });
    const base = await start(rpc);
    const res = await post(`${base}/api/client-portal/jo-hotel-renovation/publish`, publishBody);
    expect(res.status).toBe(200);
    const call = calls.find((c) => c.fn === "pm_publish_project")!;
    expect((call.args.p_project as Record<string, unknown>).currency).toBe("AWG");
    expect(call.args.p_published_by).toBe("Victor Quant");
  });

  it("validates change orders", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }).rpc);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/change-orders`, { title: "", reason: "x", amount: 10 })).status).toBe(400);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/change-orders`, { title: "Extra", reason: "x", amount: 0 })).status).toBe(400);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/change-orders`, { title: "Extra", reason: "Asbestos", amount: 14200 })).status).toBe(200);
  });

  it("maps a database 'already decided' to 409", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }, new PortalRpcError("not pending", 400, "55000")).rpc);
    const res = await post(`${base}/api/client-portal/jo-hotel-renovation/change-orders/0f8fad5b-d9cb-469f-a165-70867728950e/withdraw`, {});
    expect(res.status).toBe(409);
  });
});

describe("milestone sync route", () => {
  it("sends only milestones, shaped", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: true });
    const base = await start(rpc);
    const res = await post(`${base}/api/client-portal/jo-hotel-renovation/milestones`, { milestones: [{ id: "m4", code: "M04", title: "Chillers set", status: "complete", targetDate: "2026-10-09" }] });
    expect(res.status).toBe(200);
    const call = calls.find((c) => c.fn === "pm_sync_milestones")!;
    expect((call.args.p_milestones as { status: string }[])[0].status).toBe("complete");
    expect(call.args).not.toHaveProperty("p_project_json");
  });

  it("rejects a malformed milestone", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }).rpc);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/milestones`, { milestones: [{ id: "m4", title: "x", status: "done" }] })).status).toBe(400);
  });

  it("maps 'publish the project first' to 409", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }, new PortalRpcError("publish the project first", 400, "55000")).rpc);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/milestones`, { milestones: [] })).status).toBe(409);
  });
});

describe("shapePublish", () => {
  it("rejects out-of-range progress and unknown milestone states", () => {
    expect(shapePublish("p", { ...publishBody, project: { ...publishBody.project, progress: 140 } }).ok).toBe(false);
    expect(shapePublish("p", { ...publishBody, milestones: [{ id: "m", title: "x", status: "done" }] }).ok).toBe(false);
  });
});

describe("money lines", () => {
  it("totals lines the way the database does", () => {
    const shaped = shapeLines([
      { description: "Heat pumps", quantity: 2, unitPrice: 38500 },
      { description: "Pipework", quantity: 1, unitPrice: 24600 },
    ])!;
    expect(shaped.subtotal).toBe(101600);
    expect(shaped.lines).toHaveLength(2);
  });

  it("refuses empty, unpriced or nonsense lines", () => {
    expect(shapeLines([])).toBeNull();
    expect(shapeLines("x")).toBeNull();
    expect(shapeLines([{ description: "", quantity: 1, unitPrice: 10 }])).toBeNull();
    expect(shapeLines([{ description: "Free", quantity: 1, unitPrice: 0 }])).toBeNull();
    expect(shapeLines([{ description: "Negative", quantity: -1, unitPrice: 10 }])).toBeNull();
  });
});

describe("invoice and quote routes", () => {
  const lines = [{ description: "Progress claim", quantity: 1, unitPrice: 134400 }];

  it("issues an invoice with shaped lines and tax", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: true });
    const base = await start(rpc);
    const res = await post(`${base}/api/client-portal/jo-hotel-renovation/invoices`, { title: "Progress claim 02", lines, taxRate: 7, dueDate: "2026-10-31", currency: "awg" });
    expect(res.status).toBe(200);
    const call = calls.find((c) => c.fn === "pm_issue_invoice")!;
    expect(call.args.p_currency).toBe("AWG");
    expect(call.args.p_tax_rate).toBe(7);
    expect(call.args.p_due_date).toBe("2026-10-31");
  });

  it("rejects an invoice with no usable lines", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: true });
    const base = await start(rpc);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/invoices`, { title: "Empty", lines: [] })).status).toBe(400);
    expect(calls.some((c) => c.fn === "pm_issue_invoice")).toBe(false);
  });

  it("only settles to paid or void", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }).rpc);
    const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/invoices/${id}/settle`, { status: "cancelled" })).status).toBe(400);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/invoices/${id}/settle`, { status: "paid" })).status).toBe(200);
  });

  it("maps a second settlement to 409", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }, new PortalRpcError("already settled", 400, "55000")).rpc);
    const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/invoices/${id}/settle`, { status: "paid" })).status).toBe(409);
  });

  it("sends a quote for the named client", async () => {
    const { rpc, calls } = fakeRpc({ exists: true, is_demo: true });
    const base = await start(rpc);
    const res = await post(`${base}/api/client-portal/jo-hotel-renovation/quotes`, { clientName: "Renaissance Aruba", title: "Pool deck heat pumps", lines, taxRate: 7, validUntil: "2026-10-20" });
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.fn === "pm_send_quote")!.args.p_client_name).toBe("Renaissance Aruba");
  });

  it("needs a client on a quote", async () => {
    const base = await start(fakeRpc({ exists: true, is_demo: true }).rpc);
    expect((await post(`${base}/api/client-portal/jo-hotel-renovation/quotes`, { title: "No client", lines })).status).toBe(400);
  });
});
