import type { IncomingMessage } from "http";
import { TRPCError } from "@trpc/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function headerValue(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Resolves the single PMEC organization for this request.
 * Production requires `PMEC_ORGANIZATION_ID`; an optional `x-pmec-organization-id`
 * header may override in non-production for local multi-tenant testing.
 */
export function resolvePmecOrganizationId(req: IncomingMessage, env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv = env.PMEC_ORGANIZATION_ID?.trim();
  const fromHeader = headerValue(req, "x-pmec-organization-id");

  if (env.NODE_ENV === "production") {
    if (!fromEnv) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "PMEC_ORGANIZATION_ID is not configured for this deployment.",
      });
    }
    if (fromHeader && fromHeader !== fromEnv) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Organization override is not permitted in production.",
      });
    }
    return assertUuid(fromEnv);
  }

  const chosen = fromHeader || fromEnv;
  if (!chosen) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Set PMEC_ORGANIZATION_ID or send x-pmec-organization-id.",
    });
  }
  return assertUuid(chosen);
}

function assertUuid(value: string): string {
  if (!UUID.test(value)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid PMEC organization id." });
  }
  return value;
}