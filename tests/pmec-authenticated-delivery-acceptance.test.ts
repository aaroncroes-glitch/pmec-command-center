import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../server/_core/context";
import type { PmecClerkPrincipal } from "../server/pmec-clerk-access";

let activePrincipal: PmecClerkPrincipal;

const deliveryStore = {
  listAssignments: vi.fn(),
  upsertAssignment: vi.fn(),
  createNotification: vi.fn(),
  getAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  listTimeLogs: vi.fn(),
  createTimeLog: vi.fn(),
  reviewTimeLog: vi.fn(),
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  archiveNotification: vi.fn(),
  restoreNotification: vi.fn(),
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
};

vi.mock("../server/pmec-clerk-access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../server/pmec-clerk-access")>()),
  resolvePmecClerkPrincipal: vi.fn(async () => activePrincipal),
}));

vi.mock("../server/pmec-delivery-store", () => deliveryStore);

const { appRouter } = await import("../server/routers");

function principal(permissions: string[], legacyEmployeeId = "employee-001"): PmecClerkPrincipal {
  return { clerkUserId: "user_verified", personId: "person_verified", organizationId: "organization_verified", legacyEmployeeId, roles: ["test_role"], permissions };
}

function caller() {
  const ctx: TrpcContext = { user: null, req: { headers: { authorization: "Bearer verified-test-token" } } as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("PMEC authenticated delivery acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activePrincipal = principal(["assignment.read_own", "assignment.update_own_status", "time_log.submit_own", "notification.manage_own"]);
    deliveryStore.listAssignments.mockResolvedValue([]);
    deliveryStore.listTimeLogs.mockResolvedValue([]);
    deliveryStore.upsertAssignment.mockImplementation(async (_organizationId, assignment) => ({ isNew: false, previousEmployeeId: assignment.employeeId, assignment }));
  });

  it("accepts an employee’s own assignment query and scopes the Neon repository call to that employee", async () => {
    await expect(caller().pmecDelivery.assignments({ employeeId: "employee-001" })).resolves.toEqual([]);
    expect(deliveryStore.listAssignments).toHaveBeenCalledWith("organization_verified", "employee-001");
  });

  it("accepts a verified PM assignment while preserving organization scope", async () => {
    activePrincipal = principal(["assignment.manage_assigned"]);
    await expect(caller().pmecDelivery.assign({
      id: "assignment-001", jobOrderId: "job-001", jobOrderTitle: "Job", taskId: "task-001", taskTitle: "Task",
      employeeId: "employee-001", employeeName: "Employee", discipline: "Electrical", assignedBy: "PM",
    })).resolves.toMatchObject({ id: "assignment-001", employeeId: "employee-001" });
    expect(deliveryStore.upsertAssignment).toHaveBeenCalledWith("organization_verified", expect.objectContaining({ id: "assignment-001" }));
  });

  it("allows HR organization-wide time-log review visibility but rejects HR assignment writes", async () => {
    activePrincipal = principal(["people.read_organization", "time_log.read_organization", "payroll.review"]);
    await expect(caller().pmecDelivery.timeLogs()).resolves.toEqual([]);
    expect(deliveryStore.listTimeLogs).toHaveBeenCalledWith("organization_verified", undefined);
    await expect(caller().pmecDelivery.assign({
      id: "assignment-002", jobOrderId: "job-001", jobOrderTitle: "Job", taskId: "task-001", taskTitle: "Task",
      employeeId: "employee-001", employeeName: "Employee", discipline: "Electrical", assignedBy: "HR",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reports the exact verified permission set to the signed-in access summary", async () => {
    activePrincipal = principal(["assignment.manage_assigned", "time_log.approve_assigned"]);
    await expect(caller().pmecAccess.me()).resolves.toEqual({
      roles: ["test_role"],
      permissions: ["assignment.manage_assigned", "time_log.approve_assigned"],
      employeeScope: "employee-001",
    });
  });
});
