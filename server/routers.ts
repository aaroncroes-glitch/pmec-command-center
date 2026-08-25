import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as delivery from "./pmec-delivery-store";
import { assertPayrollReviewPermission, hasPmecPermission, resolvePmecClerkPrincipal, type PmecClerkPrincipal } from "./pmec-clerk-access";

const assignmentManagerPermissions = ["assignment.manage_assigned"];
const organizationTimeReadPermissions = ["time_log.approve_assigned", "time_log.read_organization"];

function hasAnyPermission(principal: PmecClerkPrincipal, permissions: string[]) {
  return permissions.some((permission) => hasPmecPermission(principal, permission));
}

function assertPermission(principal: PmecClerkPrincipal, permission: string) {
  if (!hasPmecPermission(principal, permission)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your PMEC membership does not permit this delivery action." });
  }
  return principal;
}

function employeeScope(principal: PmecClerkPrincipal) {
  return principal.legacyEmployeeId ?? principal.personId;
}

function assertOwnEmployeeScope(principal: PmecClerkPrincipal, employeeId: string) {
  if (employeeScope(principal) !== employeeId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only access your own PMEC delivery records." });
  }
  return principal;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  pmecPayroll: router({
    access: publicProcedure.query(async ({ ctx }) => {
      const principal = await resolvePmecClerkPrincipal(ctx.req);
      const authorized = assertPayrollReviewPermission(principal);
      return {
        allowed: true as const,
        role: authorized.roles.includes("hr_manager") ? "hr_manager" : "authorized",
        permissions: authorized.permissions,
      };
    }),
  }),
  pmecDelivery: router({
    assignments: publicProcedure.input(z.object({ employeeId: z.string().min(1).optional() }).optional()).query(async ({ ctx, input }) => {
      const principal = await resolvePmecClerkPrincipal(ctx.req);
      const requestedEmployeeId = input?.employeeId;
      if (hasAnyPermission(principal, assignmentManagerPermissions)) return delivery.listAssignments(principal.organizationId, requestedEmployeeId);
      assertPermission(principal, "assignment.read_own");
      if (requestedEmployeeId) assertOwnEmployeeScope(principal, requestedEmployeeId);
      return delivery.listAssignments(principal.organizationId, employeeScope(principal));
    }),
    assign: publicProcedure.input(z.object({ id: z.string().min(1), jobOrderId: z.string().min(1), jobOrderTitle: z.string().min(1), taskId: z.string().min(1), taskTitle: z.string().min(1), employeeId: z.string().min(1), employeeName: z.string().min(1), discipline: z.string().min(1), status: z.enum(["assigned", "in_progress", "blocked", "complete"]).default("assigned"), progress: z.number().int().min(0).max(100).default(0), assignedBy: z.string().min(1), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "assignment.manage_assigned");
      const result = await delivery.upsertAssignment(principal.organizationId, input);
      if (result.isNew || result.previousEmployeeId !== result.assignment.employeeId) {
        await delivery.createNotification(principal.organizationId, {
          id: `pmec-notify-${Date.now()}`,
          employeeId: result.assignment.employeeId,
          type: "assignment",
          title: "New PMEC work assigned",
          body: `${result.assignment.taskTitle} · ${result.assignment.jobOrderTitle}`,
          route: "/assigned-work",
        });
      }
      return result.assignment;
    }),
    updateAssignment: publicProcedure.input(z.object({ id: z.string().min(1), status: z.enum(["assigned", "in_progress", "blocked", "complete"]).optional(), progress: z.number().int().min(0).max(100).optional() })).mutation(async ({ ctx, input }) => {
      const principal = await resolvePmecClerkPrincipal(ctx.req);
      const assignment = await delivery.getAssignment(principal.organizationId, input.id);
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "PMEC assignment was not found." });
      if (!hasAnyPermission(principal, assignmentManagerPermissions)) {
        assertPermission(principal, "assignment.update_own_status");
        assertOwnEmployeeScope(principal, assignment.employeeId);
      }
      return delivery.updateAssignment(principal.organizationId, input.id, input);
    }),
    timeLogs: publicProcedure.input(z.object({ employeeId: z.string().min(1).optional() }).optional()).query(async ({ ctx, input }) => {
      const principal = await resolvePmecClerkPrincipal(ctx.req);
      const requestedEmployeeId = input?.employeeId;
      if (hasAnyPermission(principal, organizationTimeReadPermissions)) return delivery.listTimeLogs(principal.organizationId, requestedEmployeeId);
      assertPermission(principal, "time_log.submit_own");
      if (requestedEmployeeId) assertOwnEmployeeScope(principal, requestedEmployeeId);
      return delivery.listTimeLogs(principal.organizationId, employeeScope(principal));
    }),
    submitTime: publicProcedure.input(z.object({ id: z.string().min(1), assignmentId: z.string().min(1), employeeId: z.string().min(1), employeeName: z.string().min(1), jobOrderId: z.string().min(1), taskId: z.string().min(1), workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), minutes: z.number().int().min(15).max(960), note: z.string().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "time_log.submit_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      const assignment = await delivery.getAssignment(principal.organizationId, input.assignmentId);
      if (!assignment || assignment.employeeId !== input.employeeId) throw new TRPCError({ code: "FORBIDDEN", message: "You can only log time against your own PMEC assignment." });
      return delivery.createTimeLog(principal.organizationId, { ...input, status: "submitted" });
    }),
    reviewTime: publicProcedure.input(z.object({ id: z.string().min(1), status: z.enum(["approved", "rejected"]), reviewerNote: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "time_log.approve_assigned");
      const reviewed = await delivery.reviewTimeLog(principal.organizationId, input.id, input.status, input.reviewerNote);
      if (!reviewed) throw new TRPCError({ code: "NOT_FOUND", message: "PMEC time log was not found." });
      if (input.status === "approved") {
        await delivery.createNotification(principal.organizationId, {
          id: `pmec-notify-${Date.now()}`,
          employeeId: reviewed.employeeId,
          type: "time_approved",
          title: "Hours approved",
          body: `${(reviewed.minutes / 60).toFixed(1)} hours approved for ${reviewed.workDate}`,
          route: "/assigned-work",
        });
      }
      return reviewed;
    }),
    notifications: publicProcedure.input(z.object({ employeeId: z.string().min(1), archived: z.boolean().optional() })).query(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "notification.manage_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      return delivery.listNotifications(principal.organizationId, input.employeeId, input.archived);
    }),
    markNotificationRead: publicProcedure.input(z.object({ id: z.string().min(1), employeeId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "notification.manage_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      return delivery.markNotificationRead(principal.organizationId, input.employeeId, input.id);
    }),
    archiveNotification: publicProcedure.input(z.object({ id: z.string().min(1), employeeId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "notification.manage_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      return delivery.archiveNotification(principal.organizationId, input.employeeId, input.id);
    }),
    restoreNotification: publicProcedure.input(z.object({ id: z.string().min(1), employeeId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "notification.manage_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      return delivery.restoreNotification(principal.organizationId, input.employeeId, input.id);
    }),
    notificationPreferences: publicProcedure.input(z.object({ employeeId: z.string().min(1) })).query(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "notification.manage_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      return delivery.getNotificationPreferences(principal.organizationId, input.employeeId);
    }),
    updateNotificationPreferences: publicProcedure.input(z.object({ employeeId: z.string().min(1), assignmentsEnabled: z.boolean(), timeApprovedEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const principal = assertPermission(await resolvePmecClerkPrincipal(ctx.req), "notification.manage_own");
      assertOwnEmployeeScope(principal, input.employeeId);
      return delivery.updateNotificationPreferences(principal.organizationId, input.employeeId, input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
