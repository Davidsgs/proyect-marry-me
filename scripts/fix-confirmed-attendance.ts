import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Reparación idempotente de datos: familias «Confirmado» sin nadie que venga.
 *
 * Antes, cambiar el estado de una familia desde el panel no marcaba a sus
 * integrantes, y Mesas (`declined` en src/lib/attendance.ts) los mostraba como
 * «no viene». Un delegado no puede confirmar sin al menos una persona, así que
 * una familia confirmada con cero asistentes solo sale de ese caso: se marcan
 * todos sus integrantes como asistentes. Las familias con al menos un asistente
 * no se tocan (ahí «no viene» puede ser una elección real del delegado).
 *
 * Sin --apply solo lista lo que cambiaría:
 *   npx tsx scripts/fix-confirmed-attendance.ts           # vista previa
 *   npx tsx scripts/fix-confirmed-attendance.ts --apply   # escribe
 */
const WHERE = `family_id IN (
  SELECT f.id FROM families f
  WHERE f.global_rsvp_status = 'CONFIRMED'
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id AND u.is_confirmed = 1)
)`;

async function main() {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  const rows = await db.all<{ family_id: number; family: string; people: number }>(sql.raw(`
    SELECT u.family_id, f.name AS family, COUNT(*) AS people
    FROM users u JOIN families f ON f.id = u.family_id
    WHERE u.${WHERE}
    GROUP BY u.family_id, f.name`));

  if (rows.length === 0) {
    console.log("Nada que reparar: toda familia confirmada tiene al menos un asistente.");
    return;
  }
  for (const r of rows) console.log(`Familia ${r.family_id} «${r.family}»: ${r.people} integrante(s) pasan a «viene».`);

  if (!process.argv.includes("--apply")) {
    console.log("Vista previa. Ejecuta con --apply para guardar.");
    return;
  }
  await db.run(sql.raw(`UPDATE users SET is_confirmed = 1 WHERE ${WHERE}`));
  // La caché de usuarios no vence sola: se renueva con el próximo despliegue o con cualquier cambio en Invitados.
  console.log("Listo. Se verá tras el próximo despliegue o el próximo cambio en Invitados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
