import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PMEC Clerk frontend proxy routing", () => {
  it("forwards Expo web Clerk requests to the verified Clerk custom domain before the static fallback", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));
    const clerkRouteIndex = config.rewrites.findIndex((route: { source: string }) => route.source === "/__clerk/:path*");
    const apiRouteIndex = config.rewrites.findIndex((route: { source: string }) => route.source === "/api/:path*");
    const fallbackRouteIndex = config.rewrites.findIndex((route: { source: string }) => route.source === "/(.*)");
    expect(config.rewrites[clerkRouteIndex].destination).toBe("https://clerk.portal.pmec.group/:path*");
    expect(clerkRouteIndex).toBeGreaterThanOrEqual(0);
    expect(clerkRouteIndex).toBeLessThan(apiRouteIndex);
    expect(clerkRouteIndex).toBeLessThan(fallbackRouteIndex);
  });
});
