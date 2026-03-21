import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const families = sqliteTable("families", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  globalRsvpStatus: text("global_rsvp_status", { enum: ["PENDING", "CONFIRMED", "DECLINED"] }).default("PENDING").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  familyId: integer("family_id").references(() => families.id, { onDelete: 'cascade' }),
  role: text("role", { enum: ["ADMIN", "MAIN_GUEST", "GUEST"] }).default("GUEST").notNull(),
  isConfirmed: integer("is_confirmed", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
