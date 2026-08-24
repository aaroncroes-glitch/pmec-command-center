import { describe, expect, it } from "vitest";
import { buildWorkforce, projectHealth } from "../lib/admin-demo";

describe("administrative workforce demo", () => {
  it("models the primary employee, 27 additional employees, and six contractors", () => {
    const workforce = buildWorkforce("Percy Solagnier");
    expect(workforce).toHaveLength(34);
    expect(workforce.filter((person) => person.type === "Employee")).toHaveLength(28);
    expect(workforce.filter((person) => person.type === "Contractor")).toHaveLength(6);
  });

  it("summarizes phase tasks into project delivery health", () => {
    const health = projectHealth({ id: "p", name: "Demo", code: "D", client: "Client", color: "#000", status: "active", phases: [{ id: "phase", name: "Execution", tasks: [{ id: "done", title: "Done", status: "done", estimatedHours: 4 }, { id: "open", title: "Open", status: "todo", estimatedHours: 4 }] }] });
    expect(health).toEqual({ completion: 50, open: 1, phaseCount: 1 });
  });

  it("includes current assignments and local leave history for profile review", () => {
    const workforce = buildWorkforce("Percy Solagnier");
    const employee = workforce.find((person) => person.id === "employee-1");
    const contractor = workforce.find((person) => person.id === "contractor-1");
    expect(employee?.assignments.length).toBeGreaterThan(0);
    expect(employee?.leaveHistory.length).toBeGreaterThan(0);
    expect(contractor?.leaveHistory).toEqual([]);
  });
});
