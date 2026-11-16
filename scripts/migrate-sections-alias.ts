import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: alias por persona y secciones del cronograma.
 *
 * Pasos:
 *   1. users.alias + índice único; genera un alias a quien no tenga
 *      («José Pérez» → jose-perez, jose-perez-2 si ya existe).
 *   2. Tabla schedule_sections (nombre, fecha opcional, orden).
 *   3. schedule_activities.section_id (FK, ON DELETE SET NULL).
 *   4. schedule_tasks.description (detalle del paso).
 *   5. schedule_responsibles.user_id (responsable vinculado a un invitado).
 *   6. Si no hay secciones, crea «Boda» (fecha de la boda) y le asigna las
 *      actividades existentes.
 *
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-sections-alias.ts
 */
async function main() {
  console.log("Migrando alias y secciones del cronograma...");

  const { sql, isNull, eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { users, scheduleSections, scheduleActivities } = await import("../src/db/schema");
  const { slugifyAlias, uniqueAlias } = await import("../src/lib/alias");
  const { WEDDING_DATE_ISO } = await import("../src/lib/wedding");

  async function hasColumn(table: string, column: string): Promise<boolean> {
    const rows = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(${table})`));
    return rows.some((r) => r.name === column);
  }

  async function addColumn(table: string, column: string, ddl: string) {
    if (await hasColumn(table, column)) {
      console.log(`  ${table}.${column} ya existe.`);
    } else {
      await db.run(sql.raw(ddl));
      console.log(`  ${table}.${column} creada.`);
    }
  }

  // 1. Alias
  await addColumn("users", "alias", "ALTER TABLE users ADD COLUMN alias text");
  await db.run(sql.raw("CREATE UNIQUE INDEX IF NOT EXISTS users_alias_unique ON users (alias)"));

  const all = await db.select({ id: users.id, alias: users.alias, name: users.name, lastName: users.lastName, fullname: users.fullname }).from(users).all();
  const taken = new Set(all.map((u) => u.alias).filter((a): a is string => !!a));
  const missing = all.filter((u) => !u.alias).sort((a, b) => a.id - b.id);
  if (missing.length > 0) {
    const updates = missing.map((u) => {
      const alias = uniqueAlias(slugifyAlias(u.fullname || `${u.name} ${u.lastName}`), taken);
      return db.update(users).set({ alias }).where(eq(users.id, u.id));
    });
    const [first, ...rest] = updates;
    await db.batch([first, ...rest]);
    console.log(`  Alias generados: ${missing.length}.`);
  } else {
    console.log("  Todos los invitados ya tienen alias.");
  }

  // 2–5. Cronograma
  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS schedule_sections (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    date text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
  )`));
  console.log("  schedule_sections lista.");
  await addColumn("schedule_activities", "section_id", "ALTER TABLE schedule_activities ADD COLUMN section_id integer REFERENCES schedule_sections(id) ON DELETE set null");
  await addColumn("schedule_tasks", "description", "ALTER TABLE schedule_tasks ADD COLUMN description text DEFAULT '' NOT NULL");
  await addColumn("schedule_responsibles", "user_id", "ALTER TABLE schedule_responsibles ADD COLUMN user_id integer REFERENCES users(id) ON DELETE set null");

  // 6. Sección inicial
  const sections = await db.select().from(scheduleSections).all();
  if (sections.length === 0) {
    const [boda] = await db.insert(scheduleSections).values({ name: "Boda", date: WEDDING_DATE_ISO.slice(0, 10), sortOrder: 0 }).returning();
    const res = await db.update(scheduleActivities).set({ sectionId: boda.id }).where(isNull(scheduleActivities.sectionId)).returning({ id: scheduleActivities.id });
    console.log(`  Sección «Boda» creada con ${res.length} actividades.`);
  } else {
    console.log(`  Ya hay ${sections.length} secciones.`);
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
