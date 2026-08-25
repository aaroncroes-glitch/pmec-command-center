# PMEC Demonstration Readiness

The PMEC production deployment for commit `2c3bf88` reached **Ready** status on 25 August 2026. The corrected local role showcase is available at `https://pmec-command-center-k9b755ruc-aaron-croes-projects.vercel.app/demo`; the stable production alias remains `https://pmec-command-center.vercel.app/demo`.

The isolated `pmec-demo` Neon organization contains three dummy Clerk identity links and active role memberships, plus two demo assignments, two demo time logs, two employee notifications, and one preference record. No real personnel or payroll data was inserted. Credentials and Clerk subject identifiers are deliberately excluded from this file.

The PMEC Vercel Clerk proxy was repaired and the proxied Clerk environment endpoint returns HTTP 200. As of 25 August 2026, a real sign-in attempt for the dummy employee reaches Clerk but receives a Clerk-side HTTP 500 response. The demonstration data and accounts remain isolated; public PMEC subdomains remain unattached until this authentication service response is resolved.

The production deployment for the one-time ticket entry reached Ready at `https://pmec-command-center-fv5p7fo7p-aaron-croes-projects.vercel.app`. A browser validation exposed the temporary employee ticket in an internal browser trace and did not complete successfully; that ticket was immediately revoked. Do not issue or share another ticket until the token-consumption route is validated without credential exposure.

The local showcase is intentionally presentation-only. Employee selection completes first-run local setup before opening the mobile workspace; Project Manager and HR selection open their respective local Control Center views. The showcase does not issue Clerk sessions or production delivery/payroll authorization. The final regression suite completed with 66 passing tests and one intentional skip, and the Expo web export completed successfully.

### Clerk password diagnosis — 25 August 2026

Read-only inspection of the PMEC Clerk Production dashboard confirms that password sign-up and adding a password to an account are enabled. The production policy requires at least 15 characters and rejects compromised passwords; the existing dummy password formats satisfy the displayed length rule. Device Trust is enabled for new-device sign-ins. These settings do not explain a generic `internal_clerk_error`; the next diagnostic source is the Clerk application log for the failed Frontend API request. No settings were changed during inspection.

The Clerk application-log route loaded its shell but did not expose an event list before the browser session returned to a blank page. The application-log UI therefore did not yield a safe, actionable root-cause record in this session.

The Clerk dashboard currently lists `portal.pmec.group` as the Production primary domain with status **Checking**. A direct health probe confirms that `clerk.portal.pmec.group/v1/environment` returns HTTP 200 through the PMEC proxy path, while `portal.pmec.group` does not resolve. The proxy is therefore not returning the prior HTTP 405, but the incomplete primary-domain state remains a production-authentication dependency. Public subdomains remain intentionally unattached pending authenticated delivery acceptance.

Clerk's production guidance requires the owned application domain and its DNS records to be fully configured before production deployment, and notes that production-domain changes can require certificate, publishable-key, and redirect-URL updates. The least-risk next action is therefore **not** a code change: retain the local-only showcase and complete the `portal.pmec.group` domain cutover only after explicit approval to expose that public hostname and validate the accompanying Clerk/Vercel configuration. [Clerk production deployment guidance](https://clerk.com/docs/guides/development/deployment/production) · [Clerk domain-change guidance](https://clerk.com/docs/guides/development/deployment/changing-domains)

The required cutover approval was received on 25 August 2026. Read-only Vercel inspection confirmed that `pmec-command-center.vercel.app` was the only domain attached to the PMEC project immediately before the cutover.

The Vercel **Add Domains** dialog was opened with the Production environment selected for `portal.pmec.group`; no domain attachment was submitted before the page refreshed.

After refreshing the Vercel dialog, `portal.pmec.group` was staged for the Production environment with no redirect configured. The next action is the user-authorized attachment submission.

Vercel accepted the attachment of `portal.pmec.group` to the PMEC Production deployment on 25 August 2026. The hostname had not resolved after the first 45-second propagation check, and Vercel now reports the domain as **Invalid Configuration**. Public HTTPS and Clerk-domain validation remain pending the required DNS configuration/propagation. No demo credentials or authorization requests were submitted during this validation.

Vercel specifies that the required record is a `CNAME` with host `portal` and value `faf6a365e4617317.vercel-dns-017.com.`. The record has not yet been placed in the authoritative zone.

The `portal` CNAME was added to the Vercel-managed `pmec.group` DNS zone with a 60-second TTL. `https://portal.pmec.group`, `/demo`, and `/api/health` now return HTTP 200. Clerk reports the primary domain **Verified**, Application **2/2 Verified**, Email **3/3 Verified**, and both Frontend API and Account Portal certificates issued.

The live employee Clerk modal initializes successfully on `https://portal.pmec.group/ess/login`. Submitting only the dummy employee email advances to Clerk's password screen without the previous `internal_clerk_error`. Browser resource inspection confirms ClerkJS and sign-in requests use the verified `https://clerk.portal.pmec.group` Frontend API directly; they do not use the legacy `/__clerk` rewrite on the public portal. No password was entered or exposed during validation, so completion of a full authenticated session still requires a manual credential test by the account owner.

The final credential-free probe returned HTTP 200 for the public employee portal, PMEC API health endpoint, Clerk environment endpoint, and an empty Clerk sign-in initialization request. This verifies public routing and Clerk sign-in initialization but does not represent an authenticated user session.
