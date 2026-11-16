import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: importancia de tareas y menú público.
 *
 * Pasos:
 *   1. tasks.priority (HIGHEST | HIGH | MEDIUM | LOW, por defecto MEDIUM).
 *   2. menu_items.is_public (visible para invitados; oculto por defecto).
 *
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-priority-public-menu.ts
 */
async function main() {
  console.log("Migrando importancia de tareas y menú público...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  async function hasColumn(table: string, column: string): Promise<boolean> {
    const rows = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(${table})`));
    return rows.some((r) => r.name === column);
  }

  const columns: { table: string; column: string; ddl: string }[] = [
    { table: "tasks", column: "priority", ddl: "ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'MEDIUM' NOT NULL" },
    { table: "menu_items", column: "is_public", ddl: "ALTER TABLE menu_items ADD COLUMN is_public integer DEFAULT false NOT NULL" },
  ];

  for (const c of columns) {
    if (await hasColumn(c.table, c.column)) {
      console.log(`  ${c.table}.${c.column} ya existe.`);
    } else {
      await db.run(sql.raw(c.ddl));
      console.log(`  ${c.table}.${c.column} creada.`);
    }
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
