import type { ReactNode } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const colors = {
  paper: "#F4F0E8",
  paperStrong: "#EAE3D6",
  ink: "#171512",
  muted: "#746F66",
  rail: "#151515",
  railMuted: "#AAA39A",
  orange: "#F15A2A",
  orangeSoft: "#FBE3D8",
  green: "#2E765B",
  greenSoft: "#DDECE5",
  amber: "#A66712",
  amberSoft: "#F4E6C7",
  red: "#A84331",
  redSoft: "#F3DDDA",
  line: "#D6CFC2",
  white: "#FFFFFF",
};

export type DemoTone = "neutral" | "orange" | "green" | "amber" | "red";

export function DemoFrame({
  role,
  title,
  subtitle,
  navItems,
  activeNav,
  onNavigate,
  children,
}: {
  role: string;
  title: string;
  subtitle: string;
  navItems: string[];
  activeNav: string;
  onNavigate: (item: string) => void;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  if (width < 760) {
    return (
      <SafeAreaView style={styles.gate}>
        <View style={styles.gateMark}><Text style={styles.gateMarkText}>PMEC</Text></View>
        <Text style={styles.gateEyebrow}>{role.toUpperCase()} · UI/UX DEMO</Text>
        <Text style={styles.gateTitle}>Designed for a wider view.</Text>
        <Text style={styles.gateCopy}>Open this design prototype on desktop or iPad landscape to review the streamlined workspace.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.shell}>
        <View style={styles.rail}>
          <View>
            <View style={styles.logoLine}><Text style={styles.logo}>PMEC</Text><View style={styles.logoRule} /></View>
            <Text style={styles.railLabel}>{role.toUpperCase()}</Text>
            <View style={styles.nav}>{navItems.map((item) => <Pressable key={item} onPress={() => onNavigate(item)} style={[styles.navItem, activeNav === item && styles.navItemActive]}><Text style={[styles.navText, activeNav === item && styles.navTextActive]}>{item}</Text></Pressable>)}</View>
          </View>
          <View style={styles.railFooter}>
            <Text style={styles.railFooterTitle}>UI/UX DEMO</Text>
            <Text style={styles.railFooterCopy}>Local presentation only.{"\n"}Not linked to live workspaces.</Text>
          </View>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          <View style={styles.topline}><Text style={styles.eyebrow}>PMEC / {role.toUpperCase()} DESIGN LAB</Text><View style={styles.demoPill}><Text style={styles.demoPillText}>ISOLATED DEMO · NOT LIVE</Text></View></View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
          <View style={styles.boundary}><Text style={styles.boundaryTitle}>Prototype boundary</Text><Text style={styles.boundaryCopy}>This page is intentionally isolated from the production PMEC workspaces, server APIs, payroll, and live personnel records. Approve individual patterns here before any deliberate production implementation.</Text></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function DemoMetric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: DemoTone }) {
  return <View style={[styles.metric, toneStyle(tone).metric]}><Text style={[styles.metricLabel, toneStyle(tone).text]}>{label}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricDetail}>{detail}</Text></View>;
}

export function DemoTag({ label, tone = "neutral" }: { label: string; tone?: DemoTone }) {
  return <View style={[styles.tag, toneStyle(tone).tag]}><Text style={[styles.tagText, toneStyle(tone).text]}>{label}</Text></View>;
}

export function DemoBar({ value, tone = "orange" }: { value: number; tone?: DemoTone }) {
  const width = `${Math.max(4, Math.min(value, 100))}%` as `${number}%`;
  return <View style={styles.barTrack}><View style={[styles.barFill, toneStyle(tone).bar, { width }]} /></View>;
}

export function DemoSection({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text></Pressable> : null}</View>{children}</View>;
}

export function DemoButton({ label, onPress, muted = false }: { label: string; onPress: () => void; muted?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.button, muted && styles.buttonMuted, pressed && styles.buttonPressed]}><Text style={[styles.buttonText, muted && styles.buttonMutedText]}>{label}</Text></Pressable>;
}

function toneStyle(tone: DemoTone) {
  if (tone === "orange") return { metric: styles.metricOrange, tag: styles.tagOrange, text: styles.textOrange, bar: styles.barOrange };
  if (tone === "green") return { metric: styles.metricGreen, tag: styles.tagGreen, text: styles.textGreen, bar: styles.barGreen };
  if (tone === "amber") return { metric: styles.metricAmber, tag: styles.tagAmber, text: styles.textAmber, bar: styles.barAmber };
  if (tone === "red") return { metric: styles.metricRed, tag: styles.tagRed, text: styles.textRed, bar: styles.barRed };
  return { metric: styles.metricNeutral, tag: styles.tagNeutral, text: styles.textNeutral, bar: styles.barNeutral };
}

export const demoStyles = StyleSheet.create({
  metricGrid: { flexDirection: "row", gap: 12, marginTop: 26 },
  split: { flexDirection: "row", gap: 16, marginTop: 16, alignItems: "flex-start" },
  main: { flex: 1.35, gap: 16 },
  side: { flex: 0.85, gap: 16 },
  attentionRow: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  rowTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "700", flex: 1 },
  rowMeta: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  rowAction: { color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  focusCard: { backgroundColor: colors.rail, padding: 20, gap: 14 },
  focusEyebrow: { color: "#F99A79", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  focusTitle: { color: colors.white, fontSize: 23, lineHeight: 27, fontWeight: "800" },
  focusCopy: { color: "#C6BEB3", fontSize: 13, lineHeight: 19 },
  focusMetric: { color: colors.white, fontSize: 28, fontWeight: "800" },
  focusMetricLabel: { color: "#A9A196", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  lightBarTrack: { backgroundColor: "#433E37", height: 5, width: "100%" },
  lightBarFill: { backgroundColor: colors.orange, height: 5 },
  milestoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  milestoneDot: { width: 9, height: 9, borderRadius: 6, backgroundColor: colors.orange },
  milestoneLine: { flex: 1, height: 1, backgroundColor: "#514A42" },
  milestoneLabel: { color: "#C6BEB3", fontSize: 11, flex: 1 },
  insight: { backgroundColor: colors.paperStrong, padding: 17, gap: 6 },
  insightValue: { color: colors.ink, fontSize: 26, fontWeight: "800" },
  insightLabel: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  capacityStrip: { flexDirection: "row", gap: 7, alignItems: "flex-end", paddingTop: 8 },
  capacityDay: { flex: 1, gap: 6, alignItems: "center" },
  capacityColumn: { width: "100%", height: 54, backgroundColor: colors.paperStrong, justifyContent: "flex-end" },
  capacityFill: { width: "100%", backgroundColor: colors.green },
  capacityLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  personSelected: { backgroundColor: colors.orangeSoft, marginHorizontal: -8, paddingHorizontal: 8 },
  personContext: { backgroundColor: colors.paperStrong, padding: 16, gap: 8 },
  personName: { color: colors.ink, fontSize: 19, fontWeight: "800" },
  personMeta: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  activeNote: { backgroundColor: colors.orangeSoft, borderLeftWidth: 3, borderLeftColor: colors.orange, padding: 13, marginTop: 16 },
  activeNoteText: { color: colors.ink, fontSize: 12, lineHeight: 18 },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  shell: { flex: 1, flexDirection: "row", backgroundColor: colors.paper },
  rail: { width: 208, backgroundColor: colors.rail, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 24, justifyContent: "space-between" },
  logoLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { color: colors.white, fontSize: 21, letterSpacing: -0.6, fontWeight: "900" },
  logoRule: { height: 4, width: 26, backgroundColor: colors.orange },
  railLabel: { color: colors.railMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginTop: 25 },
  nav: { borderTopWidth: 1, borderTopColor: "#2D2B29", marginTop: 18, paddingTop: 8 },
  navItem: { paddingVertical: 11, paddingHorizontal: 10, marginHorizontal: -10 },
  navItemActive: { backgroundColor: "#2A2825", borderLeftWidth: 2, borderLeftColor: colors.orange },
  navText: { color: colors.railMuted, fontSize: 12, fontWeight: "700" },
  navTextActive: { color: colors.white },
  railFooter: { borderTopWidth: 1, borderTopColor: "#2D2B29", paddingTop: 16 },
  railFooterTitle: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  railFooterCopy: { color: colors.railMuted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 42, paddingTop: 30, paddingBottom: 40, maxWidth: 1330, width: "100%", alignSelf: "center" },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  eyebrow: { color: colors.orange, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  demoPill: { backgroundColor: colors.paperStrong, paddingVertical: 7, paddingHorizontal: 10 },
  demoPillText: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 43, lineHeight: 46, fontWeight: "900", letterSpacing: -1.7, marginTop: 16, maxWidth: 560 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 650 },
  metric: { flex: 1, minHeight: 112, padding: 16, gap: 8 },
  metricNeutral: { backgroundColor: colors.paperStrong }, metricOrange: { backgroundColor: colors.orangeSoft }, metricGreen: { backgroundColor: colors.greenSoft }, metricAmber: { backgroundColor: colors.amberSoft }, metricRed: { backgroundColor: colors.redSoft },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  metricValue: { color: colors.ink, fontSize: 28, fontWeight: "900", letterSpacing: -0.7 },
  metricDetail: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  section: { backgroundColor: colors.white, padding: 20, borderWidth: 1, borderColor: colors.line },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 12, fontWeight: "900", letterSpacing: 0.9 },
  sectionAction: { paddingVertical: 5 }, sectionActionText: { color: colors.orange, fontSize: 10, fontWeight: "900", letterSpacing: 0.65 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4 },
  tagNeutral: { backgroundColor: colors.paperStrong }, tagOrange: { backgroundColor: colors.orangeSoft }, tagGreen: { backgroundColor: colors.greenSoft }, tagAmber: { backgroundColor: colors.amberSoft }, tagRed: { backgroundColor: colors.redSoft },
  tagText: { color: colors.ink, fontSize: 9, fontWeight: "900", letterSpacing: 0.45 }, textNeutral: { color: colors.muted }, textOrange: { color: colors.orange }, textGreen: { color: colors.green }, textAmber: { color: colors.amber }, textRed: { color: colors.red },
  barTrack: { backgroundColor: colors.paperStrong, height: 6, width: "100%" }, barFill: { height: 6 }, barNeutral: { backgroundColor: colors.ink }, barOrange: { backgroundColor: colors.orange }, barGreen: { backgroundColor: colors.green }, barAmber: { backgroundColor: colors.amber }, barRed: { backgroundColor: colors.red },
  button: { backgroundColor: colors.rail, minHeight: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }, buttonPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, buttonText: { color: colors.white, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, buttonMuted: { backgroundColor: colors.paperStrong }, buttonMutedText: { color: colors.ink },
  boundary: { backgroundColor: colors.paperStrong, padding: 17, marginTop: 24, flexDirection: "row", gap: 22, alignItems: "flex-start" }, boundaryTitle: { color: colors.ink, fontSize: 11, fontWeight: "900", width: 128 }, boundaryCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, flex: 1, maxWidth: 680 },
  gate: { flex: 1, padding: 28, backgroundColor: colors.paper, justifyContent: "center" }, gateMark: { backgroundColor: colors.rail, width: 64, height: 64, alignItems: "center", justifyContent: "center", marginBottom: 24 }, gateMarkText: { color: colors.white, fontWeight: "900", fontSize: 14 }, gateEyebrow: { color: colors.orange, fontWeight: "900", fontSize: 10, letterSpacing: 1.1 }, gateTitle: { color: colors.ink, fontSize: 38, lineHeight: 42, fontWeight: "900", letterSpacing: -1.3, marginTop: 10, maxWidth: 360 }, gateCopy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 390 },
});
