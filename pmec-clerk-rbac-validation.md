# Clerk RBAC, Schema, and Onboarding Validation

The Clerk-first guide was reviewed against the working PMEC demonstration’s employee task/time/leave/notification flows and PM/HR delivery/workforce controls. The guide maintains the current functional split while replacing the demo-only role selector with a server-derived Clerk identity and Neon membership principal.

The Neon review schema contains the required identity mapping, fixed roles, named permissions, role-bound product surfaces, invitation lifecycle, onboarding state, and audit trail. It permits one active invitation per person/role while allowing a revoked or expired invitation to be resent. The SQL is a review draft for a new Neon development branch; it has not been executed against a live database.

The employee onboarding storyboard validates controlled email invitation, Clerk verification, atomic membership activation, preferences setup, employee-only navigation, and safe recovery states. The Next.js patterns are explicitly reference code; the current PMEC project remains Expo plus tRPC until the user elects to connect Clerk and Neon credentials.
