import { useCallback } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter, type Href } from "expo-router";

import { useLumen } from "@/lib/lumen-workspace";
import { tracking, type, weight } from "@/lib/pmec-design";
import { performSafeBack } from "@/lib/pmec-navigation";
import { PmecPressable } from "@/components/pmec/pressable";

/** The hairline arrow circle the screens already used, kept exactly as it looked. */
const CIRCLE = 34;

/** `performSafeBack` bound to the current router. `fallback` should be the screen's parent. */
export function useSafeBack(fallback: Href = "/") {
  const router = useRouter();
  return useCallback(() => performSafeBack(router, fallback), [router, fallback]);
}

export type BackButtonProps = {
  /**
   * Where to go when there is no history to return to: after a refresh, from a direct
   * link, or when the screen was reached through a replace. Use the screen's parent.
   */
  fallback?: Href;
  /** Accessible name. Always begins with "Back" so every back control announces the same way. */
  label?: string;
  /** In-page back, such as a detail view returning to its list. Replaces history navigation. */
  onPress?: () => void;
  /** "circle" is the arrow at the top of a screen; "text" is a labelled link. */
  variant?: "circle" | "text";
  /** Visible text for the text variant. */
  text?: string;
  /** "inverse" for the dark desktop rail. */
  tone?: "ink" | "inverse";
  /** Layout for the whole control, such as spacing below it. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The one back control.
 *
 * Previously each screen hand-rolled a 34px arrow that called `router.back()` directly:
 * no accessible name, a target below the 44px minimum, and no way out when the history
 * was empty. This keeps the same arrow and fixes all three.
 */
export function BackButton({
  fallback = "/",
  label = "Back",
  onPress,
  variant = "circle",
  text = "← Back",
  tone = "ink",
  style,
}: BackButtonProps) {
  const { palette } = useLumen();
  const safeBack = useSafeBack(fallback);
  const ink = tone === "inverse" ? palette.inverseText : palette.foreground;
  const handlePress = onPress ?? safeBack;

  return (
    <View style={[styles.wrap, style]}>
      {variant === "text" ? (
        <PmecPressable accessibilityLabel={label} onPress={handlePress} style={styles.textButton}>
          <Text style={[styles.textLabel, { color: ink }]}>{text}</Text>
        </PmecPressable>
      ) : (
        <PmecPressable
          accessibilityLabel={label}
          onPress={handlePress}
          dense
          denseHeight={CIRCLE}
          style={[
            styles.circle,
            { borderColor: tone === "inverse" ? palette.inverseText : palette.border },
          ]}
        >
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[styles.arrow, { color: ink }]}
          >
            ←
          </Text>
        </PmecPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start" },
  circle: {
    alignItems: "center",
    borderRadius: CIRCLE / 2,
    borderWidth: 1,
    height: CIRCLE,
    justifyContent: "center",
    width: CIRCLE,
  },
  arrow: { fontSize: 20, lineHeight: 22 },
  textButton: { alignItems: "flex-start" },
  textLabel: {
    fontSize: type.label,
    fontWeight: weight.black,
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
});
