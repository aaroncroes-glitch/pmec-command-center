-- PMEC Command Center showcase demo sync.
--
-- portal., hr. and pm.pmec.group are separate browser origins, so browser storage cannot carry
-- a leave request from the employee's phone to HR's laptop. This table is the one copy every
-- device reads and writes while the showcase runs (server/pmec-demo-sync.ts).
--
-- It holds unauthenticated DEMO data only and never touches the delivery tables. The checks
-- repeat the API's own limits so the database refuses anything else even if the API did not:
-- only the two showcase workspaces, a slug room code, and a bounded payload.
--
-- Apply with an owner role. The runtime role gets exactly what the store uses — SELECT to
-- read, INSERT and UPDATE for the atomic upsert — and, as with delivery, no DELETE.

CREATE TABLE IF NOT EXISTS pmec.demo_state (
  room text NOT NULL CHECK (room ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  key text NOT NULL CHECK (key IN ('lumen.pmec.control-center.v2', 'lumen.pmec.job-orders.v2')),
  value jsonb NOT NULL CHECK (octet_length(value::text) <= 1000000),
  version integer NOT NULL CHECK (version >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room, key)
);

GRANT USAGE ON SCHEMA pmec TO pmec_runtime_20260825;
GRANT SELECT, INSERT, UPDATE ON TABLE pmec.demo_state TO pmec_runtime_20260825;
