import type { ViewStyle } from "react-native";

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
  /** Hide on narrow layouts (web only). */
  minWidth?: number;
};

/** Native: no figure and no reserved space. */
export function HairlineFigure(_props: Props) {
  return null;
}
