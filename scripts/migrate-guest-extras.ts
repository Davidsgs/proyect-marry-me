import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente del rediseño del lado invitado.
 *
 * Pasos:
 *   1. families.is_direct_family (familia directa: puede traer niños).
 *   2. users.dietary y users.dietary_note (restricción alimentaria por persona).
 *
 * Los datos de Regalos viven en event_config (claves gift_*): no requieren DDL.
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-guest-extras.ts
 */
async function main() {
  console.log("Migrando extras del lado invitado...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  async function hasColumn(table: string, column: string): Promise<boolean> {
    const rows = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(${table})`));
    return rows.some((r) => r.name === column);
  }

  const columns: { table: string; column: string; ddl: string }[] = [
    { table: "families", column: "is_direct_family", ddl: "ALTER TABLE families ADD COLUMN is_direct_family integer DEFAULT false NOT NULL" },
    { table: "users", column: "dietary", ddl: "ALTER TABLE users ADD COLUMN dietary text DEFAULT 'NONE' NOT NULL" },
    { table: "users", column: "dietary_note", ddl: "ALTER TABLE users ADD COLUMN dietary_note text DEFAULT '' NOT NULL" },
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
