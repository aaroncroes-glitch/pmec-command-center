import {
  Branches,
  Cabinet,
  Drawer,
  Laptop,
  Loupe,
  Padlock,
  Plot,
  Router,
  Terrain,
  Vault,
} from "@lucasmarkes/hairline/react";
import { useMemo } from "react";
import { useWindowDimensions, View, type ViewStyle } from "react-native";

import { hairlineThemeVars } from "@/lib/hairline-theme";
import { useLumen } from "@/lib/lumen-workspace";
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
  plate?: string;
  themeMode?: ThemeMode;
  intensity?: number;
  label?: string;
  style?: ViewStyle;
  minWidth?: number;
};

const figures = {
  branches: Branches,
  cabinet: Cabinet,
  drawer: Drawer,
  laptop: Laptop,
  loupe: Loupe,
  padlock: Padlock,
  plot: Plot,
  router: Router,
  terrain: Terrain,
  vault: Vault,
} as const;

export function HairlineFigure({
  name,
  plate,
  themeMode,
  intensity = 0.55,
  label,
  style,
  minWidth = 0,
}: Props) {
  const { width } = useWindowDimensions();
  const { palette, themeMode: workspaceTheme } = useLumen();
  const mode = themeMode ?? workspaceTheme;
  const plateColor = plate ?? palette.background;
  const themeStyle = useMemo(() => hairlineThemeVars(palette, plateColor), [palette, plateColor]);

  if (minWidth > 0 && width < minWidth) {
    return null;
  }

  const Figure = figures[name];

  return (
    <View style={[{ width: "100%", maxWidth: "100%" }, style]} pointerEvents="auto">
      <Figure
        intensity={intensity}
        theme={mode}
        label={label}
        style={{
          width: "100%",
          ...themeStyle,
        }}
      />
    </View>
  );
}
