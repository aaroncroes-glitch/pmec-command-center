import { neon } from "@neondatabase/serverless";
import { TRPCError } from "@trpc/server";

export const MAPPABLE_ROLES = ["employee", "project_manager", "hr_manager"] as const;
export type MappableRole = (typeof MAPPABLE_ROLES)[number];

export type IdentityMapping = {
  personId: string;
  clerkUserId: string | null;
  workEmail: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  department: string;
  jobTitle: string;
  legacyEmployeeId: string | null;
  active: boolean;
  memberships: Array<{ role: string; status: string; allowedSurface: string }>;
};

export type ProductionClerkUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  lastSignInAt: number | null;
};

export type MappingInput = {
  clerkUserId: string;
  workEmail: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  department: string;
  jobTitle: string;
  legacyEmployeeId?: string;
  role: MappableRole;
};

type MappingRow = Omit<IdentityMapping, "memberships"> & { memberships: unknown };

function getIdentityAdminConnection() {
  const value = process.env.PMEC_IDENTITY_ADMIN_DATABASE_URL;
  if (!value) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Production identity administration is not configured yet.",
    });
  }
  return value;
}

export function allowedSurfaceForRole(role: MappableRole) {
  return role === "employee" ? "employee_mobile" : "operations_web";
}

export async function listIdentityMappings(organizationId: string): Promise<IdentityMapping[]> {
  const sql = neon(getIdentityAdminConnection());
  const rows = await sql.query(
    `SELECT p.id AS "personId",
            ai.external_subject AS "clerkUserId",
            p.work_email::text AS "workEmail",
            p.first_name AS "firstName",
            p.last_name AS "lastName",
            p.preferred_name AS "preferredName",
            p.department AS "department",
            p.job_title AS "jobTitle",
            p.legacy_employee_id AS "legacyEmployeeId",
            p.active AS "active",
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'role', m.role::text,
                  'status', m.status::text,
                  'allowedSurface', m.allowed_surface::text
                )
              ) FILTER (WHERE m.id IS NOT NULL),
              '[]'::jsonb
            ) AS memberships
       FROM pmec.people p
       LEFT JOIN pmec.auth_identities ai ON ai.person_id = p.id AND ai.provider = 'clerk'
       LEFT JOIN pmec.memberships m ON m.person_id = p.id AND m.organization_id = p.organization_id
      WHERE p.organization_id = $1
      GROUP BY p.id, ai.external_subject
      ORDER BY p.active DESC, p.last_name, p.first_name`,
    [organizationId],
  ) as MappingRow[];

  return rows.map((row) => ({
    personId: row.personId,
    clerkUserId: row.clerkUserId,
    workEmail: row.workEmail,
    firstName: row.firstName,
    lastName: row.lastName,
    preferredName: row.preferredName,
    department: row.department,
    jobTitle: row.jobTitle,
    legacyEmployeeId: row.legacyEmployeeId,
    active: row.active,
    memberships: Array.isArray(row.memberships) ? row.memberships as IdentityMapping["memberships"] : [],
  }));
}

export async function listProductionClerkUsers(): Promise<ProductionClerkUser[]> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Clerk production access is not configured." });
  }

  const response = await fetch("https://api.clerk.com/v1/users?limit=100&order_by=-last_sign_in_at", {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Clerk production users could not be retrieved." });
  }

  const users = await response.json() as Array<{
    id: string;
    email_addresses?: Array<{ email_address?: string }>;
    first_name?: string | null;
    last_name?: string | null;
    last_sign_in_at?: number | null;
  }>;
  return users.map((user) => ({
    id: user.id,
    email: user.email_addresses?.[0]?.email_address ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  }));
}

export async function mapProductionClerkUser(organizationId: string, actorPersonId: string, input: MappingInput) {
  const sql = neon(getIdentityAdminConnection());
  const existingIdentity = await sql.query(
    `SELECT p.organization_id, ai.person_id
       FROM pmec.auth_identities ai
       JOIN pmec.people p ON p.id = ai.person_id
      WHERE ai.provider = 'clerk' AND ai.external_subject = $1`,
    [input.clerkUserId],
  ) as Array<{ organization_id: string; person_id: string }>;

  if (existingIdentity[0]) {
    if (existingIdentity[0].organization_id !== organizationId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This Clerk account is already linked to another organization." });
    }
    throw new TRPCError({ code: "CONFLICT", message: "This Clerk account is already linked to a PMEC person. Update the existing membership instead." });
  }

  const surface = allowedSurfaceForRole(input.role);
  const rows = await sql.query(
    `WITH person AS (
       INSERT INTO pmec.people (
         organization_id, legacy_employee_id, work_email, first_name, last_name,
         preferred_name, department, job_title, active
       ) VALUES ($1, NULLIF($2, ''), $3, $4, $5, NULLIF($6, ''), $7, $8, true)
       ON CONFLICT (organization_id, work_email) DO UPDATE
       SET legacy_employee_id = COALESCE(EXCLUDED.legacy_employee_id, pmec.people.legacy_employee_id),
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           preferred_name = EXCLUDED.preferred_name,
           department = EXCLUDED.department,
           job_title = EXCLUDED.job_title,
           active = true,
           updated_at = now()
       RETURNING id
     ), identity AS (
       INSERT INTO pmec.auth_identities (person_id, provider, external_subject, verified_email, last_authenticated_at)
       SELECT id, 'clerk'::pmec.identity_provider, $9, $3, now() FROM person
       ON CONFLICT (provider, external_subject) DO UPDATE
       SET verified_email = EXCLUDED.verified_email,
           last_authenticated_at = now()
       RETURNING person_id
     )
       INSERT INTO pmec.memberships (organization_id, person_id, role, status, allowed_surface, granted_by_person_id, granted_at, activated_at)
     SELECT $1, person_id, $10::pmec.role_code, 'active'::pmec.membership_status,
            $11::pmec.client_surface, $12::uuid, now(), now()
       FROM identity
     ON CONFLICT (organization_id, person_id, role) DO UPDATE
       SET status = 'active', allowed_surface = EXCLUDED.allowed_surface, activated_at = COALESCE(pmec.memberships.activated_at, now()), updated_at = now()
     RETURNING person_id, role::text AS role, status::text AS status, allowed_surface::text AS allowed_surface`,
    [
      organizationId,
      input.legacyEmployeeId ?? "",
      input.workEmail.trim().toLowerCase(),
      input.firstName.trim(),
      input.lastName.trim(),
      input.preferredName?.trim() ?? "",
      input.department.trim(),
      input.jobTitle.trim(),
      input.clerkUserId,
      input.role,
      surface,
      actorPersonId,
    ],
  ) as Array<{ person_id: string; role: string; status: string; allowed_surface: string }>;

  const mapped = rows[0];
  if (!mapped) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PMEC membership mapping did not return a result." });
  await sql.query(
    `INSERT INTO pmec.audit_events (organization_id, actor_person_id, event_type, entity_type, entity_id, payload)
     VALUES ($1, $2, 'membership.mapped_clerk_user', 'person', $3::uuid,
       jsonb_build_object('role', $4, 'allowedSurface', $5, 'clerkUserId', $6))`,
    [organizationId, actorPersonId, mapped.person_id, mapped.role, mapped.allowed_surface, input.clerkUserId],
  );
  return mapped;
}
