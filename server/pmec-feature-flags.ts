import type { Response } from "express";

function truthy(value: string | undefined) {
  return value === "1" || value?.toLowerCase() === "true";
}

/** Legacy Manus OAuth + JWT session cookies (off by default). */
export function isLegacyManusAuthEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return truthy(env.PMEC_LEGACY_MANUS_AUTH);
}

/**
 * Unauthenticated showcase APIs (`/api/demo-sync/*`, demo client-portal writes).
 * Off in production unless `PMEC_PUBLIC_DEMO_API=1`.
 */
export function isPublicDemoApiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === "production") return truthy(env.PMEC_PUBLIC_DEMO_API);
  return env.PMEC_PUBLIC_DEMO_API !== "0";
}

export function sendNotFoundUnlessPublicDemoApi(res: Response): boolean {
  if (!isPublicDemoApiEnabled()) {
    res.status(404).json({ error: "not found" });
    return false;
  }
  return true;
}