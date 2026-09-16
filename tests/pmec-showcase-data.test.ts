import { describe, expect, it } from "vitest";

import { initialEssState } from "../lib/ess-data";
import { initialWorkspace } from "../lib/lumen-data";
import { initialAssignments, initialLeave, initialLogs, workforce } from "../lib/pmec-control-seeds";
import { demoDay } from "../lib/pmec-demo-dates";
import { initialPmeJobOrders } from "../lib/pmec-job-orders";
import { buildEmployeeDelivery } from "../lib/pmec-showcase-delivery";

// The showcase is shown to prospective clients on whatever day they visit, so these hold
// relative to today rather than to fixed dates.
const today = demoDay(0);
const isWeekday = (dateKey: string) => ![0, 6].includes(new Date(`${dateKey}T12:00:00`).getDay());
const tasks = initialPmeJobOrders.flatMap((job) => job.tasks.map((task) => ({ job, task })));

describe("showcase timeline", () => {
  it("puts achieved milestones behind today and open ones ahead", () => {
    for (const job of initialPmeJobOrders) {
      for (const milestone of job.milestones) {
        if (milestone.achieved) expect(milestone.achievedDate! <= today, `${job.id} · ${milestone.label}`).toBe(true);
        else expect(milestone.targetDate > today, `${job.id} · ${milestone.label}`).toBe(true);
      }
    }
  });

  it("finishes done work in the past, keeps active work current, and starts the rest later", () => {
    for (const { job, task } of tasks) {
      if (task.status === "COMPLETED") expect(task.completedDate! <= today, task.id).toBe(true);
      else if (task.status === "NOT_STARTED") expect(task.startDate! > today, task.id).toBe(true);
      else expect(task.startDate! <= today && task.dueDate! >= today, task.id).toBe(true);
      if (job.phase === "COMPLETED") expect(task.status, task.id).toBe("COMPLETED");
    }
  });
});

describe("one story across the three workspaces", () => {
  const people = new Map(workforce.map((person) => [person.id, person.name]));

  it("assigns every open work package to the person the tracker names", () => {
    expect(initialAssignments.length).toBeGreaterThanOrEqual(15);
    for (const assignment of initialAssignments) {
      const found = tasks.find(({ job, task }) => job.id === assignment.jobOrderId && task.id === assignment.taskId);
      expect(found?.task.status, assignment.id).not.toBe("COMPLETED");
      expect(people.get(assignment.employeeId), assignment.id).toBe(found?.task.assignedTo);
    }
  });

  it("logs hours on past working days, against the person's own work, never on approved leave", () => {
    expect(initialLogs.length).toBeGreaterThanOrEqual(40);
    for (const log of initialLogs) {
      expect(isWeekday(log.date) && log.date < today, log.id).toBe(true);
      expect(initialAssignments.some((assignment) => assignment.employeeId === log.employeeId && assignment.taskId === log.taskId), log.id).toBe(true);
      expect(initialLeave.some((leave) => leave.employeeId === log.employeeId && leave.status === "approved" && leave.startDate <= log.date && log.date <= leave.endDate), log.id).toBe(false);
    }
  });

  it("leaves hours waiting for the project manager to approve", () => {
    expect(initialLogs.filter((log) => log.status === "Submitted").length).toBeGreaterThanOrEqual(8);
    expect(initialLogs.filter((log) => log.status === "Approved").length).toBeGreaterThanOrEqual(30);
  });

  it("builds the employee's own queue out of the shared workspace", () => {
    const delivery = buildEmployeeDelivery({ assignments: initialAssignments, timeLogs: initialLogs, jobOrders: initialPmeJobOrders, employeeId: "employee-76", employeeName: "Percy Solagnier" });
    expect(delivery.assignments.length).toBeGreaterThanOrEqual(4);
    expect(delivery.assignments.every((assignment) => assignment.employeeId === "employee-76")).toBe(true);
    expect(delivery.assignments.some((assignment) => assignment.status === "in_progress")).toBe(true);
    expect(delivery.timeLogs.length).toBeGreaterThanOrEqual(6);
    expect(delivery.updates.some((update) => update.type === "assignment")).toBe(true);
    expect(delivery.updates.some((update) => update.type === "time_approved")).toBe(true);
    expect(delivery.updates.filter((update) => !update.readAt).length).toBeGreaterThanOrEqual(1);
  });

  it("turns hours approved during a showcase into their own unread update", () => {
    const submitted = initialLogs.find((log) => log.employeeId === "employee-76" && log.status === "Submitted")!;
    const timeLogs = initialLogs.map((log) => (log.id === submitted.id ? { ...log, status: "Approved" as const, approvedAt: new Date().toISOString() } : log));
    const delivery = buildEmployeeDelivery({ assignments: initialAssignments, timeLogs, jobOrders: initialPmeJobOrders, employeeId: "employee-76", employeeName: "Percy Solagnier" });
    const update = delivery.updates.find((item) => item.id === `notification-approved-${submitted.id}`);

    expect(update?.readAt).toBeNull();
    expect(update?.body).toContain(submitted.note);
  });

  it("shows HR the same leave the employee sees", () => {
    const hr = initialLeave.filter((leave) => leave.employeeId === "employee-76").map((leave) => `${leave.type} ${leave.startDate} ${leave.endDate} ${leave.status}`).sort();
    const own = initialEssState.leaveRequests.map((leave) => `${leave.type} ${leave.startDate} ${leave.endDate} ${leave.status}`).sort();
    expect(hr).toEqual(own);
  });

  it("names each of the employee's projects after a job in the portfolio", () => {
    for (const project of initialEssState.projects) {
      expect(initialPmeJobOrders.some((job) => job.title.startsWith(project.name)), project.name).toBe(true);
    }
  });
});

describe("employee account", () => {
  it("has three weeks of attendance on working days, with two late starts", () => {
    const { attendance } = initialEssState;
    expect(attendance.length).toBeGreaterThanOrEqual(12);
    expect(attendance.every((record) => isWeekday(record.date) && record.date < today && Boolean(record.clockIn) && Boolean(record.clockOut))).toBe(true);
    expect(attendance.filter((record) => record.late)).toHaveLength(2);
  });

  it("has six months of payslips, newest first, ending with the latest payday", () => {
    const { payslips } = initialEssState;
    expect(payslips).toHaveLength(6);
    expect(payslips.every((slip) => slip.payDate <= today && slip.net === slip.gross - slip.deductions)).toBe(true);
    expect([...payslips].sort((a, b) => b.payDate.localeCompare(a.payDate))).toEqual(payslips);
    expect(payslips[0]!.payDate > demoDay(-35)).toBe(true);
  });

  it("knows Aruba's public holidays for this year and next", () => {
    const year = new Date().getFullYear();
    const thisYear = initialEssState.publicHolidays.filter((holiday) => holiday.date.startsWith(String(year))).map((holiday) => holiday.label);
    expect(thisYear).toEqual(expect.arrayContaining(["Betico Croes Day", "Carnival Monday", "King’s Day"]));
    expect(initialEssState.publicHolidays.some((holiday) => holiday.date.startsWith(String(year + 1)))).toBe(true);
  });

  it("keeps the task list on engineering work", () => {
    const list = initialWorkspace.tasks;
    expect(list.length).toBeGreaterThanOrEqual(14);
    expect(list.some((task) => /RAIA|Moresco|Skyfall|listing|campaign/i.test(task.title))).toBe(false);
    expect(list.some((task) => task.dueDate === today && !task.completed)).toBe(true);
    expect(list.some((task) => task.completed)).toBe(true);
  });
});
