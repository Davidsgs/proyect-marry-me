import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: padrinos y cortejo.
 *
 * Pasos:
 *   1. Tabla wedding_party (papel, nombre, invitado vinculado opcional,
 *      frase de agradecimiento y orden).
 *
 * Se edita en Ajustes (permiso settings.write): no requiere permisos nuevos.
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-wedding-party.ts
 */
async function main() {
  console.log("Migrando padrinos y cortejo...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS wedding_party (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    role text NOT NULL,
    name text NOT NULL,
    user_id integer REFERENCES users(id) ON DELETE set null,
    message text DEFAULT '' NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
  )`));
  console.log("  wedding_party lista.");
  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
