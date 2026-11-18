import { AnySQLiteColumn, integer, sqliteTable, text, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const families = sqliteTable("families", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  alias: text("alias").default("").notNull(),
  globalRsvpStatus: text("global_rsvp_status", { enum: ["PENDING", "CONFIRMED", "DECLINED"] }).default("PENDING").notNull(),
  delegateUserId: integer("delegate_user_id").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  // Las familias marcadas ven en su invitación la nota de celebración para adultos
  // (sin niños). Reemplaza a is_direct_family (lógica inversa), que queda sin uso.
  showAdultsNote: integer("show_adults_note", { mode: 'boolean' }).default(false).notNull(),
  // Invitación virtual (familiares en el exterior): no confirman ni tienen mesa,
  // ven la transmisión en vivo (/dashboard/en-vivo) y no cuentan entre los presenciales.
  isVirtual: integer("is_virtual", { mode: 'boolean' }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  name: text("name").notNull(),
  lastName: text("last_name").default("").notNull(),
  fullname: text("fullname").default("").notNull(),
  // Alias único por persona (src/lib/alias.ts). Nulo solo en filas anteriores a la migración.
  alias: text("alias").unique(),
  familyId: integer("family_id").references((): AnySQLiteColumn => families.id, { onDelete: 'cascade' }),
  tableId: integer("table_id").references((): AnySQLiteColumn => tables.id, { onDelete: 'set null' }),
  role: text("role", { enum: ["ADMIN", "MAIN_GUEST", "GUEST"] }).default("GUEST").notNull(),
  ageCategory: text("age_category", { enum: ["BABY", "CHILD", "ADULT"] }).default("ADULT").notNull(),
  isConfirmed: integer("is_confirmed", { mode: 'boolean' }).default(false),
  // Restricción alimentaria (src/lib/diet.ts). dietaryNote solo con OTHER, ≤20 caracteres.
  dietary: text("dietary", { enum: ["NONE", "VEGETARIAN", "VEGAN", "GLUTEN_FREE", "LACTOSE_FREE", "OTHER"] }).default("NONE").notNull(),
  dietaryNote: text("dietary_note").default("").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull(),
  name: text("name").default("").notNull(),
  capacity: integer("capacity").default(10).notNull(),
  notes: text("notes").default("").notNull(),
  // Área del plano (floor_areas). Nula = primera área. Las posiciones viven en
  // layout_positions (una por alternativa); pos_x/pos_y quedan del plano antiguo.
  areaId: integer("area_id").references((): AnySQLiteColumn => floorAreas.id, { onDelete: 'set null' }),
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
  // Importancia (src/lib/priority.ts): valores en inglés, etiquetas en español.
  priority: text("priority", { enum: ["HIGHEST", "HIGH", "MEDIUM", "LOW"] }).default("MEDIUM").notNull(),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
  completedAt: text("completed_at"),
  completedBy: integer("completed_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdBy: integer("created_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Secciones del cronograma (Pre-boda, Boda, Fiesta…): agrupan actividades y
// pueden llevar su propia fecha ("YYYY-MM-DD"), p. ej. la pre-boda otro día.
export const scheduleSections = sqliteTable("schedule_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  date: text("date"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Cronograma de la boda: cada actividad es un hito de la cronología
// (Titulo + hora), con una sublista de pasos y notas al pie.
export const scheduleActivities = sqliteTable("schedule_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Sección a la que pertenece. Si se borra la sección, queda «Sin sección».
  sectionId: integer("section_id").references((): AnySQLiteColumn => scheduleSections.id, { onDelete: 'set null' }),
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

// Responsables de una actividad: un invitado de la lista (userId) o un nombre
// libre (proveedores sin cuenta). El nombre se guarda siempre, así sigue
// mostrándose aunque se borre al invitado. Los pasos de la actividad pueden
// apuntar a uno de ellos (scheduleTasks.responsibleId).
export const scheduleResponsibles = sqliteTable("schedule_responsibles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => scheduleActivities.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  userId: integer("user_id").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const scheduleTasks = sqliteTable("schedule_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").notNull().references(() => scheduleActivities.id, { onDelete: 'cascade' }),
  label: text("label").notNull(),
  // Detalle del paso (qué hay que hacer exactamente, contactos…).
  description: text("description").default("").notNull(),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
  // Responsable opcional: si se borra el responsable, la tarea queda sin asignar.
  responsibleId: integer("responsible_id").references((): AnySQLiteColumn => scheduleResponsibles.id, { onDelete: 'set null' }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// ─── Menú ────────────────────────────────────────────────────────────────────
// Qué se sirve y en qué momento de la boda. El "momento" es una actividad del
// cronograma (schedule_activities): así el menú y la cronología no divergen.
// activityId nulo = ítem aún sin momento asignado ("Por asignar").
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id").references((): AnySQLiteColumn => scheduleActivities.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["PASAPALO", "ENTRADA", "PRINCIPAL", "ACOMPANAMIENTO", "POSTRE", "BEBIDA", "TORTA", "OTRO"],
  }).default("OTRO").notNull(),
  description: text("description").default("").notNull(),
  // Cantidad estimada a servir (porciones, unidades, botellas…). null = sin definir.
  quantity: integer("quantity"),
  unit: text("unit").default("").notNull(),           // "porciones", "botellas"…
  supplier: text("supplier").default("").notNull(),   // catering, bodega, pastelería…
  notes: text("notes").default("").notNull(),
  // Etiquetas dietéticas, para responder rápido a invitados con restricciones.
  isVegetarian: integer("is_vegetarian", { mode: 'boolean' }).default(false).notNull(),
  isVegan: integer("is_vegan", { mode: 'boolean' }).default(false).notNull(),
  isGlutenFree: integer("is_gluten_free", { mode: 'boolean' }).default(false).notNull(),
  isLactoseFree: integer("is_lactose_free", { mode: 'boolean' }).default(false).notNull(),
  allergens: text("allergens").default("").notNull(), // texto libre: "frutos secos, mariscos"
  // Estado de cierre con el proveedor: idea → confirmado, o descartado.
  status: text("status", { enum: ["IDEA", "CONFIRMED", "DISCARDED"] }).default("IDEA").notNull(),
  // Visible en el menú que ven los invitados. Oculto por defecto; los descartados nunca se muestran.
  isPublic: integer("is_public", { mode: 'boolean' }).default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdBy: integer("created_by").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
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

// ─── Padrinos y cortejo ──────────────────────────────────────────────────────
// Agradecimiento público (en la invitación, solo con sesión) a quienes acompañan
// a los novios. Nombre libre o vinculado a un invitado; el nombre se guarda
// siempre, así se sigue mostrando aunque se borre al invitado.
export const weddingParty = sqliteTable("wedding_party", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  role: text("role").notNull(),                       // "Madrina", "Testigo", "Dama de honor"…
  name: text("name").notNull(),
  userId: integer("user_id").references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }),
  message: text("message").default("").notNull(),   // frase de agradecimiento opcional
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// ─── Planos de mesas ─────────────────────────────────────────────────────────
// Áreas (Salón, Jardín…) con sus mesas y elementos (pista, DJ, mesa dulce…).
// Cada área tiene varias alternativas de distribución con posiciones propias;
// una es la vigente. Los invitados siguen sentados en su mesa: cambiar de
// alternativa solo mueve dónde está dibujada.
export const floorAreas = sqliteTable("floor_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const floorLayouts = sqliteTable("floor_layouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  areaId: integer("area_id").notNull().references(() => floorAreas.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Elementos del plano que no son mesas. Tamaño en px del lienzo.
export const floorElements = sqliteTable("floor_elements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  areaId: integer("area_id").notNull().references(() => floorAreas.id, { onDelete: 'cascade' }),
  kind: text("kind", { enum: ["DANCE_FLOOR", "SWEETS", "DJ", "BAR", "STAGE", "PHOTO", "ENTRANCE", "OTHER"] }).default("OTHER").notNull(),
  label: text("label").default("").notNull(),
  shape: text("shape", { enum: ["RECT", "ROUND"] }).default("RECT").notNull(),
  width: integer("width").default(160).notNull(),
  height: integer("height").default(100).notNull(),
  // Color elegido ("#rrggbb"). Nulo = el color por defecto de su tipo.
  color: text("color"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// Posición de una mesa o de un elemento en una alternativa (uno de los dos ids).
export const layoutPositions = sqliteTable("layout_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  layoutId: integer("layout_id").notNull().references(() => floorLayouts.id, { onDelete: 'cascade' }),
  tableId: integer("table_id").references(() => tables.id, { onDelete: 'cascade' }),
  elementId: integer("element_id").references(() => floorElements.id, { onDelete: 'cascade' }),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
}, (t) => [
  uniqueIndex("layout_positions_table_unique").on(t.layoutId, t.tableId),
  uniqueIndex("layout_positions_element_unique").on(t.layoutId, t.elementId),
]);

// Auditoría de respuestas: una fila por cada confirmación del delegado o cambio
// de estado hecho por un administrador. Solo se agregan filas, nunca se editan.
export const rsvpEvents = sqliteTable("rsvp_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: integer("family_id").notNull().references(() => families.id, { onDelete: 'cascade' }),
  status: text("status", { enum: ["PENDING", "CONFIRMED", "DECLINED"] }).notNull(),
  // Quién lo hizo. Nombre copiado: el historial se lee igual si la persona se borra.
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: 'set null' }),
  actorName: text("actor_name").default("").notNull(),
  actorKind: text("actor_kind", { enum: ["DELEGATE", "ADMIN"] }).notNull(),
  // JSON [{ userId, name, attending }]: asistencia de cada integrante en ese
  // momento. "[]" cuando el administrador solo cambió el estado de la familia.
  attendees: text("attendees").default("[]").notNull(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});
