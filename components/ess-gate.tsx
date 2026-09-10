import { View } from "react-native";
import { Redirect } from "expo-router";

import { essGateTarget } from "@/lib/ess-gate";
import { useEss } from "@/lib/ess-workspace";
import { useLumen } from "@/lib/lumen-workspace";

/**
 * What an employee screen must render instead of itself, or null when it may render.
 *
 * Call it alongside the screen's other hooks and return its result early:
 *
 *   const gate = useEssGate();
 *   ...
 *   if (gate) return gate;
 *
 * While saved state is still loading it renders an empty page in the paper colour
 * rather than guessing, so a returning employee is never bounced to onboarding.
 */
export function useEssGate(options?: { requireOnboarded?: boolean }) {
  const { ready, onboarded, isAuthenticated } = useEss();
  const { palette } = useLumen();
  const target = essGateTarget({ ready, onboarded, isAuthenticated }, options);
  if (target === "wait") return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  if (target) return <Redirect href={target} />;
  return null;
}
