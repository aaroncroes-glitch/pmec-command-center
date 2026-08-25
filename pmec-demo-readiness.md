# PMEC Demonstration Readiness

The PMEC production deployment for commit `2c3bf88` reached **Ready** status on 25 August 2026. The corrected local role showcase is available at `https://pmec-command-center-k9b755ruc-aaron-croes-projects.vercel.app/demo`; the stable production alias remains `https://pmec-command-center.vercel.app/demo`.

The isolated `pmec-demo` Neon organization contains three dummy Clerk identity links and active role memberships, plus two demo assignments, two demo time logs, two employee notifications, and one preference record. No real personnel or payroll data was inserted. Credentials and Clerk subject identifiers are deliberately excluded from this file.

The PMEC Vercel Clerk proxy was repaired and the proxied Clerk environment endpoint returns HTTP 200. As of 25 August 2026, a real sign-in attempt for the dummy employee reaches Clerk but receives a Clerk-side HTTP 500 response. The demonstration data and accounts remain isolated; public PMEC subdomains remain unattached until this authentication service response is resolved.

The production deployment for the one-time ticket entry reached Ready at `https://pmec-command-center-fv5p7fo7p-aaron-croes-projects.vercel.app`. A browser validation exposed the temporary employee ticket in an internal browser trace and did not complete successfully; that ticket was immediately revoked. Do not issue or share another ticket until the token-consumption route is validated without credential exposure.

The local showcase is intentionally presentation-only. Employee selection completes first-run local setup before opening the mobile workspace; Project Manager and HR selection open their respective local Control Center views. The showcase does not issue Clerk sessions or production delivery/payroll authorization. The final regression suite completed with 66 passing tests and one intentional skip, and the Expo web export completed successfully.
