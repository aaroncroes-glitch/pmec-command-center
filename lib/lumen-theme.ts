export type ThemeMode = "light" | "dark";

export type LumenPalette = {
  background: string;
  surface: string;
  surfaceStrong: string;
  foreground: string;
  muted: string;
  border: string;
  /** Boundaries of inputs and outlined controls: 3:1 against the surfaces they sit on. */
  field: string;
  accent: string;
  accentSoft: string;
  /** Text on an accent fill: ink on light, black on dark.  */
  onAccent: string;
  /** The accent as small text on a page surface. On light the fill cyan is too pale to read. */
  accentText: string;
  /** The accent as text on an inverted card, which flips with the mode. */
  accentOnInverse: string;
  /** The navigation rail. Dark chrome in both modes, kept clear of the page behind it. */
  rail: string;
  /** Text and marks on the rail, which is dark in both modes: 14.9:1 or better. */
  railText: string;
  /** Secondary text on the rail: 6.7:1 or better, 5.0:1 on the active item. */
  railMuted: string;
  /** The accent on the rail. */
  railAccent: string;
  /** The selected rail item. */
  railActive: string;
  /** Hairlines on the rail. */
  railLine: string;
  inverse: string;
  inverseText: string;
  /** Secondary text on the inverse card: 5.2:1 or better in both modes. */
  mutedOnInverse: string;
  /** A raised panel inside the inverse card. */
  inverseSoft: string;
  success: string;
  successSoft: string;
  /** The success tone as small text on its own soft tint. */
  successText: string;
  /** The rejected/over-budget tone: a fill, its soft tint, and text safe on that tint. */
  danger: string;
  dangerSoft: string;
  dangerText: string;
  warningSoft: string;
  /** The budget-warning tone as small text. */
  warningText: string;
};

/**
 * PMEC's palettes. Since October 2026 the brand is black and cyan, replacing the signal
 * orange: dark is the default, and light keeps the cream ground with a deep cyan for text.
 * Every pairing below was measured against WCAG 2.1 AA (4.5:1 text, 3:1 boundaries).
 */
export const lumenPalettes: Record<ThemeMode, LumenPalette> = {
  light: {
    background: "#F6F3EE",
    surface: "#EEE8E0",
    surfaceStrong: "#E7E0D8",
    foreground: "#191919",
    muted: "#69635D",
    border: "#D4CDC3",
    // 3.7:1 on the background, 3.4:1 on the surface: inputs and outlined controls.
    field: "#857C71",
    // A fill, never text: ink on it measures 7.3:1.
    accent: "#1FB8C3",
    accentSoft: "#D4F3F1",
    onAccent: "#191919",
    // 7.6:1 on the background, 6.5:1 on the strong surface, 7.2:1 on the soft accent.
    accentText: "#0B5560",
    // 13.6:1 on the ink card it sits on.
    accentOnInverse: "#49FAF1",
    rail: "#191919",
    railText: "#F6F3EE",
    railMuted: "#A8A29B",
    railAccent: "#49FAF1",
    railActive: "#303030",
    railLine: "#343434",
    inverse: "#191919",
    inverseText: "#F6F3EE",
    mutedOnInverse: "#A8A29B",
    inverseSoft: "#2A2A2A",
    success: "#287A5A",
    successSoft: "#E8F1ED",
    successText: "#1F6349",
    danger: "#B4483E",
    dangerSoft: "#F7DDD8",
    dangerText: "#9E3A31",
    warningSoft: "#FFF1D8",
    warningText: "#9C4E12",
  },
  dark: {
    background: "#000000",
    surface: "#0A0D0F",
    surfaceStrong: "#11161A",
    // 17.8:1 on the page, 15.4:1 on the strong surface.
    foreground: "#E6EDF2",
    // 8.0:1 on the page, 6.9:1 on the strong surface.
    muted: "#8BA3B3",
    border: "#26323A",
    // 3.8:1 on the page, 3.3:1 on the strong surface.
    field: "#5B6B75",
    // 16.2:1 on the page — the cyan carries text as well as fills.
    accent: "#49FAF1",
    accentSoft: "#0B2A2C",
    onAccent: "#000000",
    // 11.7:1 on the soft accent.
    accentText: "#49FAF1",
    // 6.3:1 on the pale card the dark mode flips to.
    accentOnInverse: "#0E5E68",
    // Lighter than the page, so the rail still reads as its own chrome.
    rail: "#0A0D0F",
    railText: "#E6EDF2",
    railMuted: "#8BA3B3",
    railAccent: "#49FAF1",
    railActive: "#1A2228",
    railLine: "#1F2A31",
    inverse: "#E6EDF2",
    inverseText: "#000000",
    mutedOnInverse: "#4A5965",
    inverseSoft: "#D3DCE2",
    success: "#7FD6AE",
    successSoft: "#0F2A20",
    successText: "#7FD6AE",
    danger: "#E5484D",
    dangerSoft: "#2A1012",
    // 7.9:1 on its soft tint.
    dangerText: "#FF8A8F",
    warningSoft: "#2A1F0B",
    warningText: "#F0B45A",
  },
};
