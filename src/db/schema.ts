import { AnySQLiteColumn, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const families = sqliteTable("families", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  alias: text("alias").default("").notNull(),
  globalRsvpStatus: text("global_rsvp_status", { enum: ["PENDING", "CONFIRMED", "DECLINED"] }).default("PENDING").notNull(),
  delegateUserId: integer("delegate_user_id").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  name: text("name").notNull(),
  lastName: text("last_name").default("").notNull(),
  fullname: text("fullname").default("").notNull(),
  familyId: integer("family_id").references((): AnySQLiteColumn => families.id, { onDelete: 'cascade' }),
  tableId: integer("table_id").references((): AnySQLiteColumn => tables.id, { onDelete: 'set null' }),
  role: text("role", { enum: ["ADMIN", "MAIN_GUEST", "GUEST"] }).default("GUEST").notNull(),
  ageCategory: text("age_category", { enum: ["BABY", "CHILD", "ADULT"] }).default("ADULT").notNull(),
  isConfirmed: integer("is_confirmed", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull(),
  name: text("name").default("").notNull(),
  capacity: integer("capacity").default(10).notNull(),
  notes: text("notes").default("").notNull(),
  posX: integer("pos_x"),
  posY: integer("pos_y"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),        // ej: "admin", "main_guest", "guest", "wedding_planner"
  label: text("label").notNull(),             // ej: "Administrador"
  isSystem: integer("is_system", { mode: 'boolean' }).default(false).notNull(), // no borrable
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),        // ej: "calendar.read", "tasks.write", "rsvp.confirm_own_family"
  label: text("label").notNull(),
  // Descripción tipo Discord: explica qué habilita el permiso. Se muestra junto
  // al toggle en el editor de permisos por administrador.
  description: text("description").default("").notNull(),
  section: text("section").notNull(),         // ej: "calendar", "tasks", "whiteboard", "rsvp", "users"
});

export const rolePermissions = sqliteTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) }));

export const userRoles = sqliteTable("user_roles", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) }));

// Permisos otorgados directamente a un usuario, además de los heredados por sus
// roles. Habilita la edición tipo Discord (toggle on/off por administrador): el
// rol "admin" solo concede el acceso base (admin.dashboard) y cada permiso extra
// se concede aquí por usuario. getUserPermissions une rol + estos.
export const userPermissions = sqliteTable("user_permissions", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.permissionId] }) }));

export const eventConfig = sqliteTable("event_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  dueDate: text("due_date"),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
  completedAt: text("completed_at"),
  completedBy: integer("completed_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdBy: integer("created_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Cronograma del día de la boda: cada actividad es un hito de la cronología
// (Titulo + hora), con una sublista de tareas (solo checkboxes) y notas al pie.
export const scheduleActivities = sqliteTable("schedule_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  time: text("time"),                                  // "HH:MM" o null
  notes: text("notes").default("").notNull(),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
  completedAt: text("completed_at"),
  // Posición dentro de la cronología. El drag & drop reescribe este campo;
  // las completadas conservan su lugar (se grisean, no se mueven al fondo).
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Responsables de una actividad: solo nombres. Las tareas de la actividad
// pueden apuntar a uno de ellos (scheduleTasks.responsibleId).
export const scheduleResponsibles = sqliteTable("schedule_responsibles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => scheduleActivities.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const scheduleTasks = sqliteTable("schedule_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => scheduleActivities.id, { onDelete: 'cascade' }),
  label: text("label").notNull(),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
  // Responsable opcional: si se borra el responsable, la tarea queda sin asignar.
  responsibleId: integer("responsible_id").references((): AnySQLiteColumn => scheduleResponsibles.id, { onDelete: 'set null' }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// ─── Economía ────────────────────────────────────────────────────────────────
// Importes SIEMPRE en centavos (entero) para evitar errores de coma flotante.
// El formateo a "$ 1.234,56" (ARS, es-AR) vive en src/lib/money.ts.

// Movimientos sueltos: un ingreso o egreso puntual.
export const financeTransactions = sqliteTable("finance_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(),
  concept: text("concept").notNull(),
  category: text("category").default("").notNull(),
  amountCents: integer("amount_cents").notNull(),
  date: text("date"),                                  // fecha del movimiento (ISO "YYYY-MM-DD") o null
  notes: text("notes").default("").notNull(),
  createdBy: integer("created_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Plan de pago en cuotas: cabecera (concepto + total + nº de cuotas). Las cuotas
// individuales viven en finance_installments y dan la trazabilidad de cada pago.
export const financeInstallmentPlans = sqliteTable("finance_installment_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["INCOME", "EXPENSE"] }).default("EXPENSE").notNull(),
  concept: text("concept").notNull(),
  category: text("category").default("").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  installmentsCount: integer("installments_count").notNull(),
  notes: text("notes").default("").notNull(),
  createdBy: integer("created_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Cada cuota de un plan: importe, vencimiento y estado de pago (quién y cuándo).
export const financeInstallments = sqliteTable("finance_installments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull().references(() => financeInstallmentPlans.id, { onDelete: 'cascade' }),
  number: integer("number").notNull(),                 // 1..N dentro del plan
  amountCents: integer("amount_cents").notNull(),
  dueDate: text("due_date"),                           // vencimiento (ISO "YYYY-MM-DD") o null
  isPaid: integer("is_paid", { mode: 'boolean' }).default(false).notNull(),
  paidAt: text("paid_at"),
  paidBy: integer("paid_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
