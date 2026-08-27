import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useEss } from "@/lib/ess-workspace";
import { useLumen } from "@/lib/lumen-workspace";
import { usePmecAccess, type PmecControlRole } from "@/lib/pmec-access";

type DemoRole = "employee" | PmecControlRole;
type DemoWorkspace = { role: DemoRole; label: string; name: string; destination: string; device: string };

const demoWorkspaces: DemoWorkspace[] = [
  { role: "employee", label: "EMPLOYEE", name: "Employee workspace", destination: "Assigned work, hours, leave, and notifications", device: "MOBILE-FIRST WORKSPACE" },
  { role: "pm", label: "PROJECT MANAGER", name: "Project Manager control center", destination: "Delivery, assignments, hours, and capacity", device: "DESKTOP / IPAD WORKSPACE" },
  { role: "hr", label: "HUMAN RESOURCES", name: "HR control center", destination: "People, leave, workforce planning, and payroll preview", device: "DESKTOP / IPAD WORKSPACE" },
];

export default function PmecDemoScreen() {
  const router = useRouter();
  const { completeOnboarding, employee, signIn } = useEss();
  const { setRole } = usePmecAccess();
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [selectedRole, setSelectedRole] = useState<DemoRole>("employee");
  const selected = demoWorkspaces.find((workspace) => workspace.role === selectedRole) ?? demoWorkspaces[0];

  const enter = () => {
    if (selected.role === "employee") {
      completeOnboarding();
      signIn(employee.employeeNumber, employee.pin);
      router.replace("/(tabs)");
      return;
    }
    setRole(selected.role);
    router.replace("/control-center");
  };

  return <ScreenContainer containerClassName={styles.container} edges={["top", "bottom", "left", "right"]}><View style={styles.root}><Animated.View entering={FadeInDown.duration(260)}><Text style={styles.kicker}>PMEC / SHOWCASE ACCESS</Text><Text style={styles.title}>EXPLORE{`\n`}EVERY ROLE.</Text><Text style={styles.intro}>Select a role to open a guided PMEC demonstration with isolated sample data. No password or Clerk session is required for this presentation route.</Text></Animated.View><View style={styles.cards}>{demoWorkspaces.map((workspace) => { const active = selectedRole === workspace.role; return <Pressable key={workspace.role} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setSelectedRole(workspace.role)} style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.pressed]}><View style={styles.cardTop}><Text style={styles.cardLabel}>{workspace.label}</Text>{active ? <Text style={styles.selected}>SELECTED</Text> : null}</View><Text style={styles.cardTitle}>{workspace.name}</Text><Text style={styles.cardCopy}>{workspace.destination}</Text><Text style={styles.cardDevice}>{workspace.device}</Text></Pressable>; })}</View><View style={styles.launchPanel}><View><Text style={styles.launchLabel}>SHOWCASE MODE · NO PASSWORD REQUIRED</Text><Text style={styles.launchTitle}>{selected.name}</Text><Text style={styles.launchCopy}>Open a local presentation state for the selected role. This does not sign in to Clerk and cannot read or change production delivery or payroll data.</Text></View><Pressable accessibilityRole="button" onPress={enter} style={({ pressed }) => [styles.enterButton, pressed && styles.pressed]}><Text style={styles.enterText}>OPEN {selected.label} SHOWCASE</Text><Text style={styles.enterArrow}>→</Text></Pressable></View><Text style={styles.security}>LOCAL SHOWCASE ONLY · DEVICE-LOCAL SAMPLE DATA · NO PRODUCTION API ACCESS</Text></View></ScreenContainer>;
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({
  container: { backgroundColor: palette.background },
  root: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  kicker: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 10 },
  title: { color: palette.foreground, fontSize: 44, fontWeight: "900", letterSpacing: -2.1, lineHeight: 48, marginTop: 12 },
  intro: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 13, maxWidth: 480 },
  cards: { gap: 9, marginTop: 24 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 16, borderWidth: 1, padding: 15 },
  cardActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent, borderWidth: 1.5 },
  cardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: palette.accent, fontSize: 9, fontWeight: "900", letterSpacing: .85 },
  selected: { color: palette.foreground, fontSize: 8, fontWeight: "900", letterSpacing: .75 },
  cardTitle: { color: palette.foreground, fontSize: 16, fontWeight: "900", marginTop: 4 },
  cardCopy: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  cardDevice: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: .72, marginTop: 11 },
  launchPanel: { backgroundColor: palette.foreground, borderRadius: 18, marginTop: "auto", padding: 18 },
  launchLabel: { color: palette.accent, fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  launchTitle: { color: palette.background, fontSize: 20, fontWeight: "900", letterSpacing: -.5, marginTop: 8 },
  launchCopy: { color: palette.background, fontSize: 12, lineHeight: 18, marginTop: 7, opacity: .8 },
  enterButton: { alignItems: "center", backgroundColor: palette.accent, borderRadius: 13, flexDirection: "row", height: 52, justifyContent: "center", marginTop: 18 },
  enterText: { color: palette.foreground, fontSize: 10, fontWeight: "900", letterSpacing: .8 },
  enterArrow: { color: palette.foreground, fontSize: 20, marginLeft: 8 },
  security: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: .65, marginTop: 18, textAlign: "center" },
  pressed: { opacity: .86, transform: [{ scale: .985 }] },
});
