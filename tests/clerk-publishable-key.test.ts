import { describe, expect, it } from "vitest";

import { hasUsableClerkPublishableKey } from "../lib/pmec-clerk-config";
import "../scripts/load-env.js";

describe("Clerk Expo publishable key", () => {
  it("contains a decodable Clerk frontend API domain", () => {
    expect(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY must be configured").toBeTruthy();
    expect(hasUsableClerkPublishableKey(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)).toBe(true);
  });
});
