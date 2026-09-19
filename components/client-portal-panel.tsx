import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getApiBaseUrl } from "@/constants/oauth";
import { clientChangeOrderDocumentId, type JobOrder } from "@/lib/pmec-job-orders";
import { usePmecJobOrders } from "@/lib/pmec-job-order-workspace";

/**
 * What this job order's client sees at client.pmec.group, and the change orders they
 * decide there.
 *
 * Nothing reaches the client until the PM presses Publish: the job order is edited freely
 * here, and only the fields below — never internal costs, rates or notes — are sent. Change
 * orders go out one at a time and come back with the client's decision, who made it and
 * when. The panel re-reads every few seconds so a decision lands here without a reload.
 */

type ChangeOrder = {
  id: string;
  number: number;
  title: string;
  reason: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  raised_by: string;
  raised_at: string;
  decided_by_label?: string | null;
  decided_at?: string | null;
  decision_note?: string | null;
};

type PortalState = {
  project: {
    original_contract_value: number;
    invoiced_to_date: number;
    progress: number;
    status_label: string;
    headline: string | null;
    currency: string;
    location: string | null;
    published_at: string | null;
    published_by: string | null;
  } | null;
  client: { name: string } | null;
  milestones?: { id: string; title: string; target_date: string | null; status: string }[];
  change_orders: ChangeOrder[];
  updates: { id: string; title: string; detail: string | null; posted_at: string }[];
};

type Load =
  | { kind: "loading" }
  | { kind: "ready"; state: PortalState }
  | { kind: "unlinked" }
  | { kind: "locked" }
  | { kind: "unavailable"; message: string };

const STATUS_LABELS = ["On programme", "At risk", "Delayed", "Complete"] as const;
const POLL_MS = 5000;

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

const money = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
};

/** A comparable fingerprint of a milestone list, local or published. */
const milestoneKey = (items: { id: string; title: string; targetDate?: string | null; target_date?: string | null; status: string }[]) =>
  items.map((item) => `${item.id}|${item.title}|${item.targetDate ?? item.target_date ?? ""}|${item.status}`).join("~");

/** Achieved milestones are complete, the next one is live, the rest are to come. */
export function milestonesForClient(job: JobOrder) {
  const ordered = [...job.milestones].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  let activeSet = false;
  return ordered.map((milestone, index) => {
    let status: "complete" | "active" | "upcoming" = "upcoming";
    if (milestone.achieved) status = "complete";
    else if (!activeSet) {
      status = "active";
      activeSet = true;
    }
    return {
      id: milestone.id,
      code: `M${String(index + 1).padStart(2, "0")}`,
      title: milestone.label,
      targetDate: milestone.achieved && milestone.achievedDate ? milestone.achievedDate : milestone.targetDate,
      status,
    };
  });
}

export function ClientPortalPanel({ job }: { job: JobOrder }) {
  const base = getApiBaseUrl();
  const endpoint = `${base}/api/client-portal/${encodeURIComponent(job.id)}`;
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const { applyClientChangeOrders } = usePmecJobOrders();

  // Milestones follow the job order on their own once the project has been published: tick
  // one here and the client's programme moves, without pressing Publish. Before the first
  // publish nothing is sent, so a milestone can never publish a project by itself.
  const [milestoneSync, setMilestoneSync] = useState<"idle" | "syncing" | "synced" | "failed">("idle");
  const [retry, setRetry] = useState(0);
  const localMilestones = useMemo(() => milestonesForClient(job), [job]);
  const localKey = milestoneKey(localMilestones);
  const publishedKey = load.kind === "ready" && load.state.milestones ? milestoneKey(load.state.milestones) : null;
  const isPublished = load.kind === "ready" && Boolean(load.state.project?.published_at);
  useEffect(() => {
    if (!isPublished || publishedKey === null || publishedKey === localKey) return;
    let cancelled = false;
    setMilestoneSync("syncing");
    void fetch(`${endpoint}/milestones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ milestones: localMilestones }) })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error(String(res.status));
        setMilestoneSync("synced");
        await refresh();
      })
      .catch(() => {
        if (cancelled) return;
        setMilestoneSync("failed");
        retryTimer = setTimeout(() => setRetry((value) => value + 1), 4000);
      });
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the two fingerprints
  }, [isPublished, publishedKey, localKey, endpoint, retry]);

  // A change order the client approved moves this job order's budget. Applying is
  // idempotent, so every refresh can safely re-send the full approved list.
  const approved = load.kind === "ready" ? load.state.change_orders.filter((order) => order.status === "approved") : [];
  const unapplied = approved.filter((order) => !job.costDocuments.some((document) => document.id === clientChangeOrderDocumentId(order.id)));
  const unappliedKey = unapplied.map((order) => order.id).join(",");
  useEffect(() => {
    if (!unappliedKey) return;
    applyClientChangeOrders(
      job.id,
      unapplied.map((order) => ({
        id: order.id,
        number: order.number,
        title: order.title,
        amount: Number(order.amount),
        decidedAt: order.decided_at ?? new Date().toISOString(),
        decidedBy: order.decided_by_label ?? "Client",
        note: order.decision_note,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the ids that still need applying
  }, [unappliedKey, job.id, applyClientChangeOrders]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.status === 404) return setLoad({ kind: "unlinked" });
      if (res.status === 403) return setLoad({ kind: "locked" });
      if (!res.ok) return setLoad({ kind: "unavailable", message: res.status === 503 ? "The client portal is not configured on this server." : "The client portal could not be reached." });
      setLoad({ kind: "ready", state: (await res.json()) as PortalState });
    } catch {
      setLoad({ kind: "unavailable", message: "The client portal could not be reached." });
    }
  }, [endpoint]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>CLIENT PORTAL</Text>
          <Text style={styles.title}>
            {load.kind === "ready" && load.state.client ? `SHARED WITH ${load.state.client.name.toUpperCase()}` : "WHAT THE CLIENT SEES"}
          </Text>
        </View>
        {load.kind === "ready" ? (
          <Text style={[styles.badge, load.state.project?.published_at ? styles.badgeLive : null]}>
            {load.state.project?.published_at ? `PUBLISHED ${when(load.state.project.published_at).toUpperCase()}` : "NOT PUBLISHED"}
          </Text>
        ) : null}
      </View>

      {load.kind === "loading" ? <ActivityIndicator style={{ marginTop: 18, alignSelf: "flex-start" }} color="#A84B2A" /> : null}
      {load.kind === "unlinked" ? (
        <Text style={styles.copy}>
          This job order is not shared with a client yet. Once PMEC links it to a client account, you can publish its
          progress, milestones and budget here, and raise change orders for the client to approve.
        </Text>
      ) : null}
      {load.kind === "locked" ? (
        <Text style={styles.copy}>
          This job order belongs to a live client. Only demonstration clients can be published while the Command
          Center is in demo mode.
        </Text>
      ) : null}
      {load.kind === "unavailable" ? <Text style={styles.error}>{load.message}</Text> : null}
      {load.kind === "ready" && isPublished ? (
        <Text style={[styles.meta, milestoneSync === "failed" ? styles.live : styles.ok]}>
          {milestoneSync === "syncing"
            ? "SENDING MILESTONE CHANGE TO CLIENT…"
            : milestoneSync === "failed"
              ? "MILESTONE CHANGE NOT SENT YET — RETRYING"
              : "MILESTONES SYNC TO THE CLIENT AUTOMATICALLY"}
        </Text>
      ) : null}

      {load.kind === "ready" ? <ReadyPanel job={job} endpoint={endpoint} state={load.state} onChanged={refresh} /> : null}
    </View>
  );
}

function ReadyPanel({ job, endpoint, state, onChanged }: { job: JobOrder; endpoint: string; state: PortalState; onChanged: () => Promise<void> }) {
  const published = state.project;
  const currency = published?.currency ?? job.currency;
  const approved = state.change_orders.filter((order) => order.status === "approved").reduce((sum, order) => sum + Number(order.amount), 0);
  const pending = state.change_orders.filter((order) => order.status === "pending");

  return (
    <>
      <View style={styles.figures}>
        <Figure label="ORIGINAL CONTRACT" value={money(Number(published?.original_contract_value ?? 0), currency)} />
        <Figure label="APPROVED CHANGES" value={`${approved >= 0 ? "+" : ""}${money(approved, currency)}`} />
        <Figure label="CURRENT CONTRACT" value={money(Number(published?.original_contract_value ?? 0) + approved, currency)} strong />
        <Figure label="AWAITING CLIENT" value={`${pending.length} CHANGE ORDER${pending.length === 1 ? "" : "S"}`} />
      </View>

      <PublishForm job={job} endpoint={endpoint} published={published} onDone={onChanged} />
      <ChangeOrders endpoint={endpoint} currency={currency} orders={state.change_orders} onDone={onChanged} />
      <SiteUpdate endpoint={endpoint} updates={state.updates} onDone={onChanged} />
    </>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.figure}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.figureValue, strong && styles.figureStrong]}>{value}</Text>
    </View>
  );
}

async function send(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

function PublishForm({ job, endpoint, published, onDone }: { job: JobOrder; endpoint: string; published: PortalState["project"]; onDone: () => Promise<void> }) {
  const doneTasks = job.tasks.filter((task) => task.status === "COMPLETED").length;
  const taskProgress = job.tasks.length ? Math.round((doneTasks / job.tasks.length) * 100) : 0;
  const [contract, setContract] = useState(String(published?.original_contract_value ?? job.budget));
  const [invoiced, setInvoiced] = useState(String(published?.invoiced_to_date ?? 0));
  // Always start from the work itself, so employees' task updates reach the client on the
  // next publish without the PM recalculating anything.
  const [progress, setProgress] = useState(String(taskProgress));
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setProgress(String(taskProgress));
  }, [taskProgress, touched]);
  const [statusLabel, setStatusLabel] = useState(published?.status_label ?? "On programme");
  const [headline, setHeadline] = useState(published?.headline ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const milestones = useMemo(() => milestonesForClient(job), [job]);

  const publish = async () => {
    const contractValue = Number(contract.replace(/[, ]/g, ""));
    const invoicedValue = Number(invoiced.replace(/[, ]/g, ""));
    const progressValue = Number(progress);
    if (!Number.isFinite(contractValue) || contractValue < 0) return setMessage({ tone: "error", text: "Enter the contract value as a number." });
    if (!Number.isFinite(invoicedValue) || invoicedValue < 0) return setMessage({ tone: "error", text: "Enter the invoiced amount as a number." });
    if (!Number.isInteger(progressValue) || progressValue < 0 || progressValue > 100) return setMessage({ tone: "error", text: "Progress must be a whole number from 0 to 100." });
    setBusy(true);
    setMessage(null);
    try {
      await send(`${endpoint}/publish`, {
        project: {
          name: job.title,
          discipline: job.discipline.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
          currency: job.currency,
          originalContractValue: contractValue,
          invoicedToDate: invoicedValue,
          progress: progressValue,
          statusLabel,
          headline,
          startDate: job.startDate,
          targetEndDate: job.targetEndDate,
        },
        milestones,
        publishedBy: job.projectManagerName,
      });
      setMessage({ tone: "ok", text: "Published. The client portal now shows this." });
      await onDone();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Publishing failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>PROGRESS, MILESTONES & BUDGET</Text>
      <Text style={styles.copy}>
        Edit freely; figures reach the client when you publish. Milestones come from this job order (achieved ones show
        as complete, the next one as in progress) and, once published, follow it automatically.
      </Text>
      <View style={styles.row}>
        <Field label="ORIGINAL CONTRACT VALUE" value={contract} onChange={setContract} numeric />
        <Field label="INVOICED TO DATE" value={invoiced} onChange={setInvoiced} numeric />
        <Field label="PROGRESS %" value={progress} onChange={(value) => { setTouched(true); setProgress(value); }} numeric narrow />
      </View>
      <Text style={styles.meta}>
        LIVE FROM WORK PACKAGES: {taskProgress}% ({doneTasks}/{job.tasks.length} complete)
        {published ? ` · CLIENT CURRENTLY SEES ${published.progress}%` : ""}
        {published && published.progress !== taskProgress ? " · PUBLISH TO UPDATE" : ""}
      </Text>
      {touched && Number(progress) !== taskProgress ? (
        <Pressable accessibilityRole="button" onPress={() => { setTouched(false); setProgress(String(taskProgress)); }} style={styles.secondary}>
          <Text style={styles.secondaryText}>USE LIVE {taskProgress}%</Text>
        </Pressable>
      ) : null}
      <Text style={styles.label}>STATUS SHOWN TO CLIENT</Text>
      <View style={styles.chips}>
        {STATUS_LABELS.map((label) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected: statusLabel === label }}
            onPress={() => setStatusLabel(label)}
            style={[styles.chip, statusLabel === label && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusLabel === label && styles.chipTextActive]}>{label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="HEADLINE FOR THE CLIENT" value={headline} onChange={setHeadline} placeholder="One sentence on where the project stands" />
      <Text style={styles.label}>MILESTONES THAT WILL BE PUBLISHED · {milestones.length}</Text>
      {milestones.map((milestone) => (
        <View key={milestone.id} style={styles.milestone}>
          <Text style={[styles.milestoneStatus, milestone.status === "complete" ? styles.ok : milestone.status === "active" ? styles.live : null]}>
            {milestone.status === "complete" ? "COMPLETE" : milestone.status === "active" ? "IN PROGRESS" : "UPCOMING"}
          </Text>
          <Text style={styles.milestoneTitle}>
            {milestone.code} · {milestone.title}
          </Text>
          <Text style={styles.meta}>{milestone.targetDate}</Text>
        </View>
      ))}
      <Pressable accessibilityRole="button" disabled={busy} onPress={publish} style={[styles.primary, busy && styles.disabled]}>
        <Text style={styles.primaryText}>{busy ? "PUBLISHING…" : "PUBLISH TO CLIENT"}</Text>
      </Pressable>
      {message ? <Text style={message.tone === "ok" ? styles.success : styles.error}>{message.text}</Text> : null}
    </View>
  );
}

function ChangeOrders({ endpoint, currency, orders, onDone }: { endpoint: string; currency: string; orders: ChangeOrder[]; onDone: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const raise = async () => {
    const value = Number(amount.replace(/[, ]/g, ""));
    if (!title.trim() || !reason.trim()) return setMessage({ tone: "error", text: "Give the change order a title and a reason." });
    if (!Number.isFinite(value) || value === 0) return setMessage({ tone: "error", text: "Enter the amount; use a minus sign for a reduction." });
    setBusy(true);
    setMessage(null);
    try {
      await send(`${endpoint}/change-orders`, { title, reason, amount: value });
      setTitle("");
      setReason("");
      setAmount("");
      setMessage({ tone: "ok", text: "Sent. The client can approve or reject it in their portal." });
      await onDone();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not send the change order." });
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (order: ChangeOrder) => {
    try {
      await send(`${endpoint}/change-orders/${order.id}/withdraw`, {});
      await onDone();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not withdraw it." });
    }
  };

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>CHANGE ORDERS · BUDGET ADJUSTMENTS</Text>
      {orders.length === 0 ? <Text style={styles.copy}>No change orders have been sent to this client.</Text> : null}
      {[...orders].reverse().map((order) => (
        <View key={order.id} style={styles.order}>
          <View style={styles.flex}>
            <Text style={styles.orderTitle}>
              CO-{String(order.number).padStart(2, "0")} · {order.title}
            </Text>
            <Text style={styles.meta}>
              {Number(order.amount) > 0 ? "+" : ""}
              {money(Number(order.amount), currency)} · raised {when(order.raised_at)}
            </Text>
            {order.decided_at && order.status !== "withdrawn" ? (
              <Text style={styles.meta}>
                {order.status === "approved" ? "Approved" : "Rejected"} by {order.decided_by_label} · {when(order.decided_at)}
                {order.decision_note ? ` — “${order.decision_note}”` : ""}
              </Text>
            ) : null}
            {order.status === "approved" ? <Text style={[styles.meta, styles.ok]}>ADDED TO THIS JOB ORDER&apos;S BUDGET</Text> : null}
          </View>
          <Text style={[styles.orderStatus, order.status === "approved" ? styles.ok : order.status === "pending" ? styles.live : styles.muted]}>
            {order.status === "pending" ? "AWAITING CLIENT" : order.status.toUpperCase()}
          </Text>
          {order.status === "pending" ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Withdraw change order ${order.number}`} onPress={() => withdraw(order)} style={styles.secondary}>
              <Text style={styles.secondaryText}>WITHDRAW</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Text style={[styles.label, { marginTop: 18 }]}>RAISE A CHANGE ORDER</Text>
      <View style={styles.row}>
        <Field label="TITLE" value={title} onChange={setTitle} placeholder="e.g. Asbestos lagging removal" />
        <Field label={`AMOUNT (${currency})`} value={amount} onChange={setAmount} numeric narrow placeholder="e.g. 14200" />
      </View>
      <Field label="REASON THE CLIENT WILL READ" value={reason} onChange={setReason} multiline placeholder="What changed, why, and what it means for the programme" />
      <Pressable accessibilityRole="button" disabled={busy} onPress={raise} style={[styles.primary, busy && styles.disabled]}>
        <Text style={styles.primaryText}>{busy ? "SENDING…" : "SEND TO CLIENT FOR APPROVAL"}</Text>
      </Pressable>
      {message ? <Text style={message.tone === "ok" ? styles.success : styles.error}>{message.text}</Text> : null}
    </View>
  );
}

function SiteUpdate({ endpoint, updates, onDone }: { endpoint: string; updates: PortalState["updates"]; onDone: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async () => {
    if (!title.trim()) return setError("Give the update a title.");
    setBusy(true);
    setError(null);
    try {
      await send(`${endpoint}/updates`, { title, detail });
      setTitle("");
      setDetail("");
      await onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not post the update.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>UPDATES FROM SITE</Text>
      {updates.slice(0, 3).map((update) => (
        <View key={update.id} style={styles.update}>
          <Text style={styles.meta}>{when(update.posted_at)}</Text>
          <Text style={styles.orderTitle}>{update.title}</Text>
        </View>
      ))}
      <Field label="TITLE" value={title} onChange={setTitle} placeholder="e.g. Chiller 02 craned into position" />
      <Field label="DETAIL" value={detail} onChange={setDetail} multiline />
      <Pressable accessibilityRole="button" disabled={busy} onPress={post} style={[styles.secondaryWide, busy && styles.disabled]}>
        <Text style={styles.secondaryText}>{busy ? "POSTING…" : "POST TO CLIENT"}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Field({ label, value, onChange, numeric, narrow, multiline, placeholder }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean; narrow?: boolean; multiline?: boolean; placeholder?: string }) {
  return (
    <View style={[styles.field, narrow ? styles.fieldNarrow : styles.fieldWide]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label.toLowerCase()}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#766B5F"
        style={[styles.input, multiline && styles.inputMulti]}
      />
    </View>
  );
}

// Matches the job order screen's own panels (projectTeamStyles). Text colours clear 4.5:1
// on the #FFFDF8 card; the muted #6E6256 is 5.6:1.
const styles = StyleSheet.create({
  section: { borderTopColor: "#DDD6CC", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 30, paddingTop: 24 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  flex: { flex: 1 },
  kicker: { color: "#A84B2A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  title: { color: "#1A1A1A", fontSize: 14, fontWeight: "900", marginTop: 6 },
  badge: { backgroundColor: "#F2E6DB", color: "#8A3D22", fontSize: 8, fontWeight: "900", letterSpacing: 0.55, paddingHorizontal: 8, paddingVertical: 6 },
  badgeLive: { backgroundColor: "#E3EFE8", color: "#2F5E4B" },
  copy: { color: "#6E6256", fontSize: 11, lineHeight: 16, marginTop: 10, maxWidth: 720 },
  figures: { borderColor: "#DDD6CC", borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", marginTop: 18 },
  figure: { flexGrow: 1, minWidth: 150, padding: 14 },
  figureValue: { color: "#1A1A1A", fontSize: 15, fontWeight: "900", marginTop: 6 },
  figureStrong: { color: "#A84B2A" },
  block: { borderTopColor: "#EAE4DB", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 22, paddingTop: 18 },
  blockTitle: { color: "#1A1A1A", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  field: { marginTop: 12 },
  fieldWide: { flexGrow: 1, minWidth: 220 },
  fieldNarrow: { minWidth: 120 },
  label: { color: "#6E6256", fontSize: 8, fontWeight: "900", letterSpacing: 0.65, marginTop: 4 },
  input: { borderColor: "#B9AFA3", borderRadius: 10, borderWidth: 1, color: "#1A1A1A", fontSize: 13, marginTop: 6, paddingHorizontal: 12, paddingVertical: 10 },
  inputMulti: { minHeight: 70, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { borderColor: "#DDD6CC", borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9 },
  chipActive: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  chipText: { color: "#1A1A1A", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  chipTextActive: { color: "#FFFDF8" },
  milestone: { alignItems: "center", borderBottomColor: "#EAE4DB", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 9 },
  milestoneStatus: { color: "#6E6256", fontSize: 8, fontWeight: "900", letterSpacing: 0.55, width: 86 },
  milestoneTitle: { color: "#1A1A1A", flex: 1, fontSize: 12, fontWeight: "800" },
  meta: { color: "#6E6256", fontSize: 10, marginTop: 3 },
  ok: { color: "#2F5E4B" },
  live: { color: "#A84B2A" },
  muted: { color: "#6E6256" },
  order: { alignItems: "center", borderBottomColor: "#EAE4DB", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", gap: 12, paddingVertical: 12 },
  orderTitle: { color: "#1A1A1A", fontSize: 12, fontWeight: "900" },
  orderStatus: { fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
  update: { borderBottomColor: "#EAE4DB", borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  primary: { alignSelf: "flex-start", backgroundColor: "#1A1A1A", borderRadius: 12, marginTop: 16, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: "#FFFDF8", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  secondary: { borderColor: "#B9AFA3", borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  secondaryWide: { alignSelf: "flex-start", borderColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, marginTop: 14, paddingHorizontal: 14, paddingVertical: 11 },
  secondaryText: { color: "#1A1A1A", fontSize: 9, fontWeight: "900", letterSpacing: 0.55 },
  disabled: { opacity: 0.55 },
  success: { color: "#2F5E4B", fontSize: 11, fontWeight: "700", marginTop: 10 },
  error: { color: "#9E3B30", fontSize: 11, fontWeight: "700", marginTop: 10 },
});
