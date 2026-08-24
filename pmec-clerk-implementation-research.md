# Clerk Implementation Research Notes for PMEC

Clerk’s current RBAC guide distinguishes **route gating** from **data authorization**. It demonstrates placing role metadata in the session token, checking the claim server-side for protected routes, and separately enforcing permissions at the server action or API boundary.[1] PMEC should use Clerk claims only as a fast route-gating hint and resolve the active membership from Neon for every protected business operation.

Clerk’s Expo quickstart uses `@clerk/expo`, a `ClerkProvider`, and the `tokenCache` from `@clerk/expo/token-cache`, which uses secure Expo token storage. The official flow requires enabling Clerk’s Native API and supports hosted authentication, native components, or a custom UI.[2] PMEC will use the hosted/native-supported sign-in route initially so the employee application keeps its existing Lumen visual language while Clerk owns credentials and recovery.

Clerk Organization invitations send a unique email link and can carry a role. Server-side invitation creation can also set a redirect URL, which is necessary for PMEC to take a newly invited employee into its mobile onboarding completion route. Clerk documents `clerkClient`/the Backend API for server-created invitations and recommends respecting `429` retry guidance for bulk invite workflows.[3]

## Sources

[1] [Clerk — Implement basic RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac)

[2] [Clerk — Expo Quickstart](https://clerk.com/docs/expo/getting-started/quickstart)

[3] [Clerk — Organization invitations](https://clerk.com/docs/guides/organizations/add-members/invitations)
