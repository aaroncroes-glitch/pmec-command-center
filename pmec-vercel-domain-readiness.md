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

The current Clerk application has no production instance. The next authentication step is an interactive `clerk deploy` session, where the production instance should use `portal.pmec.group` as the primary application domain and Clerk should generate the exact record for `clerk.pmec.group`. Do not add a guessed DNS value. When Clerk finishes the interactive setup, it will issue new `pk_live_` and `sk_live_` keys and report the required DNS record; the production API and Vercel environment must use those live values instead of the development credentials.

The shared Clerk Dashboard session is authenticated and lists the `pmec` application, so the remaining production-instance work can be attempted through the account dashboard without requesting credentials from the user.

## Clerk production DNS records issued for PMEC

The Clerk production instance was created for `portal.pmec.group` and issued the following records. Vercel is the active DNS provider for `pmec.group` and exposes a record-entry form. Existing CAA records already allow both Google Trust Services and Let’s Encrypt, so they do not block Clerk certificate issuance.

| Purpose | Type | Host | Value |
| --- | --- | --- | --- |
| Frontend API | CNAME | `clerk.portal.pmec.group` | `frontend-api.clerk.services` |
| Account portal | CNAME | `accounts.portal.pmec.group` | `accounts.clerk.services` |
| Email | CNAME | `clkmail.portal.pmec.group` | `mail.fhfr0mfjw99n.clerk.services` |
| DKIM | CNAME | `clk._domainkey.portal.pmec.group` | `dkim1.fhfr0mfjw99n.clerk.services` |
| DKIM | CNAME | `clk2._domainkey.portal.pmec.group` | `dkim2.fhfr0mfjw99n.clerk.services` |

All five Clerk-issued CNAME records are now present in Vercel DNS: `clerk.portal` → `frontend-api.clerk.services`, `accounts.portal` → `accounts.clerk.services`, `clkmail.portal` → `mail.fhfr0mfjw99n.clerk.services`, `clk._domainkey.portal` → `dkim1.fhfr0mfjw99n.clerk.services`, and `clk2._domainkey.portal` → `dkim2.fhfr0mfjw99n.clerk.services`. Clerk DNS propagation and certificate issuance can now proceed.

The Clerk production Domains page is accessible in the authenticated dashboard, but the automation browser intermittently resets after navigation. The CLI status is therefore the authoritative verification source for this rollout. Its latest result confirms DNS completion, while SSL and the email-related DNS checks are still provisioning.

The Google Cloud Console is now authenticated as the PMEC owner. Its selected default project is unrelated to PMEC, so any optional Google OAuth connection should be created in a dedicated PMEC Google Cloud project rather than reusing that default workspace.

The dedicated `PMEC Command Center` Google Cloud project has been created under the `raiaaruba.com` organization. It will be used only for PMEC’s optional Google OAuth client and must be selected in the console before creating credentials.

Google Cloud confirms the project-creation activity, but the browser remained on the unrelated default project after creation. The next OAuth step requires selecting the new PMEC project in the Google Cloud project picker.

The default-project selector is present and accessible in the Google Cloud Console, confirming that the PMEC project can be selected through the project picker rather than by reusing the default workspace.

The Google Cloud project picker confirms the PMEC project identifier is `pmec-command-center`.

The project picker remains open with `PMEC Command Center` available as a non-current project. It must be selected before Google OAuth credentials can be configured.

The PMEC project is the first interactive table row in the Google Cloud project picker and is identified by `pmec-command-center`.

The project picker remains active, so PMEC has not yet become the selected Google Cloud project. OAuth configuration remains blocked until the picker completes the project switch.

The Google Cloud Console is now selected on the dedicated `PMEC Command Center` project (`pmec-command-center`), so any OAuth consent and client configuration will be isolated from the default project.

Clerk’s production SSO Connections page shows Google as the existing social provider with setup still required. The provider configuration is ready to supply the authorized redirect URI and accept the custom Google OAuth credentials.

The provider remains in the Clerk SSO Connections list pending its setup view; no Google credential has been entered or saved yet.

Clerk requires the exact Google OAuth redirect URI `https://clerk.portal.pmec.group/v1/oauth_callback`. The dedicated Google Auth Platform workspace for project `pmec-command-center` is open and ready to create the corresponding web OAuth client.

Google’s OAuth consent workflow requires PMEC application branding, a support email, an audience designation, and contact details before an OAuth client can be created.

The consent workflow exposes `aaroncroes@raiaaruba.com` as the available PMEC owner support-contact option.

The consent workflow now requires an audience designation. PMEC needs the **External** audience because its workforce includes contractors and is not limited to the `raiaaruba.com` Google Workspace organization. Google will initially place this configuration in testing until it is published according to Google’s requirements.

The External audience has been selected. Google now requires a configuration-contact email before the consent configuration can be created.

The required owner contact has been added. Google now presents the Google API Services User Data Policy agreement immediately before creating the PMEC OAuth consent configuration.

The user authorized acceptance and the policy was reviewed. The consent form must be reopened to tick its agreement control and create the PMEC OAuth consent configuration.

The browser reset while returning to the Google consent form, so the policy acceptance and consent-screen creation remain pending despite the user’s authorization.

Reopening the Google consent workflow confirms that incomplete consent-screen fields are not preserved across the browser reset. The PMEC app name, support contact, external audience, configuration contact, and policy agreement must be re-entered in one uninterrupted session before creation.

The restarted workflow now has the `PMEC Command Center` application name restored and the PMEC owner support-contact selector open.

The PMEC owner support contact has been restored, and the restarted workflow is again at the External-audience selection step.

The External audience has been restored, and the restarted workflow is now at the required configuration-contact step.

The PMEC owner configuration contact has been restored, and the consent workflow is again at the user-authorized Google API Services policy-agreement stage.

The user-authorized Google API Services policy agreement has been accepted in the PMEC consent workflow. The consent configuration is ready to be created.

The PMEC Google OAuth consent configuration has been submitted and is processing under the dedicated Google Cloud project.

Google confirms that the PMEC OAuth consent configuration was created. The dedicated project has now opened the production web OAuth client-creation flow.

The PMEC Google OAuth client will use Google’s **Web application** type because Clerk’s production redirect URI is HTTPS and hosted at `clerk.portal.pmec.group`.

The dedicated web client is named `PMEC Command Center — Clerk Production`. Its authorized JavaScript origins will be `https://portal.pmec.group`, `https://hr.pmec.group`, and `https://pm.pmec.group`; its only authorized redirect URI will be Clerk’s exact `https://clerk.portal.pmec.group/v1/oauth_callback`.

The shared portal origin `https://portal.pmec.group` has been entered as the first JavaScript origin for the PMEC Google OAuth web client.

The HR Control Center origin `https://hr.pmec.group` has been entered as the second JavaScript origin for the PMEC Google OAuth web client.

The Project Manager Control Center origin `https://pm.pmec.group` has been entered as the third JavaScript origin for the PMEC Google OAuth web client.

The exact Clerk callback `https://clerk.portal.pmec.group/v1/oauth_callback` has been entered as the sole authorized redirect URI. The PMEC Google OAuth web client is now configured and ready to create.

The PMEC Google OAuth web client has been submitted to Google Cloud. Credential generation is in progress; its client secret will be kept out of source control and handled only through secure configuration.

Google Cloud is now reloading the PMEC client list to confirm completion of the submitted web-client creation.

The Google client list now confirms creation of `PMEC Command Center — Clerk Production` as a Web application. Its credential detail page is opening for secure Clerk-provider configuration.

Google confirms the PMEC client has an enabled, masked client secret. Google no longer permits viewing that existing secret and prevents creation of a third secret; completing Clerk configuration now requires deleting an existing unused secret and regenerating one for immediate secure transfer.

An enabled replacement secret is now available for the PMEC client and has been copied only to the active browser clipboard for immediate entry into Clerk. Its value is not recorded in this repository or project documentation.

The PMEC Google OAuth client ID has been entered in Clerk’s production Google-provider form. The replacement client secret remains only in the active browser clipboard awaiting direct paste into Clerk.

Clerk’s production client-secret field is now focused and ready for the secure in-browser clipboard transfer.

The browser’s standard clipboard-paste path did not complete the secure transfer, so the generated secret remains reserved for immediate direct entry into Clerk and will not be persisted in source control.

The authorized replacement secret has been entered directly into Clerk’s production Google-provider form. Clerk recognizes both credentials and its save action is enabled; no secret value has been added to source control or project documentation.

Clerk has saved the PMEC production Google provider successfully. The provider no longer reports setup required, has no unsaved changes, and retains a configured client secret without exposing its value.

Google’s PMEC OAuth consent configuration remains in **Testing**. Its Audience page requires additional Branding information before the application can be published for the external PMEC workforce; until publication, access is limited to explicitly added Google test users.

Google requires an application home page, public privacy-policy link, and public terms-of-service link before it will publish PMEC’s External OAuth application. `pmec.group` is already authorized, but these URLs must exist on a deployed PMEC host before they can be entered; the Google client will remain in Testing until that controlled web deployment is available.

The repository now includes `/privacy` and `/terms` public legal routes, host-aware client routing for `portal.pmec.group`, `hr.pmec.group`, and `pm.pmec.group`, and a Vercel catch-all API entry that exports the existing Express/tRPC application. Payroll authorization remains in the server router and its Neon/Clerk validation; hostname routing is only an additional interface boundary. Vercel’s production environment still needs the live Clerk and Neon values before a deployment can be tested.

The existing Expo web export is static, while PMEC payroll authorization and operational data APIs are currently served by the Express/tRPC runtime. The three public hostnames must remain unattached until the API has a production-compatible deployment and `EXPO_PUBLIC_API_BASE_URL` points to its HTTPS endpoint. This prevents the new subdomains from exposing a non-functional interface or weakening the existing server-side authorization boundary.

Vercel’s MCP registration quote expired twice before order submission despite renewed confirmation. The next safe path is Vercel’s authenticated Domains dashboard, where the user can complete the registration directly and its purchase workflow can retain control of the payment and registration state.

The previous Vercel project browser view became stale during the handoff, so the Domains dashboard will be reopened directly for the remaining registration workflow.

After the user completed the registration manually, the shared automation browser no longer retained its Vercel session. The user-confirmed purchase therefore remains the source of truth until a read-only Vercel account query or a renewed browser session confirms the managed-domain entry.

The Vercel browser session continues to reset to a blank page after automation handoffs. Direct browser routes can still be reopened when needed, but the remaining DNS configuration should be treated as a controlled user-dashboard action unless a stable interactive session is available.

## References

[1] [Clerk: Deploying to production](https://clerk.com/docs/guides/development/deployment/production)
