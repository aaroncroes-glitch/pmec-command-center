# PMEC Custom-Domain Readiness

PMEC’s connected Vercel account has one ready production project, currently served only on Vercel-generated temporary hostnames. The production domain is intentionally not attached yet because the final PMEC hostname has not been selected. The current managed development workspace remains the functional API and database preview; the earlier Vercel project should not be treated as a complete production deployment until its application build and runtime configuration are deliberately aligned.

| Area | Confirmed state | Required completion step |
|---|---|---|
| Vercel account | Connected to Aaron Croes’ Vercel team | Choose the exact PMEC hostname and attach it to the final production project. |
| PMEC web hostname | Not selected | Recommended pattern: `app.<domain>` or `portal.<domain>`. |
| Clerk hostname | Not selected | Recommended pattern: `clerk.<domain>` on the same root domain as PMEC. |
| Clerk environment | Development instance linked to PMEC | Create/configure the production Clerk instance and generate production `pk_live_` and `sk_live_` keys. |
| DNS | To be managed through Vercel | Add the Vercel project record and the Clerk-provided custom-domain verification record after the hostnames are selected. |

## Completion sequence

First, select the base domain and intended application hostname. Then attach that hostname to the Vercel PMEC production project and accept Vercel’s DNS instructions. Configure Clerk’s production instance with the corresponding application origin and create its custom authentication domain. Clerk will provide the exact CNAME or verification target required for that hostname; do not guess or reuse development-instance records. Finally, store the production Clerk keys through the project’s secure environment configuration, update the production redirect/origin allow-list, and validate sign-in, HR payroll authorization, and a non-HR denial on the deployed domain.

> The current Clerk development key and Neon HR membership are valid only for the linked development environment. The production custom-domain rollout requires its own production Clerk configuration and a deployment-specific acceptance test.

## Pending decision

Provide the exact PMEC domain or subdomain, for example `portal.pmec-group.com`. Once selected, the final Vercel and Clerk DNS records can be prepared and reviewed before any public cutover.

## References

[1] [Clerk: Deploying to production](https://clerk.com/docs/guides/development/deployment/production)
