import type { EssState } from "@/lib/ess-types";
import { addDays, toDateKey } from "./lumen-utils";

const today = toDateKey(new Date());
const makeProject = (id: string, name: string, code: string, client: string, color: string, status: "active" | "planning" | "completed", taskNames: string[]) => ({ id, name, code, client, color, status, phases: ["Planning", "Execution", "QA", "Delivery"].map((phase, phaseIndex) => ({ id: `${id}-phase-${phaseIndex + 1}`, name: phase, tasks: taskNames.slice(phaseIndex * 2, phaseIndex * 2 + 2).map((title, taskIndex) => ({ id: `${id}-task-${phaseIndex + 1}-${taskIndex + 1}`, title, status: phaseIndex === 0 ? "done" as const : phaseIndex === 1 && taskIndex === 0 ? "in_progress" as const : "todo" as const, estimatedHours: 4 + taskIndex * 2 })) })) });

export const initialEssState: EssState = {
  onboarded: false,
  employee: { id: "employee-76", firstName: "Percy", lastName: "Solagnier", employeeNumber: "76", pin: "1234", role: "Mechanical Engineer", department: "Office", address: "Wayaka 97, Aruba", monthlySalary: 7100, currentYearAllowance: 12, carryOverDays: 2.5, vacationBalance: 14.5 },
  attendance: [
    { id: "attendance-yesterday", date: addDays(today, -1), clockIn: `${addDays(today, -1)}T08:04:00.000Z`, clockOut: `${addDays(today, -1)}T17:02:00.000Z`, projectId: "project-101", phaseId: "project-101-phase-2", late: false },
    { id: "attendance-two-days", date: addDays(today, -2), clockIn: `${addDays(today, -2)}T08:12:00.000Z`, clockOut: `${addDays(today, -2)}T16:45:00.000Z`, projectId: "project-102", phaseId: "project-102-phase-2", late: true },
  ],
  projects: [
    makeProject("project-101", "Hotel Renovation", "HR-2026", "Renaissance Aruba", "#FF5A1F", "active", ["Confirm site measurements", "Update equipment list", "Coordinate access", "Review mechanical drawings", "Inspect pressure systems", "Prepare QA punch list", "Client walkthrough", "Close delivery notes"]),
    makeProject("project-102", "Electrical Install", "EI-2026", "PMEC N.V.", "#3A7563", "active", ["Review panel schedule", "Cable routing plan", "Install conduit run", "Verify circuit loads", "Test continuity", "Record QA results", "Sign-off inspection", "Archive as-builts"]),
    makeProject("project-103", "Office Fit-out", "OF-2026", "Oranjestad Business Park", "#96734C", "planning", ["Collect client brief", "Define work package", "Confirm supplier scope", "Draft installation plan", "Prepare safety checklist", "Review material lead times", "Schedule handover", "Prepare close-out file"]),
    makeProject("project-104", "Solar Panel Array", "SP-2025", "WEB Aruba", "#6059A8", "completed", ["Review commissioning notes", "Archive site photos", "Confirm performance figures", "Update completion file", "Complete final inspection", "Share QA certificate", "File acceptance letter", "Close work order"]),
  ],
  leaveRequests: [{ id: "leave-1", type: "Vacation", startDate: addDays(today, 18), endDate: addDays(today, 21), reason: "Family time", status: "approved" }, { id: "leave-2", type: "Vacation", startDate: addDays(today, 28), endDate: addDays(today, 30), reason: "Travel plans", status: "rejected", managerNote: "Please resubmit after the site handover scheduled for that week." }],
  publicHolidays: [{ date: "2026-01-01", label: "New Year’s Day" }, { date: "2026-04-27", label: "King’s Day" }, { date: "2026-12-25", label: "Christmas Day" }, { date: "2026-12-26", label: "Boxing Day" }],
  payslips: [
    { id: "payslip-july", label: "July 2026", payDate: "2026-07-25", gross: 7100, deductions: 1694, net: 5406, hours: 176 },
    { id: "payslip-june", label: "June 2026", payDate: "2026-06-25", gross: 7100, deductions: 1694, net: 5406, hours: 168 },
    { id: "payslip-may", label: "May 2026", payDate: "2026-05-25", gross: 7100, deductions: 1694, net: 5406, hours: 172 },
  ],
  events: [{ id: "event-1", title: "Safety refresher", date: addDays(today, 5), type: "personal" }],
  activity: [{ id: "activity-1", title: "Project task updated", detail: "Hotel Renovation · Review mechanical drawings", createdAt: addDays(today, -1), tone: "accent" }, { id: "activity-2", title: "Leave request approved", detail: "Vacation · 4 days", createdAt: addDays(today, -3), tone: "success" }],
};
