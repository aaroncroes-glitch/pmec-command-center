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

### Device and role separation audit — 26 August 2026

The Employee experience is **mobile-first**: `portal.pmec.group` routes administrative Control Center requests back to the Employee workspace, where the interface labels the scope as Employee and restricts the presentation to personal assignments, time, leave, notifications, and payslip features. The Project Manager and HR Control Center is **desktop/iPad-only**: the shared administrative route blocks widths below 760 pixels with an explicit wider-view message and specifies iPad landscape or desktop use.

The planned dedicated hosts are role locked in the client entry model: `pm.pmec.group` locks Project Manager, while `hr.pmec.group` locks Human Resources. Project Manager capabilities cover delivery, assignment, capacity, and hour approval; HR covers people, leave, workforce planning, organization-wide hour visibility, and verified payroll review. The server separately rejects unauthorized delivery and payroll requests. Focused host-routing and role-authorization acceptance suites passed (9 tests). `pm.pmec.group` and `hr.pmec.group` have not yet been attached to public DNS/Vercel, so their live role-specific endpoints remain pending.

### PM and HR public-host attachment — 26 August 2026

Vercel accepted `pm.pmec.group` and `hr.pmec.group` as Production domains for the PMEC project. Credential-free HTTPS probes for both hostnames return HTTP 200. Browser rendering was briefly blank during the initial certificate/provisioning window; the role-specific client entry remains subject to final public route validation after the next PMEC deployment.

The Project Manager host now renders the desktop Control Center with a visible **HOST LOCKED** Project Manager state and PM delivery controls. The HR host still showed a transient blank render on its first browser load; its public HTTPS response is healthy and requires a further post-provisioning route check.

The HR Control Center subsequently rendered successfully with a visible **HOST LOCKED** Human Resources state, HR-only navigation, and the signed-out payroll boundary. The Employee QR launch-card commit `3a79ea3` reached **Ready** in Vercel Production on 26 August 2026.

### Secure demo-session handoff

The remaining session acceptance must be completed only by entering the isolated demo credentials privately in Clerk; passwords, tokens, and protected payloads must not be copied into chat, browser automation, source control, or logs. Test Employee from the mobile entry at `https://portal.pmec.group/ess/login`, Project Manager from `https://pm.pmec.group`, and HR from `https://hr.pmec.group`. Sign out fully between roles. Confirm that Employee sees only own-scope work and cannot reach payroll, Project Manager can manage delivery but not payroll/HR leave decisions, and HR can review people/leave/read-only delivery hours and payroll only when its server-verified membership authorizes it.

### Employee onboarding handout — 26 August 2026

The credential-free mobile onboarding handout is published at the public `/mobile-onboarding` route and uses the verified Employee entry QR destination. Its Git production build from commit `1fd2b04` reached **Ready** in Vercel Production on 26 August 2026.

Credential-free probes confirm that the public portal and the Ready deployment serve the same current web bundle for `/mobile-onboarding`. A final public route reload rendered the full handout successfully, including the scannable QR guidance, mobile-entry address, three-step onboarding sequence, and credential-free security note.

The locally rendered handout’s one-page PDF download action was invoked without account data. After resolving the bundled QR asset through Expo Asset, the export completed without a browser runtime error; final downloaded-file confirmation remains pending.

### Clerk-independent client showcase — 27 August 2026

The public `/demo` route is now PMEC **Showcase Access**. It offers a no-password launcher for isolated Employee, Project Manager, and HR presentation views using only device-local sample data. It does not create a Clerk session, issue a bearer token, call the delivery API, or expose payroll data. The Employee route opens the local workspace; Project Manager and HR open role-scoped local Control Center views. Focused showcase, onboarding-handout, and server role-boundary tests passed.

The associated personalized manager-contact handout and one-page PDF export were released in Ready Production deployment `efb53c9`. Credential-free checks confirm the stable portal now serves both the no-password showcase launcher and the PDF export control.
