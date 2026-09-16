export type ProjectTaskStatus = "todo" | "in_progress" | "done";

export type DemoEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  pin: string;
  role: string;
  department: string;
  address: string;
  monthlySalary: number;
  currentYearAllowance: number;
  carryOverDays: number;
  vacationBalance: number;
};

export type ProjectPhaseTask = { id: string; title: string; status: ProjectTaskStatus; estimatedHours: number };
export type ProjectPhase = { id: string; name: string; tasks: ProjectPhaseTask[] };
export type WorkProject = { id: string; name: string; code: string; client: string; color: string; status: "active" | "planning" | "completed"; phases: ProjectPhase[] };
export type AttendanceRecord = { id: string; date: string; clockIn?: string; clockOut?: string; projectId?: string; phaseId?: string; taskId?: string; late: boolean };
export type PublicHoliday = { date: string; label: string };
export type LeaveRequest = { id: string; type: "Vacation" | "Sick" | "Personal"; startDate: string; endDate: string; reason: string; status: "pending" | "approved" | "rejected"; managerNote?: string };
export type Payslip = { id: string; label: string; payDate: string; gross: number; deductions: number; net: number; hours: number };
export type PersonalEvent = { id: string; title: string; date: string; type: "personal" | "leave" };
export type ActivityItem = { id: string; title: string; detail: string; createdAt: string; tone: "accent" | "neutral" | "success" };
export type ClockInSelection = { projectId: string; phaseId: string; taskId?: string };

/** Which delivery updates this employee has read or archived, by notification id. */
export type UpdateState = { read: string[]; archived: string[] };
export type EssState = { onboarded: boolean; sessionEmployeeId?: string; employee: DemoEmployee; attendance: AttendanceRecord[]; projects: WorkProject[]; leaveRequests: LeaveRequest[]; publicHolidays: PublicHoliday[]; payslips: Payslip[]; events: PersonalEvent[]; activity: ActivityItem[]; updates?: UpdateState };
