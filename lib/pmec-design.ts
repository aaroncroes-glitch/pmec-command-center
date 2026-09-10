/**
 * PMEC design tokens.
 *
 * The single source for type, spacing, and interaction sizing. Screens read these
 * instead of inventing values, which is what keeps one screen's vocabulary
 * transferable to the next.
 *
 * The visual language itself is settled and is not up for redesign (see PRODUCT.md):
 * warm paper ground, ink type, hairline rules, condensed heavy display weights,
 * uppercase letterspaced labels, one held accent. These tokens encode that language.
 * They do not replace it.
 *
 * Colour still comes from `useLumen().palette`. Only the status vocabulary lives here,
 * because the palette has no semantic layer.
 */

/**
 * Type scale, ratio ~1.2.
 *
 * `label` is the floor at 12px. The old interface set labels as low as 7px, which is
 * unreadable in the field conditions this product ships into; the uppercase letterspaced
 * treatment survives, the illegibility does not.
 */
export const type = {
  /** Uppercase letterspaced eyebrows, badges, chips, table headers. Floor: never smaller. */
  label: 12,
  /** Secondary and supporting copy. */
  meta: 13,
  /** Body copy floor. */
  body: 15,
  /** Emphasised body, list-row titles. */
  bodyStrong: 17,
  /** Card and section headings. */
  heading: 20,
  /** Screen titles. */
  title: 24,
  /** Figures in stat tiles. */
  figure: 29,
  /** Page display type. */
  display: 35,
} as const;

/** Letterspacing for the uppercase label treatment, by size. */
export const tracking = {
  label: 0.8,
  display: -0.6,
  title: -0.3,
} as const;

/** Weights, matching the condensed-heavy character of the existing language. */
export const weight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
  black: "900",
} as const;

/** Spacing scale. Multiples of 4, with 2 available for hairline offsets. */
export const space = {
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  sm: 3,
  md: 6,
  pill: 999,
} as const;

/**
 * WCAG 2.1 AA minimum interactive target, in px.
 *
 * Enforced by `PmecPressable` rather than left to each screen, so a screen cannot fall
 * below it by omission. The previous interface had 86% of mobile targets under this.
 */
export const MIN_TARGET = 44;

/** Focus ring width. Paired with an offset so it reads on both light and dark grounds. */
export const FOCUS_RING = 2;

/**
 * Semantic status vocabulary.
 *
 * Deliberately held inside the existing warm range so status reads as part of the same
 * family rather than as a second palette. Status is never carried by colour alone:
 * every consumer pairs these with a text label.
 *
 * Verified at >=4.5:1 against background, surface, and surfaceStrong.
 */
export const status = {
  neutral: { light: "#69635D", dark: "#A79E93" },
  /** On track, approved, complete. */
  positive: { light: "#1F6047", dark: "#63BC96" },
  /** Needs attention, pending, watch. */
  caution: { light: "#7A5310", dark: "#D8A64A" },
  /** Over budget, overdue, rejected, blocked. */
  critical: { light: "#8E2519", dark: "#E8776A" },
} as const;

export type StatusTone = keyof typeof status;

/** Wash backgrounds for status chips, at the same hues. */
export const statusWash = {
  neutral: { light: "#EAE5DD", dark: "#221E1A" },
  positive: { light: "#DFEDE6", dark: "#16291F" },
  caution: { light: "#F7EBD4", dark: "#2E2517" },
  critical: { light: "#F6E2DE", dark: "#33201C" },
} as const;

export type ThemeMode = "light" | "dark";

export function statusColor(tone: StatusTone, mode: ThemeMode = "light") {
  return status[tone][mode];
}

export function statusBackground(tone: StatusTone, mode: ThemeMode = "light") {
  return statusWash[tone][mode];
}
