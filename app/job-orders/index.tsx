// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";

import {
  COST_DOCUMENT_APPROVAL_LABELS,
  COST_DOCUMENT_APPROVAL_STATUSES,
  COST_DOCUMENT_CATEGORY_TAGS,
  BUDGET_ALERT_LABELS,
  DISCIPLINES,
  DISCIPLINE_LABELS,
  JOB_ORDER_PHASE_LABELS,
  JOB_ORDER_PHASES,
  WORK_PACKAGE_STATUSES,
  WORK_PACKAGE_STATUS_LABELS,
  budgetAlertStatus,
  budgetVariance,
  completedTaskCount,
  contingencyAmount,
  costDocumentCategoryTags,
  formatMoney,
  groupCurrencyTotals,
  groupWorkPackages,
  impliedLaborMultiplier,
  isCostDocumentApprovalOverdue,
  isOverBudget,
  jobOrderProgress,
  jobOrderSpent,
  matchesProjectSearch,
  nextJobOrderPhase,
  pendingApprovalAgeHours,
  pendingApprovalAgeLabel,
  remainingAuthorized,
  spentPctOfBudget,
  totalAuthorized,
  type BudgetAlertStatus,
  type CostDocumentApprovalStatus,
  type CostDocumentType,
  type EngineeringDiscipline,
  type JobOrder,
  type JobOrderPriority,
  type WorkPackageTask,
} from "@/lib/pmec-job-orders";
import { usePmecAccess } from "@/lib/pmec-access";
import { getPmecHostWorkspace } from "@/lib/pmec-host-routing";
import { usePmecJobOrders } from "@/lib/pmec-job-order-workspace";
import { type PmecWorkforcePerson, usePmecControl } from "@/lib/pmec-control-workspace";
import * as DocumentPicker from "expo-document-picker";
import { useLumen } from "@/lib/lumen-workspace";
import { BackButton, Chip, StatTile } from "@/components/pmec";

type PortfolioTab = "ACTIVE" | "COMPLETED" | "ALL";
type BudgetFilter = "ALL" | Exclude<BudgetAlertStatus, "ON_TRACK">;
const priorityOptions: JobOrderPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const phaseKinds = new Set([
  "PLANNING",
  "DESIGN",
  "PROCUREMENT",
  "EXECUTION",
  "QA_INSPECTION",
  "PUNCH_LIST",
  "CLIENT_SIGNOFF",
  "ON_HOLD",
]);
const budgetFilterOptions: BudgetFilter[] = ["ALL", "WATCH", "AT_RISK", "OVER_BUDGET"];
const projectSearchStyles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: "#F0ECE5",
    borderColor: "#DDD6CC",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
  },
  input: { color: "#1A1A1A", flex: 1, fontSize: 12, minHeight: 42 },
  count: { color: "#A84B2A", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
});
const costDocumentStyles = StyleSheet.create({
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 11 },
  filterChip: {
    borderColor: "#D7CEC3",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  filterChipText: { color: "#6E6256", fontSize: 8, fontWeight: "900", letterSpacing: 0.35 },
  filterChipTextActive: { color: "#FFFDF8" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 7 },
  tag: {
    backgroundColor: "#F0E6DC",
    color: "#A84B2A",
    fontSize: 8,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  reviewNote: { color: "#6E6256", fontSize: 9, lineHeight: 14, marginTop: 8 },
  rightColumn: { alignItems: "flex-end", gap: 9 },
  statusButton: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
  pending: { backgroundColor: "#FFF1D8" },
  approved: { backgroundColor: "#E8F1ED" },
  statusButtonText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.35 },
  pendingText: { color: "#8A5A11" },
  approvedText: { color: "#2A5F50" },
  menu: {
    backgroundColor: "#FFFDF8",
    borderColor: "#D7CEC3",
    borderWidth: 1,
    marginTop: 8,
    padding: 9,
  },
  reviewLabel: { color: "#6E6256", fontSize: 8, fontWeight: "900", letterSpacing: 0.45 },
  reviewInput: {
    borderBottomColor: "#D7CEC3",
    borderBottomWidth: 1,
    color: "#1A1A1A",
    fontSize: 11,
    marginTop: 5,
    minHeight: 44,
    paddingVertical: 7,
    textAlignVertical: "top",
  },
  menuOptions: { flexDirection: "row", gap: 7, marginTop: 9 },
  menuOption: {
    borderColor: "#D7CEC3",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  menuOptionActive: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  menuOptionText: { color: "#6E6256", fontSize: 8, fontWeight: "900" },
  menuOptionTextActive: { color: "#FFFDF8" },
});
const decisionAgingStyles = StyleSheet.create({
  banner: {
    backgroundColor: "#F7DDD8",
    borderLeftColor: "#B4483E",
    borderLeftWidth: 3,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerTitle: { color: "#8D2E27", fontSize: 9, fontWeight: "900", letterSpacing: 0.55 },
  bannerCopy: { color: "#7D4B46", fontSize: 10, lineHeight: 15, marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F7DDD8",
    borderColor: "#E2A39C",
    borderRadius: 7,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeText: { color: "#8D2E27", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
});
const decisionBulkStyles = StyleSheet.create({
  // Same value as the palette's AA-checked muted token; this sheet is built without the palette.
  hint: { color: "#69635D", fontSize: 13, lineHeight: 18, marginTop: 8 },
  shell: { backgroundColor: "#1A1A1A", gap: 10, marginTop: 14, padding: 13 },
  heading: { color: "#FFFDF8", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  copy: { color: "#D7CEC3", fontSize: 10, lineHeight: 15 },
  note: {
    backgroundColor: "#2A2A2A",
    color: "#FFFDF8",
    fontSize: 11,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 9,
    textAlignVertical: "top",
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    justifyContent: "space-between",
  },
  selectAll: { color: "#F7C5A8", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  approve: { backgroundColor: "#FF5A1F", paddingHorizontal: 12, paddingVertical: 10 },
  approveDisabled: { backgroundColor: "#6B625A" },
  approveText: { color: "#FFFDF8", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  select: {
    alignSelf: "flex-start",
    borderColor: "#B4483E",
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  selectActive: { backgroundColor: "#B4483E" },
  selectText: { color: "#8D2E27", fontSize: 8, fontWeight: "900", letterSpacing: 0.35 },
  selectTextActive: { color: "#FFFDF8" },
});
const budgetAlertStyles = StyleSheet.create({
  shell: { borderLeftWidth: 3, marginTop: 13, paddingHorizontal: 10, paddingVertical: 9 },
  watch: { backgroundColor: "#FFF1D8", borderLeftColor: "#B57618" },
  risk: { backgroundColor: "#F7DDD8", borderLeftColor: "#B4483E" },
  title: { color: "#573900", fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
  riskTitle: { color: "#8D2E27" },
  copy: { color: "#6E6256", fontSize: 9, fontWeight: "700", marginTop: 4 },
  riskCopy: { color: "#7D4B46" },
});
Object.assign(costDocumentStyles, {
  summaryHint: { color: "#6E6256", fontSize: 9, lineHeight: 14, marginTop: 12 },
  history: {
    borderTopColor: "#E2D9CE",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 9,
  },
  historyTitle: { color: "#A84B2A", fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
  historyRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  historyDot: { borderRadius: 4, height: 8, marginTop: 3, width: 8 },
  historyDotApproved: { backgroundColor: "#2A5F50" },
  historyDotPending: { backgroundColor: "#B57618" },
  historyStatus: { color: "#3F3932", fontSize: 8, fontWeight: "900", letterSpacing: 0.35 },
  historyMeta: { color: "#82766A", fontSize: 8, marginTop: 2 },
  historyNote: { color: "#6E6256", fontSize: 9, lineHeight: 13, marginTop: 3 },
  openProject: { color: "#A84B2A", fontSize: 8, fontWeight: "900", letterSpacing: 0.35 },
});

export default function JobOrdersPage() {
  const { width } = useWindowDimensions();
  const { projectId } = useLocalSearchParams<{ projectId?: string | string[] }>();
  const access = usePmecAccess();
  const hostWorkspace = getPmecHostWorkspace();
  const { palette } = useLumen();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { jobOrders } = usePmecJobOrders();
  const [tab, setTab] = useState<PortfolioTab>("ACTIVE");
  const [discipline, setDiscipline] = useState<EngineeringDiscipline | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("ALL");
  const [selected, setSelected] = useState<JobOrder | null>(null);
  const [creating, setCreating] = useState(false);
  const [decisionSummary, setDecisionSummary] = useState(false);
  const visible = jobOrders.filter(
    (job) =>
      (tab === "ACTIVE"
        ? phaseKinds.has(job.phase)
        : tab === "COMPLETED"
          ? job.phase === "COMPLETED" || job.phase === "CANCELLED"
          : true) &&
      (discipline === "ALL" || job.discipline === discipline) &&
      matchesProjectSearch(job, query) &&
      (budgetFilter === "ALL" || budgetAlertStatus(job) === budgetFilter),
  );
  const portfolio = useMemo(
    () => ({
      budget: groupCurrencyTotals(visible, (job) => job.budget),
      spent: groupCurrencyTotals(visible, jobOrderSpent),
      active: jobOrders.filter((job) => phaseKinds.has(job.phase)).length,
      complete: visible.reduce((sum, job) => sum + completedTaskCount(job), 0),
      tasks: visible.reduce((sum, job) => sum + job.tasks.length, 0),
    }),
    [jobOrders, visible],
  );
  const pendingDecisionCount = useMemo(
    () =>
      jobOrders
        .flatMap((job) => job.costDocuments)
        .filter((document) => (document.approvalStatus ?? "PENDING") === "PENDING").length,
    [jobOrders],
  );
  const selectedProjectId = Array.isArray(projectId) ? projectId[0] : projectId;
  useEffect(() => {
    if (selectedProjectId) {
      const matchingJob = jobOrders.find((job) => job.id === selectedProjectId);
      if (matchingJob) setSelected(matchingJob);
    }
  }, [jobOrders, selectedProjectId]);

  if (hostWorkspace === "portal") return <Redirect href="/(tabs)" />;
  if (hostWorkspace === "hr" || !access.can("delivery")) return <Redirect href="/control-center" />;
  if (width < 760)
    return (
      <View style={styles.gate}>
        <Text style={styles.gateBrand}>PMEC / JOB ORDERS</Text>
        <Text style={styles.gateTitle}>A wider view{`\n`}is required.</Text>
        <Text style={styles.gateCopy}>
          The project delivery tracker is intentionally designed for iPad landscape and desktop
          decision-making.
        </Text>
      </View>
    );
  return (
    <View style={styles.page}>
      <View style={styles.rail}>
        <Text style={styles.brand}>PMEC</Text>
        <Text style={styles.brandSub}>PROJECT DELIVERY</Text>
        <View style={styles.railLine} />
        <Text style={styles.railLabel}>PROJECTS</Text>
        <Text style={styles.railCopy}>PROJECT MANAGER DEMO</Text>
        <BackButton
          variant="text"
          tone="inverse"
          text="← Control Center"
          label="Back to Control Center"
          fallback="/control-center"
          style={{ marginTop: 28 }}
        />
        <View style={styles.railFoot}>
          <Text style={styles.railFootTitle}>PROJECT DATA</Text>
          <Text style={styles.railFootCopy}>Demo data, saved in this browser only</Text>
        </View>
      </View>
      <View style={styles.main}>
        {/* The header, figures and filters scroll with the projects. Pinned, they took about 620px
            of an 820px iPad screen and left the cards a narrow strip at the bottom. */}
        <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>PMEC / PROJECT DELIVERY</Text>
              <Text style={styles.title}>Project{`\n`}Tracker.</Text>
              <Text style={styles.subtitle}>
                Search projects and monitor delivery progress, budget variance, work breakdown, and
                schedule across every discipline.
              </Text>
            </View>
            <Pressable
              onPress={() => setCreating(true)}
              style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
            >
              <Text style={styles.newButtonText}>NEW PROJECT</Text>
              <Text style={styles.newButtonArrow}>+</Text>
            </Pressable>
          </View>
          <View style={styles.kpiGrid}>
            <StatTile
              label="Authorized budget"
              figure={{ kind: "money", values: toMoney(portfolio.budget) }}
              caption="Filtered project currencies"
            />
            <StatTile
              label="Derived spend"
              figure={{ kind: "money", values: toMoney(portfolio.spent) }}
              caption="Labor + materials + subcontract"
            />
            <StatTile
              label="Active projects"
              figure={{ kind: "count", value: portfolio.active }}
              caption="Across all PMEC regions"
            />
            <StatTile
              label="Decision queue"
              figure={{ kind: "count", value: pendingDecisionCount }}
              caption="Pending cost-document decisions"
              onPress={() => setDecisionSummary(true)}
            />
          </View>
          <View style={styles.filterBar}>
            <View style={projectSearchStyles.row}>
              <TextInput
                accessibilityLabel="Search projects"
                value={query}
                onChangeText={setQuery}
                placeholder="Search project, client, manager, region, or tag"
                placeholderTextColor={palette.muted}
                style={projectSearchStyles.input}
              />
              <Text style={projectSearchStyles.count}>
                {visible.length} RESULT{visible.length === 1 ? "" : "S"}
              </Text>
            </View>
            <View style={styles.tabs}>
              {(["ACTIVE", "COMPLETED", "ALL"] as PortfolioTab[]).map((item) => (
                <Chip key={item} label={item} selected={tab === item} onPress={() => setTab(item)} />
              ))}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
              contentContainerStyle={styles.chips}
            >
              {(["ALL", ...DISCIPLINES] as const).map((item) => (
                <Chip
                  key={item}
                  label={item === "ALL" ? "All disciplines" : DISCIPLINE_LABELS[item]}
                  selected={discipline === item}
                  onPress={() => setDiscipline(item)}
                />
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
              contentContainerStyle={styles.chips}
            >
              {budgetFilterOptions.map((item) => (
                <Chip
                  key={item}
                  label={item === "ALL" ? "All budgets" : BUDGET_ALERT_LABELS[item]}
                  selected={budgetFilter === item}
                  onPress={() => setBudgetFilter(item)}
                />
              ))}
            </ScrollView>
          </View>
          <View style={styles.cardGrid}>
            {visible.length ? (
              visible.map((job) => (
                <JobOrderCard
                  key={job.id}
                  job={job}
                  styles={styles}
                  onPress={() => setSelected(job)}
                />
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No projects match this view.</Text>
                <Text style={styles.emptyCopy}>
                  Clear a filter or search by project, client, manager, region, or tag.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      <JobOrderPanel
        jobId={selected?.id ?? null}
        onClose={() => setSelected(null)}
        styles={styles}
      />
      <CreateJobOrderPanel visible={creating} onClose={() => setCreating(false)} styles={styles} />
      <ManagerDecisionSummary
        visible={decisionSummary}
        onClose={() => setDecisionSummary(false)}
        onOpenProject={(job) => setSelected(job)}
        jobOrders={jobOrders}
        styles={styles}
      />
    </View>
  );
}

function JobOrderCard({
  job,
  styles,
  onPress,
}: {
  job: JobOrder;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const progress = jobOrderProgress(job);
  const spent = jobOrderSpent(job);
  const burn = spentPctOfBudget(job);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardPills}>
          <Pill styles={styles} text={JOB_ORDER_PHASE_LABELS[job.phase]} tone="dark" />
          <Pill
            styles={styles}
            text={job.priority}
            tone={job.priority === "CRITICAL" ? "risk" : job.priority === "HIGH" ? "warn" : "plain"}
          />
        </View>
        <Text style={styles.cardRegion}>{job.region}</Text>
      </View>
      <Text style={styles.cardDiscipline}>{DISCIPLINE_LABELS[job.discipline].toUpperCase()}</Text>
      <Text style={styles.cardTitle}>{job.title}</Text>
      <Text style={styles.cardClient}>{job.clientName}</Text>
      <View style={styles.progressGroup}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>OVERALL PROGRESS</Text>
          <Text style={styles.progressNumber}>{progress}%</Text>
        </View>
        <Track styles={styles} value={progress} color="#FF5A1F" />
      </View>
      <View style={styles.progressGroup}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>BUDGET BURN</Text>
          <Text style={styles.progressNumber}>
            {formatMoney(job.currency, spent)} · {burn}%
          </Text>
        </View>
        <Track
          styles={styles}
          value={burn}
          color={isOverBudget(job) ? "#B4483E" : burn > 85 ? "#B57618" : "#3A7563"}
          marker={Math.round((job.budget / totalAuthorized(job)) * 100)}
        />
      </View>
      <BudgetAlert styles={styles} job={job} />
      <View style={styles.cardFooter}>
        <Text style={styles.cardAssignee}>{job.subcontractorName ?? job.projectManagerName}</Text>
        <Text style={styles.cardDate}>TARGET {job.targetEndDate}</Text>
      </View>
      <Lifecycle styles={styles} phase={job.phase} />
    </Pressable>
  );
}
function BudgetAlert({ job }: { job: JobOrder }) {
  const status = budgetAlertStatus(job);
  if (status === "ON_TRACK") return null;
  const isWatch = status === "WATCH";
  const variance = budgetVariance(job);
  const remaining = Math.max(0, job.budget - jobOrderSpent(job));
  return (
    <View
      style={[budgetAlertStyles.shell, isWatch ? budgetAlertStyles.watch : budgetAlertStyles.risk]}
    >
      <Text style={[budgetAlertStyles.title, !isWatch && budgetAlertStyles.riskTitle]}>
        {BUDGET_ALERT_LABELS[status].toUpperCase()} · {spentPctOfBudget(job)}% BURN
      </Text>
      <Text style={[budgetAlertStyles.copy, !isWatch && budgetAlertStyles.riskCopy]}>
        {variance > 0
          ? `${formatMoney(job.currency, variance)} OVER AUTHORIZED BUDGET`
          : `${formatMoney(job.currency, remaining)} TO BUDGET LIMIT`}
      </Text>
    </View>
  );
}
function Pill({
  styles,
  text,
  tone,
}: {
  styles: ReturnType<typeof makeStyles>;
  text: string;
  tone: "dark" | "plain" | "warn" | "risk";
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "dark"
          ? styles.pillDark
          : tone === "risk"
            ? styles.pillRisk
            : tone === "warn"
              ? styles.pillWarn
              : styles.pillPlain,
      ]}
    >
      <Text style={[styles.pillText, tone === "dark" && styles.pillTextDark]}>{text}</Text>
    </View>
  );
}
function Track({
  styles,
  value,
  color,
  marker,
}: {
  styles: ReturnType<typeof makeStyles>;
  value: number;
  color: string;
  marker?: number;
}) {
  return (
    <View style={styles.track}>
      {marker ? <View style={[styles.trackMarker, { left: `${Math.min(99, marker)}%` }]} /> : null}
      <View
        style={[
          styles.trackFill,
          { width: `${Math.max(2, Math.min(value, 100))}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}
function Lifecycle({
  styles,
  phase,
}: {
  styles: ReturnType<typeof makeStyles>;
  phase: JobOrder["phase"];
}) {
  const lifecycle = JOB_ORDER_PHASES;
  return (
    <View style={styles.lifecycle}>
      {lifecycle.map((item, index) => (
        <View key={item} style={styles.lifecycleItem}>
          <View
            style={[
              styles.lifecycleDot,
              item === phase && styles.lifecycleDotActive,
              item === "EXECUTION" && item === phase && styles.lifecycleDotPulse,
            ]}
          />
          {index < lifecycle.length - 1 ? (
            <View
              style={[
                styles.lifecycleLine,
                lifecycle.indexOf(phase as (typeof lifecycle)[number]) > index &&
                  styles.lifecycleLineDone,
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function JobOrderPanel({
  jobId,
  onClose,
  styles,
}: {
  jobId: string | null;
  onClose: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const {
    jobOrders,
    updateTask,
    addWorkPackage,
    toggleMilestone,
    addMilestone,
    addCostDocument,
    recordCostDocumentDecision,
    advancePhase,
    removeJobOrder,
  } = usePmecJobOrders();
  const control = usePmecControl();
  const job = jobOrders.find((item) => item.id === jobId);
  const [taskEditorId, setTaskEditorId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [addingCost, setAddingCost] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!job) return null;
  const progress = jobOrderProgress(job);
  const spent = jobOrderSpent(job);
  const nextPhase = nextJobOrderPhase(job.phase);
  const implied = impliedLaborMultiplier(job);
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Animated.View entering={SlideInRight.duration(260)} style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerHeaderMain}>
              <View style={styles.cardPills}>
                <Pill styles={styles} text={JOB_ORDER_PHASE_LABELS[job.phase]} tone="dark" />
                <Pill
                  styles={styles}
                  text={job.priority}
                  tone={
                    job.priority === "CRITICAL"
                      ? "risk"
                      : job.priority === "HIGH"
                        ? "warn"
                        : "plain"
                  }
                />
              </View>
              <Text style={styles.drawerDiscipline}>
                {DISCIPLINE_LABELS[job.discipline].toUpperCase()} · {job.region}
              </Text>
              <Text style={styles.drawerTitle}>{job.title}</Text>
              <Text style={styles.drawerClient}>{job.clientName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailIntro}>
              <Text style={styles.detailDescription}>{job.description}</Text>
              <View style={styles.tagRow}>
                {job.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
              <Lifecycle styles={styles} phase={job.phase} />
              <View style={styles.detailFacts}>
                <DetailFact
                  styles={styles}
                  label="PROJECT MANAGER"
                  value={job.projectManagerName}
                />
                <DetailFact styles={styles} label="TARGET END" value={job.targetEndDate} />
                <DetailFact
                  styles={styles}
                  label="SUBCONTRACTOR"
                  value={job.subcontractorName ?? "Not assigned"}
                />
              </View>
              {nextPhase ? (
                <Pressable onPress={() => advancePhase(job.id, nextPhase)} style={styles.advance}>
                  <Text style={styles.advanceText}>
                    ADVANCE TO {JOB_ORDER_PHASE_LABELS[nextPhase].toUpperCase()} →
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Section
              styles={styles}
              title="BUDGET UTILIZATION"
              action={`${formatMoney(job.currency, spent)} SPENT`}
            />
            <View style={styles.stats}>
              <Stat styles={styles} label="BUDGET" value={formatMoney(job.currency, job.budget)} />
              <Stat
                styles={styles}
                label="CONTINGENCY"
                value={formatMoney(job.currency, contingencyAmount(job))}
              />
              <Stat
                styles={styles}
                label="REMAINING AUTHORIZED"
                value={formatMoney(job.currency, remainingAuthorized(job))}
              />
            </View>
            <BudgetAlert job={job} />
            <View style={styles.detailProgress}>
              <View style={styles.progressMeta}>
                <Text style={styles.progressLabel}>UTILIZATION VS BUDGET</Text>
                <Text style={styles.progressNumber}>{spentPctOfBudget(job)}%</Text>
              </View>
              <Track
                styles={styles}
                value={spentPctOfBudget(job)}
                color={
                  isOverBudget(job) ? "#B4483E" : spentPctOfBudget(job) > 80 ? "#B57618" : "#FF5A1F"
                }
                marker={Math.round((job.budget / totalAuthorized(job)) * 100)}
              />
              {implied !== null ? (
                <Text
                  style={[
                    styles.multiplier,
                    job.netLaborMultiplier &&
                      Math.abs(implied - job.netLaborMultiplier) > 0.3 &&
                      styles.multiplierRisk,
                  ]}
                >
                  IMPLIED LABOR MULTIPLIER {implied}{" "}
                  {job.netLaborMultiplier ? `· QUOTED ${job.netLaborMultiplier}` : ""}
                </Text>
              ) : null}
            </View>
            <Section
              styles={styles}
              title="MILESTONES"
              action={`${job.milestones.filter((item) => item.achieved).length}/${job.milestones.length} ACHIEVED`}
            />
            <View style={styles.listCard}>
              {job.milestones.map((milestone) => (
                <Pressable
                  key={milestone.id}
                  onPress={() => toggleMilestone(job.id, milestone.id)}
                  style={styles.milestone}
                >
                  <View
                    style={[
                      styles.milestoneCheck,
                      milestone.achieved && styles.milestoneCheckActive,
                    ]}
                  >
                    <Text style={styles.milestoneTick}>{milestone.achieved ? "✓" : ""}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.listTitle}>{milestone.label}</Text>
                    <Text style={styles.listMeta}>
                      {milestone.achieved
                        ? `ACHIEVED ${milestone.achievedDate}`
                        : `TARGET ${milestone.targetDate}`}
                    </Text>
                  </View>
                </Pressable>
              ))}
              <Pressable onPress={() => setAddingMilestone(true)} style={styles.inlineAction}>
                <Text style={styles.inlineActionText}>+ ADD MILESTONE</Text>
              </Pressable>
            </View>
            <Section
              styles={styles}
              title="WORK BREAKDOWN"
              action={`${completedTaskCount(job)}/${job.tasks.length} COMPLETE`}
            />
            {groupWorkPackages(job).map(([group, tasks]) => (
              <View key={group} style={styles.wbsGroup}>
                <Text style={styles.wbsTitle}>{group.toUpperCase()}</Text>
                {tasks.map((taskItem) => (
                  <TaskRow
                    key={taskItem.id}
                    task={taskItem}
                    styles={styles}
                    open={taskEditorId === taskItem.id}
                    onToggle={() =>
                      setTaskEditorId(taskEditorId === taskItem.id ? null : taskItem.id)
                    }
                    onSave={(updates) => {
                      updateTask(job.id, taskItem.id, updates);
                      setTaskEditorId(null);
                    }}
                  />
                ))}
              </View>
            ))}
            <Pressable onPress={() => setAddingTask(true)} style={styles.addTask}>
              <Text style={styles.addTaskText}>+ ADD WORK PACKAGE</Text>
            </Pressable>
            <ProjectTeamPanel job={job} control={control} />
            <Section
              styles={styles}
              title="COST DOCUMENTS"
              action={`${job.costDocuments.length} RECORD${job.costDocuments.length === 1 ? "" : "S"}`}
            />
            <CostDocumentList
              job={job}
              styles={styles}
              onDecision={(documentId, decision) =>
                recordCostDocumentDecision(job.id, documentId, {
                  ...decision,
                  changedBy: job.projectManagerName,
                })
              }
            />
            <Pressable onPress={() => setAddingCost(true)} style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>+ RECORD COST DOCUMENT</Text>
            </Pressable>
            <View style={styles.danger}>
              <Text style={styles.dangerTitle}>EXECUTIVE ACTION</Text>
              <Text style={styles.dangerCopy}>
                Removing a job order is only for confirming a mistaken conversion in this local
                demo.
              </Text>
              {confirmDelete ? (
                <View style={styles.confirmRow}>
                  <Pressable
                    onPress={() => {
                      removeJobOrder(job.id);
                      onClose();
                    }}
                    style={styles.deleteConfirm}
                  >
                    <Text style={styles.deleteConfirmText}>CONFIRM REMOVE</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmDelete(false)}>
                    <Text style={styles.cancelText}>CANCEL</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setConfirmDelete(true)}>
                  <Text style={styles.deleteText}>REMOVE JOB ORDER</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
          <MilestoneScheduleForm
            visible={addingMilestone}
            onClose={() => setAddingMilestone(false)}
            onSubmit={(input) => {
              addMilestone(job.id, input);
              setAddingMilestone(false);
            }}
            styles={styles}
          />
          <AddWorkPackage
            visible={addingTask}
            onClose={() => setAddingTask(false)}
            onSubmit={(input) => {
              addWorkPackage(job.id, input);
              setAddingTask(false);
            }}
            styles={styles}
          />
          <CostDocumentUploadForm
            visible={addingCost}
            onClose={() => setAddingCost(false)}
            onSubmit={(input) => {
              addCostDocument(job.id, { ...input, uploadedBy: job.projectManagerName });
              setAddingCost(false);
            }}
            styles={styles}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function DetailFact({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailFact}>
      <Text style={styles.detailFactLabel}>{label}</Text>
      <Text style={styles.detailFactValue}>{value}</Text>
    </View>
  );
}
function Stat({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}
function Section({
  styles,
  title,
  action,
}: {
  styles: ReturnType<typeof makeStyles>;
  title: string;
  action: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}
function formatDecisionTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function ManagerDecisionSummary({
  visible,
  onClose,
  onOpenProject,
  jobOrders,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenProject: (job: JobOrder) => void;
  jobOrders: JobOrder[];
  styles: ReturnType<typeof makeStyles>;
}) {
  const { bulkApproveCostDocuments } = usePmecJobOrders();
  const [filter, setFilter] = useState<"ALL" | CostDocumentApprovalStatus>("PENDING");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [bulkNote, setBulkNote] = useState("");
  const allRecords = jobOrders.flatMap((job) =>
    job.costDocuments.map((document) => ({ job, document })),
  );
  const records = allRecords.filter(
    ({ document }) => filter === "ALL" || (document.approvalStatus ?? "PENDING") === filter,
  );
  const pendingCount = allRecords.filter(
    ({ document }) => (document.approvalStatus ?? "PENDING") === "PENDING",
  ).length;
  const approvedCount = allRecords.filter(
    ({ document }) => (document.approvalStatus ?? "PENDING") === "APPROVED",
  ).length;
  const overdueCount = allRecords.filter(({ document }) =>
    isCostDocumentApprovalOverdue(document),
  ).length;
  const pendingRecords = allRecords.filter(
    ({ document }) => (document.approvalStatus ?? "PENDING") === "PENDING",
  );
  const selectedPendingRecords = pendingRecords.filter(({ job, document }) =>
    selectedKeys.has(`${job.id}:${document.id}`),
  );
  const documentValueByCurrency = records.reduce(
    (totals, { job, document }) => ({
      ...totals,
      [job.currency]: (totals[job.currency] ?? 0) + (document.amount ?? 0),
    }),
    {} as Record<string, number>,
  );
  const formattedDocumentValue =
    Object.entries(documentValueByCurrency)
      .map(([currency, value]) => formatMoney(currency, value))
      .join(" · ") || "—";
  const toggleSelection = (key: string) =>
    setSelectedKeys((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const toggleAllPending = () =>
    setSelectedKeys((current) =>
      current.size === pendingRecords.length
        ? new Set()
        : new Set(pendingRecords.map(({ job, document }) => `${job.id}:${document.id}`)),
    );
  const approveSelection = () => {
    const reviewNote = bulkNote.trim();
    if (!selectedPendingRecords.length || !reviewNote) return;
    bulkApproveCostDocuments(
      selectedPendingRecords.map(({ job, document }) => ({
        jobOrderId: job.id,
        documentId: document.id,
      })),
      { changedBy: "PMEC Project Manager", reviewNote },
    );
    setSelectedKeys(new Set());
    setBulkNote("");
    setFilter("PENDING");
  };
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Animated.View entering={SlideInRight.duration(260)} style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.eyebrow}>PMEC / PROJECT DELIVERY</Text>
              <Text style={styles.createTitle}>Decision Summary</Text>
              <Text style={styles.drawerClient}>
                Review every local cost-document decision across the active portfolio.
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stats}>
              <Stat styles={styles} label="PENDING" value={String(pendingCount)} />
              <Stat styles={styles} label="APPROVED" value={String(approvedCount)} />
              <Stat styles={styles} label="VIEW VALUE" value={formattedDocumentValue} />
            </View>
            {overdueCount ? (
              <View style={decisionAgingStyles.banner}>
                <Text style={decisionAgingStyles.bannerTitle}>
                  APPROVAL ATTENTION · {overdueCount} OVER 48H
                </Text>
                <Text style={decisionAgingStyles.bannerCopy}>
                  Pending records have exceeded the 48-hour review window. Open a project to record
                  the decision and rationale.
                </Text>
              </View>
            ) : null}
            {pendingRecords.length ? (
              <View style={decisionBulkStyles.shell}>
                <Text style={decisionBulkStyles.heading}>
                  BULK APPROVAL · {selectedPendingRecords.length} SELECTED
                </Text>
                <Text style={decisionBulkStyles.copy}>
                  Select pending records, add one shared rationale, then approve the batch locally.
                </Text>
                <TextInput
                  accessibilityLabel="Bulk approval review note"
                  value={bulkNote}
                  onChangeText={setBulkNote}
                  multiline
                  placeholder="Shared approval rationale (required)..."
                  placeholderTextColor="#B5AAA0"
                  style={decisionBulkStyles.note}
                />
                <View style={decisionBulkStyles.actionRow}>
                  <Pressable
                    accessibilityLabel="Select all pending cost documents"
                    onPress={toggleAllPending}
                  >
                    <Text style={decisionBulkStyles.selectAll}>
                      {selectedKeys.size === pendingRecords.length
                        ? "CLEAR SELECTION"
                        : "SELECT ALL PENDING"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Approve selected cost documents"
                    disabled={!selectedPendingRecords.length || !bulkNote.trim()}
                    onPress={approveSelection}
                    style={[
                      decisionBulkStyles.approve,
                      (!selectedPendingRecords.length || !bulkNote.trim()) &&
                        decisionBulkStyles.approveDisabled,
                    ]}
                  >
                    <Text style={decisionBulkStyles.approveText}>APPROVE SELECTED</Text>
                  </Pressable>
                </View>
                {!selectedPendingRecords.length || !bulkNote.trim() ? (
                  <Text accessibilityLiveRegion="polite" style={decisionBulkStyles.hint}>
                    {!selectedPendingRecords.length
                      ? "Select documents, then write a shared reason to approve them."
                      : "Write a shared reason to approve the selected documents."}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <View style={costDocumentStyles.filterRow}>
              {(["ALL", ...COST_DOCUMENT_APPROVAL_STATUSES] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setFilter(status)}
                  style={[
                    costDocumentStyles.filterChip,
                    filter === status && costDocumentStyles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      costDocumentStyles.filterChipText,
                      filter === status && costDocumentStyles.filterChipTextActive,
                    ]}
                  >
                    {status === "ALL"
                      ? "ALL DECISIONS"
                      : COST_DOCUMENT_APPROVAL_LABELS[status].toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={costDocumentStyles.summaryHint}>
              LOCAL SHOWCASE · Review status, rationale, and supporting category before opening a
              project record.
            </Text>
            <View style={styles.listCard}>
              {records.length ? (
                records.map(({ job, document }) => {
                  const status = document.approvalStatus ?? "PENDING";
                  const tags = document.tags?.length
                    ? document.tags
                    : costDocumentCategoryTags(document.documentType);
                  const history = document.approvalHistory ?? [];
                  const lastDecision = history[history.length - 1];
                  const isOverdue = isCostDocumentApprovalOverdue(document);
                  const ageHours = pendingApprovalAgeHours(document);
                  const recordKey = `${job.id}:${document.id}`;
                  const isSelected = selectedKeys.has(recordKey);
                  return (
                    <View key={recordKey} style={styles.document}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          onOpenProject(job);
                          onClose();
                        }}
                        style={({ pressed }) => [styles.flex, pressed && styles.pressed]}
                      >
                        <View style={styles.documentIcon}>
                          <Text style={styles.documentIconText}>
                            {status === "APPROVED" ? "OK" : "PEND"}
                          </Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.listTitle}>{document.description}</Text>
                          <Text style={styles.listMeta}>
                            {job.title} · {job.clientName}
                          </Text>
                          <View style={costDocumentStyles.tagRow}>
                            {tags.map((tag) => (
                              <Text key={tag} style={costDocumentStyles.tag}>
                                #{tag}
                              </Text>
                            ))}
                          </View>
                          {isOverdue ? (
                            <View style={decisionAgingStyles.badge}>
                              <Text style={decisionAgingStyles.badgeText}>
                                REVIEW OVERDUE · {pendingApprovalAgeLabel(ageHours)} PENDING
                              </Text>
                            </View>
                          ) : null}
                          {lastDecision?.reviewNote ? (
                            <Text style={costDocumentStyles.reviewNote} numberOfLines={2}>
                              Latest note: {lastDecision.reviewNote}
                            </Text>
                          ) : (
                            <Text style={costDocumentStyles.reviewNote}>
                              No decision note recorded.
                            </Text>
                          )}
                          <Text style={costDocumentStyles.historyMeta}>
                            {lastDecision
                              ? `${formatDecisionTime(lastDecision.changedAt)} · ${lastDecision.changedBy}`
                              : "No recorded decision"}
                          </Text>
                        </View>
                      </Pressable>
                      <View style={costDocumentStyles.rightColumn}>
                        {status === "PENDING" ? (
                          <Pressable
                            accessibilityLabel={`Select ${document.description} for bulk approval`}
                            onPress={() => toggleSelection(recordKey)}
                            style={[
                              decisionBulkStyles.select,
                              isSelected && decisionBulkStyles.selectActive,
                            ]}
                          >
                            <Text
                              style={[
                                decisionBulkStyles.selectText,
                                isSelected && decisionBulkStyles.selectTextActive,
                              ]}
                            >
                              {isSelected ? "✓ SELECTED" : "SELECT"}
                            </Text>
                          </Pressable>
                        ) : null}
                        <View
                          style={[
                            costDocumentStyles.statusButton,
                            status === "APPROVED"
                              ? costDocumentStyles.approved
                              : costDocumentStyles.pending,
                          ]}
                        >
                          <Text
                            style={[
                              costDocumentStyles.statusButtonText,
                              status === "APPROVED"
                                ? costDocumentStyles.approvedText
                                : costDocumentStyles.pendingText,
                            ]}
                          >
                            {COST_DOCUMENT_APPROVAL_LABELS[status].toUpperCase()}
                          </Text>
                        </View>
                        {document.amount ? (
                          <Text style={styles.documentAmount}>
                            {formatMoney(job.currency, document.amount)}
                          </Text>
                        ) : null}
                        <Text style={costDocumentStyles.openProject}>OPEN PROJECT →</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyInline}>No cost documents match this decision state.</Text>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function CostDocumentList({
  job,
  styles,
  onDecision,
}: {
  job: JobOrder;
  styles: ReturnType<typeof makeStyles>;
  onDecision: (
    documentId: string,
    decision: { status: CostDocumentApprovalStatus; reviewNote?: string },
  ) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | CostDocumentApprovalStatus>("ALL");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const visibleDocuments = job.costDocuments.filter(
    (document) => statusFilter === "ALL" || (document.approvalStatus ?? "PENDING") === statusFilter,
  );
  return (
    <>
      <View style={costDocumentStyles.filterRow}>
        {(["ALL", ...COST_DOCUMENT_APPROVAL_STATUSES] as const).map((status) => (
          <Pressable
            key={status}
            onPress={() => setStatusFilter(status)}
            style={[
              costDocumentStyles.filterChip,
              statusFilter === status && costDocumentStyles.filterChipActive,
            ]}
          >
            <Text
              style={[
                costDocumentStyles.filterChipText,
                statusFilter === status && costDocumentStyles.filterChipTextActive,
              ]}
            >
              {status === "ALL"
                ? "ALL RECORDS"
                : COST_DOCUMENT_APPROVAL_LABELS[status].toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.listCard}>
        {visibleDocuments.length ? (
          visibleDocuments.map((document) => {
            const approvalStatus = document.approvalStatus ?? "PENDING";
            const tags = document.tags?.length
              ? document.tags
              : costDocumentCategoryTags(document.documentType);
            const reviewNote = reviewNotes[document.id] ?? document.reviewNote ?? "";
            const history = [...(document.approvalHistory ?? [])].sort((a, b) =>
              b.changedAt.localeCompare(a.changedAt),
            );
            return (
              <View key={document.id} style={styles.document}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>
                    {document.documentType === "CONTRACT"
                      ? "CTR"
                      : document.documentType === "SUBCONTRACTOR_INVOICE"
                        ? "INV"
                        : document.documentType === "PURCHASE_RECEIPT"
                          ? "RCT"
                          : "DOC"}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.listTitle}>{document.description}</Text>
                  <Text style={styles.listMeta} numberOfLines={1}>
                    {document.fileName
                      ? document.documentType.replaceAll("_", " ") +
                        " · LOCAL FILE · " +
                        document.fileName
                      : document.documentType.replaceAll("_", " ") + " · " + document.uploadedBy}
                  </Text>
                  <View style={costDocumentStyles.tagRow}>
                    {tags.map((tag) => (
                      <Text key={tag} style={costDocumentStyles.tag}>
                        #{tag}
                      </Text>
                    ))}
                  </View>
                  {document.reviewNote ? (
                    <Text style={costDocumentStyles.reviewNote}>
                      Review note: {document.reviewNote}
                    </Text>
                  ) : null}
                  {history.length ? (
                    <View style={costDocumentStyles.history}>
                      <Text style={costDocumentStyles.historyTitle}>
                        APPROVAL HISTORY · {history.length} EVENT{history.length === 1 ? "" : "S"}
                      </Text>
                      {history.map((entry) => (
                        <View key={entry.id} style={costDocumentStyles.historyRow}>
                          <View
                            style={[
                              costDocumentStyles.historyDot,
                              entry.status === "APPROVED"
                                ? costDocumentStyles.historyDotApproved
                                : costDocumentStyles.historyDotPending,
                            ]}
                          />
                          <View style={styles.flex}>
                            <Text style={costDocumentStyles.historyStatus}>
                              {COST_DOCUMENT_APPROVAL_LABELS[entry.status].toUpperCase()} ·{" "}
                              {entry.changedBy}
                            </Text>
                            <Text style={costDocumentStyles.historyMeta}>
                              {formatDecisionTime(entry.changedAt)}
                            </Text>
                            {entry.reviewNote ? (
                              <Text style={costDocumentStyles.historyNote}>{entry.reviewNote}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {openMenuId === document.id ? (
                    <View style={costDocumentStyles.menu}>
                      <Text style={costDocumentStyles.reviewLabel}>REVIEW NOTE</Text>
                      <TextInput
                        accessibilityLabel={"Review note for " + document.description}
                        value={reviewNote}
                        onChangeText={(value) =>
                          setReviewNotes((current) => ({ ...current, [document.id]: value }))
                        }
                        multiline
                        placeholder="Explain the approval decision..."
                        placeholderTextColor="#8B8175"
                        style={costDocumentStyles.reviewInput}
                      />
                      <View style={costDocumentStyles.menuOptions}>
                        {COST_DOCUMENT_APPROVAL_STATUSES.map((status) => (
                          <Pressable
                            key={status}
                            onPress={() => {
                              const savedNote = reviewNote.trim();
                              onDecision(document.id, {
                                status,
                                reviewNote: savedNote || undefined,
                              });
                              setReviewNotes((current) => ({
                                ...current,
                                [document.id]: savedNote,
                              }));
                              setOpenMenuId(null);
                            }}
                            style={[
                              costDocumentStyles.menuOption,
                              approvalStatus === status && costDocumentStyles.menuOptionActive,
                            ]}
                          >
                            <Text
                              style={[
                                costDocumentStyles.menuOptionText,
                                approvalStatus === status &&
                                  costDocumentStyles.menuOptionTextActive,
                              ]}
                            >
                              {COST_DOCUMENT_APPROVAL_LABELS[status]}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
                <View style={costDocumentStyles.rightColumn}>
                  <Pressable
                    accessibilityLabel={"Change approval for " + document.description}
                    onPress={() => setOpenMenuId(openMenuId === document.id ? null : document.id)}
                    style={[
                      costDocumentStyles.statusButton,
                      approvalStatus === "APPROVED"
                        ? costDocumentStyles.approved
                        : costDocumentStyles.pending,
                    ]}
                  >
                    <Text
                      style={[
                        costDocumentStyles.statusButtonText,
                        approvalStatus === "APPROVED"
                          ? costDocumentStyles.approvedText
                          : costDocumentStyles.pendingText,
                      ]}
                    >
                      {COST_DOCUMENT_APPROVAL_LABELS[approvalStatus].toUpperCase()} ▾
                    </Text>
                  </Pressable>
                  {document.amount ? (
                    <Text style={styles.documentAmount}>
                      {formatMoney(job.currency, document.amount)}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyInline}>No cost documents match this approval status.</Text>
        )}
      </View>
    </>
  );
}
function TaskRow({
  task,
  styles,
  open,
  onToggle,
  onSave,
}: {
  task: WorkPackageTask;
  styles: ReturnType<typeof makeStyles>;
  open: boolean;
  onToggle: () => void;
  onSave: (updates: Partial<WorkPackageTask>) => void;
}) {
  const [progress, setProgress] = useState(String(task.progress));
  const [notes, setNotes] = useState(task.notes ?? "");
  const [status, setStatus] = useState(task.status);
  return (
    <View style={styles.task}>
      <Pressable onPress={onToggle} style={styles.taskHeader}>
        <View
          style={[
            styles.taskStatus,
            task.status === "COMPLETED"
              ? styles.statusDone
              : task.status === "BLOCKED"
                ? styles.statusBlocked
                : task.status === "IN_PROGRESS"
                  ? styles.statusProgress
                  : styles.statusPlain,
          ]}
        >
          <Text style={styles.taskStatusText}>
            {WORK_PACKAGE_STATUS_LABELS[task.status].toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.listTitle}>{task.title}</Text>
          <Text style={styles.listMeta}>
            {DISCIPLINE_LABELS[task.discipline]} · {task.assignedTo}
          </Text>
        </View>
        <Text style={styles.taskProgress}>{task.progress}%</Text>
      </Pressable>
      {open ? (
        <View style={styles.taskBody}>
          <Text style={styles.taskDescription}>{task.description}</Text>
          <View style={styles.taskDates}>
            <Text style={styles.listMeta}>START {task.startDate ?? "—"}</Text>
            <Text style={styles.listMeta}>DUE {task.dueDate ?? "—"}</Text>
            <Text style={styles.listMeta}>
              {formatMoney("COST", task.laborCost + task.materialCost)}
            </Text>
          </View>
          {task.materials.length ? (
            <View style={styles.materials}>
              {task.materials.map((material) => (
                <Text key={material.name} style={styles.materialLine}>
                  {material.name} · {material.quantity} {material.unit} ×{" "}
                  {material.unitCost.toLocaleString()} ={" "}
                  {(material.quantity * material.unitCost).toLocaleString()}
                </Text>
              ))}
            </View>
          ) : null}
          <Text style={styles.fieldLabel}>STATUS</Text>
          <View style={styles.statusChoices}>
            {WORK_PACKAGE_STATUSES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setStatus(item)}
                style={[styles.statusChoice, status === item && styles.statusChoiceActive]}
              >
                <Text
                  style={[
                    styles.statusChoiceText,
                    status === item && styles.statusChoiceTextActive,
                  ]}
                >
                  {WORK_PACKAGE_STATUS_LABELS[item].toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>PROGRESS (0–100)</Text>
          <TextInput
            value={progress}
            onChangeText={setProgress}
            keyboardType="numeric"
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Add a progress note..."
            placeholderTextColor="#756F68"
            style={[styles.input, styles.note]}
          />
          <View style={styles.editorActions}>
            <Pressable
              onPress={() =>
                onSave({
                  status,
                  progress: Math.max(0, Math.min(100, Math.round((Number(progress) || 0) / 5) * 5)),
                  notes,
                })
              }
              style={styles.saveTask}
            >
              <Text style={styles.saveTaskText}>SAVE CHANGES</Text>
            </Pressable>
            <Pressable onPress={onToggle}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CreateJobOrderPanel({
  visible,
  onClose,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { addJobOrder } = usePmecJobOrders();
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [targetEndDate, setTargetEndDate] = useState("2026-12-15");
  const [manager, setManager] = useState("Aaron Croes");
  const [discipline, setDiscipline] = useState<EngineeringDiscipline>("PROJECT_MANAGEMENT");
  const [priority, setPriority] = useState<JobOrderPriority>("MEDIUM");
  const valid = Boolean(
    title.trim() &&
    client.trim() &&
    currency.trim() &&
    Number(budget) > 0 &&
    startDate &&
    targetEndDate,
  );
  const submit = () => {
    if (!valid) return;
    addJobOrder({
      title,
      description: "New PMEC job order created locally for demonstration.",
      clientName: client,
      currency: currency.toUpperCase(),
      budget: Number(budget),
      contingencyPct: 10,
      startDate,
      targetEndDate,
      projectManagerName: manager || "PMEC Project Manager",
      discipline,
      priority,
      region: "ARUBA",
      tags: ["new-job-order"],
    });
    setTitle("");
    setClient("");
    setBudget("");
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Animated.View entering={SlideInRight.duration(260)} style={styles.createDrawer}>
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.eyebrow}>PMEC / PROJECT DELIVERY</Text>
              <Text style={styles.createTitle}>New Job Order</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.drawerScroll}>
            <Text style={styles.createCopy}>
              This local PMEC demo starts each job order in planning with no work packages and no
              derived spend. Currency is locked after creation.
            </Text>
            <FormField
              styles={styles}
              label="JOB ORDER TITLE *"
              value={title}
              setValue={setTitle}
            />
            <FormField styles={styles} label="CLIENT NAME *" value={client} setValue={setClient} />
            <FormField
              styles={styles}
              label="CURRENCY (ISO) *"
              value={currency}
              setValue={setCurrency}
            />
            <FormField
              styles={styles}
              label="BUDGET *"
              value={budget}
              setValue={setBudget}
              numeric
            />
            <FormField
              styles={styles}
              label="START DATE *"
              value={startDate}
              setValue={setStartDate}
            />
            <FormField
              styles={styles}
              label="TARGET END DATE *"
              value={targetEndDate}
              setValue={setTargetEndDate}
            />
            <FormField
              styles={styles}
              label="PROJECT MANAGER"
              value={manager}
              setValue={setManager}
            />
            <Text style={styles.fieldLabel}>LEAD DISCIPLINE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusChoices}
            >
              {DISCIPLINES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setDiscipline(item)}
                  style={[styles.statusChoice, discipline === item && styles.statusChoiceActive]}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      discipline === item && styles.statusChoiceTextActive,
                    ]}
                  >
                    {DISCIPLINE_LABELS[item].toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <View style={styles.statusChoices}>
              {priorityOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setPriority(item)}
                  style={[styles.statusChoice, priority === item && styles.statusChoiceActive]}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      priority === item && styles.statusChoiceTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              disabled={!valid}
              onPress={submit}
              style={[styles.createSubmit, !valid && styles.disabled]}
            >
              <Text style={styles.createSubmitText}>CREATE JOB ORDER</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
function FormField({
  styles,
  label,
  value,
  setValue,
  numeric,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
  setValue: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType={numeric ? "numeric" : "default"}
        style={styles.input}
      />
    </View>
  );
}
function SimpleForm({
  visible,
  onClose,
  title,
  fields,
  onSubmit,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  fields: string[];
  onSubmit: (values: string[]) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [values, setValues] = useState<string[]>(fields.map(() => ""));
  if (!visible) return null;
  return (
    <View style={styles.formOverlay}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{title.toUpperCase()}</Text>
        {fields.map((field, index) => (
          <FormField
            key={field}
            styles={styles}
            label={field.toUpperCase()}
            value={values[index] ?? ""}
            setValue={(value) =>
              setValues((current) =>
                current.map((item, itemIndex) => (itemIndex === index ? value : item)),
              )
            }
            numeric={field === "Amount"}
          />
        ))}
        <View style={styles.editorActions}>
          <Pressable
            disabled={values.some((value) => !value.trim())}
            onPress={() => {
              onSubmit(values);
              setValues(fields.map(() => ""));
            }}
            style={[styles.saveTask, values.some((value) => !value.trim()) && styles.disabled]}
          >
            <Text style={styles.saveTaskText}>SAVE</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
function AddWorkPackage({
  visible,
  onClose,
  onSubmit,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<WorkPackageTask, "id" | "materialCost">) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [phase, setPhase] = useState("General");
  if (!visible) return null;
  const save = () => {
    if (!title.trim() || !assignee.trim()) return;
    onSubmit({
      title,
      description: "New work package added to the PMEC local demonstration.",
      discipline: "PROJECT_MANAGEMENT",
      status: "NOT_STARTED",
      progress: 0,
      assignedTo: assignee,
      laborCost: 0,
      materials: [],
      wbsPhase: phase || "General",
    });
    setTitle("");
    setAssignee("");
    setPhase("General");
  };
  return (
    <View style={styles.formOverlay}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>ADD WORK PACKAGE</Text>
        <FormField styles={styles} label="Work package title" value={title} setValue={setTitle} />
        <FormField styles={styles} label="Assigned to" value={assignee} setValue={setAssignee} />
        <FormField styles={styles} label="WBS phase" value={phase} setValue={setPhase} />
        <Text style={styles.formHint}>
          Materials, labor, due date, and notes can be enriched in the project-management system’s
          next connected-data phase. The new package immediately enters the local WBS and portfolio
          calculations.
        </Text>
        {!title.trim() || !assignee.trim() ? (
          <Text accessibilityLiveRegion="polite" style={styles.actionHint}>
            {!title.trim() && !assignee.trim()
              ? "Add a title and who it is assigned to."
              : !assignee.trim()
                ? "Add who this package is assigned to."
                : "Add a title for this package."}
          </Text>
        ) : null}
        <View style={styles.editorActions}>
          <Pressable
            disabled={!title.trim() || !assignee.trim()}
            onPress={save}
            style={[styles.saveTask, (!title.trim() || !assignee.trim()) && styles.disabled]}
          >
            <Text style={styles.saveTaskText}>ADD PACKAGE</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
/** Adapts the grouped currency totals to the StatTile money shape. */
function toMoney(values: { currency: string; total: number }[]) {
  return values.map((item) => ({ currency: item.currency, amount: item.total }));
}

const makeStyles = (palette: ReturnType<typeof useLumen>["palette"]) =>
  StyleSheet.create({
    actionHint: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 12 },
    page: { backgroundColor: palette.background, flex: 1, flexDirection: "row" },
    rail: { backgroundColor: palette.rail, padding: 24, width: 220 },
    brand: { color: "#F6F3EE", fontSize: 30, fontWeight: "900", letterSpacing: -1.2 },
    brandSub: {
      color: palette.accentText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
      marginTop: 6,
    },
    railLine: { backgroundColor: "#3A3A3A", height: 1, marginTop: 45 },
    railLabel: {
      color: palette.inverseText,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
      marginTop: 18,
    },
    railCopy: { color: "#8E8982", fontSize: 10, lineHeight: 15, marginTop: 6 },
    railFoot: { bottom: 24, left: 24, position: "absolute", right: 24 },
    railFootTitle: {
      color: palette.inverseText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.7,
    },
    railFootCopy: { color: "#8E8982", fontSize: 10, lineHeight: 15, marginTop: 6 },
    main: { flex: 1 },
    mainScroll: { flex: 1 },
    header: {
      alignItems: "flex-start",
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 34,
      paddingVertical: 29,
    },
    eyebrow: { color: palette.accentText, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
    title: {
      color: palette.foreground,
      fontSize: 45,
      fontWeight: "900",
      letterSpacing: -2.3,
      lineHeight: 45,
      marginTop: 9,
    },
    subtitle: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: 550 },
    newButton: {
      alignItems: "center",
      backgroundColor: palette.foreground,
      borderRadius: 16,
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 17,
      paddingVertical: 13,
    },
    newButtonText: {
      color: palette.inverseText,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.7,
    },
    newButtonArrow: { color: palette.accentText, fontSize: 20, fontWeight: "400", lineHeight: 20 },
    kpiGrid: { flexDirection: "row", gap: 12, paddingHorizontal: 34, paddingTop: 18 },
    kpi: { backgroundColor: palette.surfaceStrong, flex: 1, minHeight: 122, padding: 16 },
    kpiLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.65 },
    kpiValue: {
      color: palette.foreground,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.8,
      marginTop: 18,
    },
    kpiDetail: { color: palette.muted, fontSize: 10, marginTop: 6 },
    filterBar: {
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: 12,
      paddingHorizontal: 34,
      paddingVertical: 20,
    },
    tabs: { flexDirection: "row", gap: 6 },
    tab: {
      borderColor: palette.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tabActive: { backgroundColor: palette.foreground, borderColor: palette.foreground },
    tabText: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
    tabTextActive: { color: palette.inverseText },
    // A dense chip reaches its 44px target with an invisible 8px ring. A horizontal row clips
    // anything outside its box, so the row makes room for the ring and pulls itself back.
    chipRow: { marginHorizontal: -8, marginVertical: -8 },
    chips: { gap: 7, paddingHorizontal: 8, paddingVertical: 8 },
    chip: {
      borderColor: palette.border,
      borderRadius: 15,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    chipActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent },
    chipText: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
    chipTextActive: { color: palette.accentText },
    cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, padding: 34 },
    card: {
      borderColor: palette.border,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 350,
      padding: 18,
      width: "31.8%",
    },
    cardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    cardPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    pill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
    pillDark: { backgroundColor: palette.foreground },
    pillPlain: { backgroundColor: palette.surfaceStrong },
    pillWarn: { backgroundColor: "#F7E8C8" },
    pillRisk: { backgroundColor: palette.dangerSoft },
    pillText: { color: palette.foreground, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
    pillTextDark: { color: palette.inverseText },
    cardRegion: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
    cardDiscipline: {
      color: palette.accentText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.7,
      marginTop: 25,
    },
    cardTitle: {
      color: palette.foreground,
      fontSize: 23,
      fontWeight: "900",
      letterSpacing: -0.9,
      lineHeight: 26,
      marginTop: 9,
    },
    cardClient: { color: palette.muted, fontSize: 11, marginTop: 8 },
    progressGroup: { marginTop: 20 },
    progressMeta: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 7,
    },
    progressLabel: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
    progressNumber: { color: palette.foreground, fontSize: 10, fontWeight: "900" },
    track: {
      backgroundColor: palette.surfaceStrong,
      borderRadius: 4,
      height: 7,
      overflow: "hidden",
      position: "relative",
    },
    trackFill: { borderRadius: 4, height: 7 },
    trackMarker: {
      backgroundColor: palette.foreground,
      borderStyle: "dashed",
      borderWidth: 1,
      height: 9,
      position: "absolute",
      top: -1,
      width: 1,
      zIndex: 3,
    },
    cardFooter: {
      alignItems: "center",
      borderTopColor: palette.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
      paddingTop: 13,
    },
    cardAssignee: { color: palette.foreground, fontSize: 9, fontWeight: "700", maxWidth: "58%" },
    cardDate: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
    lifecycle: { flexDirection: "row", marginTop: 15 },
    lifecycleItem: { alignItems: "center", flex: 1, flexDirection: "row" },
    lifecycleDot: { backgroundColor: palette.border, borderRadius: 5, height: 7, width: 7 },
    lifecycleDotActive: { backgroundColor: palette.accent, height: 10, width: 10 },
    lifecycleDotPulse: { borderColor: "#FFB08F", borderWidth: 3 },
    lifecycleLine: { backgroundColor: palette.border, flex: 1, height: 1, marginHorizontal: 2 },
    lifecycleLineDone: { backgroundColor: palette.foreground },
    empty: {
      alignItems: "center",
      borderColor: palette.border,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 270,
      padding: 30,
      width: "100%",
    },
    emptyTitle: { color: palette.foreground, fontSize: 23, fontWeight: "900" },
    emptyCopy: { color: palette.muted, fontSize: 12, marginTop: 8 },
    drawerOverlay: { backgroundColor: "rgba(25,25,25,.42)", flex: 1, justifyContent: "flex-end" },
    drawer: {
      backgroundColor: palette.background,
      height: "100%",
      marginLeft: "22%",
      width: "78%",
    },
    createDrawer: {
      backgroundColor: palette.background,
      height: "100%",
      marginLeft: "38%",
      width: "62%",
    },
    drawerHeader: {
      alignItems: "flex-start",
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 25,
    },
    drawerHeaderMain: { flex: 1, paddingRight: 20 },
    drawerDiscipline: {
      color: palette.accentText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.7,
      marginTop: 16,
    },
    drawerTitle: {
      color: palette.foreground,
      fontSize: 37,
      fontWeight: "900",
      letterSpacing: -1.5,
      lineHeight: 40,
      marginTop: 7,
    },
    drawerClient: { color: palette.muted, fontSize: 13, marginTop: 7 },
    close: {
      backgroundColor: palette.foreground,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    closeText: { color: palette.inverseText, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
    drawerScroll: { padding: 25 },
    detailIntro: {
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingBottom: 22,
    },
    detailDescription: { color: palette.foreground, fontSize: 14, lineHeight: 21, maxWidth: 720 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
    tag: { color: palette.accentText, fontSize: 10, fontWeight: "700" },
    detailFacts: { flexDirection: "row", gap: 12, marginTop: 20 },
    detailFact: { backgroundColor: palette.surfaceStrong, flex: 1, padding: 12 },
    detailFactLabel: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
    detailFactValue: { color: palette.foreground, fontSize: 11, fontWeight: "900", marginTop: 7 },
    advance: {
      alignSelf: "flex-start",
      borderBottomColor: palette.accent,
      borderBottomWidth: 1,
      marginTop: 20,
      paddingBottom: 4,
    },
    advanceText: { color: palette.accentText, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
    section: {
      alignItems: "center",
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 28,
      paddingBottom: 10,
    },
    sectionTitle: {
      color: palette.foreground,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    sectionAction: { color: palette.accentText, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    stats: { flexDirection: "row", gap: 10, marginTop: 14 },
    stat: { backgroundColor: palette.surfaceStrong, flex: 1, padding: 13 },
    statLabel: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
    statValue: {
      color: palette.foreground,
      fontSize: 15,
      fontWeight: "900",
      letterSpacing: -0.4,
      marginTop: 8,
    },
    detailProgress: { marginTop: 18 },
    multiplier: {
      color: palette.success,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.5,
      marginTop: 9,
    },
    multiplierRisk: { color: palette.dangerText },
    listCard: { borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth, marginTop: 11 },
    milestone: {
      alignItems: "center",
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 10,
      padding: 13,
    },
    milestoneCheck: {
      alignItems: "center",
      borderColor: palette.border,
      borderRadius: 11,
      borderWidth: 1,
      height: 21,
      justifyContent: "center",
      width: 21,
    },
    milestoneCheckActive: { backgroundColor: palette.success, borderColor: palette.success },
    milestoneTick: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
    flex: { flex: 1 },
    listTitle: { color: palette.foreground, fontSize: 13, fontWeight: "900" },
    listMeta: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    inlineAction: { alignSelf: "flex-start", padding: 13 },
    inlineActionText: { color: palette.accentText, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    wbsGroup: { marginTop: 16 },
    wbsTitle: {
      color: palette.accentText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.7,
      marginBottom: 6,
    },
    task: { borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth, marginBottom: 7 },
    taskHeader: { alignItems: "center", flexDirection: "row", gap: 10, padding: 13 },
    taskStatus: { borderRadius: 11, paddingHorizontal: 7, paddingVertical: 5 },
    statusDone: { backgroundColor: `${palette.success}22` },
    statusBlocked: { backgroundColor: palette.dangerSoft },
    statusProgress: { backgroundColor: palette.accentSoft },
    statusPlain: { backgroundColor: palette.surfaceStrong },
    taskStatusText: {
      color: palette.foreground,
      fontSize: 7,
      fontWeight: "900",
      letterSpacing: 0.45,
    },
    taskProgress: { color: palette.accentText, fontSize: 12, fontWeight: "900" },
    taskBody: {
      backgroundColor: palette.surfaceStrong,
      borderTopColor: palette.border,
      borderTopWidth: 1,
      padding: 13,
    },
    taskDescription: { color: palette.foreground, fontSize: 12, lineHeight: 18 },
    taskDates: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 11 },
    materials: {
      borderLeftColor: palette.accent,
      borderLeftWidth: 2,
      marginTop: 12,
      paddingLeft: 9,
    },
    materialLine: { color: palette.muted, fontSize: 10, lineHeight: 16 },
    fieldLabel: {
      color: palette.muted,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.6,
      marginTop: 17,
    },
    statusChoices: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    statusChoice: {
      borderColor: palette.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 7,
    },
    statusChoiceActive: { backgroundColor: palette.foreground, borderColor: palette.foreground },
    statusChoiceText: { color: palette.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.35 },
    statusChoiceTextActive: { color: palette.inverseText },
    input: {
      borderBottomColor: palette.border,
      borderBottomWidth: 1,
      color: palette.foreground,
      fontSize: 13,
      minHeight: 38,
      paddingVertical: 7,
    },
    note: { minHeight: 66, textAlignVertical: "top" },
    editorActions: { alignItems: "center", flexDirection: "row", gap: 14, marginTop: 17 },
    saveTask: {
      backgroundColor: palette.foreground,
      borderRadius: 11,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    saveTaskText: {
      color: palette.inverseText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    cancelText: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    document: {
      alignItems: "center",
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 10,
      padding: 13,
    },
    documentIcon: {
      alignItems: "center",
      backgroundColor: palette.accentSoft,
      borderRadius: 6,
      height: 28,
      justifyContent: "center",
      width: 32,
    },
    documentIconText: { color: palette.accentText, fontSize: 8, fontWeight: "900" },
    documentAmount: { color: palette.foreground, fontSize: 10, fontWeight: "900" },
    emptyInline: { color: palette.muted, fontSize: 11, padding: 14 },
    danger: { backgroundColor: palette.dangerSoft, marginTop: 28, padding: 15 },
    dangerTitle: { color: palette.dangerText, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
    dangerCopy: { color: "#7D4B46", fontSize: 11, lineHeight: 16, marginTop: 7 },
    deleteText: {
      color: palette.dangerText,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.55,
      marginTop: 13,
    },
    confirmRow: { alignItems: "center", flexDirection: "row", gap: 14, marginTop: 13 },
    deleteConfirm: {
      backgroundColor: palette.danger,
      borderRadius: 10,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },
    deleteConfirmText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900", letterSpacing: 0.45 },
    formOverlay: {
      alignItems: "center",
      backgroundColor: "rgba(25,25,25,.54)",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    formCard: {
      backgroundColor: palette.background,
      borderColor: palette.border,
      borderWidth: 1,
      maxWidth: 520,
      padding: 22,
      width: "80%",
    },
    formTitle: { color: palette.foreground, fontSize: 15, fontWeight: "900", letterSpacing: 0.4 },
    formHint: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 14 },
    createTitle: {
      color: palette.foreground,
      fontSize: 31,
      fontWeight: "900",
      letterSpacing: -1,
      marginTop: 8,
    },
    createCopy: { color: palette.muted, fontSize: 12, lineHeight: 18, marginBottom: 5 },
    createSubmit: {
      alignItems: "center",
      backgroundColor: palette.accent,
      borderRadius: 14,
      marginTop: 28,
      minHeight: 47,
      justifyContent: "center",
    },
    createSubmitText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
    disabled: { opacity: 0.35 },
    gate: {
      alignItems: "flex-start",
      backgroundColor: "#191919",
      flex: 1,
      justifyContent: "center",
      padding: 32,
    },
    gateBrand: { color: "#FF5A1F", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
    gateTitle: {
      color: "#F6F3EE",
      fontSize: 42,
      fontWeight: "900",
      letterSpacing: -2,
      lineHeight: 47,
      marginTop: 16,
    },
    gateCopy: { color: "#B7B0A8", fontSize: 15, lineHeight: 22, marginTop: 17, maxWidth: 300 },
    pressed: { opacity: 0.7 },
    budgetRisk: { backgroundColor: palette.danger },
    budgetWarn: { backgroundColor: palette.warningText },
    budgetSafe: { backgroundColor: palette.success },
  });

function ProjectTeamPanel({
  job,
  control,
}: {
  job: JobOrder;
  control: ReturnType<typeof usePmecControl>;
}) {
  const [activeTaskId, setActiveTaskId] = useState(job.tasks[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const selectedTask = job.tasks.find((taskItem) => taskItem.id === activeTaskId);
  const filteredPeople = control.workforce.filter((person) =>
    [person.name, person.role, person.discipline, person.type, person.location]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const activePeople = control.workforce.filter((person) => person.status === "Active").length;
  const assign = (person: PmecWorkforcePerson) => {
    if (selectedTask && person.status === "Active")
      control.assignTask(job.id, selectedTask.id, person.id);
  };
  return (
    <View style={projectTeamStyles.section}>
      <View style={projectTeamStyles.sectionHeader}>
        <View>
          <Text style={projectTeamStyles.kicker}>PROJECT TEAM & ASSIGNMENTS</Text>
          <Text style={projectTeamStyles.title}>
            {control.workforce.length} PEOPLE · {activePeople} AVAILABLE
          </Text>
        </View>
        <Text style={projectTeamStyles.local}>LOCAL SHOWCASE</Text>
      </View>
      <Text style={projectTeamStyles.copy}>
        Choose a work package, then assign any available PMEC employee or contractor. Changes are
        saved only in this browser for the demonstration.
      </Text>
      <Text style={projectTeamStyles.label}>1. SELECT WORK PACKAGE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={projectTeamStyles.taskChips}
      >
        {job.tasks.map((taskItem) => (
          <Pressable
            key={taskItem.id}
            onPress={() => setActiveTaskId(taskItem.id)}
            style={[
              projectTeamStyles.taskChip,
              activeTaskId === taskItem.id && projectTeamStyles.taskChipActive,
            ]}
          >
            <Text
              style={[
                projectTeamStyles.taskChipText,
                activeTaskId === taskItem.id && projectTeamStyles.taskChipTextActive,
              ]}
              numberOfLines={1}
            >
              {taskItem.title}
            </Text>
            <Text
              style={[
                projectTeamStyles.taskChipMeta,
                activeTaskId === taskItem.id && projectTeamStyles.taskChipTextActive,
              ]}
            >
              {taskItem.assignedTo}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={projectTeamStyles.searchShell}>
        <TextInput
          accessibilityLabel="Search workforce"
          value={query}
          onChangeText={setQuery}
          placeholder="Search all employees and contractors"
          placeholderTextColor="#8B8175"
          style={projectTeamStyles.searchInput}
        />
        <Text style={projectTeamStyles.searchCount}>{filteredPeople.length} PEOPLE</Text>
      </View>
      <Text style={projectTeamStyles.label}>
        2. ASSIGN TO {selectedTask?.title ?? "A WORK PACKAGE"}
      </Text>
      <ScrollView
        style={projectTeamStyles.peopleList}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {filteredPeople.map((person) => {
          const existing = control.assignments.find(
            (item) => item.jobOrderId === job.id && item.employeeId === person.id,
          );
          const unavailable = person.status !== "Active";
          return (
            <Pressable
              key={person.id}
              disabled={unavailable || !selectedTask}
              onPress={() => assign(person)}
              style={({ pressed }) => [
                projectTeamStyles.personRow,
                (unavailable || !selectedTask) && projectTeamStyles.personDisabled,
                pressed && projectTeamStyles.personPressed,
              ]}
            >
              <View style={projectTeamStyles.personAvatar}>
                <Text style={projectTeamStyles.personInitials}>
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </Text>
              </View>
              <View style={projectTeamStyles.personMain}>
                <Text style={projectTeamStyles.personName}>{person.name}</Text>
                <Text style={projectTeamStyles.personMeta}>
                  {person.role} · {person.discipline}
                </Text>
                <Text style={projectTeamStyles.personMeta}>
                  {person.type} · {person.location} · {person.allocation}% allocated
                </Text>
              </View>
              <View style={projectTeamStyles.personAction}>
                <Text
                  style={[
                    projectTeamStyles.availability,
                    unavailable && projectTeamStyles.unavailable,
                  ]}
                >
                  {unavailable ? person.status.toUpperCase() : "AVAILABLE"}
                </Text>
                <Text style={projectTeamStyles.assignText}>
                  {existing ? "REASSIGN" : "ASSIGN"} →
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MilestoneScheduleForm({
  visible,
  onClose,
  onSubmit,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<JobOrderMilestone, "id" | "achieved">) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const today = new Date();
  const [label, setLabel] = useState("");
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [targetDate, setTargetDate] = useState("");
  if (!visible) return null;
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = Array.from(
    { length: new Date(year, month + 1, 0).getDate() },
    (_, index) => index + 1,
  );
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() }, (_, index) => index);
  const chooseDate = (day: number) =>
    setTargetDate(
      [year, String(month + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-"),
    );
  const submit = () => {
    if (label.trim() && targetDate) {
      onSubmit({ label: label.trim(), targetDate });
      setLabel("");
      setTargetDate("");
    }
  };
  return (
    <View style={styles.formOverlay}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>SCHEDULE MILESTONE</Text>
        <Text style={styles.formHint}>
          Set a target date from the project calendar. This local-demo schedule is retained in this
          browser.
        </Text>
        <FormField styles={styles} label="Milestone label" value={label} setValue={setLabel} />
        <Text style={calendarStyles.label}>TARGET DATE {targetDate ? "· " + targetDate : ""}</Text>
        <View style={calendarStyles.monthHeader}>
          <Pressable
            onPress={() => setCursor(new Date(year, month - 1, 1))}
            style={calendarStyles.monthButton}
          >
            <Text style={calendarStyles.monthButtonText}>←</Text>
          </Pressable>
          <Text style={calendarStyles.monthTitle}>
            {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <Pressable
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            style={calendarStyles.monthButton}
          >
            <Text style={calendarStyles.monthButtonText}>→</Text>
          </Pressable>
        </View>
        <View style={calendarStyles.week}>
          <Text style={calendarStyles.weekday}>S</Text>
          <Text style={calendarStyles.weekday}>M</Text>
          <Text style={calendarStyles.weekday}>T</Text>
          <Text style={calendarStyles.weekday}>W</Text>
          <Text style={calendarStyles.weekday}>T</Text>
          <Text style={calendarStyles.weekday}>F</Text>
          <Text style={calendarStyles.weekday}>S</Text>
        </View>
        <View style={calendarStyles.grid}>
          {blanks.map((blank) => (
            <View key={"blank-" + blank} style={calendarStyles.day} />
          ))}
          {days.map((day) => {
            const iso = [
              year,
              String(month + 1).padStart(2, "0"),
              String(day).padStart(2, "0"),
            ].join("-");
            return (
              <Pressable
                key={iso}
                onPress={() => chooseDate(day)}
                style={[calendarStyles.day, targetDate === iso && calendarStyles.daySelected]}
              >
                <Text
                  style={[
                    calendarStyles.dayText,
                    targetDate === iso && calendarStyles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {!label.trim() || !targetDate ? (
          <Text accessibilityLiveRegion="polite" style={styles.actionHint}>
            {!label.trim() && !targetDate
              ? "Name the milestone and pick a target date."
              : !targetDate
                ? "Pick a target date to add this milestone."
                : "Name the milestone to add it."}
          </Text>
        ) : null}
        <View style={styles.editorActions}>
          <Pressable
            disabled={!label.trim() || !targetDate}
            onPress={submit}
            style={[styles.saveTask, (!label.trim() || !targetDate) && styles.disabled]}
          >
            <Text style={styles.saveTaskText}>ADD MILESTONE</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "Local file";
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function CostDocumentUploadForm({
  visible,
  onClose,
  onSubmit,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<CostDocument, "id" | "uploadedAt" | "uploadedBy">) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [asset, setAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [documentType, setDocumentType] = useState<CostDocumentType>("OTHER");
  const [approvalStatus, setApprovalStatus] = useState<CostDocumentApprovalStatus>("PENDING");
  const [tags, setTags] = useState<string[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const [pickerNotice, setPickerNotice] = useState("");
  if (!visible) return null;

  const selectAsset = (nextAsset: DocumentPicker.DocumentPickerAsset) => {
    setAsset(nextAsset);
    setPickerNotice("");
    if (!description) setDescription(nextAsset.name);
  };
  const pick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) selectAsset(result.assets[0]);
    } catch {
      setPickerNotice("The file picker could not open. Try dropping a supported file instead.");
    }
  };
  const acceptDroppedFile = (file: File) => {
    const supported =
      file.type === "application/pdf" ||
      file.type.startsWith("image/") ||
      /\.(pdf|png|jpe?g|webp|xlsx?|csv)$/i.test(file.name);
    if (!supported) {
      setPickerNotice("Use a PDF, image, invoice, receipt, spreadsheet, or CSV file.");
      return;
    }
    selectAsset({
      name: file.name,
      size: file.size,
      mimeType: file.type || null,
      uri: URL.createObjectURL(file),
    } as DocumentPicker.DocumentPickerAsset);
  };
  const dropHandlers =
    Platform.OS === "web"
      ? {
          onDragEnter: (event: any) => {
            event.preventDefault();
            setDropActive(true);
          },
          onDragOver: (event: any) => {
            event.preventDefault();
            setDropActive(true);
          },
          onDragLeave: (event: any) => {
            event.preventDefault();
            setDropActive(false);
          },
          onDrop: (event: any) => {
            event.preventDefault();
            setDropActive(false);
            const files = event?.nativeEvent?.dataTransfer?.files ?? event?.dataTransfer?.files;
            const droppedFile = files?.[0] as File | undefined;
            if (droppedFile) acceptDroppedFile(droppedFile);
          },
        }
      : {};
  const save = () => {
    if (!asset) return;
    onSubmit({
      description: description.trim() || asset.name,
      amount: Number(amount) || undefined,
      documentType,
      approvalStatus,
      tags,
      url: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType,
      sizeBytes: asset.size,
    });
    setAsset(null);
    setDescription("");
    setAmount("");
    setDocumentType("OTHER");
    setApprovalStatus("PENDING");
    setTags([]);
    setPickerNotice("");
  };
  return (
    <View style={styles.formOverlay}>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>UPLOAD COST DOCUMENT</Text>
        <Text style={styles.formHint}>
          The demonstration keeps the selected file reference and metadata only on this device. No
          document is transmitted to PMEC servers.
        </Text>
        <View
          {...dropHandlers}
          style={[uploadStyles.dropZone, dropActive && uploadStyles.dropZoneActive]}
        >
          <Text style={uploadStyles.dropKicker}>
            {dropActive ? "RELEASE TO SELECT" : "DROP DOCUMENT HERE"}
          </Text>
          <Text style={uploadStyles.dropCopy}>
            Drop one PDF, image, invoice, receipt, spreadsheet, or CSV file.
          </Text>
          <Pressable onPress={() => void pick()} style={uploadStyles.pickButton}>
            <Text style={uploadStyles.pickLabel}>
              {asset ? "CHOOSE A DIFFERENT FILE" : "BROWSE FILES"}
            </Text>
            <Text style={uploadStyles.pickName} numberOfLines={1}>
              {asset ? asset.name : "Or use the secure device file picker"}
            </Text>
          </Pressable>
        </View>
        {asset ? (
          <View style={uploadStyles.selectedFile}>
            <Text style={uploadStyles.selectedKicker}>FILE READY · LOCAL ONLY</Text>
            <Text style={uploadStyles.selectedName} numberOfLines={1}>
              {asset.name}
            </Text>
            <Text style={uploadStyles.selectedMeta}>
              {formatFileSize(asset.size)} · {asset.mimeType || "Unknown type"}
            </Text>
          </View>
        ) : null}
        {pickerNotice ? <Text style={uploadStyles.notice}>{pickerNotice}</Text> : null}
        <FormField
          styles={styles}
          label="Description"
          value={description}
          setValue={setDescription}
        />
        <FormField
          styles={styles}
          label="Amount (optional)"
          value={amount}
          setValue={setAmount}
          numeric
        />
        <Text style={styles.fieldLabel}>DOCUMENT TYPE</Text>
        <View style={styles.statusChoices}>
          {(
            [
              "SUBCONTRACTOR_INVOICE",
              "PURCHASE_RECEIPT",
              "CONTRACT",
              "CHANGE_ORDER",
              "OTHER",
            ] as CostDocumentType[]
          ).map((item) => (
            <Pressable
              key={item}
              onPress={() => setDocumentType(item)}
              style={[styles.statusChoice, documentType === item && styles.statusChoiceActive]}
            >
              <Text
                style={[
                  styles.statusChoiceText,
                  documentType === item && styles.statusChoiceTextActive,
                ]}
              >
                {item.replaceAll("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>APPROVAL STATUS</Text>
        <View style={styles.statusChoices}>
          {COST_DOCUMENT_APPROVAL_STATUSES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setApprovalStatus(item)}
              style={[styles.statusChoice, approvalStatus === item && styles.statusChoiceActive]}
            >
              <Text
                style={[
                  styles.statusChoiceText,
                  approvalStatus === item && styles.statusChoiceTextActive,
                ]}
              >
                {COST_DOCUMENT_APPROVAL_LABELS[item].toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>CATEGORY TAGS</Text>
        <Text style={uploadStyles.tagHint}>Select all tags that describe this record.</Text>
        <View style={styles.statusChoices}>
          {COST_DOCUMENT_CATEGORY_TAGS.map((item) => (
            <Pressable
              key={item}
              onPress={() =>
                setTags((current) =>
                  current.includes(item)
                    ? current.filter((tag) => tag !== item)
                    : [...current, item],
                )
              }
              style={[styles.statusChoice, tags.includes(item) && styles.statusChoiceActive]}
            >
              <Text
                style={[
                  styles.statusChoiceText,
                  tags.includes(item) && styles.statusChoiceTextActive,
                ]}
              >
                #{item}
              </Text>
            </Pressable>
          ))}
        </View>
        {!asset ? (
          <Text accessibilityLiveRegion="polite" style={styles.actionHint}>
            Attach a file to add it to cost records.
          </Text>
        ) : null}
        <View style={styles.editorActions}>
          <Pressable
            disabled={!asset}
            onPress={save}
            style={[styles.saveTask, !asset && styles.disabled]}
          >
            <Text style={styles.saveTaskText}>ADD TO COST RECORDS</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const projectTeamStyles = StyleSheet.create({
  section: {
    borderTopColor: "#DDD6CC",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 30,
    paddingTop: 24,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kicker: { color: "#A84B2A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  title: { color: "#1A1A1A", fontSize: 14, fontWeight: "900", marginTop: 6 },
  local: {
    backgroundColor: "#F2E6DB",
    color: "#A84B2A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.55,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  copy: { color: "#6E6256", fontSize: 11, lineHeight: 16, marginTop: 11, maxWidth: 720 },
  label: { color: "#6E6256", fontSize: 8, fontWeight: "900", letterSpacing: 0.65, marginTop: 18 },
  taskChips: { gap: 8, paddingTop: 9 },
  taskChip: {
    borderColor: "#DDD6CC",
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 190,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  taskChipActive: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  taskChipText: { color: "#1A1A1A", fontSize: 10, fontWeight: "900" },
  taskChipTextActive: { color: "#FFFDF8" },
  taskChipMeta: { color: "#8B8175", fontSize: 9, marginTop: 5 },
  searchShell: {
    alignItems: "center",
    backgroundColor: "#F0ECE5",
    borderColor: "#DDD6CC",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    paddingHorizontal: 12,
  },
  searchInput: { color: "#1A1A1A", flex: 1, fontSize: 12, minHeight: 40 },
  searchCount: { color: "#A84B2A", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  peopleList: { maxHeight: 320, marginTop: 9 },
  personRow: {
    alignItems: "center",
    borderBottomColor: "#E7E1D8",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11,
  },
  personDisabled: { opacity: 0.55 },
  personPressed: { opacity: 0.72 },
  personAvatar: {
    alignItems: "center",
    backgroundColor: "#F2E6DB",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  personInitials: { color: "#A84B2A", fontSize: 10, fontWeight: "900" },
  personMain: { flex: 1 },
  personName: { color: "#1A1A1A", fontSize: 11, fontWeight: "900" },
  personMeta: { color: "#756F68", fontSize: 9, marginTop: 3 },
  personAction: { alignItems: "flex-end", gap: 5 },
  availability: { color: "#1F6349", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  unavailable: { color: "#9E3A31" },
  assignText: { color: "#A84B2A", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
});
const calendarStyles = StyleSheet.create({
  label: { color: "#6E6256", fontSize: 8, fontWeight: "900", letterSpacing: 0.65, marginTop: 15 },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: "#F0ECE5",
    borderRadius: 9,
    height: 31,
    justifyContent: "center",
    width: 31,
  },
  monthButtonText: { color: "#1A1A1A", fontSize: 16, fontWeight: "900" },
  monthTitle: { color: "#1A1A1A", fontSize: 12, fontWeight: "900" },
  week: { flexDirection: "row", marginTop: 12 },
  weekday: { color: "#8B8175", flex: 1, fontSize: 8, fontWeight: "900", textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  day: {
    alignItems: "center",
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: "14.2857%",
  },
  daySelected: { backgroundColor: "#A84B2A" },
  dayText: { color: "#1A1A1A", fontSize: 10, fontWeight: "800" },
  dayTextSelected: { color: "#FFFDF8" },
});
const uploadStyles = StyleSheet.create({
  dropZone: {
    backgroundColor: "#F8F4ED",
    borderColor: "#C9BBAA",
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1.5,
    marginTop: 16,
    padding: 16,
  },
  dropZoneActive: { backgroundColor: "#F2E6DB", borderColor: "#A84B2A" },
  dropKicker: { color: "#A84B2A", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  dropCopy: { color: "#6E6256", fontSize: 10, lineHeight: 15, marginTop: 6 },
  pickButton: {
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickLabel: { color: "#FFFDF8", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  pickName: { color: "#E7D9CB", flex: 1, fontSize: 9, marginLeft: 9, textAlign: "right" },
  selectedFile: {
    backgroundColor: "#E8F1ED",
    borderLeftColor: "#3A7563",
    borderLeftWidth: 3,
    marginTop: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedKicker: { color: "#2A5F50", fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
  selectedName: { color: "#1A1A1A", fontSize: 11, fontWeight: "900", marginTop: 5 },
  selectedMeta: { color: "#517062", fontSize: 9, marginTop: 4 },
  notice: { color: "#A84B2A", fontSize: 10, fontWeight: "700", lineHeight: 15, marginTop: 10 },
  tagHint: { color: "#6E6256", fontSize: 9, marginTop: 6 },
});
