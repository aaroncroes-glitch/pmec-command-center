import { describe, expect, it } from "vitest";

import type { Task } from "../lib/lumen-types";
import { addDays, compareTasks, matchesTaskFilters, monthCells, nextOccurrenceDate, nextOccurrenceReminder, normalizeTags, projectProgress } from "../lib/lumen-utils";

const baseTask: Task = {
  id: "task-1",
  title: "Draft proposal",
  projectId: "project-a",
  dueDate: "2026-08-23",
  priority: "medium",
  completed: false,
  createdAt: "2026-08-23",
};

describe("Lumen workspace utilities", () => {
  it("moves dates forward and backward without changing the date format", () => {
    expect(addDays("2026-08-23", 2)).toBe("2026-08-25");
    expect(addDays("2026-08-23", -3)).toBe("2026-08-20");
  });

  it("orders open high-priority work before completed work", () => {
    const tasks = [
      { ...baseTask, id: "completed", completed: true, priority: "high" as const },
      { ...baseTask, id: "low", priority: "low" as const },
      { ...baseTask, id: "high", priority: "high" as const },
    ];
    expect(tasks.sort(compareTasks).map((task) => task.id)).toEqual(["high", "low", "completed"]);
  });

  it("reports the correct completion percentage for a project", () => {
    const tasks = [
      { ...baseTask, id: "one", completed: true },
      { ...baseTask, id: "two", completed: false },
      { ...baseTask, id: "other", projectId: "project-b", completed: true },
    ];
    expect(projectProgress("project-a", tasks)).toBe(50);
    expect(projectProgress("project-b", tasks)).toBe(100);
    expect(projectProgress("missing", tasks)).toBe(0);
  });

  it("creates correctly spaced recurrence dates", () => {
    expect(nextOccurrenceDate("2026-01-31", "daily")).toBe("2026-02-01");
    expect(nextOccurrenceDate("2026-01-31", "weekly")).toBe("2026-02-07");
    expect(nextOccurrenceDate("2026-01-15", "monthly")).toBe("2026-02-15");
    expect(nextOccurrenceDate("2026-01-15", "none")).toBe("2026-01-15");
  });

  it("normalizes tags and applies priority and tag filters together", () => {
    expect(normalizeTags([" Client ", "client", "DEEP-WORK", ""])).toEqual(["client", "deep-work"]);
    const tagged = { ...baseTask, priority: "high" as const, tags: ["client", "deep-work"] };
    expect(matchesTaskFilters(tagged, "high", "client")).toBe(true);
    expect(matchesTaskFilters(tagged, "medium", "client")).toBe(false);
    expect(matchesTaskFilters(tagged, "high", "admin")).toBe(false);
  });

  it("creates a full month grid and preserves reminder time on the next occurrence", () => {
    const cells = monthCells("2026-08-23");
    expect(cells).toHaveLength(42);
    expect(cells).toContain("2026-08-01");
    const reminder = nextOccurrenceReminder("2026-08-23T09:30:00.000Z", "2026-08-30");
    expect(reminder).toContain("2026-08-30T09:30:00.000Z");
  });
});
