import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertPmecAssignment, InsertPmecNotification, InsertPmecTimeLog, InsertUser, pmecAssignments, pmecNotifications, pmecTimeLogs, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listPmecAssignments(employeeId?: string) {
  const db = await getDb();
  if (!db) return [];
  return employeeId ? db.select().from(pmecAssignments).where(eq(pmecAssignments.employeeId, employeeId)).orderBy(desc(pmecAssignments.updatedAt)) : db.select().from(pmecAssignments).orderBy(desc(pmecAssignments.updatedAt));
}

export async function upsertPmecAssignment(record: InsertPmecAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Shared delivery database is not available");
  const previous = await db.select().from(pmecAssignments).where(eq(pmecAssignments.id, record.id)).limit(1);
  await db.insert(pmecAssignments).values(record).onDuplicateKeyUpdate({ set: { employeeId: record.employeeId, employeeName: record.employeeName, discipline: record.discipline, status: record.status, progress: record.progress, assignedBy: record.assignedBy, dueDate: record.dueDate, jobOrderTitle: record.jobOrderTitle, taskTitle: record.taskTitle } });
  const rows = await db.select().from(pmecAssignments).where(eq(pmecAssignments.id, record.id)).limit(1);
  if (!previous[0] || previous[0].employeeId !== record.employeeId) await createPmecNotification({ id: `pmec-notify-${Date.now()}`, employeeId: record.employeeId, type: "assignment", title: "New PMEC work assigned", body: `${record.taskTitle} · ${record.jobOrderTitle}`, route: "/assigned-work" });
  return rows[0];
}

export async function updatePmecAssignment(id: string, update: Partial<Pick<InsertPmecAssignment, "status" | "progress">>) {
  const db = await getDb();
  if (!db) throw new Error("Shared delivery database is not available");
  await db.update(pmecAssignments).set(update).where(eq(pmecAssignments.id, id));
  const rows = await db.select().from(pmecAssignments).where(eq(pmecAssignments.id, id)).limit(1);
  return rows[0];
}

export async function listPmecTimeLogs(employeeId?: string) {
  const db = await getDb();
  if (!db) return [];
  return employeeId ? db.select().from(pmecTimeLogs).where(eq(pmecTimeLogs.employeeId, employeeId)).orderBy(desc(pmecTimeLogs.workDate), desc(pmecTimeLogs.createdAt)) : db.select().from(pmecTimeLogs).orderBy(desc(pmecTimeLogs.workDate), desc(pmecTimeLogs.createdAt));
}

export async function createPmecTimeLog(record: InsertPmecTimeLog) {
  const db = await getDb();
  if (!db) throw new Error("Shared delivery database is not available");
  await db.insert(pmecTimeLogs).values(record);
  const rows = await db.select().from(pmecTimeLogs).where(eq(pmecTimeLogs.id, record.id)).limit(1);
  return rows[0];
}

export async function reviewPmecTimeLog(id: string, status: "approved" | "rejected", reviewerNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Shared delivery database is not available");
  const before = await db.select().from(pmecTimeLogs).where(eq(pmecTimeLogs.id, id)).limit(1);
  await db.update(pmecTimeLogs).set({ status, reviewerNote: reviewerNote ?? null }).where(eq(pmecTimeLogs.id, id));
  const rows = await db.select().from(pmecTimeLogs).where(eq(pmecTimeLogs.id, id)).limit(1);
  const log = rows[0];
  if (log && status === "approved" && before[0]?.status !== "approved") await createPmecNotification({ id: `pmec-notify-${Date.now()}`, employeeId: log.employeeId, type: "time_approved", title: "Hours approved", body: `${(log.minutes / 60).toFixed(1)} hours approved for ${log.workDate}`, route: "/assigned-work" });
  return rows[0];
}

export async function listPmecNotifications(employeeId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pmecNotifications).where(eq(pmecNotifications.employeeId, employeeId)).orderBy(desc(pmecNotifications.createdAt));
}

export async function createPmecNotification(record: InsertPmecNotification) {
  const db = await getDb();
  if (!db) throw new Error("Shared delivery database is not available");
  await db.insert(pmecNotifications).values(record);
  const rows = await db.select().from(pmecNotifications).where(eq(pmecNotifications.id, record.id)).limit(1);
  return rows[0];
}

export async function markPmecNotificationRead(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Shared delivery database is not available");
  await db.update(pmecNotifications).set({ readAt: new Date() }).where(eq(pmecNotifications.id, id));
  const rows = await db.select().from(pmecNotifications).where(eq(pmecNotifications.id, id)).limit(1);
  return rows[0];
}
