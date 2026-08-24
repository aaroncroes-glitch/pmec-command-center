# PMEC Clerk/Auth.js and Neon Design Validation

The production design was checked against the current PMEC demonstration’s client-only PM/HR role model and its shared assignment, time-log, notification, leave, workforce, and capacity workflows. The schema maps all current employee identifiers through `people.legacy_employee_id`, then replaces duplicated names in operational records with foreign-key relationships.

The authorization matrix preserves employee self-service boundaries, PM project-delivery authority, and HR workforce/leave authority. It also requires server-side permission checks and scoped queries, replacing the current local demonstration role switcher as the security boundary. The design explicitly treats mobile versus desktop presentation as a routing/product policy—not a trust signal—and keeps authorization tied to verified identity, membership, permission, and data scope.

The documented rollout uses controlled invitations for 28 employees, four Project Managers, and two HR Managers; a parallel read-only migration; denied-access test cases; audit events; and a feature-flagged cutover. No production database, credentials, users, or live role changes were created as part of this design draft.
