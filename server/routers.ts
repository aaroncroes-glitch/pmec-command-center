import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
  pmecDelivery: router({
    assignments: publicProcedure.input(z.object({ employeeId: z.string().min(1).optional() }).optional()).query(({ input }) => db.listPmecAssignments(input?.employeeId)),
    assign: publicProcedure.input(z.object({ id: z.string().min(1), jobOrderId: z.string().min(1), jobOrderTitle: z.string().min(1), taskId: z.string().min(1), taskTitle: z.string().min(1), employeeId: z.string().min(1), employeeName: z.string().min(1), discipline: z.string().min(1), status: z.enum(["assigned", "in_progress", "blocked", "complete"]).default("assigned"), progress: z.number().int().min(0).max(100).default(0), assignedBy: z.string().min(1), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })).mutation(({ input }) => db.upsertPmecAssignment(input)),
    updateAssignment: publicProcedure.input(z.object({ id: z.string().min(1), status: z.enum(["assigned", "in_progress", "blocked", "complete"]).optional(), progress: z.number().int().min(0).max(100).optional() })).mutation(({ input }) => db.updatePmecAssignment(input.id, input)),
    timeLogs: publicProcedure.input(z.object({ employeeId: z.string().min(1).optional() }).optional()).query(({ input }) => db.listPmecTimeLogs(input?.employeeId)),
    submitTime: publicProcedure.input(z.object({ id: z.string().min(1), assignmentId: z.string().min(1), employeeId: z.string().min(1), employeeName: z.string().min(1), jobOrderId: z.string().min(1), taskId: z.string().min(1), workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), minutes: z.number().int().min(15).max(960), note: z.string().min(3).max(1000) })).mutation(({ input }) => db.createPmecTimeLog({ ...input, status: "submitted" })),
    reviewTime: publicProcedure.input(z.object({ id: z.string().min(1), status: z.enum(["approved", "rejected"]), reviewerNote: z.string().max(1000).optional() })).mutation(({ input }) => db.reviewPmecTimeLog(input.id, input.status, input.reviewerNote)),
    notifications: publicProcedure.input(z.object({ employeeId: z.string().min(1), archived: z.boolean().optional() })).query(({ input }) => db.listPmecNotifications(input.employeeId, input.archived)),
    markNotificationRead: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ input }) => db.markPmecNotificationRead(input.id)),
    archiveNotification: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ input }) => db.archivePmecNotification(input.id)),
    restoreNotification: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ input }) => db.restorePmecNotification(input.id)),
    notificationPreferences: publicProcedure.input(z.object({ employeeId: z.string().min(1) })).query(({ input }) => db.getPmecNotificationPreferences(input.employeeId)),
    updateNotificationPreferences: publicProcedure.input(z.object({ employeeId: z.string().min(1), assignmentsEnabled: z.boolean(), timeApprovedEnabled: z.boolean() })).mutation(({ input }) => db.updatePmecNotificationPreferences(input.employeeId, { assignmentsEnabled: input.assignmentsEnabled ? 1 : 0, timeApprovedEnabled: input.timeApprovedEnabled ? 1 : 0 })),
  }),
});

export type AppRouter = typeof appRouter;
