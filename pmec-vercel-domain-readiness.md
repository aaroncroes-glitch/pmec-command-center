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

## Current PMEC domain decision

The approved target is `pmec.group`, with `portal.pmec.group` for the shared PMEC portal, `hr.pmec.group` for the HR workspace, and `pm.pmec.group` for project-manager access. The existing `pmec-control-center-demo-preview` Vercel project is ready but is a manual demonstration deployment; it must not receive production traffic until the production build, Clerk production instance, and database runtime configuration have been deliberately connected.

`pmec.group` is now active and Vercel-managed, with Vercel CDN nameservers active and automatic renewal enabled. The PMEC source is preserved in the private [PMEC Command Center repository](https://github.com/aaroncroes-glitch/pmec-command-center) and connected to the dedicated Vercel project `pmec-command-center`. No deployment or custom domain is attached to that project yet. Assigning the public subdomains now would still route an unsuitable build because the current server-enforced API needs a production-compatible runtime and environment configuration first.

Vercel’s MCP registration quote expired twice before order submission despite renewed confirmation. The next safe path is Vercel’s authenticated Domains dashboard, where the user can complete the registration directly and its purchase workflow can retain control of the payment and registration state.

The previous Vercel project browser view became stale during the handoff, so the Domains dashboard will be reopened directly for the remaining registration workflow.

After the user completed the registration manually, the shared automation browser no longer retained its Vercel session. The user-confirmed purchase therefore remains the source of truth until a read-only Vercel account query or a renewed browser session confirms the managed-domain entry.

The Vercel browser session continues to reset to a blank page after automation handoffs. Direct browser routes can still be reopened when needed, but the remaining DNS configuration should be treated as a controlled user-dashboard action unless a stable interactive session is available.

## References

[1] [Clerk: Deploying to production](https://clerk.com/docs/guides/development/deployment/production)
