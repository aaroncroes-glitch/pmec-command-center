import { useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Badge, Button, PmecPressable } from "@/components/pmec";
import { initialEssState } from "@/lib/ess-data";
import { useLumen } from "@/lib/lumen-workspace";
import { buildCapacityForecastForMonth, type CapacityForecastDay } from "@/lib/pmec-capacity-forecast";
import {
  usePmecControl,
  type PmecLeaveRequest,
  type PmecWorkforcePerson,
} from "@/lib/pmec-control-workspace";
import { space, statusBackground, statusColor, tracking, type, weight } from "@/lib/pmec-design";
import {
  buildMonthGrid,
  monthKeyOf,
  monthLabel,
  shiftMonth,
  summarizeMonth,
  todayKey,
  type CalendarDay,
} from "@/lib/pmec-month-calendar";

type Palette = ReturnType<typeof useLumen>["palette"];
type Styles = ReturnType<typeof makeStyles>;
type Mode = "light" | "dark";
type Day = CalendarDay<PmecLeaveRequest>;
type People = Map<string, PmecWorkforcePerson>;

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const SHOWN_PER_DAY = 3;
// The same notes the HR & leave view records, so a decision reads the same either way.
const APPROVE_NOTE = "Approved by HR";
const REJECT_NOTE = "Please select an alternative work window.";
const LEVEL_TONE = { clear: "positive", watch: "caution", constrained: "critical" } as const;

const asDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
};
const longDate = (date: string) =>
  asDate(date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortDate = (date: string) =>
  asDate(date).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
const shortName = (name?: string) => {
  if (!name) return "Someone";
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[1]!.charAt(0)}.` : name;
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
// Pending leave is told apart by its dashed outline as well as its colour, so the
// difference never rests on colour alone (WCAG 1.4.1).
const pendingWash = (mode: Mode) => ({
  backgroundColor: statusBackground("caution", mode),
  borderColor: statusColor("caution", mode),
});

/**
 * HR's month at a glance: who is away on which day, what is waiting for a decision,
 * public holidays, and the days where too few people are available. Selecting a day
 * lists everyone away, with decisions for pending requests; they write to the same
 * leave data as the HR & leave view.
 */
export function HrCalendar({ onPerson }: { onPerson: (person: PmecWorkforcePerson) => void }) {
  const control = usePmecControl();
  const { palette } = useLumen();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const mode: Mode = palette.background === "#F6F3EE" ? "light" : "dark";
  const today = todayKey();
  const thisMonth = monthKeyOf(new Date());
  const [monthKey, setMonthKey] = useState(thisMonth);
  const [selected, setSelected] = useState(today);
  const holidays = initialEssState.publicHolidays;

  const people = useMemo<People>(
    () => new Map(control.workforce.map((person) => [person.id, person])),
    [control.workforce],
  );
  const weeks = useMemo(
    () => buildMonthGrid(monthKey, { leave: control.leaveRequests, holidays, today }),
    [monthKey, control.leaveRequests, holidays, today],
  );
  // The forecast covers weekdays only, so weekends carry no coverage level.
  const coverage = useMemo(
    () =>
      new Map(
        buildCapacityForecastForMonth(control.workforce, control.leaveRequests, monthKey).map((day) => [
          day.date,
          day,
        ]),
      ),
    [control.workforce, control.leaveRequests, monthKey],
  );
  const summary = summarizeMonth(monthKey, control.leaveRequests, holidays);
  const selectedDay = weeks.flat().find((day) => day.date === selected) ?? null;
  const wide = width >= 1180;

  const show = (next: string) => {
    setMonthKey(next);
    setSelected(next === thisMonth ? today : `${next}-01`);
  };
  const decide = (leave: PmecLeaveRequest, status: "approved" | "rejected") =>
    control.reviewLeave(leave.id, status, status === "approved" ? APPROVE_NOTE : REJECT_NOTE);

  const headline =
    [
      summary.peopleAway ? `${plural(summary.peopleAway, "person", "people")} away` : null,
      summary.pending ? `${plural(summary.pending, "request", "requests")} to review` : null,
      summary.holidays ? plural(summary.holidays, "public holiday", "public holidays") : null,
    ]
      .filter(Boolean)
      .join(" · ") || "No leave or public holidays this month";

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={styles.month}>
            {monthLabel(monthKey).toUpperCase()}
          </Text>
          <Text style={styles.headline}>{headline}</Text>
        </View>
        <View style={styles.nav}>
          <PmecPressable
            accessibilityLabel="Previous month"
            onPress={() => show(shiftMonth(monthKey, -1))}
            style={styles.navButton}
          >
            <Text style={styles.navText}>← PREVIOUS</Text>
          </PmecPressable>
          <PmecPressable accessibilityLabel="Go to today" onPress={() => show(thisMonth)} style={styles.navButton}>
            <Text style={styles.navText}>TODAY</Text>
          </PmecPressable>
          <PmecPressable
            accessibilityLabel="Next month"
            onPress={() => show(shiftMonth(monthKey, 1))}
            style={styles.navButton}
          >
            <Text style={styles.navText}>NEXT →</Text>
          </PmecPressable>
        </View>
      </View>

      <Legend styles={styles} mode={mode} />

      <View style={[styles.body, wide && styles.bodyWide]}>
        <View style={[styles.grid, wide && styles.gridWide]}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((label, index) => (
              <Text key={label} style={[styles.weekday, index >= 5 && styles.weekdayWeekend]}>
                {label}
              </Text>
            ))}
          </View>
          {weeks.map((week) => (
            <View key={week[0]!.date} style={styles.weekRow}>
              {week.map((day) => (
                <DayCell
                  key={day.date}
                  day={day}
                  level={coverage.get(day.date)?.level}
                  selected={day.date === selected}
                  people={people}
                  styles={styles}
                  mode={mode}
                  onSelect={() => setSelected(day.date)}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={[styles.detail, wide && styles.detailWide]}>
          {selectedDay ? (
            <DayDetail
              day={selectedDay}
              coverage={coverage.get(selectedDay.date)}
              people={people}
              styles={styles}
              onPerson={onPerson}
              onDecide={decide}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function DayCell({
  day,
  level,
  selected,
  people,
  styles,
  mode,
  onSelect,
}: {
  day: Day;
  level?: CapacityForecastDay["level"];
  selected: boolean;
  people: People;
  styles: Styles;
  mode: Mode;
  onSelect: () => void;
}) {
  // Every day with someone away already rates "watch", which the names show. Only the
  // days where coverage genuinely runs short are marked on the grid.
  const constrained = day.inMonth && level === "constrained";
  const label = [
    longDate(day.date),
    day.holiday,
    day.away.length ? `${day.away.length} away` : "everyone available",
    day.away.some((leave) => leave.status === "pending") ? "includes pending leave" : null,
    constrained ? "coverage constrained" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PmecPressable
      accessibilityLabel={label}
      selected={selected}
      pressed={selected}
      onPress={onSelect}
      style={[styles.cell, (day.weekend || !day.inMonth) && styles.cellMuted, selected && styles.cellSelected]}
    >
      <View>
        <Text style={[styles.dayNumber, !day.inMonth && styles.dayNumberOutside]}>{day.day}</Text>
        {day.isToday ? <View style={styles.todayMark} /> : null}
      </View>
      {day.inMonth ? (
        <>
          {day.holiday ? (
            <Text numberOfLines={1} style={styles.holiday}>
              {day.holiday}
            </Text>
          ) : null}
          {day.away.slice(0, SHOWN_PER_DAY).map((leave) => (
            <Text
              key={leave.id}
              numberOfLines={1}
              style={[
                styles.entry,
                leave.status === "pending"
                  ? [styles.entryPending, pendingWash(mode), { color: statusColor("caution", mode) }]
                  : styles.entryApproved,
              ]}
            >
              {shortName(people.get(leave.employeeId)?.name)}
            </Text>
          ))}
          {day.away.length > SHOWN_PER_DAY ? (
            <Text style={styles.more}>+{day.away.length - SHOWN_PER_DAY} more</Text>
          ) : null}
          {constrained ? (
            <Text numberOfLines={1} style={[styles.level, styles.levelInCell, { color: statusColor("critical", mode) }]}>
              CONSTRAINED
            </Text>
          ) : null}
        </>
      ) : null}
    </PmecPressable>
  );
}

function DayDetail({
  day,
  coverage,
  people,
  styles,
  onPerson,
  onDecide,
}: {
  day: Day;
  coverage?: CapacityForecastDay;
  people: People;
  styles: Styles;
  onPerson: (person: PmecWorkforcePerson) => void;
  onDecide: (leave: PmecLeaveRequest, status: "approved" | "rejected") => void;
}) {
  return (
    <>
      <Text style={styles.detailEyebrow}>{day.isToday ? "TODAY" : day.weekend ? "WEEKEND" : "WORKDAY"}</Text>
      <Text accessibilityRole="header" style={styles.detailDate}>
        {longDate(day.date)}
      </Text>
      {day.holiday ? <Badge label={`Public holiday · ${day.holiday}`} tone="neutral" /> : null}
      {coverage ? (
        <View style={styles.coverageRow}>
          <Badge label={coverage.level.toUpperCase()} tone={LEVEL_TONE[coverage.level]} />
          <Text style={styles.detailMeta}>
            {coverage.approvedAway} away · {coverage.pendingAway} pending · {coverage.projectedRoomHours}H projected
            room
          </Text>
        </View>
      ) : null}
      <Text style={styles.sectionLabel}>{day.away.length ? `LEAVE · ${day.away.length}` : "LEAVE"}</Text>
      {day.away.length === 0 ? (
        <Text style={styles.empty}>
          {day.holiday ? "Public holiday. No leave booked." : "Everyone is available."}
        </Text>
      ) : (
        day.away.map((leave) => {
          const person = people.get(leave.employeeId);
          const whose = person ? `${person.name}'s` : "this";
          return (
            <View key={leave.id} style={styles.awayRow}>
              <PmecPressable
                accessibilityLabel={person ? `Open ${person.name}'s profile` : "Person not in the workforce list"}
                disabled={!person}
                onPress={() => person && onPerson(person)}
                style={styles.personButton}
              >
                <Text style={styles.personName}>{person?.name ?? "Unknown person"}</Text>
                <Text style={styles.detailMeta}>
                  {person ? `${person.role} · ${person.discipline}` : leave.employeeId}
                </Text>
              </PmecPressable>
              <View style={styles.leaveLine}>
                <Badge
                  label={leave.status === "pending" ? "PENDING" : "APPROVED"}
                  tone={leave.status === "pending" ? "caution" : "positive"}
                />
                <Text style={styles.detailMeta}>
                  {leave.type} ·{" "}
                  {leave.startDate === leave.endDate
                    ? shortDate(leave.startDate)
                    : `${shortDate(leave.startDate)} – ${shortDate(leave.endDate)}`}{" "}
                  · {plural(leave.workDays, "work day", "work days")}
                </Text>
              </View>
              {leave.status === "pending" ? (
                <View style={styles.decisions}>
                  <Button
                    label="Approve"
                    hint={`Approves ${whose} leave request`}
                    onPress={() => onDecide(leave, "approved")}
                  />
                  <Button
                    label="Reject"
                    variant="secondary"
                    hint={`Rejects ${whose} leave request`}
                    onPress={() => onDecide(leave, "rejected")}
                  />
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </>
  );
}

function Legend({ styles, mode }: { styles: Styles; mode: Mode }) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.swatch, styles.swatchApproved]} />
        <Text style={styles.legendText}>Approved leave</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.swatch, styles.entryPending, pendingWash(mode)]} />
        <Text style={styles.legendText}>Waiting for a decision</Text>
      </View>
      <View style={styles.legendItem}>
        <Text style={styles.holiday}>Holiday</Text>
        <Text style={styles.legendText}>Public holiday</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.todayMark} />
        <Text style={styles.legendText}>Today</Text>
      </View>
      <View style={styles.legendItem}>
        <Text style={[styles.level, { color: statusColor("critical", mode) }]}>CONSTRAINED</Text>
        <Text style={styles.legendText}>Too few people available</Text>
      </View>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    wrap: { gap: space.lg },
    header: {
      alignItems: "flex-end",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space.lg,
      justifyContent: "space-between",
    },
    headerCopy: { gap: space.xs },
    month: { color: palette.foreground, fontSize: type.title, fontWeight: weight.black, letterSpacing: tracking.title },
    headline: { color: palette.muted, fontSize: type.meta, fontWeight: weight.medium },
    nav: { flexDirection: "row", gap: space.sm },
    navButton: {
      alignItems: "center",
      borderColor: palette.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: space.lg,
    },
    navText: { color: palette.foreground, fontSize: type.label, fontWeight: weight.black, letterSpacing: tracking.label },
    legend: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: space.lg },
    legendItem: { alignItems: "center", flexDirection: "row", gap: space.sm },
    legendText: { color: palette.muted, fontSize: type.label, fontWeight: weight.medium },
    body: { gap: space.lg },
    bodyWide: { alignItems: "flex-start", flexDirection: "row" },
    grid: { backgroundColor: palette.border, borderColor: palette.border, borderWidth: 1, gap: 1 },
    gridWide: { flex: 3 },
    weekRow: { flexDirection: "row", gap: 1 },
    weekday: {
      backgroundColor: palette.surface,
      color: palette.foreground,
      flex: 1,
      fontSize: type.label,
      fontWeight: weight.black,
      letterSpacing: tracking.label,
      paddingHorizontal: space.sm,
      paddingVertical: space.sm,
    },
    weekdayWeekend: { color: palette.muted },
    cell: {
      backgroundColor: palette.background,
      borderColor: "transparent",
      borderWidth: 2,
      flex: 1,
      gap: 3,
      justifyContent: "flex-start",
      minHeight: 112,
      padding: 6,
    },
    cellMuted: { backgroundColor: palette.surface },
    cellSelected: { borderColor: palette.foreground },
    dayNumber: { color: palette.foreground, fontSize: type.bodyStrong, fontWeight: weight.black },
    dayNumberOutside: { color: palette.muted, fontWeight: weight.bold },
    todayMark: { backgroundColor: palette.accent, borderRadius: 2, height: 3, marginTop: 2, width: 18 },
    holiday: { color: palette.muted, fontSize: type.label, fontStyle: "italic", fontWeight: weight.medium },
    entry: {
      borderColor: "transparent",
      borderRadius: 3,
      borderWidth: 1,
      fontSize: type.label,
      fontWeight: weight.bold,
      overflow: "hidden",
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    entryApproved: { backgroundColor: palette.surfaceStrong, color: palette.foreground },
    entryPending: { borderStyle: "dashed" },
    swatch: { borderColor: "transparent", borderRadius: 3, borderWidth: 1, height: 14, width: 22 },
    swatchApproved: { backgroundColor: palette.surfaceStrong },
    more: { color: palette.muted, fontSize: type.label, fontWeight: weight.bold },
    level: { fontSize: type.label, fontWeight: weight.black, letterSpacing: tracking.label },
    levelInCell: { marginTop: "auto" },
    detail: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      gap: space.md,
      padding: space.xl,
    },
    detailWide: { flex: 1.3, minWidth: 300 },
    detailEyebrow: { color: palette.muted, fontSize: type.label, fontWeight: weight.black, letterSpacing: tracking.label },
    detailDate: { color: palette.foreground, fontSize: type.heading, fontWeight: weight.black, letterSpacing: tracking.title },
    coverageRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: space.sm },
    detailMeta: { color: palette.muted, fontSize: type.meta, lineHeight: type.meta * 1.45 },
    sectionLabel: {
      borderTopColor: palette.border,
      borderTopWidth: 1,
      color: palette.foreground,
      fontSize: type.label,
      fontWeight: weight.black,
      letterSpacing: tracking.label,
      marginTop: space.sm,
      paddingTop: space.md,
    },
    empty: { color: palette.muted, fontSize: type.body },
    awayRow: {
      borderBottomColor: palette.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: space.sm,
      paddingBottom: space.md,
    },
    personButton: { alignItems: "flex-start" },
    personName: {
      color: palette.foreground,
      fontSize: type.bodyStrong,
      fontWeight: weight.bold,
      textDecorationLine: "underline",
    },
    leaveLine: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: space.sm },
    decisions: { flexDirection: "row", gap: space.sm },
  });
