import { describe, expect, it } from "vitest";

import {
  buildMonthGrid,
  monthLabel,
  shiftMonth,
  summarizeMonth,
  type CalendarLeave,
} from "../lib/pmec-month-calendar";

const leave: CalendarLeave[] = [
  { id: "a", employeeId: "p1", startDate: "2026-09-28", endDate: "2026-10-02", status: "approved" },
  { id: "b", employeeId: "p2", startDate: "2026-09-14", endDate: "2026-09-14", status: "pending" },
  { id: "c", employeeId: "p3", startDate: "2026-09-14", endDate: "2026-09-18", status: "rejected" },
  { id: "d", employeeId: "p1", startDate: "2026-08-30", endDate: "2026-09-01", status: "approved" },
];
const holidays = [
  { date: "2026-12-25", label: "Christmas Day" },
  { date: "2026-09-07", label: "Test holiday" },
];

describe("buildMonthGrid", () => {
  const weeks = buildMonthGrid("2026-09", { leave, holidays, today: "2026-09-10" });
  const byDate = new Map(weeks.flat().map((day) => [day.date, day]));

  it("lays out whole Monday-first weeks around the month", () => {
    // 1 September 2026 is a Tuesday and the 30th a Wednesday.
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]![0]).toMatchObject({ date: "2026-08-31", inMonth: false });
    expect(weeks[0]![1]).toMatchObject({ date: "2026-09-01", inMonth: true, day: 1 });
    expect(weeks.at(-1)!.at(-1)).toMatchObject({ date: "2026-10-04", inMonth: false });
  });

  it("marks weekends, today and holidays", () => {
    expect(byDate.get("2026-09-12")?.weekend).toBe(true);
    expect(byDate.get("2026-09-14")?.weekend).toBe(false);
    expect(byDate.get("2026-09-10")?.isToday).toBe(true);
    expect(byDate.get("2026-09-07")?.holiday).toBe("Test holiday");
  });

  it("places leave on every day it covers, across month edges", () => {
    expect(byDate.get("2026-09-30")?.away.map((l) => l.id)).toEqual(["a"]);
    expect(byDate.get("2026-10-01")?.away.map((l) => l.id)).toEqual(["a"]);
    expect(byDate.get("2026-09-01")?.away.map((l) => l.id)).toEqual(["d"]);
    expect(byDate.get("2026-09-02")?.away).toEqual([]);
  });

  it("shows pending leave and leaves rejected leave out", () => {
    expect(byDate.get("2026-09-14")?.away.map((l) => [l.id, l.status])).toEqual([["b", "pending"]]);
  });

  it("handles a month that starts on a Sunday", () => {
    // 1 February 2026 is a Sunday: the grid opens on Monday 26 January.
    const feb = buildMonthGrid("2026-02", { leave: [], today: "2026-02-10" });
    expect(feb[0]![0]!.date).toBe("2026-01-26");
    expect(feb[0]![6]!.date).toBe("2026-02-01");
    expect(feb.at(-1)!.at(-1)!.date).toBe("2026-03-01");
  });
});

describe("month helpers", () => {
  it("steps across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("names the month", () => {
    expect(monthLabel("2026-09")).toBe("September 2026");
  });

  it("summarizes who is away and what needs a decision", () => {
    expect(summarizeMonth("2026-09", leave, holidays)).toEqual({ peopleAway: 1, pending: 1, holidays: 1 });
    expect(summarizeMonth("2026-12", leave, holidays)).toEqual({ peopleAway: 0, pending: 0, holidays: 1 });
  });
});
