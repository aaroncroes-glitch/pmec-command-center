import { View, type ViewStyle } from "react-native";

import type { ThemeMode } from "@/lib/lumen-theme";

export type HairlineFigureName =
  | "branches"
  | "cabinet"
  | "drawer"
  | "laptop"
  | "loupe"
  | "padlock"
  | "plot"
  | "router"
  | "terrain"
  | "vault";

type Props = {
  name: HairlineFigureName;
  /** Surface the figure sits on — must match the real background fill. */
  plate?: string;
  themeMode?: ThemeMode;
  intensity?: number;
  label?: string;
  style?: ViewStyle;
  /** Hide on narrow layouts (web only; no-op on native). */
  minWidth?: number;
};

/** Native / SSR: empty 5:4 box so layout does not shift on web when Hairline mounts. */
export function HairlineFigure({ style }: Props) {
  return <View style={[{ width: "100%", aspectRatio: 5 / 4 }, style]} pointerEvents="none" />;
}
