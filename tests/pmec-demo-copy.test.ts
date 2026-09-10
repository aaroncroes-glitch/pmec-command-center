import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("PM screens speak plainly", () => {
  it.each(["app/control-center/index.tsx", "app/job-orders/index.tsx"])(
    "%s shows no vendor or internal names",
    (file) => {
      // Clerk is the sign-in vendor, Neon the database, Lumen the old product name. Only
      // text a person reads counts: string literals and JSX text, not identifiers.
      const visible = [...read(file).matchAll(/"([^"\n]*)"|>([^<>{}\n]+)</g)].map((m) => m[1] ?? m[2]);
      const leaks = visible.filter(
        (text) =>
          !text.startsWith("@/") &&
          /\b(Clerk|CLERK|Neon|NEON|Lumen|LUMEN)\b|ACCESS BOUNDARIES|ROLE BOUNDARY/.test(text),
      );
      expect(leaks).toEqual([]);
    },
  );
});

describe("disabled form buttons explain themselves", () => {
  const tracker = read("app/job-orders/index.tsx");
  it.each([
    "Pick a target date to add this milestone.",
    "Add who this package is assigned to.",
    "Attach a file to add it to cost records.",
    "Write a shared reason to approve the selected documents.",
  ])("says: %s", (hint) => {
    expect(tracker).toContain(hint);
  });
});
