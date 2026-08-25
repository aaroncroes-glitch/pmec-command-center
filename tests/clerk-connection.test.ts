import { describe, expect, it } from "vitest";

describe("Clerk server credential", () => {
  it("authenticates a lightweight instance request", async () => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    expect(secretKey, "CLERK_SECRET_KEY must be configured").toBeTruthy();

    const response = await fetch("https://api.clerk.com/v1/instance", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    expect(response.ok, `Clerk instance validation failed with ${response.status}`).toBe(true);
  }, 20_000);
});
