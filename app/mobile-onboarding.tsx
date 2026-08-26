import * as Linking from "expo-linking";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, Image, useWindowDimensions } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useLumen } from "@/lib/lumen-workspace";

const EMPLOYEE_ENTRY_URL = "https://portal.pmec.group/ess/login";

const steps = [
  ["01", "Scan the code", "Open your phone camera and scan the QR code to open the PMEC Employee workspace."],
  ["02", "Sign in securely", "Use your PMEC work email and the access details provided separately by your manager or administrator."],
  ["03", "Set your workspace", "Review your assigned work and choose your notification preferences so you are ready for your first shift."],
] as const;

export default function MobileOnboardingHandout() {
  const { palette } = useLumen();
  const { width } = useWindowDimensions();
  const styles = makeStyles(palette);
  const compact = width < 640;

  const openEmployeeWorkspace = () => {
    void Linking.openURL(EMPLOYEE_ENTRY_URL);
  };

  const printHandout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <ScreenContainer containerClassName={styles.page} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandLine}>
          <Text style={styles.brand}>PMEC</Text>
          <Text style={styles.brandDivider}>/</Text>
          <Text style={styles.brandSub}>EMPLOYEE ONBOARDING</Text>
          <Text style={styles.issue}>MOBILE ACCESS GUIDE · 2026</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>WELCOME TO PMEC</Text>
            <Text style={styles.title}>Your first day,{"\n"}in one scan.</Text>
            <Text style={styles.intro}>Open the PMEC Employee workspace on your phone to see your assigned work, log time, review notices, and manage your personal work settings.</Text>
            <View style={styles.heroRule} />
            <Text style={styles.securityNote}>YOUR SIGN-IN DETAILS ARE PROVIDED SEPARATELY. THIS HANDOUT DOES NOT INCLUDE PASSWORDS OR ACCESS CODES.</Text>
          </View>

          <View style={styles.qrPanel}>
            <View style={styles.qrFrame}>
              <Image accessibilityLabel="QR code that opens the PMEC Employee mobile workspace" source={require("../assets/images/employee-mobile-launch-qr.png")} style={styles.qrCode} />
            </View>
            <Text style={styles.qrLabel}>SCAN TO OPEN</Text>
            <Text style={styles.qrCaption}>PMEC Employee Workspace</Text>
          </View>
        </View>

        <View style={styles.routeLine}>
          <Text style={styles.routeLabel}>MOBILE ENTRY</Text>
          <Text style={styles.routeUrl}>portal.pmec.group/ess/login</Text>
        </View>

        <View style={[styles.steps, compact && styles.stepsCompact]}>
          {steps.map(([number, title, body]) => (
            <View key={number} style={[styles.step, compact && styles.stepCompact]}>
              <Text style={styles.stepNumber}>{number}</Text>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepBody}>{body}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <Pressable accessibilityLabel="Open the PMEC Employee mobile workspace" onPress={openEmployeeWorkspace} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionText}>OPEN EMPLOYEE WORKSPACE →</Text>
          </Pressable>
          {Platform.OS === "web" ? (
            <Pressable accessibilityLabel="Print the PMEC Employee onboarding handout" onPress={printHandout} style={({ pressed }) => [styles.printAction, pressed && styles.pressed]}>
              <Text style={styles.printActionText}>PRINT HANDOUT</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpLabel}>NEED HELP?</Text>
          <Text style={styles.helpCopy}>If you cannot open the link or do not have your work access details, contact your PMEC manager or administrator before your first scheduled shift.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>PMEC COMMAND CENTER · EMPLOYEE WORKSPACE</Text>
          <Text style={styles.footerText}>MOBILE-FIRST · ROLE-SECURED</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({
  page: { backgroundColor: palette.background },
  content: { alignSelf: "center", maxWidth: 960, paddingBottom: 54, paddingHorizontal: 24, paddingTop: 24, width: "100%" },
  brandLine: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  brand: { color: palette.foreground, fontSize: 20, fontWeight: "900", letterSpacing: -0.8 },
  brandDivider: { color: palette.accent, fontSize: 19, fontWeight: "900" },
  brandSub: { color: palette.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  issue: { color: palette.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7, marginLeft: "auto" },
  hero: { backgroundColor: palette.foreground, flexDirection: "row", gap: 28, marginTop: 28, padding: 28 },
  heroCopy: { flex: 1, minWidth: 220 },
  eyebrow: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  title: { color: palette.background, fontSize: 48, fontWeight: "900", letterSpacing: -2.5, lineHeight: 50 },
  intro: { color: palette.background, fontSize: 14, fontWeight: "500", lineHeight: 22, marginTop: 18, maxWidth: 520, opacity: 0.84 },
  heroRule: { backgroundColor: palette.accent, height: 3, marginTop: 22, width: 40 },
  securityNote: { color: palette.background, fontSize: 9, fontWeight: "900", letterSpacing: 0.65, lineHeight: 14, marginTop: 12, maxWidth: 540, opacity: 0.9 },
  qrPanel: { alignItems: "center", backgroundColor: palette.background, justifyContent: "center", minWidth: 210, padding: 14 },
  qrFrame: { backgroundColor: palette.surfaceStrong, padding: 9 },
  qrCode: { height: 150, width: 150 },
  qrLabel: { color: palette.foreground, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 12 },
  qrCaption: { color: palette.muted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  routeLine: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 14, paddingVertical: 14 },
  routeLabel: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  routeUrl: { color: palette.foreground, fontSize: 13, fontWeight: "800", letterSpacing: -0.1 },
  steps: { flexDirection: "row", marginTop: 14 },
  stepsCompact: { flexDirection: "column" },
  step: { borderRightColor: palette.border, borderRightWidth: StyleSheet.hairlineWidth, flex: 1, minHeight: 156, padding: 18 },
  stepCompact: { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, borderRightWidth: 0, minHeight: 0 },
  stepNumber: { color: palette.accent, fontSize: 11, fontWeight: "900", letterSpacing: 0.9 },
  stepTitle: { color: palette.foreground, fontSize: 18, fontWeight: "900", letterSpacing: -0.35, marginTop: 18 },
  stepBody: { color: palette.muted, fontSize: 12, fontWeight: "500", lineHeight: 19, marginTop: 8 },
  actions: { alignItems: "center", flexDirection: "row", gap: 12, marginTop: 28 },
  actionsCompact: { alignItems: "stretch", flexDirection: "column" },
  primaryAction: { alignItems: "center", backgroundColor: palette.accent, justifyContent: "center", minHeight: 50, paddingHorizontal: 22 },
  primaryActionText: { color: palette.foreground, fontSize: 11, fontWeight: "900", letterSpacing: 0.85 },
  printAction: { alignItems: "center", borderColor: palette.foreground, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", minHeight: 50, paddingHorizontal: 20 },
  printActionText: { color: palette.foreground, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  helpCard: { backgroundColor: palette.surfaceStrong, marginTop: 28, padding: 20 },
  helpLabel: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 7 },
  helpCopy: { color: palette.foreground, fontSize: 13, fontWeight: "600", lineHeight: 20, maxWidth: 720 },
  footer: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", marginTop: 34, paddingTop: 16 },
  footerText: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.75 },
});
