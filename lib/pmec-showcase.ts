/**
 * Showcase mode: PMEC is being shown to prospective clients, before real sign-in exists.
 *
 * While it is on, sign-in stays out of sight and every screen runs on demo data,
 * including the employee's assigned work and notifications and the HR payroll preview,
 * none of which would otherwise show without a verified account. Build with
 * EXPO_PUBLIC_PMEC_SHOWCASE=off to bring back sign-in, live data and the payroll check.
 */
export const showcaseMode = process.env.EXPO_PUBLIC_PMEC_SHOWCASE !== "off";
