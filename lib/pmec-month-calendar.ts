/**
 * Month calendar arithmetic for the HR calendar.
 *
 * Dates are ISO strings (YYYY-MM-DD) handled in UTC throughout, so a leave request never
 * shifts by a day with the viewer's time zone. ISO strings also compare correctly as
 * plain strings, which keeps the range checks below simple.
 */

export type CalendarLeave = {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
};

export type CalendarHoliday = { date: string; label: string };

export type CalendarDay<L extends CalendarLeave = CalendarLeave> = {
  date: string;
  day: number;
  /** False for the leading and trailing days that fill out the first and last week. */
  inMonth: boolean;
  weekend: boolean;
  isToday: boolean;
  holiday: string | null;
  /** Approved and pending leave covering this date. Rejected leave is left out. */
  away: L[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const splitKey = (monthKey: string) => monthKey.split("-").map(Number) as [number, number];

/** The viewer's current month, e.g. "2026-09". */
export function monthKeyOf(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** The viewer's current date, e.g. "2026-09-10". */
export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = splitKey(monthKey);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthLabel(monthKey: string) {
  const [year, month] = splitKey(monthKey);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Whole weeks, Monday first, covering every day of the month. */
export function buildMonthGrid<L extends CalendarLeave>(
  monthKey: string,
  { leave, holidays = [], today }: { leave: L[]; holidays?: CalendarHoliday[]; today: string },
): CalendarDay<L>[][] {
  const [year, month] = splitKey(monthKey);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const lead = (first.getUTCDay() + 6) % 7;
  const trail = 6 - ((last.getUTCDay() + 6) % 7);
  const holidayByDate = new Map(holidays.map((h) => [h.date, h.label]));
  const current = leave.filter((request) => request.status !== "rejected");

  const weeks: CalendarDay<L>[][] = [];
  let week: CalendarDay<L>[] = [];
  for (let offset = -lead; offset < last.getUTCDate() + trail; offset += 1) {
    const d = new Date(Date.UTC(year, month - 1, 1 + offset));
    const date = iso(d);
    const weekday = d.getUTCDay();
    week.push({
      date,
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month - 1,
      weekend: weekday === 0 || weekday === 6,
      isToday: date === today,
      holiday: holidayByDate.get(date) ?? null,
      away: current.filter((request) => request.startDate <= date && date <= request.endDate),
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  return weeks;
}

/** Headline numbers for the month: who is away, what awaits a decision, holidays. */
export function summarizeMonth<L extends CalendarLeave>(
  monthKey: string,
  leave: L[],
  holidays: CalendarHoliday[] = [],
) {
  const [year, month] = splitKey(monthKey);
  const first = `${monthKey}-01`;
  const last = iso(new Date(Date.UTC(year, month, 0)));
  const overlapping = leave.filter((request) => request.startDate <= last && request.endDate >= first);
  return {
    peopleAway: new Set(overlapping.filter((r) => r.status === "approved").map((r) => r.employeeId)).size,
    pending: overlapping.filter((r) => r.status === "pending").length,
    holidays: holidays.filter((h) => h.date.startsWith(monthKey)).length,
  };
}
