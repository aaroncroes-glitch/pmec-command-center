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

### Role-specific public entry verification — 27 August 2026

The public `pm.pmec.group/control-center` route renders the host-locked Project Manager Control Center on a desktop viewport, including delivery, hours, and capacity navigation. It remains visibly signed out and labels delivery information as a local demonstration until a verified production session is available. The Employee workspace remains a separate mobile-first route; the workspace selector now sends Project Manager and HR choices to their dedicated public domains.

The public `hr.pmec.group/control-center` route likewise renders the host-locked HR Control Center on a desktop viewport, with people, leave, and capacity navigation. Payroll stays explicitly sign-in-gated, and the displayed HR delivery context remains local demonstration data until a verified server-authorized session exists.

The workspace-selector routing correction was released in Ready Production deployment `79128b9`. Employee selection remains on the mobile-first local showcase; Project Manager and HR selections now send visitors to `pm.pmec.group/control-center` and `hr.pmec.group/control-center`, respectively.

### PM project-detail restoration — 27 August 2026

The Project Manager Control Center now exposes a direct PM-only Project Tracker path from its delivery workspace. Selecting a project opens its detail panel with lifecycle phases, overall progress, budget utilization, contingency and remaining-authorized values, milestones, work breakdown, package status, and cost records. The same detail panel supports a direct `projectId` route from PM Control Center project cards. The route redirects Employee and HR host access back to their permitted workspace; all demonstration project data remains device-local unless a separately verified PM production session is available.

The Project Manager project-detail restoration was released in Ready Production deployment `e0e4199`.

The public PM route `pm.pmec.group/job-orders?projectId=jo-coastal-substation` was verified on a desktop viewport. It opens the selected project panel directly and renders lifecycle status, 40% overall progress, 81% budget utilization, budget/contingency/remaining-authorized values, milestone progress, work packages, and cost-document context. These remain demonstration data and do not grant an unsigned visitor production delivery authority.

### PM project search and budget variance — 27 August 2026

The PM Control Center delivery view now supports an in-place search across project, client, manager, region, and tag. Search validation narrowed the three local projects to the Coastal Substation project using its client context. The dedicated Project Tracker adds lifecycle, discipline, and budget-status filters. Budget alerts use PM-only local project data: watch begins at 75% burn, at-risk at 90%, and over-budget above 100% of authorized project budget; server-side production authority remains unchanged.

The PM search and budget-alert release `9a29e5e` is building in the Vercel Production pipeline; its public verification will be recorded only after the deployment reaches Ready.

Release `9a29e5e` reached Ready Production. The release URL verified the new Project Tracker search field, three-result count, lifecycle and discipline filters, dedicated budget-status filters, and visual budget-watch alerts for the 81% and 89% local-project burn cases. The public PM tracker remains local demonstration content and does not grant unsigned users server-side project authority.

### PM showcase interaction audit — 27 August 2026

The local PM Control Center and Project Tracker load successfully with the PM local demonstration role, a three-project portfolio, direct Project Tracker entry, existing budget watch cards, and PM-only host/device guards. Staffing assignment, milestone calendar, and local cost-document selection are being audited as local-device interactions; no source document or demonstration data will be transmitted to production services.

The project-detail staffing panel now exposes all 34 local workforce records (28 employees and 6 contractors), distinguishes unavailable people, and immediately updates the selected work package assignment in local state. The audit identified that the prior local assignment flow also attempted an unsigned delivery-sync request; it now retains local showcase changes without any delivery API call, while authenticated live sync keeps its server-enforced route.

The audited PM detail flow successfully reassigned a selected work package to an available local workforce member and opened the new month-navigable milestone calendar. The repaired showcase now performs these presentation actions without the prior unsigned delivery-fetch overlay.

The milestone scheduler now accepts an entered label and a selected calendar date before enabling the local save action. The cost-document workflow opens a supported file selector plus description, amount, and document-type fields, and clearly states that selected file references and metadata remain local to the showcase device.

TypeScript, targeted Project Manager interaction/authorization suites, and a low-memory web export passed. The broader non-database regression suite passed 69 tests with one intentional skip. Two separate Neon integration tests remain dependent on the retired `neondb_owner` credential and therefore fail under the restricted runtime connection; this does not affect the local PM showcase, which intentionally makes no unsigned delivery requests.

The Production Project Manager bundle contains the audited project-team assignment, milestone-calendar, and local cost-document workflow components. Public PM rendering remains a signed-out, device-local showcase until a server-verified Project Manager session is available; no local showcase action can call protected delivery APIs.

The PM cost-document dialog now accepts one supported PDF, image, invoice, receipt, spreadsheet, or CSV file by desktop drag-and-drop and displays a release-state drop zone, local-file name, size, and type before cost metadata is saved. The supported device picker remains available as an accessible fallback. Selected files are retained only as a device-local showcase reference and are never uploaded to PMEC services.

The drag-and-drop release was published from commit `9f3c81e`. Credential-free public-bundle inspection confirms that both the drop-zone prompt and the Browse Files fallback are present on the Project Manager deployment. Automated interaction coverage and TypeScript verification passed; no file was transferred to a PMEC service during validation.

### PM cost-document approval and category tags — 27 August 2026

Project Managers can now set each local showcase cost document to **Pending approval** or **Approved** from an in-place status dropdown and filter the record list by that state. The status change was exercised locally and immediately updated the visible record. Document rows show semantic category tags, including Invoice, Receipt, Contract, Change order, Compliance, and Vendor quote. New local document entries support multi-select tags and an initial approval state. Previously stored browser-local showcase records are migrated to Pending approval with tags derived from their document type. These controls remain device-local and do not create an approval record or upload a document to PMEC services.

### PM cost-document review notes — 27 August 2026

Changing a local showcase cost-document approval state now opens a short **Review note** field before the manager selects Pending approval or Approved. The entered rationale is saved together with the approval decision and shown beneath the document tags. The local PM validation entered a supplier-scope rationale, saved it with Approved, and confirmed the note rendered after the approval menu closed. Review notes remain browser-local demonstration data and never create a production approval record.

The review-note release `3ac7b9d` reached Ready in Vercel Production on 27 August 2026. Public PM bundle verification confirms the review-note flow is included with the existing local-only document approval and category-tag controls.

### PM cost-document history and decision summary — 27 August 2026

Every local Project Manager decision now appends a chronological approval-history event with status, review note, timestamp, and reviewer name. Existing browser-local cost documents are safely normalized with an initial history entry, so legacy showcase data remains readable. A local validation changed a pending receipt to Approved with a decision rationale; the document rendered two ordered history events and the PM decision queue updated from one pending item to zero.

The PM Project Tracker now includes a **Decision Queue** summary that shows pending and approved counts, supports all/pending/approved filters, displays the latest rationale and category tags, and opens the associated local project record for follow-up. The summary reports monetary values by original document currency rather than combining currencies. These history and summary records remain browser-local showcase data; they do not create production approval records, upload documents, or call protected delivery APIs. Focused decision-history, PM interaction, host-routing, and authenticated-delivery authorization suites passed (9 tests).

The implementation was released from commit `d51703f` in Ready Vercel Production deployment `pmec-command-center-9dctbw331-aaron-croes-projects.vercel.app`. Its direct Project Manager route renders the Decision Queue. A fresh follow-up load of `pm.pmec.group/job-orders` also rendered the Decision Queue, confirming that the custom hostname now serves the current release.

### PM Decision Queue approval-aging warnings — 28 August 2026

The local Project Manager Decision Queue now evaluates pending approval age from the latest pending decision event (or the locally recorded upload time when no decision history exists). Records pending for **more than 48 hours** receive an explicit `REVIEW OVERDUE` badge with an elapsed day/hour value; the summary opens with an `APPROVAL ATTENTION` banner whenever one or more records need review. Approved records never receive this badge. These timing indicators use browser-local demonstration data only and do not issue reminders, create production approvals, or call protected delivery services.
