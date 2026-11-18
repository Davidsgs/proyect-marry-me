import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente de la invitación virtual (familiares en el exterior).
 *
 *   1. families.is_virtual: la familia sigue la boda en vivo y no cuenta entre
 *      los presenciales.
 *
 * El enlace de la transmisión vive en event_config (clave live_stream_url): no
 * requiere DDL. No usa permisos nuevos (la sección Virtuales usa los de Invitados).
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-virtual-guests.ts
 */
async function main() {
  console.log("Migrando invitación virtual...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  const rows = await db.all<{ name: string }>(sql.raw("PRAGMA table_info(families)"));
  if (rows.some((r) => r.name === "is_virtual")) {
    console.log("  families.is_virtual ya existe.");
  } else {
    await db.run(sql.raw("ALTER TABLE families ADD COLUMN is_virtual integer DEFAULT false NOT NULL"));
    console.log("  families.is_virtual creada.");
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
