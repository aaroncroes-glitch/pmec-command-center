import * as Linking from "expo-linking";
import { Asset } from "expo-asset";
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useLumen } from "@/lib/lumen-workspace";

const EMPLOYEE_ENTRY_URL = "https://portal.pmec.group/ess/login";
const QR_SOURCE = require("../assets/images/employee-mobile-launch-qr.png");

const steps = [
  ["01", "Scan the code", "Open your phone camera and scan the QR code to open the PMEC Employee workspace."],
  ["02", "Sign in securely", "Use your PMEC work email and the access details provided separately by your manager or administrator."],
  ["03", "Set your workspace", "Review your assigned work and choose your notification preferences so you are ready for your first shift."],
] as const;

const toDataUrl = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to prepare QR image for PDF export."));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
};

export default function MobileOnboardingHandout() {
  const { palette } = useLumen();
  const { width } = useWindowDimensions();
  const styles = makeStyles(palette);
  const compact = width < 640;
  const [managerName, setManagerName] = useState("Your PMEC Manager");
  const [managerContact, setManagerContact] = useState("Contact details supplied in your welcome invitation");
  const [exporting, setExporting] = useState(false);

  const openEmployeeWorkspace = () => {
    void Linking.openURL(EMPLOYEE_ENTRY_URL);
  };

  const printHandout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.print();
    }
  };

  const exportPdf = async () => {
    if (Platform.OS !== "web" || exporting) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ format: "a4", orientation: "portrait", unit: "pt" });
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 42;
      const qrAsset = Asset.fromModule(QR_SOURCE);
      await qrAsset.downloadAsync();
      const qrData = await toDataUrl(qrAsset.localUri ?? qrAsset.uri);

      pdf.setFillColor(246, 243, 238);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setTextColor(24, 24, 24);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("PMEC", margin, 42);
      pdf.setTextColor(255, 90, 31);
      pdf.text("/", 92, 42);
      pdf.setTextColor(95, 95, 95);
      pdf.setFontSize(8);
      pdf.text("EMPLOYEE ONBOARDING", 105, 41);
      pdf.text("MOBILE ACCESS GUIDE · 2026", pageWidth - margin, 41, { align: "right" });

      pdf.setFillColor(24, 24, 24);
      pdf.rect(margin, 62, pageWidth - margin * 2, 224, "F");
      pdf.setTextColor(255, 90, 31);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("WELCOME TO PMEC", margin + 22, 92);
      pdf.setTextColor(246, 243, 238);
      pdf.setFontSize(33);
      pdf.text(["Your first day,", "in one scan."], margin + 22, 130, { lineHeightFactor: 1.04 });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(pdf.splitTextToSize("Open the PMEC Employee workspace on your phone to see your assigned work, log time, review notices, and manage your personal work settings.", 262), margin + 22, 211, { lineHeightFactor: 1.4 });
      pdf.setDrawColor(255, 90, 31);
      pdf.setLineWidth(2);
      pdf.line(margin + 22, 248, margin + 56, 248);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.text(pdf.splitTextToSize("YOUR SIGN-IN DETAILS ARE PROVIDED SEPARATELY. THIS HANDOUT DOES NOT INCLUDE PASSWORDS OR ACCESS CODES.", 280), margin + 22, 264, { lineHeightFactor: 1.45 });

      pdf.setFillColor(255, 255, 255);
      pdf.rect(385, 84, 124, 174, "F");
      pdf.setFillColor(231, 224, 216);
      pdf.rect(397, 96, 100, 100, "F");
      pdf.addImage(qrData, "PNG", 403, 102, 88, 88);
      pdf.setTextColor(24, 24, 24);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text("SCAN TO OPEN", 447, 215, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("PMEC Employee Workspace", 447, 227, { align: "center" });

      pdf.setDrawColor(210, 204, 196);
      pdf.setLineWidth(0.6);
      pdf.line(margin, 304, pageWidth - margin, 304);
      pdf.setTextColor(255, 90, 31);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.text("MOBILE ENTRY", margin, 321);
      pdf.setTextColor(24, 24, 24);
      pdf.setFontSize(9);
      pdf.text("portal.pmec.group/ess/login", 112, 321);

      const columnWidth = (pageWidth - margin * 2) / 3;
      steps.forEach(([number, title, body], index) => {
        const x = margin + columnWidth * index;
        if (index > 0) pdf.line(x, 342, x, 470);
        pdf.setTextColor(255, 90, 31);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(number, x + 16, 361);
        pdf.setTextColor(24, 24, 24);
        pdf.setFontSize(13);
        pdf.text(title, x + 16, 393);
        pdf.setTextColor(95, 95, 95);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text(pdf.splitTextToSize(body, columnWidth - 34), x + 16, 412, { lineHeightFactor: 1.45 });
      });

      pdf.setFillColor(231, 224, 216);
      pdf.rect(margin, 500, pageWidth - margin * 2, 126, "F");
      pdf.setTextColor(255, 90, 31);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("YOUR PMEC CONTACT", margin + 18, 526);
      pdf.setTextColor(24, 24, 24);
      pdf.setFontSize(13);
      pdf.text(managerName.trim() || "Your PMEC Manager", margin + 18, 552);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(pdf.splitTextToSize(managerContact.trim() || "Contact details supplied in your welcome invitation", pageWidth - margin * 2 - 36), margin + 18, 572, { lineHeightFactor: 1.5 });
      pdf.setTextColor(95, 95, 95);
      pdf.setFontSize(8.5);
      pdf.text("If you cannot open the link or do not have your work access details, contact your PMEC manager or administrator before your first scheduled shift.", margin + 18, 607, { maxWidth: pageWidth - margin * 2 - 36 });

      pdf.setDrawColor(210, 204, 196);
      pdf.line(margin, 760, pageWidth - margin, 760);
      pdf.setTextColor(95, 95, 95);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text("PMEC COMMAND CENTER · EMPLOYEE WORKSPACE", margin, 778);
      pdf.text("MOBILE-FIRST · ROLE-SECURED", pageWidth - margin, 778, { align: "right" });
      const pdfBlob = pdf.output("blob");
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "PMEC-employee-onboarding.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    } finally {
      setExporting(false);
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

        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>WELCOME TO PMEC</Text>
            <Text style={styles.title}>Your first day,{"\n"}in one scan.</Text>
            <Text style={styles.intro}>Open the PMEC Employee workspace on your phone to see your assigned work, log time, review notices, and manage your personal work settings.</Text>
            <View style={styles.heroRule} />
            <Text style={styles.securityNote}>YOUR SIGN-IN DETAILS ARE PROVIDED SEPARATELY. THIS HANDOUT DOES NOT INCLUDE PASSWORDS OR ACCESS CODES.</Text>
          </View>

          <View style={styles.qrPanel}>
            <View style={styles.qrFrame}>
              <Image accessibilityLabel="QR code that opens the PMEC Employee mobile workspace" source={QR_SOURCE} style={styles.qrCode} />
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

        <View style={styles.contactCard}>
          <Text style={styles.contactEyebrow}>YOUR PMEC CONTACT</Text>
          <Text style={styles.contactIntro}>HR can personalize these details before exporting or printing this handout for a new employee.</Text>
          <View style={[styles.contactFields, compact && styles.contactFieldsCompact]}>
            <View style={styles.contactField}>
              <Text style={styles.inputLabel}>MANAGER NAME</Text>
              <TextInput accessibilityLabel="Manager name for the onboarding handout" onChangeText={setManagerName} placeholder="Manager name" placeholderTextColor={palette.muted} style={styles.input} value={managerName} />
            </View>
            <View style={styles.contactField}>
              <Text style={styles.inputLabel}>EMAIL OR PHONE</Text>
              <TextInput accessibilityLabel="Manager email or phone for the onboarding handout" onChangeText={setManagerContact} placeholder="Manager email or phone" placeholderTextColor={palette.muted} style={styles.input} value={managerContact} />
            </View>
          </View>
        </View>

        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <Pressable accessibilityLabel="Open the PMEC Employee mobile workspace" onPress={openEmployeeWorkspace} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionText}>OPEN EMPLOYEE WORKSPACE →</Text>
          </Pressable>
          {Platform.OS === "web" ? (
            <>
              <Pressable accessibilityLabel="Download the completed PMEC Employee onboarding handout as a PDF" disabled={exporting} onPress={exportPdf} style={({ pressed }) => [styles.pdfAction, (pressed || exporting) && styles.pressed]}>
                <Text style={styles.pdfActionText}>{exporting ? "PREPARING PDF…" : "DOWNLOAD ONE-PAGE PDF"}</Text>
              </Pressable>
              <Pressable accessibilityLabel="Print the PMEC Employee onboarding handout" onPress={printHandout} style={({ pressed }) => [styles.printAction, pressed && styles.pressed]}>
                <Text style={styles.printActionText}>PRINT HANDOUT</Text>
              </Pressable>
            </>
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
  heroCompact: { flexDirection: "column" },
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
  contactCard: { backgroundColor: palette.surfaceStrong, marginTop: 28, padding: 20 },
  contactEyebrow: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 7 },
  contactIntro: { color: palette.foreground, fontSize: 13, fontWeight: "600", lineHeight: 20, maxWidth: 720 },
  contactFields: { flexDirection: "row", gap: 14, marginTop: 18 },
  contactFieldsCompact: { flexDirection: "column" },
  contactField: { flex: 1 },
  inputLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 7 },
  input: { backgroundColor: palette.background, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth, color: palette.foreground, fontSize: 13, fontWeight: "700", minHeight: 44, paddingHorizontal: 12, paddingVertical: 9 },
  actions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 28 },
  actionsCompact: { alignItems: "stretch", flexDirection: "column" },
  primaryAction: { alignItems: "center", backgroundColor: palette.accent, justifyContent: "center", minHeight: 50, paddingHorizontal: 22 },
  primaryActionText: { color: palette.foreground, fontSize: 11, fontWeight: "900", letterSpacing: 0.85 },
  pdfAction: { alignItems: "center", backgroundColor: palette.foreground, justifyContent: "center", minHeight: 50, paddingHorizontal: 20 },
  pdfActionText: { color: palette.background, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  printAction: { alignItems: "center", borderColor: palette.foreground, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", minHeight: 50, paddingHorizontal: 20 },
  printActionText: { color: palette.foreground, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  helpCard: { backgroundColor: palette.surfaceStrong, marginTop: 28, padding: 20 },
  helpLabel: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 7 },
  helpCopy: { color: palette.foreground, fontSize: 13, fontWeight: "600", lineHeight: 20, maxWidth: 720 },
  footer: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", marginTop: 34, paddingTop: 16 },
  footerText: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.75 },
});
