import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type ComponentProps } from "react";
import { type OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

const MAPPING = {
  checklist: "checklist",
  "folder.fill": "folder",
  target: "my-location",
  "gearshape.fill": "settings",
  "calendar": "calendar-today",
  "chevron.left": "chevron-left",
  "house.fill": "home",
  "chevron.right": "chevron-right",
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  return <MaterialIcons color={color} name={MAPPING[name]} size={size} style={style} />;
}
