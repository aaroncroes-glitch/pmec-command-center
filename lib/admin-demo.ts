import type { WorkProject } from "@/lib/ess-types";

export type WorkforceLeaveRecord = {
  id: string;
  type: "Vacation" | "Sick" | "Personal";
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  managerNote?: string;
};

export type WorkforceAssignment = { project: string; code: string; allocation: number; phase: string };

export type WorkforcePerson = {
  id: string;
  name: string;
  role: string;
  department: string;
  type: "Employee" | "Contractor";
  status: "Active" | "Away" | "Pending";
  allocation: number;
  location: string;
  assignments: WorkforceAssignment[];
  leaveHistory: WorkforceLeaveRecord[];
};

const names = ["Amelia Ruiz", "Noah Croes", "Sofia Arends", "Ethan Werleman", "Mila Tromp", "Lucas Boekhoudt", "Iris Peterson", "Owen De Cuba", "Nora Kock", "Levi Lacle", "Ella Thijsen", "Mason Croes", "Lina Loefstok", "Julian Koolman", "Mia Eman", "Theo Nichols", "Sara Doran", "Daniel Geerman", "Jade Figaroa", "Victor Quant", "Olivia Maduro", "Henry Peterson", "Ava Arends", "Gabriel Lacle", "Eva Tromp", "Leo Dirksz", "Isla De Cuba"];
const roles = ["Electrical Technician", "Project Coordinator", "Site Engineer", "QA Specialist", "Planner", "Mechanical Technician", "Safety Officer"];
const assignments = [
  { project: "Hotel Renovation", code: "HTL-24", phase: "Execution" },
  { project: "Electrical Install", code: "ELE-18", phase: "Commissioning" },
  { project: "Office Fit-out", code: "OFF-31", phase: "Site preparation" },
];

function makeAssignments(index: number, allocation: number): WorkforceAssignment[] {
  const primary = assignments[index % assignments.length];
  const secondary = assignments[(index + 1) % assignments.length];
  const primaryAllocation = Math.min(allocation, Math.max(20, allocation - (index % 3) * 10));
  const remaining = allocation - primaryAllocation;
  return remaining > 10
    ? [{ ...primary, allocation: primaryAllocation }, { ...secondary, allocation: remaining }]
    : [{ ...primary, allocation }];
}

function makeLeaveHistory(id: string, index: number, type: WorkforcePerson["type"]): WorkforceLeaveRecord[] {
  if (type === "Contractor") return [];
  const vacations = ["2026-01-12", "2026-02-16", "2026-03-09", "2026-04-20"];
  const startDate = vacations[index % vacations.length];
  const status = index % 6 === 0 ? "pending" : index % 7 === 0 ? "rejected" : "approved";
  return [
    {
      id: `${id}-leave-1`,
      type: "Vacation",
      startDate,
      endDate: startDate,
      status,
      reason: status === "pending" ? "Annual leave request" : "Planned personal time",
      managerNote: status === "rejected" ? "Please coordinate an alternate delivery window." : undefined,
    },
    {
      id: `${id}-leave-2`,
      type: "Sick",
      startDate: "2025-11-06",
      endDate: "2025-11-06",
      status: "approved",
      reason: "Recorded absence",
    },
  ];
}

export function buildWorkforce(primaryName: string): WorkforcePerson[] {
  const primary: WorkforcePerson = {
    id: "employee-76",
    name: primaryName,
    role: "Mechanical Engineer",
    department: "Office",
    type: "Employee",
    status: "Active",
    allocation: 85,
    location: "Oranjestad",
    assignments: makeAssignments(0, 85),
    leaveHistory: [],
  };
  const employees = names.map((name, index) => {
    const allocation = 56 + (index * 7) % 40;
    return {
      id: `employee-${index + 1}`,
      name,
      role: roles[index % roles.length],
      department: index % 4 === 0 ? "Projects" : index % 4 === 1 ? "Field Operations" : index % 4 === 2 ? "Office" : "Quality",
      type: "Employee" as const,
      status: index === 4 ? "Away" as const : index === 9 ? "Pending" as const : "Active" as const,
      allocation,
      location: index % 3 === 0 ? "Oranjestad" : index % 3 === 1 ? "Noord" : "San Nicolas",
      assignments: makeAssignments(index + 1, allocation),
      leaveHistory: makeLeaveHistory(`employee-${index + 1}`, index, "Employee"),
    };
  });
  const contractors = ["Coastline Electric", "Aruba Steelworks", "Northwind HVAC", "Blue Coral Systems", "Island Scaffolding", "Terra Solar"].map((name, index) => {
    const allocation = 42 + index * 8;
    return {
      id: `contractor-${index + 1}`,
      name,
      role: "Specialist Contractor",
      department: "External",
      type: "Contractor" as const,
      status: index === 3 ? "Pending" as const : "Active" as const,
      allocation,
      location: "Aruba",
      assignments: makeAssignments(index + 2, allocation),
      leaveHistory: makeLeaveHistory(`contractor-${index + 1}`, index, "Contractor"),
    };
  });
  return [primary, ...employees, ...contractors];
}

export function projectHealth(project: WorkProject) {
  const tasks = project.phases.flatMap((phase) => phase.tasks);
  const done = tasks.filter((task) => task.status === "done").length;
  return { completion: tasks.length ? Math.round((done / tasks.length) * 100) : 0, open: tasks.length - done, phaseCount: project.phases.length };
}
