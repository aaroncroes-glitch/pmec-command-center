import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useLumen } from "@/lib/lumen-workspace";
import { FOCUS_RING, MIN_TARGET } from "@/lib/pmec-design";

type Palette = ReturnType<typeof useLumen>["palette"];

export type PmecPressableProps = {
  /**
   * What assistive technology announces. Required: React Native Web renders Pressable as
   * a bare <div>, so an element without this is invisible to screen readers. Making it
   * non-optional is the whole point of this component.
   */
  accessibilityLabel: string;
  onPress: () => void;
  children: React.ReactNode;
  role?: "button" | "link" | "tab" | "checkbox" | "radio" | "switch";
  /** Announced as selected/checked, and used by consumers to style the active state. */
  selected?: boolean;
  /**
   * Sets `aria-pressed` for toggle-style controls. React Native Web does not derive an
   * ARIA attribute from `accessibilityState.selected` when the role is "button", so a
   * toggle needs this to announce its state on the web build.
   */
  pressed?: boolean;
  disabled?: boolean;
  /** Longer description read after the label, for actions whose effect is not obvious. */
  hint?: string;
  style?: StyleProp<ViewStyle>;
  /** Style merged in while pressed. Defaults to a subtle opacity drop. */
  pressedStyle?: StyleProp<ViewStyle>;
  /**
   * For controls whose visible box must stay smaller than 44px, such as chips in a dense
   * filter bar. The visible shape keeps `style`; the touch target is grown around it.
   */
  dense?: boolean;
  /** Visible height of a dense control, used to size the surrounding target. */
  denseHeight?: number;
  testID?: string;
};

/**
 * The one pressable in the product.
 *
 * Guarantees, by construction rather than by each screen remembering:
 *   - a 44x44px minimum interactive target (WCAG 2.1 AA, 2.5.5)
 *   - an accessibility role and an accessible name
 *   - a visible keyboard focus ring
 *   - an announced disabled and selected state
 *
 * The audit measured 86% of mobile targets below the minimum and 87% of interactive
 * elements with no role at all. Both numbers are properties of there being no shared
 * pressable, not of any individual screen.
 */
export function PmecPressable({
  accessibilityLabel,
  onPress,
  children,
  role = "button",
  selected,
  pressed: pressedState,
  disabled = false,
  hint,
  style,
  pressedStyle,
  dense = false,
  denseHeight = 28,
  testID,
}: PmecPressableProps) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [focused, setFocused] = useState(false);

  // React Native Web does not implement `hitSlop`; a probe 4px outside a chip already
  // misses. So a dense control grows its real box with padding and pulls the extra back
  // out with a negative margin, leaving layout untouched but the target genuinely 44px.
  // The visible shape moves to an inner view so the padding stays invisible.
  const inset = dense ? Math.max(0, (MIN_TARGET - denseHeight) / 2) : 0;

  const a11y = {
    accessibilityRole: role,
    accessibilityLabel,
    accessibilityHint: hint,
    accessibilityState: { disabled, selected },
    ...(pressedState === undefined ? null : { "aria-pressed": pressedState }),
  } as const;

  if (dense) {
    return (
      <Pressable
        {...a11y}
        disabled={disabled}
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        testID={testID}
        style={({ pressed }) => [
          {
            marginHorizontal: -inset,
            marginVertical: -inset,
            paddingHorizontal: inset,
            paddingVertical: inset,
          },
          pressed && (pressedStyle ?? styles.pressed),
          disabled && styles.disabled,
        ]}
      >
        <View style={[style, focused && styles.focused]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <Pressable
      {...a11y}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        style,
        focused && styles.focused,
        pressed && (pressedStyle ?? styles.pressed),
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    base: {
      justifyContent: "center",
      minHeight: MIN_TARGET,
      minWidth: MIN_TARGET,
    },
    focused: {
      outlineColor: palette.accent,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: FOCUS_RING,
    } as ViewStyle,
    pressed: {
      opacity: 0.68,
    },
    disabled: {
      opacity: 0.4,
    },
  });

/**
 * Row-shaped pressable for lists, where the whole row is the target.
 * Separate from the base so list rows get vertical padding without every caller
 * restating it.
 */
export function PmecPressableRow({ style, ...props }: PmecPressableProps) {
  const { palette } = useLumen();
  const styles = useMemo(() => makeRowStyles(palette), [palette]);
  return <PmecPressable {...props} style={[styles.row, style]} />;
}

const makeRowStyles = (palette: Palette) =>
  StyleSheet.create({
    row: {
      alignItems: "center",
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 12,
      paddingVertical: 12,
    },
  });
