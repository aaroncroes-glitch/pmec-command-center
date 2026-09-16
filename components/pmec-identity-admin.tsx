import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useOptionalAuth } from "@/lib/pmec-clerk-optional";

import { trpc } from "@/lib/trpc";
import { useLumen } from "@/lib/lumen-workspace";

type Role = "employee" | "project_manager" | "hr_manager";
const roleOptions: Array<{ value: Role; label: string; surface: string }> = [
  { value: "employee", label: "Employee", surface: "Mobile workspace" },
  { value: "project_manager", label: "Project Manager", surface: "Desktop / iPad" },
  { value: "hr_manager", label: "HR Manager", surface: "Desktop / iPad" },
];

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Identity administration is unavailable.";
  if (/organization administrator/i.test(message)) return "Your verified PMEC role cannot manage memberships.";
  if (/not configured/i.test(message)) return "Identity administration still needs its separate least-privileged Neon credential.";
  return message;
}

export function PmecIdentityAdmin() {
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { isLoaded, isSignedIn } = useOptionalAuth();
  const overview = trpc.pmecIdentityAdmin.overview.useQuery(undefined, { enabled: isLoaded && isSignedIn, retry: false });
  const mapUser = trpc.pmecIdentityAdmin.mapProductionUser.useMutation({ onSuccess: () => overview.refetch() });
  const [selectedClerkUserId, setSelectedClerkUserId] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [workEmail, setWorkEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("Operations");
  const [jobTitle, setJobTitle] = useState("");
  const [legacyEmployeeId, setLegacyEmployeeId] = useState("");
  const selected = overview.data?.clerkUsers.find((user) => user.id === selectedClerkUserId);
  const mappedIds = new Set(overview.data?.people.flatMap((person) => person.clerkUserId ? [person.clerkUserId] : []) ?? []);
  const availableUsers = overview.data?.clerkUsers.filter((user) => !mappedIds.has(user.id)) ?? [];

  const selectUser = (id: string) => {
    const user = availableUsers.find((item) => item.id === id);
    if (!user) return;
    setSelectedClerkUserId(user.id);
    setWorkEmail(user.email ?? "");
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  };

  const submit = () => {
    if (!selected || !workEmail || !firstName || !lastName || !department || !jobTitle) return;
    mapUser.mutate({ clerkUserId: selected.id, workEmail, firstName, lastName, department, jobTitle, role, legacyEmployeeId: legacyEmployeeId || undefined });
  };

  if (!isLoaded || overview.isLoading) return <View style={styles.state}><Text style={styles.stateTitle}>Checking identity administration…</Text><Text style={styles.stateCopy}>PMEC verifies your Clerk account and organization-admin membership before loading personnel data.</Text></View>;
  if (!isSignedIn) return <View style={styles.state}><Text style={styles.stateTitle}>Sign in required</Text><Text style={styles.stateCopy}>Only a verified PMEC organization administrator can link a Production Clerk account to a person and membership.</Text></View>;
  if (overview.error) return <View style={[styles.state, styles.warningState]}><Text style={styles.stateTitle}>Identity administration unavailable</Text><Text style={styles.stateCopy}>{errorMessage(overview.error)}</Text><Text style={styles.note}>No identity or membership change is possible from this state.</Text></View>;
  if (!overview.data) return <View style={styles.state}><Text style={styles.stateTitle}>Identity administration is still loading</Text><Text style={styles.stateCopy}>No identity or membership change is possible until the verified directory is available.</Text></View>;
  const data = overview.data;

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.kicker}>PMEC / ORGANIZATION ADMIN</Text><Text style={styles.title}>Identity mapping,{`\n`}with a paper trail.</Text><Text style={styles.subtitle}>Link a real Production Clerk user to one PMEC person and an active least-privilege membership. Payroll authority is never granted from this workspace.</Text></View><View style={styles.heroCallout}><Text style={styles.heroNumber}>{availableUsers.length}</Text><Text style={styles.heroLabel}>UNLINKED PRODUCTION{`\n`}CLERK ACCOUNTS</Text></View></View>

    <View style={styles.guardrail}><Text style={styles.guardrailTitle}>CONTROL BOUNDARY</Text><Text style={styles.guardrailCopy}>Organization administrators can create employee, Project Manager, and HR memberships. They cannot grant organization-admin or payroll permissions here; those privileges remain independently governed.</Text></View>

    <View style={styles.grid}>
      <View style={styles.card}><Text style={styles.cardKicker}>01 / SELECT A PRODUCTION ACCOUNT</Text><Text style={styles.cardTitle}>Unlinked Clerk users</Text>{availableUsers.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>{availableUsers.map((user) => <Pressable key={user.id} onPress={() => selectUser(user.id)} style={[styles.userChoice, selectedClerkUserId === user.id && styles.userChoiceActive]}><Text style={[styles.userChoiceName, selectedClerkUserId === user.id && styles.userChoiceNameActive]}>{user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Unnamed account"}</Text><Text style={[styles.userChoiceMeta, selectedClerkUserId === user.id && styles.userChoiceMetaActive]}>{user.email ?? "No email on account"}</Text></Pressable>)}</ScrollView> : <Text style={styles.empty}>No unlinked Production Clerk users are available. Ask the team member to finish Clerk sign-in first.</Text>}</View>
      <View style={styles.card}><Text style={styles.cardKicker}>02 / CHOOSE THE LEAST-PRIVILEGE ROLE</Text><Text style={styles.cardTitle}>Membership and surface</Text><View style={styles.roleRow}>{roleOptions.map((option) => <Pressable key={option.value} onPress={() => setRole(option.value)} style={[styles.roleChoice, role === option.value && styles.roleChoiceActive]}><Text style={[styles.roleChoiceTitle, role === option.value && styles.roleChoiceTitleActive]}>{option.label.toUpperCase()}</Text><Text style={[styles.roleChoiceMeta, role === option.value && styles.roleChoiceMetaActive]}>{option.surface}</Text></Pressable>)}</View><Text style={styles.note}>The selected role determines the account’s permitted PMEC surface. Permissions are resolved server-side from Neon at every request.</Text></View>
    </View>

    <View style={styles.card}><Text style={styles.cardKicker}>03 / COMPLETE PERSON RECORD</Text><Text style={styles.cardTitle}>Confirm work identity before activation</Text><View style={styles.fields}><Field styles={styles} label="WORK EMAIL" value={workEmail} onChangeText={setWorkEmail} placeholder="name@company.com" keyboardType="email-address" /><Field styles={styles} label="FIRST NAME" value={firstName} onChangeText={setFirstName} placeholder="First name" /><Field styles={styles} label="LAST NAME" value={lastName} onChangeText={setLastName} placeholder="Last name" /><Field styles={styles} label="DEPARTMENT" value={department} onChangeText={setDepartment} placeholder="Department" /><Field styles={styles} label="JOB TITLE" value={jobTitle} onChangeText={setJobTitle} placeholder="Job title" /><Field styles={styles} label="LEGACY EMPLOYEE ID (OPTIONAL)" value={legacyEmployeeId} onChangeText={setLegacyEmployeeId} placeholder="Legacy reference" /></View><View style={styles.submitRow}><View><Text style={styles.submitTitle}>{selected ? `Ready to map ${selected.email ?? "selected Clerk account"}` : "Select a Production Clerk account"}</Text><Text style={styles.submitCopy}>The change activates one membership and writes an audit event.</Text></View><Pressable disabled={!selected || !workEmail || !firstName || !lastName || !department || !jobTitle || mapUser.isPending} onPress={submit} style={[styles.submit, (!selected || !workEmail || !firstName || !lastName || !department || !jobTitle || mapUser.isPending) && styles.submitDisabled]}><Text style={styles.submitText}>{mapUser.isPending ? "MAPPING…" : "ACTIVATE MEMBERSHIP →"}</Text></Pressable></View>{mapUser.error ? <Text style={styles.error}>{errorMessage(mapUser.error)}</Text> : null}{mapUser.isSuccess ? <Text style={styles.success}>Membership activated and audit event recorded. Refresh the user’s Clerk session before access verification.</Text> : null}</View>

    <View style={styles.card}><Text style={styles.cardKicker}>CURRENT STATE</Text><Text style={styles.cardTitle}>PMEC person and membership directory</Text><View style={styles.tableHead}><Text style={[styles.tableHeadText, styles.personColumn]}>PERSON</Text><Text style={[styles.tableHeadText, styles.roleColumn]}>MEMBERSHIP</Text><Text style={[styles.tableHeadText, styles.statusColumn]}>CLERK</Text></View>{data.people.map((person) => <View key={person.personId} style={styles.tableRow}><View style={styles.personColumn}><Text style={styles.personName}>{person.preferredName || `${person.firstName} ${person.lastName}`}</Text><Text style={styles.personMeta}>{person.workEmail} · {person.department}</Text></View><View style={styles.roleColumn}>{person.memberships.length ? person.memberships.map((membership, index) => <Text key={`${membership.role}-${index}`} style={styles.membership}>{membership.role.replaceAll("_", " ").toUpperCase()} · {membership.allowedSurface.replaceAll("_", " ").toUpperCase()}</Text>) : <Text style={styles.membership}>NO ACTIVE MEMBERSHIP</Text>}</View><View style={styles.statusColumn}><Text style={[styles.status, person.clerkUserId ? styles.statusLinked : styles.statusUnlinked]}>{person.clerkUserId ? "LINKED" : "NOT LINKED"}</Text></View></View>)}{!data.people.length ? <Text style={styles.empty}>No PMEC people are available in this organization yet.</Text> : null}</View>
  </ScrollView>;
}

function Field({ styles, label, ...props }: { styles: ReturnType<typeof makeStyles>; label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "email-address" }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={styles.placeholder.color} autoCapitalize="words" /></View>; }

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) => StyleSheet.create({
  content: { padding: 26, gap: 16 }, hero: { alignItems: "stretch", backgroundColor: palette.foreground, flexDirection: "row", gap: 24, justifyContent: "space-between", padding: 28 }, heroCopy: { flex: 1 }, kicker: { color: palette.accentText, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, title: { color: palette.inverseText, fontSize: 36, fontWeight: "900", letterSpacing: -1.5, lineHeight: 39, marginTop: 10 }, subtitle: { color: palette.inverseText, fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: 560, opacity: 0.7 }, heroCallout: { borderLeftColor: "rgba(255,255,255,0.22)", borderLeftWidth: 1, justifyContent: "center", minWidth: 150, paddingLeft: 22 }, heroNumber: { color: palette.accentText, fontSize: 42, fontWeight: "900", letterSpacing: -2 }, heroLabel: { color: palette.inverseText, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, lineHeight: 15, marginTop: 4, opacity: 0.75 }, guardrail: { backgroundColor: palette.surfaceStrong, borderLeftColor: palette.accent, borderLeftWidth: 4, padding: 17 }, guardrailTitle: { color: palette.foreground, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, guardrailCopy: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, grid: { flexDirection: "row", gap: 16 }, card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth, flex: 1, padding: 20 }, cardKicker: { color: palette.accentText, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, cardTitle: { color: palette.foreground, fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginTop: 7 }, choiceRow: { gap: 9, paddingTop: 16 }, userChoice: { borderColor: palette.border, borderWidth: 1, minWidth: 180, padding: 12 }, userChoiceActive: { backgroundColor: palette.foreground, borderColor: palette.foreground }, userChoiceName: { color: palette.foreground, fontSize: 13, fontWeight: "900" }, userChoiceNameActive: { color: palette.inverseText }, userChoiceMeta: { color: palette.muted, fontSize: 11, marginTop: 5 }, userChoiceMetaActive: { color: palette.inverseText, opacity: 0.7 }, roleRow: { flexDirection: "row", gap: 8, marginTop: 16 }, roleChoice: { borderColor: palette.border, borderWidth: 1, flex: 1, minHeight: 89, padding: 11 }, roleChoiceActive: { backgroundColor: palette.accent, borderColor: palette.accent }, roleChoiceTitle: { color: palette.foreground, fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }, roleChoiceTitleActive: { color: "#FFFFFF" }, roleChoiceMeta: { color: palette.muted, fontSize: 11, lineHeight: 15, marginTop: 7 }, roleChoiceMetaActive: { color: "#FFFFFF", opacity: 0.82 }, note: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 14 }, fields: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 18 }, field: { minWidth: 190, width: "31%" }, fieldLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.7, marginBottom: 7 }, input: { borderBottomColor: palette.border, borderBottomWidth: 1, color: palette.foreground, fontSize: 14, paddingBottom: 9 }, placeholder: { color: palette.muted }, submitRow: { alignItems: "center", borderTopColor: palette.border, borderTopWidth: 1, flexDirection: "row", gap: 20, justifyContent: "space-between", marginTop: 22, paddingTop: 16 }, submitTitle: { color: palette.foreground, fontSize: 13, fontWeight: "900" }, submitCopy: { color: palette.muted, fontSize: 11, marginTop: 4 }, submit: { backgroundColor: palette.foreground, paddingHorizontal: 17, paddingVertical: 13 }, submitDisabled: { backgroundColor: palette.border }, submitText: { color: palette.inverseText, fontSize: 10, fontWeight: "900", letterSpacing: 0.4 }, error: { color: "#B54736", fontSize: 12, fontWeight: "700", marginTop: 14 }, success: { color: palette.success, fontSize: 12, fontWeight: "700", marginTop: 14 }, tableHead: { borderBottomColor: palette.border, borderBottomWidth: 1, flexDirection: "row", marginTop: 17, paddingBottom: 9 }, tableHeadText: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, tableRow: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 62, paddingVertical: 9 }, personColumn: { flex: 1.35 }, roleColumn: { flex: 1.2 }, statusColumn: { flex: 0.52, alignItems: "flex-end" }, personName: { color: palette.foreground, fontSize: 13, fontWeight: "900" }, personMeta: { color: palette.muted, fontSize: 11, marginTop: 4 }, membership: { color: palette.foreground, fontSize: 10, fontWeight: "700", lineHeight: 15 }, status: { fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, statusLinked: { color: palette.success }, statusUnlinked: { color: "#9C6B00" }, empty: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 14 }, state: { backgroundColor: palette.surfaceStrong, margin: 26, padding: 24 }, warningState: { borderLeftColor: "#9C6B00", borderLeftWidth: 4 }, stateTitle: { color: palette.foreground, fontSize: 18, fontWeight: "900" }, stateCopy: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
});
