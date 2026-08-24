import { describe, expect, it } from "vitest";

import { buildCapacityForecast, buildCapacityForecastForMonth, filterAndSortCapacityPeople, summarizeCapacityForecast, summarizeUpcomingCapacityMonth } from "../lib/pmec-capacity-forecast";

const people = [
  { id: "civil-lead", name: "Luis", role: "Civil Lead", discipline: "Civil", status: "Active" as const, allocation: 90, weeklyCapacity: 40 },
  { id: "civil-engineer", name: "Sara", role: "Civil Engineer", discipline: "Civil", status: "Away" as const, allocation: 60, weeklyCapacity: 40 },
  { id: "electrical-engineer", name: "Sofia", role: "Electrical Engineer", discipline: "Electrical", status: "Active" as const, allocation: 50, weeklyCapacity: 40 },
];

describe("PMEC HR capacity forecasting", () => {
  it("builds a five-workday forecast anchored to the leave calendar and excludes weekends", () => {
    const forecast = buildCapacityForecast(people, [{ employeeId: "civil-engineer", startDate: "2026-04-13", endDate: "2026-04-13", status: "approved" }], 5);

    expect(forecast.map((day) => day.date)).toEqual(["2026-04-13", "2026-04-14", "2026-04-15", "2026-04-16", "2026-04-17"]);
    expect(forecast[0]).toMatchObject({ approvedAway: 1, pendingAway: 0, baseRoomHours: 8, confirmedRoomHours: 0, projectedRoomHours: 0, level: "constrained" });
    expect(forecast[1]).toMatchObject({ approvedAway: 0, projectedRoomHours: 8, level: "clear" });
  });

  it("keeps pending leave as a planning reserve without treating it as confirmed leave", () => {
    const forecast = buildCapacityForecast(people, [{ employeeId: "civil-engineer", startDate: "2026-04-13", endDate: "2026-04-13", status: "pending" }], 1);
    const summary = summarizeCapacityForecast(forecast);

    expect(forecast[0]).toMatchObject({ approvedAway: 0, pendingAway: 1, confirmedRoomHours: 8, projectedRoomHours: 0, level: "constrained" });
    expect(summary).toMatchObject({ lowestDate: "2026-04-13", lowestProjectedRoomHours: 0, constrainedDays: 1 });
  });

  it("filters by department and role, then orders planning rosters predictably", () => {
    expect(filterAndSortCapacityPeople(people, { discipline: "Civil", sort: "allocation" }).map((person) => person.id)).toEqual(["civil-lead", "civil-engineer"]);
    expect(filterAndSortCapacityPeople(people, { role: "Civil Engineer", sort: "name" }).map((person) => person.id)).toEqual(["civil-engineer"]);
    expect(filterAndSortCapacityPeople(people, { sort: "risk" })[0].id).toBe("civil-engineer");
    expect(filterAndSortCapacityPeople(people, { sort: "room" })[0].id).toBe("civil-lead");
  });

  it("compares confirmed available room against overlapping leave requests for the first forecast month", () => {
    const leave = [
      { employeeId: "civil-engineer", startDate: "2026-04-13", endDate: "2026-04-13", status: "approved" as const },
      { employeeId: "electrical-engineer", startDate: "2026-04-16", endDate: "2026-04-16", status: "pending" as const },
    ];
    const summary = summarizeUpcomingCapacityMonth(buildCapacityForecast(people, leave, 5), leave);

    expect(summary).toEqual({ monthKey: "2026-04", confirmedAvailableHours: 32, projectedAvailableHours: 24, approvedLeaveHours: 8, pendingLeaveHours: 8, totalLeaveHours: 16, leaveRequests: 2, approvedLeaveRequests: 1, pendingLeaveRequests: 1 });
  });

  it("builds each selected calendar month as workdays and resets leave-hour impact when moving ahead", () => {
    const leave = [{ employeeId: "civil-engineer", startDate: "2026-04-13", endDate: "2026-04-13", status: "approved" as const }];
    const april = buildCapacityForecastForMonth(people, leave, "2026-04");
    const may = buildCapacityForecastForMonth(people, leave, "2026-05");

    expect(april[0]?.date).toBe("2026-04-01");
    expect(april.at(-1)?.date).toBe("2026-04-30");
    expect(april.some((day) => ["2026-04-04", "2026-04-05"].includes(day.date))).toBe(false);
    expect(may[0]?.date).toBe("2026-05-01");
    expect(summarizeUpcomingCapacityMonth(may, leave)).toMatchObject({ monthKey: "2026-05", approvedLeaveHours: 0, pendingLeaveHours: 0, totalLeaveHours: 0 });
  });
});
