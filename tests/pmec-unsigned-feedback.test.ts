import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const unsignedContext: TrpcContext = { user: null, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("PMEC unsigned-request feedback", () => {
  it("fails closed before returning payroll or delivery data", async () => {
    const caller = appRouter.createCaller(unsignedContext);
    await expect(caller.pmecPayroll.access()).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "Sign in with Clerk to continue." });
    await expect(caller.pmecDelivery.assignments()).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "Sign in with Clerk to continue." });
  });

  it("shows clear signed-out guidance and never labels local delivery data as synchronized", () => {
    const controlCenter = readFileSync(resolve(process.cwd(), "app/control-center/index.tsx"), "utf8");
    const assignedWork = readFileSync(resolve(process.cwd(), "app/assigned-work.tsx"), "utf8");
    expect(controlCenter).toContain("PAYROLL ACCESS: SIGN IN WITH CLERK");
    expect(assignedWork).toContain("PMEC account access is required.");
    expect(assignedWork).toContain("No local demonstration work is shown as synchronized work.");
  });
});
