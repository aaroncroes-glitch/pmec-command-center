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

The validated production-readiness checkpoint has been pushed to the private `aaroncroes-glitch/pmec-command-center` repository and triggered a new Git deployment in Vercel. The Vercel connector’s deployment-list endpoint returns a permissions error, but the authenticated dashboard confirms the build is in progress.

The browser session reset while monitoring that build. No deployment setting or domain assignment was changed by the reset.

The Git deployment completed successfully and is marked Ready in Vercel. Its initial `/api/health` request, however, returned a serverless-function invocation error; no PMEC public domain has been attached while the runtime failure is investigated.

The Vercel dashboard log view also reset the browser session before it returned the function stack trace, so runtime logs will be retrieved through an alternate Vercel project path or addressed through the stateless API bootstrap.

The deployment-specific runtime-log view is now accessible and identifies the failing resource as `/api/[...path]`; log rows are still loading and have not yet provided the exception text.

The runtime log identified a CommonJS `require()` failure for the ESM-only `jose` module inside the legacy session SDK. The SDK now loads `jose` lazily through a cached dynamic import, preserving the same session-signing and verification logic while allowing Vercel’s generated CommonJS function bundle to initialize. TypeScript and the complete deterministic suite pass after this correction; a new Git deployment must still prove `/api/health` at runtime.

The corrected commit has been pushed and triggered a new Vercel production deployment. The browser reset while that deployment was building; no domain, environment, or deployment setting was changed.

The corrected deployment URL is reachable but remains in Vercel’s build stage, so its API health endpoint cannot yet be validated.

The corrected deployment now returns a successful `/api/health` response. Accessing Vercel’s Environment Variables settings redirected the sandbox browser to Vercel login, so production-variable entry is paused pending restoration of the authenticated browser session.

The authenticated Vercel environment settings are now available. Vercel supports importing a `.env` file directly into the Production environment, allowing a purpose-built handoff file containing only PMEC’s required live Clerk and Neon values to be entered without printing secrets in chat or source control.

The authenticated Clerk CLI has retrieved the live production Clerk keys into a private local handoff file, and the PMEC Neon access-control URL has been combined into a second private, ignored import file. No value has been printed or committed. Vercel’s import control is open and awaiting secure file selection.

The Vercel import dialog exposes a file input, but the browser uploader could not bind to the dialog and reset the browser session. The retrieved production configuration remains in private local handoff files while an alternate secure entry method is used.

An alternate clipboard-assisted entry method was prepared without exposing configuration values, but the Vercel browser session again reset to its login state before the paste could occur.

The authenticated Vercel session subsequently recovered and returned to the Production environment form. The scope remains set to Production; at that point the dashboard reported no saved project environment variables.

The authenticated form remains available. The automated clipboard shortcut is translated to a platform shortcut that does not paste the private import file; only a stray literal key entered in the empty key field, and no configuration value was exposed or saved.

A browser clipboard-read attempt timed out without transferring data. Vercel still reports no saved project environment variables, and the displayed key field contains only the non-sensitive stray character; no secret was entered or persisted.

The browser cannot reach the sandbox’s loopback network, so the local-only secure handoff bridge timed out. Its response was never received by Vercel; no value was transferred or saved.

Because an uncommitted Clerk secret appeared in a browser inspection, the production instance’s key-rotation workflow was initiated. A replacement key was created with a dedicated Vercel-production name, while the pre-existing key remains active until Vercel has been redeployed and verified with the replacement.

The Clerk verification code was completed by the account holder. The new dedicated Vercel-production secret key was created and copied into the protected browser clipboard; its value was not displayed or committed. The exposed predecessor remains active solely to support the documented zero-downtime verification sequence.

The Vercel page requests clipboard-read permission, but the automated read did not resolve within the browser-operation timeout. No rotated key value was transferred or saved in Vercel through that path.

The Vercel Production form has been reopened with `CLERK_SECRET_KEY` selected as a Secret-type variable. The replacement value is still pending a secure in-browser transfer, and no variable has been saved.

The new key was moved through a short-lived in-browser handoff with its shape and length validated only; the value itself was not returned, printed, or committed. It is ready to be inserted into Vercel’s pending Secret-type Production variable and immediately cleared from the handoff.

The replacement key was inserted into Vercel as `CLERK_SECRET_KEY` with Secret protection. The temporary browser handoff was cleared immediately after insertion; the Vercel form has not yet been saved.

A second Vercel Production variable row has been prepared for `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`. The protected replacement secret remains present in the unsaved form.

The unsaved Vercel form containing the rendered replacement was explicitly discarded. Vercel again reports no saved project environment variables.

The rendered replacement key remains listed in Clerk but has never been placed in Vercel. Its deletion is pending a refreshed dashboard interaction; the original key remains active solely to avoid service interruption until a final clean replacement is deployed and verified.

Clerk’s confirmation dialog is now open for the exposed replacement key. Although Clerk records a recent use timestamp, the key was never saved to Vercel or deployed by PMEC; it will be deleted before the final clean key is generated.

The exposed, unused replacement key has been deleted from Clerk. Only the original production key remains active while the final clean Vercel-specific replacement is created and safely deployed.

Creation of the final clean Vercel-specific production key has been requested. Its value will not be rendered through browser inspection; after Clerk’s account verification, it will be moved directly into Vercel through the controlled non-rendering handoff.

Clerk created the final named Vercel-production key. A non-rendering copy control is available, and the next step is to transfer that value directly to Vercel without a page inspection that could display it.

The final clean key was validated only by shape and moved to a transient in-browser handoff. Vercel’s empty Production environment form is open and ready for the non-rendering insertion; no value has been saved.

The final clean key was inserted in Vercel as the protected `CLERK_SECRET_KEY` and its transient handoff was cleared. A second row has been added for the Clerk publishable key; the Vercel form remains unsaved.

The Vercel Production form now prepares `CLERK_SECRET_KEY`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `NEON_DATABASE_URL`. The Neon value was retrieved through the connected PMEC Neon project and inserted through a private clipboard transfer; no value has been printed or saved yet.

Vercel received the verified three-variable Production configuration. The request was submitted only after confirming all three names, values present, and expected key/connection formats without exposing any value; the dashboard is now being checked for persisted variable names and the required redeployment.

Vercel correctly rejected the mixed form because `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` cannot use Secret visibility. The final configuration will be stored safely in two stages: protected Secret variables for `CLERK_SECRET_KEY` and `NEON_DATABASE_URL`, followed by a Config-variable entry for the public publishable key.

The final clean Clerk secret was preserved only in a transient browser handoff before closing the invalid mixed-visibility form. The form is being discarded so no invalid or exposed variable is saved; the handoff will be cleared once the corrected Secret-only submission is complete.

The invalid form was discarded, and a new Vercel Production environment form is open for the corrected Secret-only submission. No project variable is currently saved.

The corrected form now contains only `CLERK_SECRET_KEY` and `NEON_DATABASE_URL`, each with a present value and the expected non-sensitive format check. The final Clerk handoff has been cleared; the verified Secret-only submission is ready to save.

The Secret-only form was submitted, but Vercel has not yet transitioned back to the variable list. The form remains open, so its non-sensitive validation state is being diagnosed before any retry.

Vercel reported that no variables were created, which indicates the earlier programmatic field updates did not reach its managed form state. A browser-clipboard retry timed out on permission handling and did not submit data; the next step is a controlled React-compatible input event using the values already present in the unsaved form.

The values were committed through native React-compatible input and change events, then the corrected Secret-only form was resubmitted. Vercel’s persisted list is now being checked by variable name only.

Vercel continued to report no created variables after the first compatible commit. A second non-rendering commit refreshed the framework’s internal value trackers for both protected rows; the current form still contains the expected names and value lengths and is ready for one final save retry.

The tracker-based save retry also returned Vercel’s non-sensitive “No environment variables were created” response. No protected values were saved or exposed. The remaining safe diagnostic is to invoke the form’s own managed change handlers rather than only manipulating DOM inputs.

The form exposes its managed change handlers for both variable names and values. Those handlers have now been invoked directly with the existing protected field instances; the final Secret-only submission can be retried without exposing any value.

Vercel again returned “No environment variables were created” after its managed handlers were invoked. The browser form cannot safely accept programmatic secret insertion in this session, so the secure fallback is to use the authenticated Vercel CLI with the already linked PMEC project rather than repeating the browser action.

The final Clerk key was never saved to Vercel or used by the deployment, but browser output rendered it during the failed form attempt. Clerk’s deletion confirmation is open and will remove this unused key before a clean replacement is generated through a non-rendering path.

The deletion request for the unused exposed Clerk key has been submitted. The final Production credential will not be regenerated until its removal is confirmed and a non-rendering Vercel configuration path is available.

Clerk requires a fresh email verification code before it will complete deletion of the exposed unused key. The verification dialog is open; no replacement key will be created until this revocation succeeds.

After the user completed Clerk verification, the exposed unused key was removed. The PMEC Neon access-control schema was also verified; the runtime authorization query requires read access only to `pmec.auth_identities`, `pmec.people`, `pmec.memberships`, and `pmec.role_permissions`. A fresh least-privilege Neon role will replace the exposed owner-level connection credential.

The Neon containment work is complete. A new `pmec_runtime_20260825` role has read-only access to the authorization tables required by the payroll check, with no insert, update, or delete rights. The former owner-level connection was invalidated successfully, and the replacement runtime connection has been retained only as a private transient handoff.

Vercel’s project variable list confirms that `CLERK_SECRET_KEY` and `NEON_DATABASE_URL` were persisted despite the form’s misleading “No environment variables were created” toast. Those entries now hold invalidated credentials and must be replaced before any redeployment. The authenticated dashboard’s non-rendering API route is available at `/api/v9/projects/pmec-command-center/env`, so the clean replacement will be applied by direct authenticated request rather than through the browser form.

The authenticated Vercel API returned non-sensitive IDs for the two stale Secret variables, and the official edit contract supports `PATCH /v9/projects/{idOrName}/env/{id}`. Clerk now lists only its untouched default key, so a clean Vercel-specific replacement can be created and transferred directly to the authenticated Vercel API without reopening the variable form.

The browser reset to a blank page while opening Clerk’s replacement-key dialog. No key was created and no credential changed; the authenticated Clerk page will be reopened before continuing the clean direct-API handoff.

The authenticated Clerk page was restored and the new-key dialog is open. The replacement will be named for Vercel’s direct API handoff and will not be rendered in a browser page or form after creation.

The clean Vercel-specific key creation request has been submitted. The next step is to complete any Clerk verification requirement, then move the generated key straight into the authenticated Vercel API request without returning it in a browser result.

The browser tool rendered the newly created key despite the planned direct handoff, so it is not safe to use. Its deletion confirmation is open and will revoke it immediately; no further browser-based key generation will be attempted in this task.

The second rendered key’s revocation request has been submitted. Clerk may require an email verification code before completing the deletion; the app remains intentionally undeployed with no PMEC subdomains attached.

The additional rendered key has been revoked; Clerk again lists only the untouched default key. Browser-visible key creation is now prohibited for this rollout. A future replacement must be created and handed to Vercel through a non-rendering API-level process, otherwise the public-domain rollout remains paused.

The most recent key is confirmed revoked, leaving only the pre-existing default Clerk key. An authenticated Dashboard API path for Clerk key management is being evaluated by metadata and header contract only; no dashboard session token or key value has been exported.

Vercel’s same-origin direct API successfully created the plain Production `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`. Its two existing sensitive variable records remain in place, with `visibility: secret`, but the first replacement `PATCH` returned HTTP 400. The metadata confirms the records’ stable IDs and target, so the next safe step is to refine the API payload against the dashboard’s own edit request rather than using the rendered form.

Vercel’s validation response confirms that a Sensitive Environment Variable’s key cannot be changed. The existing records already have the required names, so the corrected direct request will update their values only, retaining the existing key, type, visibility, and target.

The corrected value-only updates returned HTTP 200 for both Production Secret records. Metadata confirms all three required variable names are present: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is plain, while `CLERK_SECRET_KEY` and `NEON_DATABASE_URL` remain protected Sensitive/Secret records. Vercel appropriately does not return protected values in the metadata response; the successful update responses are the verification. A new Production deployment can now consume the clean configuration.

The latest Production deployment is the corrected jose runtime import from `main` (`3f87184`). Its deployment actions will be used to trigger a configuration-only redeploy; no new source commit is needed.

After a transient browser reset, the authenticated Vercel deployment page was restored. The latest ready Production deployment remains `422J4hzNht3XghTffD12VG9xBWwc` for commit `3f87184` and is queued for a configuration-only redeploy.

The latest deployment’s action menu exposes the expected Redeploy action. The browser’s menu-item wrapper did not persist the selection, so the dashboard’s native Redeploy handler will be invoked instead; this remains a source-preserving configuration-only redeploy.

The Vercel deployment-create API accepted the authenticated request path but rejected the dashboard URL identifier as `deployment_not_found`. The deployment’s canonical API identifier will be retrieved from metadata before retrying; no new deployment was created.

Vercel metadata resolved the canonical deployment ID, and a forced Production redeploy was successfully created. The new deployment is `dpl_5uudWzSmCX4JNyN97HCrFiQdrnf5` at `pmec-command-center-8euhkym2z-aaron-croes-projects.vercel.app`, initially in `INITIALIZING`; it is the first build configured to consume the clean Clerk key, restricted Neon runtime credential, and public Clerk key.

The new deployment progressed to `BUILDING`. A stale dashboard confirmation dialog was dismissed to prevent a duplicate redeploy; only the authenticated API-created deployment remains active.

The deployment remains in `BUILDING` after two status checks and has not reported an error. The build will continue to be monitored before any live API or domain action is taken.

The new Production deployment reached `READY`. Its `/api/health` endpoint returns `ok: true`, and an unauthenticated request to `pmecPayroll.access` returns a clean `401 UNAUTHORIZED` Clerk sign-in requirement rather than payroll data or a server error. This verifies the deployed payroll route fails closed for unsigned callers.

The existing Expo web export is static, while PMEC payroll authorization and operational data APIs are currently served by the Express/tRPC runtime. The three public hostnames must remain unattached until the API has a production-compatible deployment and `EXPO_PUBLIC_API_BASE_URL` points to its HTTPS endpoint. This prevents the new subdomains from exposing a non-functional interface or weakening the existing server-side authorization boundary.

Vercel’s MCP registration quote expired twice before order submission despite renewed confirmation. The next safe path is Vercel’s authenticated Domains dashboard, where the user can complete the registration directly and its purchase workflow can retain control of the payment and registration state.

The previous Vercel project browser view became stale during the handoff, so the Domains dashboard will be reopened directly for the remaining registration workflow.

After the user completed the registration manually, the shared automation browser no longer retained its Vercel session. The user-confirmed purchase therefore remains the source of truth until a read-only Vercel account query or a renewed browser session confirms the managed-domain entry.

The Vercel browser session continues to reset to a blank page after automation handoffs. Direct browser routes can still be reopened when needed, but the remaining DNS configuration should be treated as a controlled user-dashboard action unless a stable interactive session is available.

## Approved Neon delivery migration

The approved migration retains legacy MySQL as a separate reference system and creates a Vercel-reachable Neon source of truth for PMEC Command Center delivery operations. The `pmec.delivery_assignments`, `pmec.delivery_time_logs`, `pmec.delivery_notifications`, and `pmec.delivery_notification_preferences` tables now exist with organization scoping, integrity checks, and read-path indexes. The least-privilege `pmec_runtime_20260825` role was verified to hold only the required delivery read/write privileges, while the existing payroll authorization lookup remains read-only and server-enforced.

## References

[1] [Clerk: Deploying to production](https://clerk.com/docs/guides/development/deployment/production)
