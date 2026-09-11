import type { Project, Task, WorkspaceState } from "./lumen-types";
import { toDateKey } from "./lumen-utils";
import { demoDay, demoWeekday } from "./pmec-demo-dates";

/**
 * Percy Solagnier's own task list in the employee showcase. The projects are the jobs he
 * is assigned to in the project manager's portfolio, so the two views tell one story.
 */
const today = toDateKey(new Date());
const d = (offset: number) => demoDay(offset);
const weekend = [0, 6].includes(new Date().getDay());
const timesheetDue = demoWeekday(weekend ? 1 : 0, 4);

export const starterProjects: Project[] = [
  { id: "project-hotel", name: "Hotel Renovation", color: "#FF5A1F", status: "active", description: "Chiller plant, pumps and guest-floor fan coils for Renaissance Aruba.", createdAt: d(-60) },
  { id: "project-yard", name: "Workshop Electrical", color: "#3A7563", status: "active", description: "Ventilation fan circuits for the PMEC yard workshop.", createdAt: d(-45) },
  { id: "project-office", name: "Office Fit-out", color: "#96734C", status: "active", description: "HVAC concept for Building C at Oranjestad Business Park.", createdAt: d(-12) },
  { id: "project-admin", name: "Training & admin", color: "#6059A8", status: "active", description: "Certificates, toolbox talks and timesheets.", createdAt: d(-90) },
];

export const starterTasks: Task[] = [
  { id: "task-chiller-submittal", title: "Review the chiller submittal from Coastline HVAC", projectId: "project-hotel", dueDate: today, priority: "high", completed: false, createdAt: d(-3), tags: ["submittal", "hvac"] },
  { id: "task-pump-base", title: "Check the pump 3 base re-grout before setting", projectId: "project-hotel", dueDate: today, priority: "high", completed: false, createdAt: d(-1), tags: ["site"] },
  { id: "task-rfi-supports", title: "Answer RFI 014 on pipe support spacing", projectId: "project-hotel", dueDate: today, priority: "medium", completed: false, createdAt: d(-2), tags: ["rfi"] },
  { id: "task-vrf-options", title: "Price two VRF options for the Building C meeting", projectId: "project-office", dueDate: today, priority: "medium", completed: true, completedAt: today, createdAt: d(-4), tags: ["design"] },
  { id: "task-as-built-markups", title: "Send as-built mark-ups from the plant room demolition", projectId: "project-hotel", dueDate: d(-1), priority: "medium", completed: false, createdAt: d(-5), tags: ["documentation"] },
  { id: "task-crane-route", title: "Walk the crane lift route with the hotel's security lead", projectId: "project-hotel", dueDate: d(1), priority: "high", completed: false, createdAt: d(-2), tags: ["site", "safety"] },
  { id: "task-toolbox-hot-work", title: "Toolbox talk: hot work permits", projectId: "project-admin", dueDate: d(1), priority: "medium", completed: false, createdAt: d(-6), tags: ["safety"] },
  { id: "task-fan-duty", title: "Confirm the extract fan duty points with Noah", projectId: "project-yard", dueDate: d(2), priority: "medium", completed: false, createdAt: d(-3), tags: ["electrical"] },
  { id: "task-load-estimate", title: "Finish the cooling load estimate for Building C", projectId: "project-office", dueDate: d(3), priority: "high", completed: false, createdAt: d(-4), tags: ["design"] },
  { id: "task-timesheet", title: "Submit the weekly timesheet", projectId: "project-admin", dueDate: timesheetDue, priority: "high", completed: false, createdAt: d(-7), tags: ["admin"], recurrence: "weekly" },
  { id: "task-fire-dampers", title: "Mark fire damper locations for Henry's review", projectId: "project-office", dueDate: d(5), priority: "low", completed: false, createdAt: d(-1), tags: ["safety", "design"] },
  { id: "task-fcu-schedule", title: "Issue the fan coil replacement schedule for floors 3–6", projectId: "project-hotel", dueDate: d(6), priority: "medium", completed: false, createdAt: d(-2), tags: ["planning"] },
  { id: "task-first-aid", title: "Renew the first-aid certificate", projectId: "project-admin", dueDate: d(9), priority: "low", completed: false, createdAt: d(-20), tags: ["training"] },
  { id: "task-commissioning-checklist", title: "Draft the commissioning checklist for chillers 1 and 2", projectId: "project-hotel", dueDate: d(12), priority: "medium", completed: false, createdAt: d(-1), tags: ["commissioning"] },
  { id: "task-condition-report", title: "Issue the HVAC condition survey report", projectId: "project-hotel", dueDate: d(-3), priority: "high", completed: true, completedAt: d(-3), createdAt: d(-10), tags: ["report"] },
  { id: "task-site-photos", title: "Upload site photos from the plant room inspection", projectId: "project-hotel", dueDate: d(-2), priority: "low", completed: true, completedAt: d(-2), createdAt: d(-3), tags: ["documentation"] },
  { id: "task-fan-schedule", title: "Update the workshop fan schedule", projectId: "project-yard", dueDate: d(-4), priority: "medium", completed: true, completedAt: d(-4), createdAt: d(-8), tags: ["electrical"] },
];

export const initialWorkspace: WorkspaceState = { projects: starterProjects, tasks: starterTasks, activeDate: today, themeMode: "light", motionMode: "full" };
