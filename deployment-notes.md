# Deployment Status

The user-provided Vercel preview URL was verified as serving the Lumen application on 2026-08-24.

- **Preview URL:** https://lumen-ess-preview.vercel.app/
- **Verified route:** `/ess/onboarding`
- **Observed result:** The Lumen onboarding screen loaded successfully with the expected title, onboarding content, and continuation controls.

The Vercel MCP Git-link context had not yet exposed the GitHub origin during earlier checks; however, the final user-provided preview URL confirms that a working Vercel deployment is now available.

## Administration Preview

The separate Vercel preview deployment was created on 2026-08-24 at `https://lumen-admin-preview-a4rwn2klz-aaron-croes-projects.vercel.app`. Its root serves the existing employee route, while the intended `/admin` client route initially returned a Vercel 404 because the direct static deployment lacked a single-page application rewrite. The direct deployment payload now includes this required route fallback before the preview is redeployed.
