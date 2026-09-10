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
  inverse: string;
  inverseText: string;
  success: string;
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
    inverse: "#191919",
    inverseText: "#F6F3EE",
    success: "#287A5A",
  },
  dark: {
    background: "#171717",
    surface: "#222222",
    surfaceStrong: "#2B2B2B",
    foreground: "#F4F0EA",
    muted: "#A9A39C",
    border: "#3B3B3B",
    accent: "#FF6B36",
    accentSoft: "#5B2D1D",
    inverse: "#F4F0EA",
    inverseText: "#171717",
    success: "#7FD6AE",
  },
};
