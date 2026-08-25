import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useEss } from "@/lib/ess-workspace";
import { useLumen } from "@/lib/lumen-workspace";
import { usePmecAccess, type PmecControlRole } from "@/lib/pmec-access";

type DemoAccount = { email: string; password: string; role: "employee" | PmecControlRole; name: string; destination: string };

const demoAccounts: DemoAccount[] = [
  { email: "employee.demo@pmec.group", password: "PMEC-Demo-Emp-2026!", role: "employee", name: "Employee workspace", destination: "Assigned work, hours, leave, and notifications" },
  { email: "pm.demo@pmec.group", password: "PMEC-Demo-PM-2026!", role: "pm", name: "Project Manager control center", destination: "Delivery, assignments, hours, and capacity" },
  { email: "hr.demo@pmec.group", password: "PMEC-Demo-HR-2026!", role: "hr", name: "HR control center", destination: "People, leave, workforce planning, and payroll preview" },
];

export default function PmecDemoScreen() {
  const router = useRouter();
  const { completeOnboarding, employee, signIn } = useEss();
  const { setRole } = usePmecAccess();
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const choose = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  const enter = () => {
    const account = demoAccounts.find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password);
    if (!account) {
      setError("Choose one of the PMEC demonstration accounts shown above.");
      return;
    }
    if (account.role === "employee") {
      completeOnboarding();
      signIn(employee.employeeNumber, employee.pin);
      router.replace("/(tabs)");
      return;
    }
    setRole(account.role);
    router.replace("/control-center");
  };

  return <ScreenContainer containerClassName={styles.container} edges={["top", "bottom", "left", "right"]}><View style={styles.root}><Animated.View entering={FadeInDown.duration(260)}><Text style={styles.kicker}>PMEC / CLIENT SHOWCASE</Text><Text style={styles.title}>EXPLORE{`\n`}EVERY ROLE.</Text><Text style={styles.intro}>Use a separate demo account to walk through the Employee, Project Manager, and HR workspaces with isolated sample data.</Text></Animated.View><View style={styles.cards}>{demoAccounts.map((account) => <Pressable key={account.role} accessibilityRole="button" onPress={() => choose(account)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><Text style={styles.cardLabel}>{account.role === "employee" ? "EMPLOYEE" : account.role === "pm" ? "PROJECT MANAGER" : "HUMAN RESOURCES"}</Text><Text style={styles.cardTitle}>{account.name}</Text><Text style={styles.cardCopy}>{account.destination}</Text></Pressable>)}</View><View style={styles.form}><Text style={styles.fieldLabel}>DEMO EMAIL</Text><TextInput accessibilityLabel="Demo email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" onChangeText={setEmail} placeholder="Choose an account above" placeholderTextColor={palette.muted} style={styles.input} value={email} /><Text style={styles.fieldLabel}>DEMO PASSWORD</Text><TextInput accessibilityLabel="Demo password" onChangeText={setPassword} placeholder="Enter the matching password" placeholderTextColor={palette.muted} secureTextEntry style={styles.input} value={password} />{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable accessibilityRole="button" onPress={enter} style={({ pressed }) => [styles.enterButton, pressed && styles.pressed]}><Text style={styles.enterText}>OPEN DEMONSTRATION</Text><Text style={styles.enterArrow}>→</Text></Pressable></View><Text style={styles.security}>LOCAL SHOWCASE ONLY · NO PRODUCTION DELIVERY OR PAYROLL ACCESS</Text></View></ScreenContainer>;
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({ container: { backgroundColor: palette.background }, root: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 }, kicker: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 10 }, title: { color: palette.foreground, fontSize: 44, fontWeight: "900", letterSpacing: -2.1, lineHeight: 48, marginTop: 12 }, intro: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 13, maxWidth: 420 }, cards: { gap: 9, marginTop: 24 }, card: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: 16, borderWidth: 1, padding: 15 }, cardLabel: { color: palette.accent, fontSize: 9, fontWeight: "900", letterSpacing: .85 }, cardTitle: { color: palette.foreground, fontSize: 16, fontWeight: "900", marginTop: 4 }, cardCopy: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, form: { marginTop: "auto", paddingTop: 18 }, fieldLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: .8, marginTop: 12 }, input: { borderBottomColor: palette.border, borderBottomWidth: 1, color: palette.foreground, fontSize: 15, fontWeight: "700", height: 42 }, error: { color: palette.accent, fontSize: 12, fontWeight: "700", marginTop: 11 }, enterButton: { alignItems: "center", backgroundColor: palette.foreground, borderRadius: 17, flexDirection: "row", height: 56, justifyContent: "center", marginTop: 18 }, enterText: { color: palette.inverseText, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, enterArrow: { color: palette.accent, fontSize: 20, marginLeft: 8 }, security: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: .65, marginTop: 18, textAlign: "center" }, pressed: { opacity: .86, transform: [{ scale: .985 }] } });
