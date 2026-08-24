# PMEC Authentication and Neon Research Notes

## Current PMEC Constraint

The running PMEC demonstration currently has only client-persisted `pm` and `hr` role selection. Project Manager permissions are delivery, assignment, capacity, and hours approval; HR permissions are workforce, leave review, HR planning, and read-only hours. Employee access is represented separately through employee identifiers in assignments, time logs, notifications, and preferences. The production design must convert this into verified identity-to-membership authorization at the API and database layers.

## Official Integration Findings

Clerk’s Neon guide shows a straightforward pattern: require authentication on application and API routes, keep the Neon connection string and Clerk keys in server-side environment variables, and use Clerk’s verified `userId` as the stable identity value stored by the application schema.[1] Neon documents a Clerk integration and positions JWT-backed Row-Level Security as an optional database-authorization layer.[2]

Auth.js also supports Neon through its official adapter. In that approach, Auth.js owns the authentication tables for users, provider accounts, sessions, and verification tokens; PMEC-specific roles and workforce data remain application-owned.[3] The Auth.js documentation notes that the project is now part of Better Auth, which is relevant for long-term platform choice.[3]

## Source Links

[1] [Clerk — Integrate Neon Postgres with Clerk](https://clerk.com/docs/guides/development/integrations/databases/neon)

[2] [Neon — Authenticate application users with Clerk](https://neon.com/docs/guides/auth-clerk)

[3] [Auth.js — Neon Adapter](https://authjs.dev/getting-started/adapters/neon)
