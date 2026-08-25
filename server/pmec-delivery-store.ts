import { neon } from "@neondatabase/serverless";

export type DeliveryAssignmentStatus = "assigned" | "in_progress" | "blocked" | "complete";
export type DeliveryTimeLogStatus = "submitted" | "approved" | "rejected";
export type DeliveryNotificationType = "assignment" | "time_approved";

export type DeliveryAssignmentInput = {
  id: string;
  jobOrderId: string;
  jobOrderTitle: string;
  taskId: string;
  taskTitle: string;
  employeeId: string;
  employeeName: string;
  discipline: string;
  status: DeliveryAssignmentStatus;
  progress: number;
  assignedBy: string;
  dueDate?: string;
};

export type DeliveryAssignment = Omit<DeliveryAssignmentInput, "dueDate"> & {
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryTimeLogInput = {
  id: string;
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  jobOrderId: string;
  taskId: string;
  workDate: string;
  minutes: number;
  note: string;
  status?: DeliveryTimeLogStatus;
};

export type DeliveryTimeLog = DeliveryTimeLogInput & {
  status: DeliveryTimeLogStatus;
  reviewerNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryNotification = {
  id: string;
  employeeId: string;
  type: DeliveryNotificationType;
  title: string;
  body: string;
  route: string;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export type DeliveryNotificationPreferences = {
  employeeId: string;
  assignmentsEnabled: boolean;
  timeApprovedEnabled: boolean;
  updatedAt?: string;
};

type NeonQuery = ReturnType<typeof neon>;
type Row = Record<string, unknown>;

function getDeliverySql(): NeonQuery {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error("PMEC Neon delivery persistence is not configured");
  return neon(connectionString);
}

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asDate(value: unknown): string | null {
  return value == null ? null : String(value).slice(0, 10);
}

function mapAssignment(row: Row): DeliveryAssignment {
  return {
    id: String(row.id),
    jobOrderId: String(row.job_order_id),
    jobOrderTitle: String(row.job_order_title),
    taskId: String(row.task_id),
    taskTitle: String(row.task_title),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),
    discipline: String(row.discipline),
    status: row.status as DeliveryAssignmentStatus,
    progress: Number(row.progress),
    assignedBy: String(row.assigned_by),
    dueDate: asDate(row.due_date),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

function mapTimeLog(row: Row): DeliveryTimeLog {
  return {
    id: String(row.id),
    assignmentId: String(row.assignment_id),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),
    jobOrderId: String(row.job_order_id),
    taskId: String(row.task_id),
    workDate: asDate(row.work_date) ?? "",
    minutes: Number(row.minutes),
    note: String(row.note),
    status: row.status as DeliveryTimeLogStatus,
    reviewerNote: row.reviewer_note == null ? null : String(row.reviewer_note),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

function mapNotification(row: Row): DeliveryNotification {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    type: row.type as DeliveryNotificationType,
    title: String(row.title),
    body: String(row.body),
    route: String(row.route),
    readAt: row.read_at == null ? null : asIso(row.read_at),
    archivedAt: row.archived_at == null ? null : asIso(row.archived_at),
    createdAt: asIso(row.created_at),
  };
}

function mapPreferences(row: Row): DeliveryNotificationPreferences {
  return {
    employeeId: String(row.employee_id),
    assignmentsEnabled: Boolean(row.assignments_enabled),
    timeApprovedEnabled: Boolean(row.time_approved_enabled),
    updatedAt: row.updated_at == null ? undefined : asIso(row.updated_at),
  };
}

export async function listAssignments(organizationId: string, employeeId?: string): Promise<DeliveryAssignment[]> {
  const sql = getDeliverySql();
  const rows = employeeId
    ? await sql.query("SELECT * FROM pmec.delivery_assignments WHERE organization_id = $1 AND employee_id = $2 ORDER BY updated_at DESC", [organizationId, employeeId])
    : await sql.query("SELECT * FROM pmec.delivery_assignments WHERE organization_id = $1 ORDER BY updated_at DESC", [organizationId]);
  return (rows as Row[]).map(mapAssignment);
}

export async function getAssignment(organizationId: string, assignmentId: string): Promise<DeliveryAssignment | null> {
  const sql = getDeliverySql();
  const rows = await sql.query("SELECT * FROM pmec.delivery_assignments WHERE organization_id = $1 AND id = $2 LIMIT 1", [organizationId, assignmentId]) as Row[];
  return rows[0] ? mapAssignment(rows[0]) : null;
}

export async function upsertAssignment(organizationId: string, record: DeliveryAssignmentInput): Promise<{ assignment: DeliveryAssignment; isNew: boolean; previousEmployeeId: string | null }> {
  const sql = getDeliverySql();
  const previousRows = await sql.query("SELECT employee_id FROM pmec.delivery_assignments WHERE organization_id = $1 AND id = $2 LIMIT 1", [organizationId, record.id]) as Row[];
  const rows = await sql.query(
    `INSERT INTO pmec.delivery_assignments (
       id, organization_id, job_order_id, job_order_title, task_id, task_title,
       employee_id, employee_name, discipline, status, progress, assigned_by, due_date
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO UPDATE SET
       job_order_id = EXCLUDED.job_order_id,
       job_order_title = EXCLUDED.job_order_title,
       task_id = EXCLUDED.task_id,
       task_title = EXCLUDED.task_title,
       employee_id = EXCLUDED.employee_id,
       employee_name = EXCLUDED.employee_name,
       discipline = EXCLUDED.discipline,
       status = EXCLUDED.status,
       progress = EXCLUDED.progress,
       assigned_by = EXCLUDED.assigned_by,
       due_date = EXCLUDED.due_date,
       updated_at = now()
     WHERE pmec.delivery_assignments.organization_id = EXCLUDED.organization_id
     RETURNING *`,
    [record.id, organizationId, record.jobOrderId, record.jobOrderTitle, record.taskId, record.taskTitle, record.employeeId, record.employeeName, record.discipline, record.status, record.progress, record.assignedBy, record.dueDate ?? null],
  ) as Row[];
  if (!rows[0]) throw new Error("Assignment belongs to a different PMEC organization");
  return {
    assignment: mapAssignment(rows[0]),
    isNew: !previousRows[0],
    previousEmployeeId: previousRows[0]?.employee_id == null ? null : String(previousRows[0].employee_id),
  };
}

export async function updateAssignment(organizationId: string, assignmentId: string, update: Pick<Partial<DeliveryAssignmentInput>, "status" | "progress">): Promise<DeliveryAssignment | null> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    `UPDATE pmec.delivery_assignments
     SET status = COALESCE($3, status), progress = COALESCE($4, progress), updated_at = now()
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    [organizationId, assignmentId, update.status ?? null, update.progress ?? null],
  ) as Row[];
  return rows[0] ? mapAssignment(rows[0]) : null;
}

export async function listTimeLogs(organizationId: string, employeeId?: string): Promise<DeliveryTimeLog[]> {
  const sql = getDeliverySql();
  const rows = employeeId
    ? await sql.query("SELECT * FROM pmec.delivery_time_logs WHERE organization_id = $1 AND employee_id = $2 ORDER BY work_date DESC, created_at DESC", [organizationId, employeeId])
    : await sql.query("SELECT * FROM pmec.delivery_time_logs WHERE organization_id = $1 ORDER BY work_date DESC, created_at DESC", [organizationId]);
  return (rows as Row[]).map(mapTimeLog);
}

export async function getTimeLog(organizationId: string, timeLogId: string): Promise<DeliveryTimeLog | null> {
  const sql = getDeliverySql();
  const rows = await sql.query("SELECT * FROM pmec.delivery_time_logs WHERE organization_id = $1 AND id = $2 LIMIT 1", [organizationId, timeLogId]) as Row[];
  return rows[0] ? mapTimeLog(rows[0]) : null;
}

export async function createTimeLog(organizationId: string, record: DeliveryTimeLogInput): Promise<DeliveryTimeLog> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    `INSERT INTO pmec.delivery_time_logs (
       id, organization_id, assignment_id, employee_id, employee_name, job_order_id,
       task_id, work_date, minutes, note, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [record.id, organizationId, record.assignmentId, record.employeeId, record.employeeName, record.jobOrderId, record.taskId, record.workDate, record.minutes, record.note, record.status ?? "submitted"],
  ) as Row[];
  if (!rows[0]) throw new Error("PMEC time log could not be created");
  return mapTimeLog(rows[0]);
}

export async function reviewTimeLog(organizationId: string, timeLogId: string, status: Extract<DeliveryTimeLogStatus, "approved" | "rejected">, reviewerNote?: string): Promise<DeliveryTimeLog | null> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    `UPDATE pmec.delivery_time_logs
     SET status = $3, reviewer_note = $4, updated_at = now()
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    [organizationId, timeLogId, status, reviewerNote ?? null],
  ) as Row[];
  return rows[0] ? mapTimeLog(rows[0]) : null;
}

export async function listNotifications(organizationId: string, employeeId: string, archived = false): Promise<DeliveryNotification[]> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    `SELECT * FROM pmec.delivery_notifications
     WHERE organization_id = $1 AND employee_id = $2 AND (${archived ? "archived_at IS NOT NULL" : "archived_at IS NULL"})
     ORDER BY created_at DESC`,
    [organizationId, employeeId],
  ) as Row[];
  return rows.map(mapNotification);
}

export async function createNotification(organizationId: string, record: Omit<DeliveryNotification, "readAt" | "archivedAt" | "createdAt">): Promise<DeliveryNotification | null> {
  const preferences = await getNotificationPreferences(organizationId, record.employeeId);
  if ((record.type === "assignment" && !preferences.assignmentsEnabled) || (record.type === "time_approved" && !preferences.timeApprovedEnabled)) return null;
  const sql = getDeliverySql();
  const rows = await sql.query(
    "INSERT INTO pmec.delivery_notifications (id, organization_id, employee_id, type, title, body, route) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [record.id, organizationId, record.employeeId, record.type, record.title, record.body, record.route],
  ) as Row[];
  return rows[0] ? mapNotification(rows[0]) : null;
}

export async function markNotificationRead(organizationId: string, employeeId: string, notificationId: string): Promise<DeliveryNotification | null> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    "UPDATE pmec.delivery_notifications SET read_at = now() WHERE organization_id = $1 AND employee_id = $2 AND id = $3 RETURNING *",
    [organizationId, employeeId, notificationId],
  ) as Row[];
  return rows[0] ? mapNotification(rows[0]) : null;
}

export async function archiveNotification(organizationId: string, employeeId: string, notificationId: string): Promise<DeliveryNotification | null> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    "UPDATE pmec.delivery_notifications SET archived_at = now(), read_at = now() WHERE organization_id = $1 AND employee_id = $2 AND id = $3 RETURNING *",
    [organizationId, employeeId, notificationId],
  ) as Row[];
  return rows[0] ? mapNotification(rows[0]) : null;
}

export async function restoreNotification(organizationId: string, employeeId: string, notificationId: string): Promise<DeliveryNotification | null> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    "UPDATE pmec.delivery_notifications SET archived_at = NULL WHERE organization_id = $1 AND employee_id = $2 AND id = $3 RETURNING *",
    [organizationId, employeeId, notificationId],
  ) as Row[];
  return rows[0] ? mapNotification(rows[0]) : null;
}

export async function getNotificationPreferences(organizationId: string, employeeId: string): Promise<DeliveryNotificationPreferences> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    "SELECT * FROM pmec.delivery_notification_preferences WHERE organization_id = $1 AND employee_id = $2 LIMIT 1",
    [organizationId, employeeId],
  ) as Row[];
  return rows[0] ? mapPreferences(rows[0]) : { employeeId, assignmentsEnabled: true, timeApprovedEnabled: true };
}

export async function updateNotificationPreferences(organizationId: string, employeeId: string, update: Pick<DeliveryNotificationPreferences, "assignmentsEnabled" | "timeApprovedEnabled">): Promise<DeliveryNotificationPreferences> {
  const sql = getDeliverySql();
  const rows = await sql.query(
    `INSERT INTO pmec.delivery_notification_preferences (
       organization_id, employee_id, assignments_enabled, time_approved_enabled
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (organization_id, employee_id) DO UPDATE SET
       assignments_enabled = EXCLUDED.assignments_enabled,
       time_approved_enabled = EXCLUDED.time_approved_enabled,
       updated_at = now()
     RETURNING *`,
    [organizationId, employeeId, update.assignmentsEnabled, update.timeApprovedEnabled],
  ) as Row[];
  if (!rows[0]) throw new Error("PMEC notification preferences could not be saved");
  return mapPreferences(rows[0]);
}
