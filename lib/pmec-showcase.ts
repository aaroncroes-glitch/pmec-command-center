/**
 * Showcase mode: PMEC is being shown to prospective clients, before real sign-in exists.
 *
 * While it is on, sign-in stays out of sight and every screen runs on demo data,
 * including the employee's assigned work and notifications and the HR payroll preview,
 * none of which would otherwise show without a verified account.
 * In production, set `EXPO_PUBLIC_PMEC_SHOWCASE=on` only for deliberate demos.
 */
export function resolveShowcaseMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const isProduction = env.NODE_ENV === "production";
  if (isProduction) return env.EXPO_PUBLIC_PMEC_SHOWCASE === "on";
  return env.EXPO_PUBLIC_PMEC_SHOWCASE !== "off";
}

export const showcaseMode = resolveShowcaseMode();