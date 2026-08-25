# PMEC Demonstration Readiness

The PMEC production deployment for commit `b4a1e4e` reached **Ready** status on 25 August 2026. The role showcase currently uses the Vercel deployment URL `https://pmec-command-center-bpc8u31vc-aaron-croes-projects.vercel.app` and the stable production alias `https://pmec-command-center.vercel.app`.

The isolated `pmec-demo` Neon organization contains three dummy Clerk identity links and active role memberships, plus two demo assignments, two demo time logs, two employee notifications, and one preference record. No real personnel or payroll data was inserted. Credentials and Clerk subject identifiers are deliberately excluded from this file.

The PMEC Vercel Clerk proxy was repaired and the proxied Clerk environment endpoint returns HTTP 200. As of 25 August 2026, a real sign-in attempt for the dummy employee reaches Clerk but receives a Clerk-side HTTP 500 response. The demonstration data and accounts remain isolated; public PMEC subdomains remain unattached until this authentication service response is resolved.
