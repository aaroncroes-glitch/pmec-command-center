import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useLumen } from "@/lib/lumen-workspace";

export type LegalSection = { heading: string; body: string };

export function PmecLegalPage({ title, eyebrow, updated, sections }: { title: string; eyebrow: string; updated: string; sections: LegalSection[] }) {
  const { palette } = useLumen();
  const styles = makeStyles(palette);
  return (
    <ScreenContainer containerClassName={styles.page} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}><Text style={styles.brand}>PMEC</Text><Text style={styles.brandSub}>COMMAND CENTER</Text></View>
        <View style={styles.hero}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.updated}>LAST UPDATED · {updated}</Text></View>
        <View style={styles.divider} />
        {sections.map((section, index) => <View key={section.heading} style={styles.section}><Text style={styles.number}>{String(index + 1).padStart(2, "0")}</Text><View style={styles.sectionBody}><Text style={styles.heading}>{section.heading}</Text><Text style={styles.copy}>{section.body}</Text></View></View>)}
        <View style={styles.contact}><Text style={styles.contactLabel}>PMEC CONTACT</Text><Text style={styles.copy}>For questions about this notice or the PMEC Command Center, contact the PMEC administrator at aaroncroes@raiaaruba.com.</Text></View>
        <View style={styles.footer}><Link href="/privacy" style={styles.footerLink}>PRIVACY</Link><Text style={styles.footerDot}>·</Text><Link href="/terms" style={styles.footerLink}>TERMS</Link><Text style={styles.footerDot}>·</Text><Text style={styles.footerText}>PMEC GROUP</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({
  page: { backgroundColor: palette.background },
  content: { alignSelf: "center", maxWidth: 900, paddingBottom: 56, paddingHorizontal: 24, paddingTop: 24, width: "100%" },
  brandRow: { alignItems: "baseline", flexDirection: "row", gap: 9 },
  brand: { color: palette.foreground, fontSize: 21, fontWeight: "900", letterSpacing: -0.8 },
  brandSub: { color: palette.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  hero: { paddingBottom: 38, paddingTop: 76 },
  eyebrow: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 14 },
  title: { color: palette.foreground, fontSize: 52, fontWeight: "900", letterSpacing: -2.5, lineHeight: 54, maxWidth: 620 },
  updated: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7, marginTop: 20 },
  divider: { backgroundColor: palette.foreground, height: 2, marginBottom: 12 },
  section: { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 18, paddingVertical: 26 },
  number: { color: palette.accent, fontSize: 11, fontWeight: "900", letterSpacing: 0.8, paddingTop: 3, width: 28 },
  sectionBody: { flex: 1 },
  heading: { color: palette.foreground, fontSize: 18, fontWeight: "900", letterSpacing: -0.35, marginBottom: 8 },
  copy: { color: palette.muted, fontSize: 14, lineHeight: 22, maxWidth: 700 },
  contact: { backgroundColor: palette.surfaceStrong, marginTop: 28, padding: 22 },
  contactLabel: { color: palette.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 8 },
  footer: { alignItems: "center", flexDirection: "row", gap: 9, marginTop: 34 },
  footerLink: { color: palette.foreground, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  footerDot: { color: palette.muted, fontSize: 12 },
  footerText: { color: palette.muted, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
});
