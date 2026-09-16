export type ThemeMode = "light" | "dark";

export type LumenPalette = {
  background: string;
  surface: string;
  surfaceStrong: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  /** Text on an accent fill. Ink in both modes: paper on the accent measures 2.82:1. */
  onAccent: string;
  /** The accent as small text on a page surface. The accent itself is 2.82:1 on paper. */
  accentText: string;
  /** The accent as text on an inverted card, which flips with the mode. */
  accentOnInverse: string;
  /** The navigation rail. Dark chrome in both modes, kept clear of the page behind it. */
  rail: string;
  inverse: string;
  inverseText: string;
  success: string;
  /** The success tone as small text on its own soft tint. */
  successText: string;
  /** The rejected/over-budget tone: a fill, its soft tint, and text safe on that tint. */
  danger: string;
  dangerSoft: string;
  dangerText: string;
  /** The budget-warning tone as small text. */
  warningText: string;
};

export const lumenPalettes: Record<ThemeMode, LumenPalette> = {
  light: {
    background: "#F6F3EE",
    surface: "#EEE8E0",
    surfaceStrong: "#E7E0D8",
    foreground: "#191919",
    muted: "#69635D",
    border: "#D4CDC3",
    accent: "#FF5A1F",
    accentSoft: "#FFE2D5",
    onAccent: "#191919",
    // 5.87:1 on the background, 4.97:1 on the strong surface, 5.29:1 on the soft accent.
    accentText: "#A63A08",
    // 7.72:1 on the ink card it sits on.
    accentOnInverse: "#FF8A5C",
    rail: "#191919",
    inverse: "#191919",
    inverseText: "#F6F3EE",
    success: "#287A5A",
    successText: "#1F6349",
    danger: "#B4483E",
    dangerSoft: "#F7DDD8",
    dangerText: "#9E3A31",
    warningText: "#9C4E12",
  },
  dark: {
    background: "#171717",
    surface: "#222222",
    surfaceStrong: "#2B2B2B",
    foreground: "#F4F0EA",
    muted: "#A9A39C",
    border: "#3B3B3B",
    accent: "#FF6B36",
    // Darkened from #5B2D1D, where the accent as text measured 4.03:1.
    accentSoft: "#43200F",
    onAccent: "#171717",
    // On dark surfaces the accent already carries text: 6.32:1 on the background.
    accentText: "#FF6B36",
    // 5.73:1 on the pale card the dark mode flips to.
    accentOnInverse: "#A63A08",
    // Lighter than the dark page, so the rail still reads as its own chrome.
    rail: "#222222",
    inverse: "#F4F0EA",
    inverseText: "#171717",
    success: "#7FD6AE",
    successText: "#7FD6AE",
    danger: "#B4483E",
    dangerSoft: "#3A1C19",
    dangerText: "#F2A79D",
    warningText: "#F0A868",
  },
};
