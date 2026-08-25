# PMEC authentication validation notes

- The Clerk server secret passed the authenticated instance check.
- The Neon runtime URL passed a read-only `SELECT 1` query, and the PMEC access schema contains the HR-only `payroll.review` permission.
- The live desktop preview currently cannot load Clerk JavaScript because the supplied Expo publishable key resolves to an empty Clerk frontend domain. The Control Center must fail closed without mounting Clerk until this key is corrected.

The PMEC workspace is now linked through the authenticated Clerk CLI to application `app_3INwedCYPv5crlAJogNCpKWJy0n`. The CLI diagnostic confirms the linked development instance and a valid local Expo publishable key; the production instance has not been configured.

The refreshed desktop preview renders without the previous Clerk frontend-domain error and shows the PMEC sign-in control. Its current custom hosted-modal trigger did not visibly open in the browser, so the control requires a supported web sign-in path before the interactive flow can be considered verified.

The confirmed Clerk subject `user_3IO6MJn5mivgfqoF62PBisNV2f4` is now bound to an active PMEC `hr_manager` membership in Neon. The membership resolves the `payroll.review` permission through the server authorization query.

The PMEC Control Center route currently reports no active Clerk session in the sandbox browser even though the subject is present in a separate mobile-route session. The payroll UI remains fail-closed until the desktop route completes its own Clerk session handoff.

PMEC now starts its Expo client and server through the Clerk-linked `.env.local` file, overriding only the managed workspace’s stale development placeholders. The focused Clerk configuration, key, and authorization-policy tests pass after this repair.

After restarting through the local environment launcher, the desktop Control Center initialized Clerk successfully and resolved the expected authenticated subject `user_3IO6MJn5mivgfqoF62PBisNV2f4`.

The signed-in HR session completed the server authorization check, displayed `PAYROLL ACCESS: VERIFIED HR`, and opened the protected Aruba payroll workspace with its scenario-only compensation warning intact.
