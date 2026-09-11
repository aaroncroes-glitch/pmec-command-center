import type { ActivityItem, AttendanceRecord, EssState, LeaveRequest, Payslip, PersonalEvent } from "./ess-types";
import { initialLogs, percyLeave } from "./pmec-control-seeds";
import { arubaPublicHolidays, demoDay, demoMonth, demoTime, recentWorkdays } from "./pmec-demo-dates";

/**
 * Percy Solagnier's account in the employee showcase. His projects, hours and leave are
 * the same ones the project manager and HR see, and every date counts from today.
 */

const EMPLOYEE_ID = "employee-76";
const d = (offset: number) => demoDay(offset);
const makeProject = (id: string, name: string, code: string, client: string, color: string, status: "active" | "planning" | "completed", taskNames: string[]) => ({ id, name, code, client, color, status, phases: ["Planning", "Execution", "QA", "Delivery"].map((phase, phaseIndex) => ({ id: `${id}-phase-${phaseIndex + 1}`, name: phase, tasks: taskNames.slice(phaseIndex * 2, phaseIndex * 2 + 2).map((title, taskIndex) => ({ id: `${id}-task-${phaseIndex + 1}-${taskIndex + 1}`, title, status: phaseIndex === 0 ? "done" as const : phaseIndex === 1 && taskIndex === 0 ? "in_progress" as const : "todo" as const, estimatedHours: 4 + taskIndex * 2 })) })) });

// The employee's projects are the portfolio's Aruba jobs.
const projectByJob: Record<string, string> = { "jo-hotel-renovation": "project-101", "jo-electrical-install": "project-102", "jo-office-fitout": "project-103", "jo-solar-array": "project-104" };

// Three weeks of attendance, on the days Percy was not on approved leave. Where he logged
// hours, he clocked in to that project. Two mornings he started after nine.
const onLeave = (day: string) => percyLeave.some((leave) => leave.status === "approved" && leave.startDate <= day && day <= leave.endDate);
const CLOCK_IN = ["07:52", "08:01", "07:48", "07:58", "09:06", "07:55", "08:03", "07:50", "07:57", "08:00", "07:46", "09:12", "07:54", "07:59", "08:02"];
const CLOCK_OUT = ["17:05", "16:48", "17:12", "16:55", "17:40", "17:02", "16:51", "17:15", "16:58", "17:08", "16:45", "17:30", "17:01", "16:57", "17:10"];
const attendance: AttendanceRecord[] = recentWorkdays(15)
  .filter((day) => !onLeave(day))
  .map((day, index) => {
    const log = initialLogs.find((entry) => entry.employeeId === EMPLOYEE_ID && entry.date === day);
    const projectId = (log && projectByJob[log.jobOrderId]) ?? "project-101";
    const clockIn = CLOCK_IN[index % CLOCK_IN.length]!;
    return { id: `attendance-${day}`, date: day, clockIn: demoTime(day, clockIn), clockOut: demoTime(day, CLOCK_OUT[index % CLOCK_OUT.length]!), projectId, phaseId: `${projectId}-phase-2`, late: clockIn >= "09:00" };
  });

// Six months of payslips up to the latest payday, the 25th. Overtime months pay a little more.
const latestPayMonth = new Date().getDate() >= 25 ? 0 : -1;
const OVERTIME = [426, 0, 213, 639, 0, 0];
const HOURS = [176, 168, 172, 184, 160, 168];
const payslips: Payslip[] = OVERTIME.map((overtime, index) => {
  const month = demoMonth(latestPayMonth - index);
  const gross = 7100 + overtime;
  const deductions = Math.round(gross * 0.2386);
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { id: `payslip-${month}`, label, payDate: `${month}-25`, gross, deductions, net: gross - deductions, hours: HOURS[index]! };
});

const leaveRequests: LeaveRequest[] = percyLeave
  .map((leave) => ({ id: leave.id, type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason, status: leave.status, managerNote: leave.managerNote }))
  .sort((a, b) => b.startDate.localeCompare(a.startDate));

const events: PersonalEvent[] = [
  { id: "event-toolbox", title: "Toolbox talk: hot work permits", date: d(1), type: "personal" },
  { id: "event-crane", title: "Chiller crane lift at the hotel", date: d(3), type: "personal" },
  { id: "event-safety", title: "Safety refresher", date: d(5), type: "personal" },
  { id: "event-school", title: "Parent-teacher evening", date: d(8), type: "personal" },
  { id: "event-client", title: "Building C concept meeting with the client", date: d(12), type: "personal" },
];

const activity: ActivityItem[] = [
  { id: "activity-hours-approved", title: "Hours approved", detail: "Last week · 40.0 h across three work packages", createdAt: d(-1), tone: "success" as const },
  { id: "activity-task", title: "Project task updated", detail: "Hotel Renovation · Chilled-water piping at 30%", createdAt: d(-2), tone: "accent" as const },
  { id: "activity-leave-approved", title: "Leave request approved", detail: "Vacation · 4 days", createdAt: d(-3), tone: "success" as const },
  { id: "activity-assigned-office", title: "New work package assigned", detail: "Office Fit-out · HVAC concept & load estimate", createdAt: d(-4), tone: "accent" as const },
  { id: "activity-assigned-yard", title: "New work package assigned", detail: "Workshop Electrical · Ventilation fan circuits", createdAt: d(-9), tone: "accent" as const },
  { id: "activity-training", title: "Training completed", detail: "Working at height refresher", createdAt: d(-10), tone: "success" as const },
  { id: "activity-assigned-hotel", title: "New work package assigned", detail: "Hotel Renovation · Chilled-water piping & pump replacement", createdAt: d(-12), tone: "accent" as const },
  { id: "activity-flu", title: "Sick leave recorded", detail: "1 day · approved by HR", createdAt: percyLeave.find((leave) => leave.id === "percy-leave-flu")!.startDate, tone: "neutral" as const },
  { id: "activity-payslip", title: "Payslip available", detail: `${payslips[0]!.label} · net AWG ${payslips[0]!.net.toLocaleString("en-US")}`, createdAt: payslips[0]!.payDate, tone: "success" as const },
].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const year = new Date().getFullYear();

export const initialEssState: EssState = {
  onboarded: false,
  employee: { id: EMPLOYEE_ID, firstName: "Percy", lastName: "Solagnier", employeeNumber: "76", pin: "1234", role: "Mechanical Engineer", department: "Office", address: "Wayaka 97, Aruba", monthlySalary: 7100, currentYearAllowance: 12, carryOverDays: 2.5, vacationBalance: 14.5 },
  attendance,
  projects: [
    makeProject("project-101", "Hotel Renovation", "HR-2026", "Renaissance Aruba", "#FF5A1F", "active", ["Confirm site measurements", "Update equipment list", "Coordinate access", "Review mechanical drawings", "Inspect pressure systems", "Prepare QA punch list", "Client walkthrough", "Close delivery notes"]),
    makeProject("project-102", "Workshop Electrical", "EI-2026", "PMEC N.V.", "#3A7563", "active", ["Review panel schedule", "Cable routing plan", "Install conduit run", "Verify circuit loads", "Test continuity", "Record QA results", "Sign-off inspection", "Archive as-builts"]),
    makeProject("project-103", "Office Fit-out", "OF-2026", "Oranjestad Business Park", "#96734C", "planning", ["Collect client brief", "Define work package", "Confirm supplier scope", "Draft installation plan", "Prepare safety checklist", "Review material lead times", "Schedule handover", "Prepare close-out file"]),
    makeProject("project-104", "Solar Panel Array", "SP-2025", "WEB Aruba", "#6059A8", "completed", ["Review commissioning notes", "Archive site photos", "Confirm performance figures", "Update completion file", "Complete final inspection", "Share QA certificate", "File acceptance letter", "Close work order"]),
  ],
  leaveRequests,
  publicHolidays: [...arubaPublicHolidays(year), ...arubaPublicHolidays(year + 1)],
  payslips,
  events,
  activity,
};
