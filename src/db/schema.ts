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
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  lastName: text("last_name").default("").notNull(),
  fullname: text("fullname").default("").notNull(),
  familyId: integer("family_id").references((): AnySQLiteColumn => families.id, { onDelete: 'cascade' }),
  role: text("role", { enum: ["ADMIN", "MAIN_GUEST", "GUEST"] }).default("GUEST").notNull(),
  isConfirmed: integer("is_confirmed", { mode: 'boolean' }).default(false),
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
  createdBy: integer("created_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});
