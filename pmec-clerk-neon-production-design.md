# PMEC Command Center: Clerk/Auth.js and Neon Postgres Production Design

**Status:** Architecture and schema draft. This document does not migrate the current managed MySQL/TiDB demonstration or turn on production authentication. It defines the target implementation before credentials, a Neon project, and a chosen identity provider are connected.

## Recommendation

> **Recommended stack:** **Clerk + Neon Postgres + Drizzle + the existing PMEC API.** Clerk should own account creation, passwordless/password/OAuth/MFA flows, sessions, and recovery. Neon should own PMEC operational records. The PMEC API should verify every Clerk session token, resolve it to a PMEC membership, and authorize the requested action before reading or changing business data.

This is the shortest route to a secure mobile employee experience and separate desktop/iPad operations experiences. Clerk’s Neon guide uses the verified Clerk user ID as the stable application identity and pairs it with a Neon connection string and Drizzle schema.[1] Auth.js also provides a Neon adapter, but it requires PMEC to own more of the authentication/session lifecycle and its related schema; Auth.js notes its project is now part of Better Auth.[2]

| Layer | Recommended responsibility | Why it belongs there |
|---|---|---|
| **Clerk** | Sign-in, invitation, MFA, session refresh, passwordless/OAuth options, password recovery | Identity security should not be reinvented in PMEC. |
| **Neon Postgres** | People, workforce profiles, memberships, roles, job orders, leave, assignments, time logs, notifications, audit records | PMEC needs relational reporting, transactional approvals, and strong foreign keys. |
| **PMEC API** | JWT verification, membership lookup, permission checks, request validation, row-scoped queries | Server-side authorization is the primary protection for mobile and desktop clients. |
| **Mobile / desktop clients** | Render only the route set returned by the API | Client routing is a user-experience control, not the security boundary. |

## Authentication Choice

### Preferred: Clerk

Create **one Clerk production instance** and one PMEC organization. Invite all 34 people by business email. Do not allow self-service role selection. The first sign-in invokes an API webhook or just-in-time membership resolver that links Clerk’s immutable `userId` to a PMEC `person` record.

Use one client identity per surface:

| Audience | Client | Default entry | Permitted PMEC role |
|---|---|---|---|
| 28 employees | Expo mobile client | Employee workspace | `employee` |
| 4 Project Managers | Desktop/iPad web client | Project delivery center | `project_manager` |
| 2 HR Managers | Desktop/iPad web client | People and HR planning center | `hr_manager` |

The app must send the Clerk session token with every API request. The API verifies the token using Clerk’s server SDK/JWKS, reads `sub`, resolves `auth_identities.external_subject = sub`, and loads only active memberships. API procedures then require named permissions rather than trusting a role value supplied by the client.

Clerk route protection and server-side user ID retrieval are documented integration patterns for a Clerk + Neon application.[1] Neon also documents a Clerk path for JWT-backed Row-Level Security (RLS), which can be added as a defense-in-depth control when PMEC needs direct, token-scoped database access.[3]

### Alternative: Auth.js / Better Auth

Choose this only if PMEC needs full identity ownership, custom credential flows, or a provider-neutral stack and accepts the extra responsibility. Auth.js’s Neon adapter owns `users`, `accounts`, `sessions`, and `verification_token` tables; PMEC roles and workforce records should remain in separate application tables.[2]

For PMEC, do **not** deploy Clerk and Auth.js for the same production users. Pick one identity authority. The schema below treats `auth_identities` as provider-neutral so a future controlled migration remains possible.

## Authorization Model

The current role switcher is suitable for a demo but is not production authorization. Replace it with fixed membership roles and explicit server permissions.

| Capability | Employee | Project Manager | HR Manager |
|---|:---:|:---:|:---:|
| View own assigned work | Yes | No | No |
| Update own assignment status | Yes | No | No |
| Submit own time log | Yes | No | No |
| View own leave balance and requests | Yes | No | No |
| Create or assign work packages | No | Yes | No |
| Approve/reject employee time logs | No | Yes | Read only |
| View project capacity | No | Yes | No |
| View people directory and profiles | Own profile | Scoped | Yes |
| Review leave requests | No | No | Yes |
| View HR capacity forecast | No | No | Yes |
| Manage membership roles | No | Restricted admin | Restricted admin |

Project access can be restricted further with `project_memberships`; a Project Manager only manages job orders to which they are assigned. HR access is organization-wide by default but can later be limited by department. Employees are always restricted to their own `person_id` except where a business rule deliberately grants a manager relationship.

### Surface policy

PMEC should expose employee features only in the Expo application and operations features only on the desktop/iPad web host. The `allowed_surface` field is an auditable delivery policy used to direct the signed-in person to the correct experience; user-agent or app detection is **not** an authorization control. The enforceable boundary remains a verified identity, active membership, named permission, and server-scoped query. Restrict Clerk redirect/origin configuration to the approved PMEC mobile and operations clients, but do not treat a browser/device assertion as a substitute for role checks.

## Core Identity and Workforce Schema

The following Postgres DDL is designed for a dedicated `pmec` schema in Neon. UUIDs are generated in the database. Use `citext` for case-insensitive email matching and `timestamptz` for all audit timestamps.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS pmec;

CREATE TYPE pmec.role_code AS ENUM (
  'employee',
  'project_manager',
  'hr_manager',
  'organization_admin'
);

CREATE TYPE pmec.identity_provider AS ENUM ('clerk', 'authjs');
CREATE TYPE pmec.client_surface AS ENUM ('employee_mobile', 'operations_web');
CREATE TYPE pmec.membership_status AS ENUM ('invited', 'active', 'suspended', 'disabled');
CREATE TYPE pmec.employment_type AS ENUM ('employee', 'contractor');

CREATE TABLE pmec.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Aruba',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  legacy_employee_id text,
  work_email citext NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text,
  employment_type pmec.employment_type NOT NULL DEFAULT 'employee',
  department text NOT NULL,
  job_title text NOT NULL,
  location text,
  manager_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, work_email),
  UNIQUE (organization_id, legacy_employee_id)
);

CREATE TABLE pmec.auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE CASCADE,
  provider pmec.identity_provider NOT NULL,
  external_subject text NOT NULL,
  verified_email citext,
  last_authenticated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_subject),
  UNIQUE (person_id, provider)
);

CREATE TABLE pmec.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE CASCADE,
  role pmec.role_code NOT NULL,
  status pmec.membership_status NOT NULL DEFAULT 'invited',
  allowed_surface pmec.client_surface NOT NULL,
  granted_by_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, person_id, role),
  CHECK (
    (role = 'employee' AND allowed_surface = 'employee_mobile') OR
    (role IN ('project_manager', 'hr_manager', 'organization_admin') AND allowed_surface = 'operations_web')
  )
);

CREATE TABLE pmec.role_permissions (
  role pmec.role_code NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);

INSERT INTO pmec.role_permissions (role, permission) VALUES
  ('employee', 'assignment.read_own'),
  ('employee', 'assignment.update_own_status'),
  ('employee', 'time_log.submit_own'),
  ('employee', 'leave.request_own'),
  ('employee', 'notification.manage_own'),
  ('project_manager', 'job_order.read_assigned'),
  ('project_manager', 'work_package.manage_assigned'),
  ('project_manager', 'assignment.manage_assigned'),
  ('project_manager', 'time_log.approve_assigned'),
  ('project_manager', 'capacity.read_project'),
  ('hr_manager', 'people.read_organization'),
  ('hr_manager', 'leave.review_organization'),
  ('hr_manager', 'capacity.read_hr'),
  ('hr_manager', 'time_log.read_organization'),
  ('organization_admin', 'membership.manage'),
  ('organization_admin', 'audit.read')
ON CONFLICT DO NOTHING;

CREATE INDEX people_org_department_idx ON pmec.people (organization_id, department) WHERE active;
CREATE INDEX memberships_active_idx ON pmec.memberships (organization_id, person_id) WHERE status = 'active';
CREATE INDEX auth_identities_subject_idx ON pmec.auth_identities (provider, external_subject);
```

## PMEC Operations Schema

This second block is the production-normalized replacement for the current assignment, time-log, notification, and client-local workforce structures. Names are intentionally not copied into operational rows; relationships point to the source person/job records.

```sql
CREATE TYPE pmec.job_order_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE pmec.assignment_status AS ENUM ('assigned', 'in_progress', 'blocked', 'complete');
CREATE TYPE pmec.time_log_status AS ENUM ('submitted', 'approved', 'rejected');
CREATE TYPE pmec.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE pmec.leave_type AS ENUM ('vacation', 'sick', 'personal', 'unpaid');
CREATE TYPE pmec.notification_type AS ENUM ('assignment', 'time_approved', 'leave_decision');

CREATE TABLE pmec.job_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  client_name text,
  status pmec.job_order_status NOT NULL DEFAULT 'draft',
  project_manager_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  start_date date,
  target_end_date date,
  created_by_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE pmec.project_memberships (
  job_order_id uuid NOT NULL REFERENCES pmec.job_orders(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE CASCADE,
  project_role text NOT NULL DEFAULT 'contributor',
  can_manage boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_order_id, person_id)
);

CREATE TABLE pmec.work_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_order_id uuid NOT NULL REFERENCES pmec.job_orders(id) ON DELETE CASCADE,
  parent_work_package_id uuid REFERENCES pmec.work_packages(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  discipline text,
  due_date date,
  status pmec.assignment_status NOT NULL DEFAULT 'assigned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_order_id, code)
);

CREATE TABLE pmec.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_package_id uuid NOT NULL REFERENCES pmec.work_packages(id) ON DELETE CASCADE,
  assignee_person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE RESTRICT,
  assigned_by_person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE RESTRICT,
  status pmec.assignment_status NOT NULL DEFAULT 'assigned',
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (work_package_id, assignee_person_id)
);

CREATE TABLE pmec.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES pmec.assignments(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE RESTRICT,
  work_date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0 AND minutes <= 1440),
  note text NOT NULL,
  status pmec.time_log_status NOT NULL DEFAULT 'submitted',
  reviewed_by_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE RESTRICT,
  leave_type pmec.leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  workdays numeric(5,2) NOT NULL CHECK (workdays > 0),
  status pmec.leave_status NOT NULL DEFAULT 'pending',
  employee_note text,
  reviewer_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.notification_preferences (
  person_id uuid PRIMARY KEY REFERENCES pmec.people(id) ON DELETE CASCADE,
  assignments_enabled boolean NOT NULL DEFAULT true,
  time_approved_enabled boolean NOT NULL DEFAULT true,
  leave_decision_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE CASCADE,
  notification_type pmec.notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  route text NOT NULL,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  actor_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  request_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assignments_assignee_idx ON pmec.assignments (assignee_person_id, status, due_date);
CREATE INDEX time_logs_person_work_date_idx ON pmec.time_logs (person_id, work_date DESC);
CREATE INDEX time_logs_assignment_idx ON pmec.time_logs (assignment_id, status);
CREATE INDEX leave_requests_person_date_idx ON pmec.leave_requests (person_id, start_date, end_date);
CREATE INDEX leave_requests_status_date_idx ON pmec.leave_requests (status, start_date);
CREATE INDEX notifications_active_idx ON pmec.notifications (person_id, created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX audit_events_org_time_idx ON pmec.audit_events (organization_id, created_at DESC);
```

## Server Enforcement Flow

Every protected API procedure follows the same pattern. The server, not the client, determines `person_id`, membership role, and query scope.

```text
Clerk session token
        │
        ▼
Verify signature, issuer, audience, expiry
        │  subject = Clerk userId
        ▼
pmec.auth_identities(provider='clerk', external_subject=subject)
        │
        ▼
Active pmec.memberships + role_permissions
        │
        ▼
Authorize named permission and target organization/project/person
        │
        ▼
Execute scoped query inside a transaction and append audit event
```

Examples:

| API action | Required check | Required data scope |
|---|---|---|
| Employee reads tasks | `assignment.read_own` | `assignments.assignee_person_id = current_person_id` |
| Employee submits hours | `time_log.submit_own` | Assignment belongs to current person and is active |
| PM approves hours | `time_log.approve_assigned` | PM has `project_memberships.can_manage = true` for the job order |
| HR views leave | `leave.review_organization` | Current membership is HR in the same organization |
| HR capacity forecast | `capacity.read_hr` | Workforce/leave rows scoped to same organization |
| Admin changes roles | `membership.manage` | Never self-grant; record an audit event |

## Optional Neon RLS Defense in Depth

The primary model should be API-mediated queries. If PMEC later uses direct database access from serverless endpoints, add Neon RLS as a second control. Neon documents JWT-backed RLS integration for Clerk.[3]

At the API boundary, resolve the verified Clerk subject and set it only for the transaction:

```sql
SELECT set_config('pmec.auth_subject', :verified_clerk_subject, true);
```

Then derive the application person ID from the identity map:

```sql
CREATE FUNCTION pmec.current_person_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT ai.person_id
  FROM pmec.auth_identities ai
  WHERE ai.provider = 'clerk'
    AND ai.external_subject = NULLIF(current_setting('pmec.auth_subject', true), '')
  LIMIT 1;
$$;

ALTER TABLE pmec.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_owner_read ON pmec.notifications
  FOR SELECT
  USING (person_id = pmec.current_person_id());

CREATE POLICY notification_owner_update ON pmec.notifications
  FOR UPDATE
  USING (person_id = pmec.current_person_id())
  WITH CHECK (person_id = pmec.current_person_id());
```

Use transaction-local configuration (`set_config(..., true)`) so a pooled Neon connection cannot leak one person’s identity into another request. Add similar policies after each PMEC query has server tests. Do not rely on RLS alone before token-to-subject mapping and policy tests are operational.

## Provisioning the 34 PMEC Users

The account roster must be created by controlled invitations, not at first arbitrary login.

| Step | Action | Owner |
|---|---|---|
| 1 | Create the PMEC organization row and seed roles/permissions. | Platform administrator |
| 2 | Import 28 employee, 4 Project Manager, and 2 HR person records, preserving the current legacy employee ID. | HR data owner |
| 3 | Create memberships with `invited` status and the correct fixed role/surface. | Organization administrator |
| 4 | Send Clerk invitations to work-email addresses. | Organization administrator |
| 5 | On verified first sign-in, write the Clerk `userId` into `auth_identities` and activate the membership. | PMEC API / webhook |
| 6 | Log each invitation, activation, suspension, and role change in `audit_events`. | PMEC API |

## Migration from the Current Demonstration

1. Create a new Neon branch and apply the DDL there. Do not point the active demonstration at Neon until reconciliation succeeds.
2. Export the current workforce, PMEC assignments, time logs, notifications, notification preferences, leave requests, and job orders.
3. Populate `people.legacy_employee_id` with the current PMEC employee identifiers. Use a mapping report to prove every assignment, time log, and notification resolves to a `people.id`.
4. Load job orders, work packages, assignments, logs, leave, and notifications using foreign keys. Reject unmapped rows instead of silently dropping them.
5. Provision Clerk accounts through invitations and attach `auth_identities` only after a verified work-email match.
6. Add server procedures one role/action at a time, with denied-access tests for every cross-person or cross-project attempt.
7. Run a parallel read-only pilot, then cut over employee and operations clients behind a feature flag.

## Environment and Secret Inventory

| Variable | Purpose | Stored where |
|---|---|---|
| `DATABASE_URL` | Neon pooled application connection | Server secret |
| `DATABASE_URL_UNPOOLED` | Drizzle migrations/admin jobs | Server secret, not client |
| `CLERK_PUBLISHABLE_KEY` | Mobile/web Clerk SDK initialization | Public client configuration |
| `CLERK_SECRET_KEY` | Server verification/webhook operations | Server secret |
| `CLERK_JWT_ISSUER_DOMAIN` | Token verification issuer | Server configuration |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Validate Clerk webhooks | Server secret |
| `PMEC_OPERATIONS_ORIGIN` | Approved desktop/iPad operations origin for CORS and redirects | Server configuration |
| `PMEC_EMPLOYEE_API_CLIENT_ID` | Optional registered mobile API client identifier for telemetry and abuse controls | Server configuration |

Never expose a Neon connection string, Clerk secret, webhook secret, or unpooled migration URL in the Expo bundle. Public keys and API base URLs are the only client configuration values.

## Acceptance Criteria Before Implementation

- A user cannot choose `employee`, `project_manager`, or `hr_manager` in the client.
- A Clerk identity resolves to exactly one active PMEC person record for each provider.
- Employee requests cannot read or mutate any other employee’s work, hours, leave, or notifications.
- Project Manager approvals are limited to job orders they manage.
- HR users can review organization workforce/leave data but cannot create project work packages.
- Every role, suspension, leave decision, and time-log approval generates an audit event.
- Both mobile and operations clients receive a tested `401` for invalid sessions and `403` for valid-but-unauthorized requests.

## References

[1] [Clerk: Integrate Neon Postgres with Clerk](https://clerk.com/docs/guides/development/integrations/databases/neon)

[2] [Auth.js: Neon Adapter](https://authjs.dev/getting-started/adapters/neon)

[3] [Neon: Authenticate application users with Clerk](https://neon.com/docs/guides/auth-clerk)
