import { demoDay, demoWeekday, recentWorkdays } from "./pmec-demo-dates";
import { initialPmeJobOrders } from "./pmec-demo-job-orders";
import type { PmecLeaveRequest, PmecTimeLog, PmecWorkforcePerson, TaskAssignment } from "./pmec-control-workspace";

/**
 * The people, assignments, hours and leave behind the PM and HR showcase.
 *
 * Assignments and hours are derived from the job-order portfolio, so a work package's
 * assignee in the tracker, the Capacity view and the employee's own queue always agree.
 * Dates count from today, like the rest of the demo data.
 */

const staffSeeds = [
  ["emp-01", "Aaron Croes", "Project Director", "Project Management", "Aruba", 88], ["emp-02", "Nour El-Sayed", "Senior Process Engineer", "Process / Instrumentation", "Cairo", 82], ["emp-03", "Luis Herrera", "Civil Structural Lead", "Civil / Structural", "Panama", 91], ["emp-04", "Karim Fathy", "Control Systems Engineer", "Process / Instrumentation", "Cairo", 76], ["emp-05", "Sofia Arends", "Electrical Engineer", "Electrical", "Aruba", 84], ["emp-06", "Daniel Geerman", "QA / HSE Lead", "Quality / Safety", "Aruba", 72], ["emp-07", "Amelia Ruiz", "Project Coordinator", "Project Management", "Panama", 68], ["emp-08", "Mila Tromp", "Planner", "Project Management", "Aruba", 64], ["emp-09", "Noah Croes", "Electrical Technician", "Electrical", "Aruba", 92], ["emp-10", "Iris Peterson", "Mechanical Engineer", "Mechanical", "Aruba", 78], ["emp-11", "Owen De Cuba", "Safety Officer", "Quality / Safety", "Aruba", 70], ["emp-12", "Nora Kock", "Quantity Surveyor", "Project Management", "Aruba", 66], ["emp-13", "Levi Lacle", "Site Engineer", "Civil / Structural", "Aruba", 86], ["emp-14", "Ella Thijsen", "QA Specialist", "Quality / Safety", "Aruba", 74], ["emp-15", "Mason Croes", "Procurement Engineer", "Electrical", "Aruba", 89], ["emp-16", "Lina Loefstok", "Mechanical Technician", "Mechanical", "Aruba", 60], ["emp-17", "Julian Koolman", "Field Supervisor", "Project Management", "Aruba", 80], ["emp-18", "Mia Eman", "Instrumentation Engineer", "Process / Instrumentation", "Cairo", 77], ["emp-19", "Theo Nichols", "Design Engineer", "Electrical", "Aruba", 63], ["emp-20", "Sara Doran", "Civil Engineer", "Civil / Structural", "Panama", 83], ["emp-21", "Jade Figaroa", "Document Controller", "Project Management", "Aruba", 56], ["emp-22", "Victor Quant", "Mechanical Lead", "Mechanical", "Aruba", 87], ["emp-23", "Olivia Maduro", "Electrical Designer", "Electrical", "Aruba", 71], ["emp-24", "Henry Peterson", "HSE Coordinator", "Quality / Safety", "Aruba", 69], ["emp-25", "Ava Arends", "Project Engineer", "Project Management", "Aruba", 90], ["emp-26", "Gabriel Lacle", "Structural Engineer", "Civil / Structural", "Panama", 75], ["emp-27", "Eva Tromp", "Junior Planner", "Project Management", "Aruba", 58], ["employee-76", "Percy Solagnier", "Mechanical Engineer", "Mechanical", "Aruba", 73],
] as const;
const contractorSeeds = [["con-01", "ELMAR N.V.", "Electrical Subcontractor", "Electrical", "Aruba", 82], ["con-02", "Estructuras del Istmo S.A.", "Structural Subcontractor", "Civil / Structural", "Panama", 85], ["con-03", "Nile Controls LLC", "Controls Contractor", "Process / Instrumentation", "Cairo", 61], ["con-04", "Coastline HVAC", "Mechanical Subcontractor", "Mechanical", "Aruba", 52], ["con-05", "Island Scaffolding", "Access Contractor", "Quality / Safety", "Aruba", 48], ["con-06", "Terra Solar", "Electrical Specialist", "Electrical", "Aruba", 66]] as const;

export const workforce: PmecWorkforcePerson[] = [...staffSeeds.map(([id, name, role, discipline, location, allocation], index) => ({ id, name, role, discipline, location, allocation, type: "Employee" as const, weeklyCapacity: 40, employment: "PMEC employee", status: index === 20 ? "Pending" as const : "Active" as const })), ...contractorSeeds.map(([id, name, role, discipline, location, allocation]) => ({ id, name, role, discipline, location, allocation, type: "Contractor" as const, weeklyCapacity: 40, employment: "External specialist", status: "Active" as const }))];

const idByName = new Map(workforce.map((person) => [person.name, person.id]));
const staffIds = new Set<string>(staffSeeds.map(([id]) => id));

/** Leave Percy Solagnier asked for. The employee app and HR both show these same requests. */
export type ShowcaseLeave = { id: string; type: PmecLeaveRequest["type"]; startDate: string; endDate: string; workDays: number; reason: string; status: PmecLeaveRequest["status"]; managerNote?: string };
export const percyLeave: ShowcaseLeave[] = [
  { id: "percy-leave-summer", type: "Vacation", startDate: demoWeekday(-9, 0), endDate: demoWeekday(-9, 4), workDays: 5, reason: "Summer break with family", status: "approved" },
  { id: "percy-leave-dentist", type: "Personal", startDate: demoWeekday(-6, 3), endDate: demoWeekday(-6, 3), workDays: 1, reason: "Dentist appointment", status: "approved" },
  { id: "percy-leave-flu", type: "Sick", startDate: demoWeekday(-2, 1), endDate: demoWeekday(-2, 1), workDays: 1, reason: "Flu", status: "approved" },
  { id: "percy-leave-procedure", type: "Sick", startDate: demoWeekday(1, 3), endDate: demoWeekday(1, 4), workDays: 2, reason: "Scheduled minor procedure", status: "pending" },
  { id: "percy-leave-family", type: "Vacation", startDate: demoWeekday(3, 1), endDate: demoWeekday(3, 4), workDays: 4, reason: "Family time", status: "approved" },
  { id: "percy-leave-travel", type: "Vacation", startDate: demoWeekday(4, 2), endDate: demoWeekday(4, 4), workDays: 3, reason: "Travel plans", status: "rejected", managerNote: "Please resubmit after the site handover scheduled for that week." },
  { id: "percy-leave-appointment", type: "Personal", startDate: demoWeekday(5, 4), endDate: demoWeekday(5, 4), workDays: 1, reason: "Personal appointment", status: "pending" },
  { id: "percy-leave-travel-2", type: "Vacation", startDate: demoWeekday(6, 0), endDate: demoWeekday(6, 3), workDays: 4, reason: "Planned family travel", status: "pending" },
];

// HR's leave sits around the current week so the calendar, forecast and away counts open on
// live-looking dates. demoWeekday(week, day): weeks from this one, day 0 = Monday.
export const initialLeave: PmecLeaveRequest[] = [
  { id: "leave-1", employeeId: "emp-08", type: "Vacation", startDate: demoWeekday(0, 0), endDate: demoWeekday(0, 4), workDays: 5, status: "approved", note: "Approved by HR" },
  { id: "leave-2", employeeId: "emp-05", type: "Personal", startDate: demoWeekday(1, 0), endDate: demoWeekday(1, 0), workDays: 1, status: "pending" },
  { id: "leave-3", employeeId: "emp-13", type: "Sick", startDate: demoWeekday(0, 2), endDate: demoWeekday(0, 3), workDays: 2, status: "approved", note: "Recorded by HR" },
  { id: "leave-4", employeeId: "emp-17", type: "Vacation", startDate: demoWeekday(1, 2), endDate: demoWeekday(1, 4), workDays: 3, status: "pending" },
  { id: "leave-5", employeeId: "emp-02", type: "Vacation", startDate: demoWeekday(2, 0), endDate: demoWeekday(2, 4), workDays: 5, status: "approved", note: "Approved by HR" },
  { id: "leave-6", employeeId: "emp-21", type: "Personal", startDate: demoWeekday(2, 3), endDate: demoWeekday(2, 3), workDays: 1, status: "pending" },
  { id: "leave-7", employeeId: "emp-04", type: "Vacation", startDate: demoWeekday(3, 0), endDate: demoWeekday(3, 2), workDays: 3, status: "rejected", note: "Please select an alternative work window." },
  { id: "leave-8", employeeId: "emp-10", type: "Vacation", startDate: demoWeekday(3, 1), endDate: demoWeekday(4, 1), workDays: 6, status: "approved", note: "Approved by HR" },
  { id: "leave-9", employeeId: "emp-06", type: "Vacation", startDate: demoWeekday(-1, 0), endDate: demoWeekday(-1, 4), workDays: 5, status: "approved", note: "Approved by HR" },
  ...percyLeave.map((leave) => ({ id: leave.id, employeeId: "employee-76", type: leave.type, startDate: leave.startDate, endDate: leave.endDate, workDays: leave.workDays, status: leave.status, note: leave.managerNote ?? (leave.status === "approved" ? "Approved by HR" : undefined) })),
];

const OPEN = new Set(["NOT_STARTED", "IN_PROGRESS", "UNDER_REVIEW", "BLOCKED"]);
const ACTIVE = new Set(["IN_PROGRESS", "UNDER_REVIEW", "BLOCKED"]);

/** Every open work package whose assignee is in the workforce. */
export const initialAssignments: TaskAssignment[] = initialPmeJobOrders.flatMap((job) =>
  job.tasks.flatMap((task) => {
    const employeeId = idByName.get(task.assignedTo);
    if (!employeeId || !OPEN.has(task.status)) return [];
    const assignedAt = task.startDate && task.startDate <= demoDay(-3) ? task.startDate : demoDay(-3);
    return [{ id: `assign-${task.id}`, jobOrderId: job.id, taskId: task.id, employeeId, assignedAt }];
  }),
);

// What each package's day of work sounds like in a timesheet note.
const NOTES: Record<string, string[]> = {
  "coastal-5": ["Point list walkdown with the utility SCADA team", "Relay status points 1–24 verified", "Control commands tested on cubicle 1", "Alarm mapping corrections sent to the client"],
  "water-2": ["Control narrative rev B: filter backwash sequence", "I/O list update for the blower building", "Call with the client on alarm philosophy", "SCADA architecture drawing mark-ups"],
  "water-3": ["Filter gallery P&IDs, sheets 4–7", "Line list and valve tags", "Blower building P&ID layout", "Internal check of sheets 1–3"],
  "hospital-5": ["Load test witnessed with the third-party engineer", "Recertification report, sections 3–5", "Responses to the inspector's comments", "Final drawing register"],
  "hospital-6": ["Fire-stopping at the stair core penetrations", "Photo record of sealed penetrations", "Surveyed level 1 while waiting on ceiling access", "Coordination call with hospital facilities"],
  "hotel-3": ["Pump 3 base inspection and re-grout plan", "Header pipe routing mark-ups", "Pipe support spacing check for RFI 014", "Valve schedule update", "Site walk with Coastline HVAC"],
  "hotel-5": ["Changeover panel shop drawing comments", "Generator interface wiring review", "Site meeting with the hotel's engineer", "Load test procedure draft"],
  "yard-2": ["Main board set and levelled", "Outgoing ways terminated, sections 1–3", "Board labelling and circuit schedule"],
  "yard-3": ["Cable tray run, bays 1–4", "Power cable pulled to the machine bays", "Conduit to the compressor room"],
  "yard-4": ["Extract fan duty points and selection", "Fan control wiring with Noah", "Roof curb details for the fans"],
  "office-2": ["Cooling load estimate, level 1", "Two VRF options priced", "Site visit to Building C"],
};
const HOURS = [8, 8, 7.5, 8.5, 8, 6, 8, 9, 7.5, 8];

const onApprovedLeave = (employeeId: string, day: string) => initialLeave.some((leave) => leave.employeeId === employeeId && leave.status === "approved" && leave.startDate <= day && day <= leave.endDate);

const activeWork = new Map<string, { jobOrderId: string; taskId: string; startDate: string }[]>();
for (const job of initialPmeJobOrders) {
  for (const task of job.tasks) {
    const employeeId = idByName.get(task.assignedTo);
    if (employeeId && staffIds.has(employeeId) && ACTIVE.has(task.status)) activeWork.set(employeeId, [...(activeWork.get(employeeId) ?? []), { jobOrderId: job.id, taskId: task.id, startDate: task.startDate ?? demoDay(0) }]);
  }
}

/**
 * Two weeks of hours for everyone with work in progress: the last two working days are
 * waiting for the project manager, everything before that is approved.
 */
export const initialLogs: PmecTimeLog[] = [...activeWork.entries()]
  .flatMap(([employeeId, work], personIndex) =>
    recentWorkdays(10).flatMap((day, dayIndex) => {
      const eligible = work.filter((item) => item.startDate <= day);
      if (!eligible.length || onApprovedLeave(employeeId, day)) return [];
      const item = eligible[(dayIndex + personIndex) % eligible.length]!;
      const notes = NOTES[item.taskId] ?? ["Work package progress"];
      return [{ id: `log-${employeeId}-${day}`, employeeId, jobOrderId: item.jobOrderId, taskId: item.taskId, date: day, hours: HOURS[(dayIndex + personIndex * 3) % HOURS.length]!, note: notes[(dayIndex + personIndex) % notes.length]!, status: dayIndex < 2 ? "Submitted" as const : "Approved" as const }];
    }),
  )
  .sort((a, b) => b.date.localeCompare(a.date));
