import { addDays, toDateKey } from "./lumen-utils";

/**
 * Dates for demo data, counted from today so a showcase never looks stale.
 *
 * Everything is a local calendar date (YYYY-MM-DD), like the rest of the app: a seed
 * written as "three days ago" means three days before the viewer's own today.
 */

const pad = (value: number) => String(value).padStart(2, "0");
const weekdayOf = (dateKey: string) => new Date(`${dateKey}T12:00:00`).getDay();

/** The date `offset` days from today. */
export function demoDay(offset: number, now = new Date()) {
  return addDays(toDateKey(now), offset);
}

/** Weekday `weekday` (0 = Monday … 6 = Sunday) of the week `week` weeks from this one. */
export function demoWeekday(week: number, weekday: number, now = new Date()) {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + week * 7 + weekday);
  return toDateKey(date);
}

/** The `count` working days before today, most recent first. Weekends are skipped. */
export function recentWorkdays(count: number, now = new Date()) {
  const days: string[] = [];
  for (let offset = -1; days.length < count; offset -= 1) {
    const key = demoDay(offset, now);
    const weekday = weekdayOf(key);
    if (weekday !== 0 && weekday !== 6) days.push(key);
  }
  return days;
}

/** A local time of day on a date, as an ISO timestamp: `demoTime("2026-09-09", "08:04")`. */
export function demoTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00`).toISOString();
}

/** An ISO timestamp `hours` before now. */
export function hoursAgo(hours: number, now = new Date()) {
  return new Date(now.getTime() - hours * 3_600_000).toISOString();
}

/** The month `offset` months from this one, as YYYY-MM. */
export function demoMonth(offset: number, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Easter Sunday in the Gregorian calendar (the anonymous Gregorian algorithm). */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Aruba's official public holidays for a year, in date order. */
export function arubaPublicHolidays(year: number) {
  const easter = easterSunday(year);
  // King's Day moves to the Saturday when 27 April falls on a Sunday.
  const kingsDay = weekdayOf(`${year}-04-27`) === 0 ? `${year}-04-26` : `${year}-04-27`;
  return [
    { date: `${year}-01-01`, label: "New Year’s Day" },
    { date: `${year}-01-25`, label: "Betico Croes Day" },
    { date: addDays(easter, -48), label: "Carnival Monday" },
    { date: `${year}-03-18`, label: "National Anthem and Flag Day" },
    { date: addDays(easter, -2), label: "Good Friday" },
    { date: addDays(easter, 1), label: "Easter Monday" },
    { date: kingsDay, label: "King’s Day" },
    { date: `${year}-05-01`, label: "Labour Day" },
    { date: addDays(easter, 39), label: "Ascension Day" },
    { date: `${year}-12-25`, label: "Christmas Day" },
    { date: `${year}-12-26`, label: "Boxing Day" },
  ].sort((x, y) => x.date.localeCompare(y.date));
}
