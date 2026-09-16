import { describe, expect, it } from "vitest";

import {
  arubaPublicHolidays,
  demoDay,
  demoMonth,
  demoTime,
  demoWeekday,
  easterSunday,
  hoursAgo,
  recentWorkdays,
} from "../lib/pmec-demo-dates";

// Thursday 10 September 2026, mid-afternoon local time.
const now = new Date(2026, 8, 10, 15, 30);

describe("demo dates", () => {
  it("counts days from today, across month edges", () => {
    expect(demoDay(0, now)).toBe("2026-09-10");
    expect(demoDay(-10, now)).toBe("2026-08-31");
    expect(demoDay(25, now)).toBe("2026-10-05");
  });

  it("finds a weekday by week, Monday first", () => {
    expect(demoWeekday(0, 0, now)).toBe("2026-09-07");
    expect(demoWeekday(1, 4, now)).toBe("2026-09-18");
    expect(demoWeekday(-1, 0, now)).toBe("2026-08-31");
  });

  it("lists recent working days, skipping today and weekends", () => {
    expect(recentWorkdays(6, now)).toEqual(["2026-09-09", "2026-09-08", "2026-09-07", "2026-09-04", "2026-09-03", "2026-09-02"]);
  });

  it("builds local timestamps, months, and ages", () => {
    expect(new Date(demoTime("2026-09-09", "08:04")).getHours()).toBe(8);
    expect(demoMonth(-1, now)).toBe("2026-08");
    expect(demoMonth(-9, now)).toBe("2025-12");
    expect(Date.parse(hoursAgo(49, now))).toBe(now.getTime() - 49 * 3_600_000);
  });
});

describe("Aruba public holidays", () => {
  it("dates Easter", () => {
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
  });

  it("lists the 2026 holidays in date order", () => {
    expect(arubaPublicHolidays(2026).map((holiday) => `${holiday.date} ${holiday.label}`)).toEqual([
      "2026-01-01 New Year’s Day",
      "2026-01-25 Betico Croes Day",
      "2026-02-16 Carnival Monday",
      "2026-03-18 National Anthem and Flag Day",
      "2026-04-03 Good Friday",
      "2026-04-06 Easter Monday",
      "2026-04-27 King’s Day",
      "2026-05-01 Labour Day",
      "2026-05-14 Ascension Day",
      "2026-12-25 Christmas Day",
      "2026-12-26 Boxing Day",
    ]);
  });

  it("moves King's Day to the Saturday when 27 April is a Sunday", () => {
    expect(arubaPublicHolidays(2025).find((holiday) => holiday.label === "King’s Day")?.date).toBe("2025-04-26");
  });
});
