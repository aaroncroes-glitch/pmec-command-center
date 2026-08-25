# PMEC Command Center

PMEC Command Center is the PMEC workspace for employees, Project Managers, and HR managers. The mobile employee experience is delivered through Expo; the desktop/iPad Control Center provides HR and project-delivery views. Payroll is draft/review only, and server authorization requires a verified Clerk principal plus an active Neon permission.

## Repository purpose

This repository is the source of truth for the production PMEC application. It is intended to be connected to a dedicated Vercel project and kept separate from the legacy `lumen-ess` repository and the old manual demonstration deployment.

| Hostname | Intended audience | Status |
| --- | --- | --- |
| `portal.pmec.group` | Employee and shared PMEC entry | Reserved for production routing |
| `hr.pmec.group` | HR Control Center | Reserved for production routing |
| `pm.pmec.group` | Project Manager Control Center | Reserved for production routing |
| `clerk.pmec.group` | Clerk production authentication endpoint | To be configured from Clerk's production-domain records |

## Local validation

Run `pnpm check` for TypeScript validation and `pnpm test` for the deterministic test suite. Local development uses `.env.local`; that file is ignored by Git and must never be committed.

## Production boundary

The existing web client can be exported with `pnpm export:web`, but the current PMEC authorization and data API run in the Express/tRPC server under `server/`. Before any public PMEC hostname is pointed to Vercel, that server must be deployed as a Vercel-compatible serverless API or to a separate production API service, with the web build configured to use its HTTPS URL through `EXPO_PUBLIC_API_BASE_URL`.

The production API runtime must receive `CLERK_SECRET_KEY` and `NEON_DATABASE_URL` securely. The web build may receive only the live `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and public API URL. Do not reuse development Clerk keys in the public deployment.

## Authentication cutover

Clerk production setup remains a separate prerequisite. After the production Clerk instance is created interactively, use the exact custom-domain DNS record issued by Clerk for `clerk.pmec.group`, then provide the live Clerk keys only to the production deployment environment. Production Clerk users will have different subject IDs from development and must be granted PMEC memberships separately in Neon.
