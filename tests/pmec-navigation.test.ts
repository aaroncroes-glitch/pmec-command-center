import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { performSafeBack } from "../lib/pmec-navigation";

const root = process.cwd();
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(resolve(root, dir)).flatMap((name) => {
    const rel = join(dir, name);
    if (statSync(resolve(root, rel)).isDirectory()) return sourceFiles(rel);
    return /\.(ts|tsx)$/.test(name) ? [rel] : [];
  });
}

describe("performSafeBack", () => {
  it("goes back when there is somewhere to go back to", () => {
    const router = { canGoBack: () => true, back: vi.fn(), replace: vi.fn() };
    performSafeBack(router, "/");
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("goes to the fallback when the history is empty", () => {
    // After a refresh or a direct link, a bare router.back() does nothing at all.
    const router = { canGoBack: () => false, back: vi.fn(), replace: vi.fn() };
    performSafeBack(router, "/settings");
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/settings");
  });
});

describe("navigation cannot dead-end", () => {
  it("never calls router.back() directly", () => {
    // Comments may name router.back() to explain why it is avoided; only code counts.
    const code = (file: string) =>
      read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|\s)\/\/.*$/gm, "$1");
    const offenders = [...sourceFiles("app"), ...sourceFiles("components")].filter((file) =>
      code(file).includes("router.back()"),
    );
    expect(offenders).toEqual([]);
  });

  it("renders every tab in place rather than redirecting off the tab bar", () => {
    // A redirect-only tab leaves the tab bar behind, and back then lands on the tab,
    // which redirects straight back: the Pay tab trap.
    const tabs = readdirSync(resolve(root, "app/(tabs)")).filter(
      (file) => file.endsWith(".tsx") && file !== "_layout.tsx",
    );
    const redirectOnly = tabs.filter((file) =>
      /export default function \w+\(\)\s*\{\s*return <Redirect[^>]*\/>;?\s*\}/.test(
        read(`app/(tabs)/${file}`),
      ),
    );
    expect(redirectOnly).toEqual([]);
  });

  it("returns to Home from any tab", () => {
    expect(read("app/(tabs)/_layout.tsx")).toContain('backBehavior="firstRoute"');
  });

  it("keeps tab labels whole", () => {
    // Without these, React Native Web squeezes each label to 9px and clips its letters.
    expect(read("app/(tabs)/_layout.tsx")).toMatch(/label: \{[^}]*flexShrink: 0[^}]*lineHeight: 13/);
  });

  it.each([
    "app/payslips.tsx",
    "app/profile.tsx",
    "app/leave.tsx",
    "app/analytics.tsx",
    "app/activity.tsx",
    "app/personal-calendar.tsx",
    "app/notifications.tsx",
    "app/notification-settings.tsx",
    "app/assigned-work.tsx",
    "app/work-project/[id].tsx",
    "app/project/[id].tsx",
    "components/pmec-legal-page.tsx",
  ])("%s has a back control", (file) => {
    expect(read(file)).toContain("<BackButton");
  });

  it("exits attendance through the safe back", () => {
    expect(read("app/attendance.tsx")).toContain('performSafeBack(router, "/")');
  });

  it("links the project tracker back to the Control Center", () => {
    expect(read("app/job-orders/index.tsx")).toContain('fallback="/control-center"');
  });
});
