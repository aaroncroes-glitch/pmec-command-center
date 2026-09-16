import { type StyleProp, StyleSheet, type ViewProps, type ViewStyle, View } from "react-native";
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
  // global.css is not imported, so on the web these Tailwind classes produce no CSS. Without
  // flex set as a style, the container grew to its content, the ScrollView inside had nothing
  // to scroll, and everything below the fold was cut off.
  return (
    <View className={cn("flex-1", "bg-background", stringContainerClass)} style={[styles.fill, containerStyle]} {...props}>
      <SafeAreaView edges={edges} className={cn("flex-1", safeAreaClassName)} style={[styles.fill, style]}>
        <View className={cn("flex-1", className)} style={styles.fill}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
