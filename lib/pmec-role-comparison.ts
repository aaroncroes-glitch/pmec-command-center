export type ComparisonPerson = { allocation: number; status: "Active" | "Away" | "Pending"; weeklyCapacity: number };
export type ComparisonLeave = { status: "pending" | "approved" | "rejected" };
export type ComparisonTimeLog = { hours: number; status: "Submitted" | "Approved" };
export type ComparisonJob = { phase: string };

export function buildRoleComparisonMetrics(input: {
  workforce: ComparisonPerson[];
  leaveRequests: ComparisonLeave[];
  timeLogs: ComparisonTimeLog[];
  jobOrders: ComparisonJob[];
  assignmentCount: number;
}) {
  const activeJobOrders = input.jobOrders.filter((job) => !["COMPLETED", "CANCELLED"].includes(job.phase)).length;
  const hoursAwaitingApproval = input.timeLogs.filter((log) => log.status === "Submitted").reduce((total, log) => total + log.hours, 0);
  const capacityWatch = input.workforce.filter((person) => person.allocation >= 85).length;
  const pendingLeave = input.leaveRequests.filter((request) => request.status === "pending").length;
  const availabilityFlags = input.workforce.filter((person) => person.status !== "Active").length;
  const weeklyOpenCapacity = Math.round(input.workforce.reduce((total, person) => total + person.weeklyCapacity * (100 - person.allocation) / 100, 0));

  return {
    projectManager: { activeJobOrders, hoursAwaitingApproval, capacityWatch, assignmentCount: input.assignmentCount },
    humanResources: { workforceCount: input.workforce.length, pendingLeave, availabilityFlags, weeklyOpenCapacity },
  };
}
