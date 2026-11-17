import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: auditoría de respuestas.
 *
 * Pasos:
 *   1. Tabla rsvp_events (familia, estado, quién respondió —delegado o
 *      administrador— y la asistencia de cada integrante en ese momento).
 *   2. Índice por familia.
 *
 * Se lee en Invitados y en el Resumen (permiso families.read): no requiere
 * permisos nuevos. Las respuestas anteriores a esta migración no tienen historial.
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-rsvp-audit.ts
 */
async function main() {
  console.log("Migrando auditoría de respuestas...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS rsvp_events (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    family_id integer NOT NULL REFERENCES families(id) ON DELETE cascade,
    status text NOT NULL,
    actor_user_id integer REFERENCES users(id) ON DELETE set null,
    actor_name text DEFAULT '' NOT NULL,
    actor_kind text NOT NULL,
    attendees text DEFAULT '[]' NOT NULL,
    created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
  )`));
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS rsvp_events_family_idx ON rsvp_events (family_id)`));
  console.log("  rsvp_events lista.");
  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
