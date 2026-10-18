import { Image, type ImageStyle, type StyleProp } from "react-native";

import { useLumen } from "@/lib/lumen-workspace";

const ON_DARK = require("@/assets/images/brand/pmec-logo-on-dark.png");
const ON_LIGHT = require("@/assets/images/brand/pmec-logo-on-light.png");

/** The lockup's own proportions (819 × 260), so it never stretches. */
const RATIO = 819 / 260;

export type BrandMarkProps = {
  /** Height in points; the width follows the artwork. */
  height?: number;
  /**
   * Force the version for a dark background. The navigation rail is dark in both modes,
   * so marks on it pass this; everywhere else the active theme decides.
   */
  onDark?: boolean;
  style?: StyleProp<ImageStyle>;
};

/**
 * The PMEC logo: hexagon mark and wordmark. White and cyan on dark grounds, black and deep
 * cyan on light ones — the cyan alone is too pale to hold on cream.
 */
export function BrandMark({ height = 28, onDark, style }: BrandMarkProps) {
  const { themeMode } = useLumen();
  const dark = onDark ?? themeMode === "dark";
  return (
    <Image
      source={dark ? ON_DARK : ON_LIGHT}
      accessibilityRole="image"
      accessibilityLabel="PMEC"
      resizeMode="contain"
      style={[{ height, width: Math.round(height * RATIO) }, style]}
    />
  );
}
