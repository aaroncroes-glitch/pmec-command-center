import { Redirect, Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getPmecHostWorkspace } from "@/lib/pmec-host-routing";
import { useLumen } from "@/lib/lumen-workspace";

export default function TabLayout() {
  const { palette } = useLumen();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hostWorkspace = getPmecHostWorkspace();
  const bottomPadding = Platform.OS === "web" ? 11 : Math.max(insets.bottom, 9);
  const isDesktopEmployeeView = width >= 760;

  if (hostWorkspace === "hr" || hostWorkspace === "pm") {
    return <Redirect href="/control-center" />;
  }

  return (
    <View style={styles.shell}>
      {isDesktopEmployeeView ? (
        <View style={[styles.desktopAdvisory, { backgroundColor: palette.surfaceStrong, borderBottomColor: palette.border }]}>
          <Text style={[styles.desktopAdvisoryEyebrow, { color: palette.accent }]}>PMEC / EMPLOYEE WORKSPACE</Text>
          <Text style={[styles.desktopAdvisoryCopy, { color: palette.foreground }]}>Optimized for mobile devices. For workforce planning, delivery controls, and HR operations, use the dedicated iPad or desktop workspaces.</Text>
        </View>
      ) : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.muted,
          tabBarButton: HapticTab,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: styles.label,
          tabBarStyle: {
            backgroundColor: palette.background,
            borderTopColor: palette.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: 57 + bottomPadding,
            paddingBottom: bottomPadding,
            paddingTop: 7,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <IconSymbol color={color} name="checklist" size={21} /> }} />
        <Tabs.Screen name="work" options={{ title: "Work", tabBarIcon: ({ color }) => <IconSymbol color={color} name="calendar" size={21} /> }} />
        <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: ({ color }) => <IconSymbol color={color} name="folder.fill" size={21} /> }} />
        <Tabs.Screen name="pay" options={{ title: "Pay", tabBarIcon: ({ color }) => <IconSymbol color={color} name="creditcard.fill" size={21} /> }} />
        <Tabs.Screen name="settings" options={{ title: "Profile", tabBarIcon: ({ color }) => <IconSymbol color={color} name="gearshape.fill" size={21} /> }} />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="focus" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2, marginTop: 2 },
  desktopAdvisory: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 22, paddingVertical: 10 },
  desktopAdvisoryEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 0.85 },
  desktopAdvisoryCopy: { fontSize: 11, fontWeight: "600", lineHeight: 16, marginTop: 3, maxWidth: 760 },
});
