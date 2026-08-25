-- Apply after creating the login role and storing its connection string only as
-- PMEC_IDENTITY_ADMIN_DATABASE_URL. This role is intentionally separate from
-- the delivery runtime and cannot access payroll scenario data.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pmec_identity_admin_20260825') THEN
    GRANT USAGE ON SCHEMA pmec TO pmec_identity_admin_20260825;
    GRANT SELECT, INSERT, UPDATE ON TABLE
      pmec.people,
      pmec.auth_identities,
      pmec.memberships,
      pmec.audit_events
    TO pmec_identity_admin_20260825;
  END IF;
END
$$;
