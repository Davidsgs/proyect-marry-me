import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: la nota de celebración sin niños pasa a mostrarse solo
 * a las familias marcadas (antes, a todas las que no eran «familia directa»).
 *
 *   1. families.show_adults_note (false para todas: nadie ve la nota hasta
 *      marcarla en Invitados).
 *
 * families.is_direct_family queda en la base sin uso.
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-adults-note.ts
 */
async function main() {
  console.log("Migrando nota sin niños...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  const rows = await db.all<{ name: string }>(sql.raw("PRAGMA table_info(families)"));
  if (rows.some((r) => r.name === "show_adults_note")) {
    console.log("  families.show_adults_note ya existe.");
  } else {
    await db.run(sql.raw("ALTER TABLE families ADD COLUMN show_adults_note integer DEFAULT false NOT NULL"));
    console.log("  families.show_adults_note creada.");
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
