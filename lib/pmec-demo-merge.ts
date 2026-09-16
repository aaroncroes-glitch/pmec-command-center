/**
 * How two devices' copies of a shared demo workspace are reconciled.
 *
 * Every write carries the version the sender last saw. When someone else wrote in between,
 * the server refuses and hands back its copy, and these functions decide what survives.
 * Kept pure and free of React so the rules can be tested directly: a presenter clicking
 * on a phone while HR approves on a laptop must never make either action vanish.
 */

/**
 * A stored workspace plus its generation. "Reset demo data" starts a new generation, and a
 * newer generation always beats an older one outright — merging across a reset would bring
 * back the records the reset was meant to clear.
 */
export type DemoEnvelope<T> = { epoch: number; data: T };

type WithId = { id: string };

/** Keeps every record from both sides, choosing per record where both have it. */
function unionBy<T>(server: T[], mine: T[], keyOf: (item: T) => string, pick: (server: T, mine: T) => T): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  // Mine first keeps the order the person on this device is looking at; anything only the
  // server has is appended after.
  for (const item of mine) {
    const key = keyOf(item);
    const remote = server.find((candidate) => keyOf(candidate) === key);
    out.push(remote ? pick(remote, item) : item);
    seen.add(key);
  }
  for (const item of server) {
    if (!seen.has(keyOf(item))) out.push(item);
  }
  return out;
}

/** A decision is further along than a request, so it wins when both edited the same one. */
const leaveRank = (status: string) => (status === "pending" ? 0 : 1);
const hoursRank = (status: string) => (status === "Approved" ? 1 : 0);

type LeaveLike = WithId & { status: string };
type LogLike = WithId & { status: string };
type AssignmentLike = WithId & { jobOrderId: string; taskId: string; assignedAt: string };

export type ControlShape = { assignments: AssignmentLike[]; timeLogs: LogLike[]; leaveRequests: LeaveLike[] };

export function mergeControl<T extends ControlShape>(server: T, mine: T): T {
  return {
    ...mine,
    leaveRequests: unionBy(server.leaveRequests, mine.leaveRequests, (item) => item.id, (remote, local) =>
      leaveRank(remote.status) > leaveRank(local.status) ? remote : local),
    timeLogs: unionBy(server.timeLogs, mine.timeLogs, (item) => item.id, (remote, local) =>
      hoursRank(remote.status) > hoursRank(local.status) ? remote : local),
    // A task has one assignee, so assignments are matched by task rather than by id —
    // reassigning a task replaces the old record instead of leaving both behind.
    assignments: unionBy(server.assignments, mine.assignments, (item) => `${item.jobOrderId}:${item.taskId}`, (remote, local) =>
      remote.assignedAt > local.assignedAt ? remote : local),
  } as T;
}

type JobOrderLike = WithId & { updatedAt: string };

/** Projects carry updatedAt, so the most recently changed copy of each one wins. */
export function mergeJobOrders<T extends JobOrderLike>(server: T[], mine: T[]): T[] {
  return unionBy(server, mine, (item) => item.id, (remote, local) => (remote.updatedAt > local.updatedAt ? remote : local));
}

/**
 * Resolves a refused write. Returns what this device should now hold, and whether it still
 * has to be written back (true unless the server's copy is simply adopted).
 */
export function resolveConflict<T>(
  server: DemoEnvelope<T>,
  mine: DemoEnvelope<T>,
  merge: (server: T, mine: T) => T,
): { next: DemoEnvelope<T>; writeBack: boolean } {
  if (server.epoch > mine.epoch) return { next: server, writeBack: false };
  if (mine.epoch > server.epoch) return { next: mine, writeBack: true };
  return { next: { epoch: server.epoch, data: merge(server.data, mine.data) }, writeBack: true };
}
