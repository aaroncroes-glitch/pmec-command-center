import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useLumen } from "@/lib/lumen-workspace";
import {
  radius,
  space,
  statusBackground,
  statusColor,
  tracking,
  type,
  weight,
  type StatusTone,
} from "@/lib/pmec-design";
import { PmecPressable } from "@/components/pmec/pressable";

type Palette = ReturnType<typeof useLumen>["palette"];

/* ------------------------------------------------------------------ Button */

export type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * The one button. Three variants, no per-screen redefinition.
 *
 * "button" was previously defined three separate times across the codebase with
 * different heights, weights and paddings, which is why the same action looked
 * different depending on where you met it.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  trailing,
  hint,
  style,
  fullWidth = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** A trailing glyph such as an arrow. Decorative: it is not announced separately. */
  trailing?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <PmecPressable
      accessibilityLabel={label}
      hint={hint}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        styles[`${variant}Button`],
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <View style={styles.buttonInner}>
        <Text style={[styles.buttonLabel, styles[`${variant}Label`]]}>{label}</Text>
        {trailing ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[styles.buttonLabel, styles[`${variant}Label`]]}
          >
            {trailing}
          </Text>
        ) : null}
      </View>
    </PmecPressable>
  );
}

/* -------------------------------------------------------------------- Chip */

/**
 * Selectable filter chip.
 *
 * Announces its selected state, which the previous filter rows did not: the Project
 * Tracker's fifteen filters were bare divs with no role, no name, and no way to tell
 * from assistive technology which one was active.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Optional result count, announced as part of the name. */
  count?: number;
}) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const base = count === undefined ? label : `${label}, ${count} results`;
  // React Native Web does not map accessibilityState.selected onto an ARIA attribute for
  // role="button", so the active filter would be announced identically to the inactive
  // ones. `pressed` below sets aria-pressed for the web build, and the state is also
  // folded into the accessible name so it is announced on every platform either way.
  const name = selected ? `${base}, selected` : base;
  return (
    <PmecPressable
      accessibilityLabel={name}
      role="button"
      selected={selected}
      pressed={selected}
      disabled={disabled}
      onPress={onPress}
      dense
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </PmecPressable>
  );
}

/* ------------------------------------------------------------------- Badge */

/**
 * Non-interactive status marker.
 *
 * Status is never carried by colour alone: the tone sets the colour, the label carries
 * the meaning, so the badge still reads under colour-blindness and in greyscale print.
 */
export function Badge({
  label,
  tone = "neutral",
  style,
}: {
  label: string;
  tone?: StatusTone;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const mode = palette.background === "#F6F3EE" ? "light" : "dark";
  return (
    <View
      accessibilityRole="text"
      style={[
        styles.badge,
        { backgroundColor: statusBackground(tone, mode), borderColor: statusColor(tone, mode) },
        style,
      ]}
    >
      <Text style={[styles.badgeLabel, { color: statusColor(tone, mode) }]}>{label}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------- Card */

/**
 * Surface with a hairline edge and no shadow, matching the drawing-set language.
 * Cards never nest.
 */
export function Card({
  children,
  style,
  raised = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
}) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return <View style={[styles.card, raised && styles.cardRaised, style]}>{children}</View>;
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    /* button */
    button: {
      alignItems: "center",
      borderRadius: radius.sm,
      justifyContent: "center",
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
    },
    fullWidth: { alignSelf: "stretch" },
    buttonInner: {
      alignItems: "center",
      flexDirection: "row",
      gap: space.sm,
      justifyContent: "center",
    },
    buttonLabel: {
      fontSize: type.label,
      fontWeight: weight.black,
      letterSpacing: tracking.label,
      textTransform: "uppercase",
    },
    primaryButton: { backgroundColor: palette.accent },
    primaryLabel: { color: palette.onAccent },
    secondaryButton: {
      backgroundColor: "transparent",
      borderColor: palette.foreground,
      borderWidth: 1,
    },
    secondaryLabel: { color: palette.foreground },
    ghostButton: { backgroundColor: "transparent" },
    ghostLabel: { color: palette.muted },

    /* chip */
    chip: {
      alignItems: "center",
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.pill,
      borderWidth: 1,
      justifyContent: "center",
      paddingHorizontal: space.md,
      paddingVertical: 6,
    },
    chipSelected: {
      backgroundColor: palette.foreground,
      borderColor: palette.foreground,
    },
    chipLabel: {
      color: palette.muted,
      fontSize: type.label,
      fontWeight: weight.heavy,
      letterSpacing: tracking.label,
      textTransform: "uppercase",
    },
    chipLabelSelected: { color: palette.inverseText },

    /* badge */
    badge: {
      alignSelf: "flex-start",
      borderRadius: radius.sm,
      borderWidth: 1,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    badgeLabel: {
      fontSize: type.label,
      fontWeight: weight.black,
      letterSpacing: tracking.label,
      textTransform: "uppercase",
    },

    /* card */
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      padding: space.lg,
    },
    cardRaised: { backgroundColor: palette.surfaceStrong },
  });
