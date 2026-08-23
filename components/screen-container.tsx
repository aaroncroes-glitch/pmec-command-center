import { type StyleProp, type ViewProps, type ViewStyle, View } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string | StyleProp<ViewStyle>;
  safeAreaClassName?: string;
}

export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  const stringContainerClass = typeof containerClassName === "string" ? containerClassName : undefined;
  const containerStyle = typeof containerClassName === "string" ? undefined : containerClassName;
  return (
    <View className={cn("flex-1", "bg-background", stringContainerClass)} style={containerStyle} {...props}>
      <SafeAreaView edges={edges} className={cn("flex-1", safeAreaClassName)} style={style}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
