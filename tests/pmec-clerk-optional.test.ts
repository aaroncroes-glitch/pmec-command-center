import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("sign-in without Clerk", () => {
  it("never throws from the Clerk fallback", () => {
    // Throwing here crashed the page whenever someone clicked sign-in in dev or a preview.
    const code = read("lib/pmec-clerk-optional.ts")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/.*$/gm, "$1");
    expect(code).not.toMatch(/\bthrow\b/);
  });

  it("shows LOCAL DEMO instead of SIGN IN on the Control Center", () => {
    expect(read("app/control-center/index.tsx")).toMatch(
      /if \(!clerkEnabled\) return <View[^>]*>\s*<Text[^>]*>LOCAL DEMO<\/Text>/,
    );
  });

  it("hides the Clerk button on the employee login without Clerk and in the showcase", () => {
    const login = read("app/ess/login.tsx");
    expect(login).toMatch(/\{clerkEnabled && !showcaseMode \? <><Pressable accessibilityRole="button" disabled=\{!clerkLoaded/);
    expect(login).toContain("LOCAL PROTOTYPE FALLBACK</Text><View style={styles.dividerLine} /></View></> : null}");
  });
});
