import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("PMEC Command Center branding", () => {
  it("keeps the requested workspace and launcher title configured", () => {
    const config = readFileSync("app.config.ts", "utf8");

    expect(config).toContain('appName: "PMEC Command Center"');
    expect(process.env.VITE_APP_TITLE ?? "PMEC Command Center").toBe("PMEC Command Center");
  });
});
