import { describe, expect, it } from "vitest";

import { mergeControl, mergeJobOrders, resolveConflict } from "../lib/pmec-demo-merge";

const base = () => ({
  assignments: [{ id: "a1", jobOrderId: "jo1", taskId: "t1", employeeId: "e1", assignedAt: "2026-09-01" }],
  timeLogs: [{ id: "h1", employeeId: "e1", jobOrderId: "jo1", taskId: "t1", date: "2026-09-10", hours: 4, note: "", status: "Submitted" }],
  leaveRequests: [{ id: "l1", employeeId: "e1", type: "Vacation", startDate: "2026-09-20", endDate: "2026-09-22", workDays: 3, status: "pending" }],
});

describe("demo sync: two devices acting at once", () => {
  it("keeps a leave request filed on the phone while HR approves something else on the laptop", () => {
    const phone = base();
    phone.leaveRequests.unshift({ id: "l2", employeeId: "e1", type: "Sick", startDate: "2026-09-25", endDate: "2026-09-25", workDays: 1, status: "pending" });
    const laptop = base();
    laptop.leaveRequests[0] = { ...laptop.leaveRequests[0], status: "approved" };

    const merged = mergeControl(laptop, phone);

    expect(merged.leaveRequests.map((item) => item.id).sort()).toEqual(["l1", "l2"]);
    expect(merged.leaveRequests.find((item) => item.id === "l1")?.status).toBe("approved");
    expect(merged.leaveRequests.find((item) => item.id === "l2")?.status).toBe("pending");
  });

  it("does not let a stale copy undo an approval of hours", () => {
    const stale = base();
    const approved = base();
    approved.timeLogs[0] = { ...approved.timeLogs[0], status: "Approved" };
    expect(mergeControl(approved, stale).timeLogs[0].status).toBe("Approved");
    expect(mergeControl(stale, approved).timeLogs[0].status).toBe("Approved");
  });

  it("keeps hours logged on the phone alongside hours already on the server", () => {
    const phone = base();
    phone.timeLogs.unshift({ id: "h2", employeeId: "e1", jobOrderId: "jo1", taskId: "t1", date: "2026-09-16", hours: 8.5, note: "site walk", status: "Submitted" });
    expect(mergeControl(base(), phone).timeLogs.map((item) => item.id)).toEqual(["h2", "h1"]);
  });

  it("replaces a reassigned task instead of leaving two assignees on it", () => {
    const server = base();
    const mine = base();
    mine.assignments = [{ id: "a9", jobOrderId: "jo1", taskId: "t1", employeeId: "e2", assignedAt: "2026-09-15" }];
    const merged = mergeControl(server, mine);
    expect(merged.assignments).toHaveLength(1);
    expect(merged.assignments[0].employeeId).toBe("e2");
  });

  it("takes the most recently changed copy of a project", () => {
    const older = [{ id: "jo1", updatedAt: "2026-09-10T10:00:00Z", title: "old" }];
    const newer = [{ id: "jo1", updatedAt: "2026-09-10T11:00:00Z", title: "new" }];
    expect(mergeJobOrders(older, newer)[0].title).toBe("new");
    expect(mergeJobOrders(newer, older)[0].title).toBe("new");
  });
});

describe("demo sync: reset", () => {
  it("adopts a reset made on another device instead of merging old records back in", () => {
    const reset = { epoch: 2, data: base() };
    const staleWithExtra = { epoch: 1, data: { ...base(), leaveRequests: [...base().leaveRequests, { id: "old", employeeId: "e1", type: "Sick", startDate: "x", endDate: "x", workDays: 1, status: "pending" }] } };
    const { next, writeBack } = resolveConflict(reset, staleWithExtra, mergeControl);
    expect(next.epoch).toBe(2);
    expect(next.data.leaveRequests.some((item) => item.id === "old")).toBe(false);
    expect(writeBack).toBe(false);
  });

  it("pushes this device's reset over an older server copy", () => {
    const server = { epoch: 1, data: { ...base(), leaveRequests: [] } };
    const mine = { epoch: 2, data: base() };
    const { next, writeBack } = resolveConflict(server, mine, mergeControl);
    expect(next).toBe(mine);
    expect(writeBack).toBe(true);
  });

  it("merges when both sides are on the same generation", () => {
    const { next, writeBack } = resolveConflict({ epoch: 3, data: base() }, { epoch: 3, data: base() }, mergeControl);
    expect(next.epoch).toBe(3);
    expect(writeBack).toBe(true);
  });
});

describe("attendance merge", () => {
  type Row = { id: string; employeeId: string; date: string; clockIn: string; clockOut?: string; late: boolean };
  const base = { assignments: [], timeLogs: [], leaveRequests: [], attendance: [] as Row[] };
  it("keeps a clock-out over an open clock-in and unions both devices", () => {
    const open: Row = { id: "a1", employeeId: "employee-76", date: "2026-09-16", clockIn: "2026-09-16T07:00:00.000Z", late: false };
    const closed = { ...open, clockOut: "2026-09-16T15:00:00.000Z" };
    const other = { ...open, id: "a2", employeeId: "emp-03" };
    const merged = mergeControl({ ...base, attendance: [closed] }, { ...base, attendance: [open, other] });
    expect(merged.attendance?.find((item) => item.id === "a1")?.clockOut).toBe(closed.clockOut);
    expect(merged.attendance).toHaveLength(2);
  });
  it("accepts copies saved before attendance existed", () => {
    const { attendance: _drop, ...old } = base;
    expect((mergeControl(old, old) as { attendance?: unknown }).attendance).toEqual([]);
  });
});
