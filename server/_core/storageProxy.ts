import type { Express } from "express";
import { TRPCError } from "@trpc/server";

import { assertClerkBearerSession } from "../pmec-clerk-access";

function trpcStatus(error: TRPCError) {
  if (error.code === "UNAUTHORIZED") return 401;
  if (error.code === "INTERNAL_SERVER_ERROR" || error.code === "PRECONDITION_FAILED") return 503;
  return 403;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL ?? "";
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY ?? "";
    if (!forgeApiUrl || !forgeApiKey) {
      res.status(404).send("Not found");
      return;
    }

    try {
      await assertClerkBearerSession(req);
    } catch (error) {
      if (error instanceof TRPCError) {
        res.status(trpcStatus(error)).json({ error: error.message });
        return;
      }
      res.status(500).send("Storage proxy error");
      return;
    }

    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const forgeUrl = new URL("v1/storage/presign/get", forgeApiUrl.replace(/\/+$/, "") + "/");
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}