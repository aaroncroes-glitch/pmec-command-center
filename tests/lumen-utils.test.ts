import { describe, expect, it } from "vitest";

import type { Task } from "../lib/lumen-types";
import { addDays, compareTasks, projectProgress } from "../lib/lumen-utils";

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
});
