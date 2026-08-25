-- PMEC Command Center: Clerk-first Neon Postgres access schema
-- REVIEW DRAFT ONLY. Apply to a Neon development branch after the Clerk
-- organization and pilot roster are confirmed. This file creates no accounts.

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
CREATE TYPE pmec.invitation_status AS ENUM ('pending', 'sent', 'accepted', 'revoked', 'expired');

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
  department text NOT NULL,
  job_title text NOT NULL,
  is_employee boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, work_email),
  UNIQUE (organization_id, legacy_employee_id)
);

-- Maps Clerk's immutable user ID (for example, user_...) to one PMEC person.
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
  activated_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, person_id, role),
  CHECK (
    (role = 'employee' AND allowed_surface = 'employee_mobile') OR
    (role IN ('project_manager', 'hr_manager', 'organization_admin')
      AND allowed_surface = 'operations_web')
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
  ('hr_manager', 'payroll.review'),
  ('organization_admin', 'membership.invite_employee'),
  ('organization_admin', 'membership.manage'),
  ('organization_admin', 'audit.read')
ON CONFLICT DO NOTHING;

-- One controlled invitation for a person/role at a time. The Clerk invitation
-- remains the delivery mechanism; this record is PMEC's authorization binding.
CREATE TABLE pmec.auth_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES pmec.people(id) ON DELETE CASCADE,
  requested_role pmec.role_code NOT NULL,
  email citext NOT NULL,
  clerk_invitation_id text UNIQUE,
  status pmec.invitation_status NOT NULL DEFAULT 'pending',
  invited_by_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  redirect_path text NOT NULL DEFAULT '/accept-invitation',
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.onboarding_progress (
  person_id uuid PRIMARY KEY REFERENCES pmec.people(id) ON DELETE CASCADE,
  invitation_id uuid REFERENCES pmec.auth_invitations(id) ON DELETE SET NULL,
  profile_confirmed_at timestamptz,
  notification_preferences_confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pmec.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  actor_person_id uuid REFERENCES pmec.people(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX memberships_active_principal_idx
  ON pmec.memberships (organization_id, person_id)
  WHERE status = 'active';
CREATE INDEX auth_identities_subject_idx
  ON pmec.auth_identities (provider, external_subject);
CREATE INDEX invitations_action_idx
  ON pmec.auth_invitations (organization_id, status, email);
CREATE UNIQUE INDEX invitations_one_open_role_idx
  ON pmec.auth_invitations (organization_id, person_id, requested_role)
  WHERE status IN ('pending', 'sent');
CREATE INDEX audit_events_org_time_idx
  ON pmec.audit_events (organization_id, created_at DESC);

-- Example principal lookup used by every PMEC API procedure after the Clerk
-- token is verified by the server. Pass $1 = Clerk user ID and $2 = org ID.
--
-- SELECT p.id AS person_id, m.organization_id, array_agg(rp.permission) AS permissions
-- FROM pmec.auth_identities ai
-- JOIN pmec.people p ON p.id = ai.person_id AND p.active
-- JOIN pmec.memberships m ON m.person_id = p.id AND m.status = 'active'
-- JOIN pmec.role_permissions rp ON rp.role = m.role
-- WHERE ai.provider = 'clerk' AND ai.external_subject = $1
--   AND m.organization_id = $2
-- GROUP BY p.id, m.organization_id;
