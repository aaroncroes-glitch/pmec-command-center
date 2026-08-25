-- PMEC Command Center delivery persistence migration.
-- Legacy MySQL remains untouched. These tables become the Vercel-reachable
-- source of truth for PMEC shared assignments, time logs, and inbox updates.

CREATE TABLE IF NOT EXISTS pmec.delivery_assignments (
  id text PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  job_order_id text NOT NULL,
  job_order_title text NOT NULL,
  task_id text NOT NULL,
  task_title text NOT NULL,
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  discipline text NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'blocked', 'complete')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  assigned_by text NOT NULL,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_assignments_org_updated_idx
  ON pmec.delivery_assignments (organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS delivery_assignments_employee_updated_idx
  ON pmec.delivery_assignments (organization_id, employee_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS pmec.delivery_time_logs (
  id text PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  assignment_id text NOT NULL REFERENCES pmec.delivery_assignments(id) ON DELETE RESTRICT,
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  job_order_id text NOT NULL,
  task_id text NOT NULL,
  work_date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes BETWEEN 15 AND 960),
  note text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_time_logs_org_work_date_idx
  ON pmec.delivery_time_logs (organization_id, work_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS delivery_time_logs_employee_work_date_idx
  ON pmec.delivery_time_logs (organization_id, employee_id, work_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS delivery_time_logs_assignment_idx
  ON pmec.delivery_time_logs (assignment_id);

CREATE TABLE IF NOT EXISTS pmec.delivery_notifications (
  id text PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('assignment', 'time_approved')),
  title text NOT NULL,
  body text NOT NULL,
  route text NOT NULL,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_notifications_employee_inbox_idx
  ON pmec.delivery_notifications (organization_id, employee_id, archived_at, created_at DESC);

CREATE TABLE IF NOT EXISTS pmec.delivery_notification_preferences (
  organization_id uuid NOT NULL REFERENCES pmec.organizations(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  assignments_enabled boolean NOT NULL DEFAULT true,
  time_approved_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, employee_id)
);

GRANT USAGE ON SCHEMA pmec TO pmec_runtime_20260825;
GRANT SELECT, INSERT, UPDATE ON TABLE
  pmec.delivery_assignments,
  pmec.delivery_time_logs,
  pmec.delivery_notifications,
  pmec.delivery_notification_preferences
TO pmec_runtime_20260825;
