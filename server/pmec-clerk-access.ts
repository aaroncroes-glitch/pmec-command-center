import { verifyToken } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { TRPCError } from "@trpc/server";
import type { IncomingMessage } from "http";

export const PAYROLL_REVIEW_PERMISSION = "payroll.review";

export type PmecClerkPrincipal = {
  clerkUserId: string;
  personId: string;
  roles: string[];
  permissions: string[];
};

function readBearerToken(req: IncomingMessage) {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function hasPmecPermission(principal: Pick<PmecClerkPrincipal, "permissions">, permission: string) {
  return principal.permissions.includes(permission);
}

export function assertPayrollReviewPermission(principal: PmecClerkPrincipal) {
  if (!hasPmecPermission(principal, PAYROLL_REVIEW_PERMISSION)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "A verified HR payroll membership is required." });
  }
  return principal;
}

export async function resolvePmecClerkPrincipal(req: IncomingMessage): Promise<PmecClerkPrincipal> {
  const token = readBearerToken(req);
  const secretKey = process.env.CLERK_SECRET_KEY;
  const connectionString = process.env.NEON_DATABASE_URL;

  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in with Clerk to continue." });
  if (!secretKey || !connectionString) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payroll authorization is not configured." });
  }

  let clerkUserId: string | undefined;
  try {
    const verified = await verifyToken(token, { secretKey });
    clerkUserId = verified.sub;
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Your Clerk session could not be verified." });
  }

  if (!clerkUserId) throw new TRPCError({ code: "UNAUTHORIZED", message: "The Clerk session has no user subject." });

  try {
    const sql = neon(connectionString);
    const rows = await sql.query(
      `SELECT p.id AS person_id, m.role::text AS role, rp.permission
       FROM pmec.auth_identities ai
       JOIN pmec.people p ON p.id = ai.person_id AND p.active
       JOIN pmec.memberships m ON m.person_id = p.id AND m.status = 'active'
       JOIN pmec.role_permissions rp ON rp.role = m.role
       WHERE ai.provider = 'clerk' AND ai.external_subject = $1`,
      [clerkUserId],
    ) as Array<{ person_id: string; role: string; permission: string }>;

    if (rows.length === 0) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No active PMEC membership is linked to this Clerk account." });
    }

    return {
      clerkUserId,
      personId: rows[0]!.person_id,
      roles: [...new Set(rows.map((row) => row.role))],
      permissions: [...new Set(rows.map((row) => row.permission))],
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[PMEC payroll authorization] Neon lookup failed", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payroll authorization is temporarily unavailable." });
  }
}
