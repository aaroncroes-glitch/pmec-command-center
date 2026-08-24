import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Shared delivery records used by both the PMEC Control Center and employee workspace. */
export const pmecAssignments = mysqlTable("pmec_assignments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  jobOrderId: varchar("job_order_id", { length: 96 }).notNull(),
  jobOrderTitle: varchar("job_order_title", { length: 255 }).notNull(),
  taskId: varchar("task_id", { length: 96 }).notNull(),
  taskTitle: varchar("task_title", { length: 255 }).notNull(),
  employeeId: varchar("employee_id", { length: 96 }).notNull(),
  employeeName: varchar("employee_name", { length: 160 }).notNull(),
  discipline: varchar("discipline", { length: 96 }).notNull(),
  status: mysqlEnum("status", ["assigned", "in_progress", "blocked", "complete"]).default("assigned").notNull(),
  progress: int("progress").default(0).notNull(),
  assignedBy: varchar("assigned_by", { length: 160 }).notNull(),
  dueDate: varchar("due_date", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const pmecTimeLogs = mysqlTable("pmec_time_logs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 64 }).notNull(),
  employeeId: varchar("employee_id", { length: 96 }).notNull(),
  employeeName: varchar("employee_name", { length: 160 }).notNull(),
  jobOrderId: varchar("job_order_id", { length: 96 }).notNull(),
  taskId: varchar("task_id", { length: 96 }).notNull(),
  workDate: varchar("work_date", { length: 10 }).notNull(),
  minutes: int("minutes").notNull(),
  note: text("note").notNull(),
  status: mysqlEnum("status", ["submitted", "approved", "rejected"]).default("submitted").notNull(),
  reviewerNote: text("reviewer_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmecAssignment = typeof pmecAssignments.$inferSelect;
export type InsertPmecAssignment = typeof pmecAssignments.$inferInsert;
export type PmecTimeLog = typeof pmecTimeLogs.$inferSelect;
export type InsertPmecTimeLog = typeof pmecTimeLogs.$inferInsert;
