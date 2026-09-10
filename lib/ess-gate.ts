export type EssGateState = { ready: boolean; onboarded: boolean; isAuthenticated: boolean };
export type EssGateTarget = "wait" | "/ess/onboarding" | "/ess/login" | null;

/**
 * Where an employee screen should send someone, given the ESS state, or null to let
 * the screen render.
 *
 * Saved state loads asynchronously. Until it has, the state holds its defaults, which
 * say "not onboarded, not signed in". Screens that decided before then sent roughly
 * half of returning employees back to the intro screen on a fresh load, so nothing is
 * decided until `ready`.
 */
export function essGateTarget(
  state: EssGateState,
  { requireOnboarded = true }: { requireOnboarded?: boolean } = {},
): EssGateTarget {
  if (!state.ready) return "wait";
  if (requireOnboarded && !state.onboarded) return "/ess/onboarding";
  if (!state.isAuthenticated) return "/ess/login";
  return null;
}
