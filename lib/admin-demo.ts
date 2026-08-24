import type { WorkProject } from "@/lib/ess-types";

export type WorkforcePerson = { id: string; name: string; role: string; department: string; type: "Employee" | "Contractor"; status: "Active" | "Away" | "Pending"; allocation: number; location: string };

const names = ["Amelia Ruiz", "Noah Croes", "Sofia Arends", "Ethan Werleman", "Mila Tromp", "Lucas Boekhoudt", "Iris Peterson", "Owen De Cuba", "Nora Kock", "Levi Lacle", "Ella Thijsen", "Mason Croes", "Lina Loefstok", "Julian Koolman", "Mia Eman", "Theo Nichols", "Sara Doran", "Daniel Geerman", "Jade Figaroa", "Victor Quant", "Olivia Maduro", "Henry Peterson", "Ava Arends", "Gabriel Lacle", "Eva Tromp", "Leo Dirksz", "Isla De Cuba"];
const roles = ["Electrical Technician", "Project Coordinator", "Site Engineer", "QA Specialist", "Planner", "Mechanical Technician", "Safety Officer"];

export function buildWorkforce(primaryName: string): WorkforcePerson[] {
  const primary: WorkforcePerson = { id: "employee-76", name: primaryName, role: "Mechanical Engineer", department: "Office", type: "Employee", status: "Active", allocation: 85, location: "Oranjestad" };
  const employees = names.map((name, index) => ({ id: `employee-${index + 1}`, name, role: roles[index % roles.length], department: index % 4 === 0 ? "Projects" : index % 4 === 1 ? "Field Operations" : index % 4 === 2 ? "Office" : "Quality", type: "Employee" as const, status: index === 4 ? "Away" as const : index === 9 ? "Pending" as const : "Active" as const, allocation: 56 + (index * 7) % 40, location: index % 3 === 0 ? "Oranjestad" : index % 3 === 1 ? "Noord" : "San Nicolas" }));
  const contractors = ["Coastline Electric", "Aruba Steelworks", "Northwind HVAC", "Blue Coral Systems", "Island Scaffolding", "Terra Solar"].map((name, index) => ({ id: `contractor-${index + 1}`, name, role: "Specialist Contractor", department: "External", type: "Contractor" as const, status: index === 3 ? "Pending" as const : "Active" as const, allocation: 42 + index * 8, location: "Aruba" }));
  return [primary, ...employees, ...contractors];
}

export function projectHealth(project: WorkProject) {
  const tasks = project.phases.flatMap((phase) => phase.tasks);
  const done = tasks.filter((task) => task.status === "done").length;
  return { completion: tasks.length ? Math.round((done / tasks.length) * 100) : 0, open: tasks.length - done, phaseCount: project.phases.length };
}
