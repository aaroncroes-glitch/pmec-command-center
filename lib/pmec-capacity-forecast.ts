export type CapacityForecastPerson = {
  id: string;
  name: string;
  role: string;
  discipline: string;
  status: "Active" | "Away" | "Pending";
  allocation: number;
  weeklyCapacity: number;
};

export type CapacityForecastLeave = {
  employeeId: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
};

export type CapacityPlanningSort = "risk" | "allocation" | "room" | "name";
export type CapacityPlanningFilters = { discipline?: string; role?: string; sort?: CapacityPlanningSort };
export type CapacityForecastLevel = "clear" | "watch" | "constrained";

export type CapacityForecastDay = {
  date: string;
  baseRoomHours: number;
  confirmedRoomHours: number;
  projectedRoomHours: number;
  approvedAway: number;
  pendingAway: number;
  level: CapacityForecastLevel;
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

function mondayFor(dateString: string) {
  const date = new Date(`${dateString}T12:00:00.000Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date;
}

function isWeekday(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function planningRisk(person: CapacityForecastPerson) {
  const availabilityRisk = person.status === "Away" ? 120 : person.status === "Pending" ? 100 : 0;
  return availabilityRisk + person.allocation;
}

export function filterAndSortCapacityPeople<T extends CapacityForecastPerson>(people: T[], filters: CapacityPlanningFilters = {}) {
  const scoped = people.filter((person) => (!filters.discipline || person.discipline === filters.discipline) && (!filters.role || person.role === filters.role));
  const sort = filters.sort ?? "risk";
  return [...scoped].sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name);
    if (sort === "room") return (left.weeklyCapacity * (100 - left.allocation)) - (right.weeklyCapacity * (100 - right.allocation));
    if (sort === "allocation") return right.allocation - left.allocation || left.name.localeCompare(right.name);
    return planningRisk(right) - planningRisk(left) || right.allocation - left.allocation || left.name.localeCompare(right.name);
  });
}

export function buildCapacityForecast(people: CapacityForecastPerson[], leaveRequests: CapacityForecastLeave[], workdays = 25): CapacityForecastDay[] {
  const relevantLeave = leaveRequests.filter((request) => request.status !== "rejected");
  const anchor = relevantLeave.map((request) => request.startDate).sort()[0] ?? iso(new Date());
  const cursor = mondayFor(anchor);
  const result: CapacityForecastDay[] = [];
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const totalDailyCapacity = people.reduce((total, person) => total + person.weeklyCapacity / 5, 0);
  const baseRoomHours = people.reduce((total, person) => total + (person.weeklyCapacity / 5) * (100 - person.allocation) / 100, 0);

  while (result.length < workdays) {
    if (isWeekday(cursor)) {
      const date = iso(cursor);
      const approvedIds = new Set(relevantLeave.filter((request) => request.status === "approved" && date >= request.startDate && date <= request.endDate).map((request) => request.employeeId));
      const pendingIds = new Set(relevantLeave.filter((request) => request.status === "pending" && date >= request.startDate && date <= request.endDate).map((request) => request.employeeId));
      const approvedLeaveHours = [...approvedIds].reduce((total, employeeId) => total + (peopleById.get(employeeId)?.weeklyCapacity ?? 0) / 5, 0);
      const pendingLeaveHours = [...pendingIds].reduce((total, employeeId) => total + (peopleById.get(employeeId)?.weeklyCapacity ?? 0) / 5, 0);
      const confirmedRoomHours = baseRoomHours - approvedLeaveHours;
      const projectedRoomHours = confirmedRoomHours - pendingLeaveHours;
      const constrained = projectedRoomHours <= 0 || (totalDailyCapacity > 0 && projectedRoomHours / totalDailyCapacity < 0.12);
      const watch = !constrained && (approvedIds.size > 0 || pendingIds.size > 0 || (totalDailyCapacity > 0 && projectedRoomHours / totalDailyCapacity < 0.24));
      result.push({ date, baseRoomHours: Math.round(baseRoomHours), confirmedRoomHours: Math.round(confirmedRoomHours), projectedRoomHours: Math.round(projectedRoomHours), approvedAway: approvedIds.size, pendingAway: pendingIds.size, level: constrained ? "constrained" : watch ? "watch" : "clear" });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export function summarizeCapacityForecast(days: CapacityForecastDay[]) {
  const lowest = days.reduce<CapacityForecastDay | undefined>((current, day) => !current || day.projectedRoomHours < current.projectedRoomHours ? day : current, undefined);
  return {
    lowestProjectedRoomHours: lowest?.projectedRoomHours ?? 0,
    lowestDate: lowest?.date ?? null,
    constrainedDays: days.filter((day) => day.level === "constrained").length,
    watchDays: days.filter((day) => day.level === "watch").length,
  };
}
