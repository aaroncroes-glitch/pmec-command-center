# PMEC Command Center: Clerk RBAC Implementation Guide

**Decision:** Use **Clerk** for authentication and **Neon Postgres** as the PMEC authorization and operational data source. The current project is an **Expo application with a tRPC API**, not a Next.js application. This guide therefore gives a Next.js App Router reference implementation alongside the required Expo/tRPC equivalent. The production access model is identical in both: the server resolves a verified Clerk identity to an active Neon membership and evaluates named permissions there.

> Clerk session claims are useful for fast route gating. They must **not** be the only source of authorization for PMEC assignments, hours, leave, or capacity data. Every protected server action/API procedure must load the current active membership and scope its database query accordingly.[1]

## 1. Clerk Configuration

Create one PMEC Clerk production instance and one Clerk Organization for PMEC. Invite known users only; do not allow a user to choose a PMEC role during sign-up. Keep the Clerk Organization role at `org:member` unless there is a Clerk-specific administrative need. The authoritative application role (`employee`, `project_manager`, or `hr_manager`) lives in Neon.

| PMEC group | Count | Clerk Organization role | Neon membership role | Product surface |
|---|---:|---|---|---|
| Employees | 28 | `org:member` | `employee` | Expo mobile workspace |
| Project Managers | 4 | `org:member` | `project_manager` | Desktop/iPad Operations Center |
| HR Managers | 2 | `org:member` | `hr_manager` | Desktop/iPad People & Capacity Center |
| System owner | As required | Clerk administrative role | `organization_admin` | Restricted administration |

In Clerk Dashboard, enable email verification, set approved redirect/origin URLs for the employee mobile link and operations web host, and enable the Native API for the Expo client. Clerk’s Expo integration uses `@clerk/expo`, `ClerkProvider`, and secure token caching with `@clerk/expo/token-cache`.[2]

## 2. Canonical Server Authorization Contract

The app must use named permissions rather than passing a role from the client. A request must be rejected with `401` if its Clerk token is invalid or absent, and with `403` if the identity is valid but lacks the named permission or target scope.

```ts
// Shared application concept — do not trust a role value from the client.
type PmecRole = "employee" | "project_manager" | "hr_manager" | "organization_admin";

type PmecPrincipal = {
  clerkUserId: string;
  personId: string;
  organizationId: string;
  roles: PmecRole[];
  permissions: Set<string>;
};

export async function requirePermission(
  clerkUserId: string | null,
  permission: string,
): Promise<PmecPrincipal> {
  if (!clerkUserId) throw new UnauthorizedError();

  const principal = await db.getActivePrincipalByClerkUserId(clerkUserId);
  if (!principal) throw new ForbiddenError("No active PMEC membership");
  if (!principal.permissions.has(permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  return principal;
}
```

The supporting Neon query joins `auth_identities → memberships → role_permissions`. It always filters `memberships.status = 'active'` and returns one organization-scoped principal. This allows a suspension to take effect without waiting for an old browser/mobile token to expire.

## 3. Next.js App Router Reference

The PMEC operations surface could be moved to Next.js later. Clerk’s official RBAC guide shows server-side route gating from session claims and emphasizes that route gating is separate from data authorization.[1]

### Route protection: `proxy.ts`

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/accept-invitation(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublic(request)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
```

### Permission resolver: `lib/pmec-auth.ts`

```ts
import { auth } from "@clerk/nextjs/server";
import { requirePermission } from "@/server/pmec-principal";

export async function requirePmecPermission(permission: string) {
  const { userId } = await auth();
  return requirePermission(userId, permission);
}
```

### Scoped action: approve a time log

```ts
import { NextResponse } from "next/server";
import { requirePmecPermission } from "@/lib/pmec-auth";
import { db } from "@/server/db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const principal = await requirePmecPermission("time_log.approve_assigned");
  const log = await db.getTimeLogForApproval(params.id, principal.organizationId);

  if (!log || !log.projectManagerIds.includes(principal.personId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.approveTimeLog({
    timeLogId: log.id,
    reviewerPersonId: principal.personId,
  });
  return NextResponse.json({ ok: true });
}
```

The critical detail is the project-scope test after permission resolution. A Project Manager has the general ability to approve time, but only within job orders that `project_memberships.can_manage = true` authorizes.

## 4. Required Expo/tRPC Equivalent

PMEC’s current implementation stays in Expo plus tRPC. Add Clerk to the Expo root and replace the demo-only `PmecAccessProvider` role selector with a server-derived principal.

```tsx
// app/_layout.tsx — representative Expo root wiring
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AppProviders />
    </ClerkProvider>
  );
}
```

```ts
// lib/trpc.ts — attach the Clerk session token, not a client-selected role.
import { useAuth } from "@clerk/expo";

export function usePmecTrpcHeaders() {
  const { getToken } = useAuth();
  return async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
}
```

```ts
// server/trpc/pmec-procedure.ts — representative server pattern.
export const pmecProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const clerkUserId = await verifyClerkBearerToken(ctx.req.headers.authorization);
  const principal = await db.getActivePrincipalByClerkUserId(clerkUserId);
  if (!principal) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, principal } });
});

export function requirePmecPermission(permission: string) {
  return pmecProcedure.use(({ ctx, next }) => {
    if (!ctx.principal.permissions.has(permission)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });
}
```

Employee task delivery then becomes unambiguous:

```ts
assignedWork: requirePmecPermission("assignment.read_own").query(({ ctx }) =>
  db.listAssignmentsForPerson(ctx.principal.personId),
),
```

No input parameter should accept `employeeId` for this employee-facing procedure. The server derives `personId` from the verified Clerk identity.

## 5. Reviewed Neon Access Schema

The complete, reviewable DDL is in **`pmec-clerk-neon-access-schema.sql`**. Its core entities are summarized below.

| Table | Purpose | Security relevance |
|---|---|---|
| `pmec.people` | HR/workforce person record | Links legacy PMEC employee identifiers to a durable UUID. |
| `pmec.auth_identities` | Clerk `userId` to person mapping | Prevents client-controlled identity association. |
| `pmec.memberships` | Organization role, status, permitted product surface | Suspension/revocation takes effect at the API boundary. |
| `pmec.role_permissions` | Fixed application permissions by role | Supports named, audited authorization checks. |
| `pmec.auth_invitations` | Controlled Clerk invitation linkage | Matches the invite to the intended PMEC person and role. |
| `pmec.onboarding_progress` | Mobile setup completion state | Keeps onboarding idempotent and auditable. |
| `pmec.audit_events` | Sensitive access and lifecycle record | Captures invite, activation, suspension, and role changes. |

The SQL uses a provider-neutral identity table, but production should seed only `provider = 'clerk'`. It keeps Auth.js migration possible without coupling PMEC operational records to an authentication vendor.

## 6. Mobile Employee Invitation and Onboarding Journey

Clerk Organization invitations send a unique invitation link by email. Server-created invitations can specify a redirect URL, which PMEC uses to return an employee to an invitation-completion route.[3]

```text
HR administrator selects an existing Employee person record
        │
        ▼
PMEC API validates employee role + work email + active employment
        │
        ▼
Create Neon auth_invitation (pending) and Clerk Organization invitation
        │
        ▼
Employee receives “Join PMEC Lumen” email on phone
        │
        ▼
Universal link opens the PMEC Expo app or hosted sign-in fallback
        │
        ▼
Clerk verifies email and creates/signs in the account
        │
        ▼
POST /onboarding/complete verifies Clerk identity + pending invite email
        │
        ▼
Create auth_identity; activate membership; record audit event
        │
        ▼
Employee confirms profile, notification preference, and reaches Assigned Work
```

### Screens and behavior

| Stage | Employee sees | API behavior | Exit condition |
|---|---|---|---|
| Invite email | “Join PMEC Lumen” and secure link | No PMEC data is exposed | User opens link |
| Welcome | PMEC / Lumen welcome, work email prefilled | Client requests Clerk hosted sign-in | Clerk sign-in begins |
| Email verification | Clerk verification screen | Clerk validates ownership | Signed-in Clerk identity |
| PMEC match | “Setting up your workspace” | API finds matching pending `auth_invitation` and creates identity link | Active `employee` membership |
| First-use preferences | Notification controls, optional biometric/device guidance | Saves `onboarding_progress` and notification preference | Employee confirms |
| Assigned Work | Task inbox, time logging, leave workspace | All data queries use current server-derived person ID | Normal app usage |

The employee cannot see PM/HR navigation during onboarding or after activation. An invitation with an email mismatch, revoked state, expired link, disabled person, or already-linked Clerk identity presents a support-safe error and creates no membership.

## 7. Safe Invitation Procedure

```ts
// Server-only; called by an HR/administrator API procedure.
async function inviteEmployee(personId: string, actor: PmecPrincipal) {
  assertPermission(actor, "membership.invite_employee");
  const person = await db.getActiveEmployee(personId, actor.organizationId);
  if (!person) throw new ForbiddenError("Employee record not found");

  const invitation = await db.createPendingInvitation({
    personId: person.id,
    organizationId: actor.organizationId,
    requestedRole: "employee",
    email: person.workEmail,
    invitedByPersonId: actor.personId,
  });

  const clerkInvitation = await clerkClient.organizations.createOrganizationInvitation({
    organizationId: process.env.CLERK_PMEC_ORGANIZATION_ID!,
    emailAddress: person.workEmail,
    role: "org:member",
    inviterUserId: actor.clerkUserId,
    redirectUrl: `${PMEC_MOBILE_INVITE_URL}?invitation=${invitation.id}`,
  });

  await db.attachClerkInvitation(invitation.id, clerkInvitation.id);
  await db.auditInvitationSent(actor.personId, person.id, invitation.id);
}
```

Use Clerk’s server/backend invitation API, never a client-side secret. Clerk documents role-capable Organization invitations, server-side redirect URLs, and rate-limit handling for invitation calls.[3]

## 8. Pre-implementation Checklist

- Create the Clerk development instance and one PMEC Organization.
- Confirm the employee mobile redirect/deep-link scheme and operations web domain.
- Create the Neon project and apply the access schema on a development branch only.
- Import a small pilot: two employees, one Project Manager, and one HR Manager.
- Test invitations, valid sign-in, revoked invitation, wrong-email acceptance, suspended membership, cross-employee access, and cross-project PM approval.
- Only after passing the pilot, request production secrets and replace the demonstration role switcher.

## References

[1] [Clerk: Implement basic role-based access control with metadata](https://clerk.com/docs/guides/secure/basic-rbac)

[2] [Clerk: Expo Quickstart](https://clerk.com/docs/expo/getting-started/quickstart)

[3] [Clerk: Organization invitations](https://clerk.com/docs/guides/organizations/add-members/invitations)
