import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";

async function main() {
  console.log("Iniciando backfill de delegados para familias...");

  const { db } = await import("../src/db");
  const { families, users } = await import("../src/db/schema");

  // 1. Obtener todas las familias
  const allFamilies = await db.select().from(families).all();
  console.log(`Se encontraron ${allFamilies.length} familias.`);

  for (const family of allFamilies) {
    // Buscar los usuarios de la familia
    const familyUsers = await db
      .select()
      .from(users)
      .where(eq(users.familyId, family.id))
      .all();
    
    // Encontrar el primer usuario de la familia con role = 'MAIN_GUEST'
    const mainGuestUser = familyUsers.find(u => u.role === 'MAIN_GUEST');

    if (mainGuestUser) {
      await db
        .update(families)
        .set({ delegateUserId: mainGuestUser.id })
        .where(eq(families.id, family.id));
      console.log(`Familia "${family.name}" (ID ${family.id}) actualizada con delegado ${mainGuestUser.email} (ID ${mainGuestUser.id})`);
    } else {
      console.log(`Familia "${family.name}" (ID ${family.id}) no tiene ningún usuario con rol MAIN_GUEST.`);
    }
  }

  console.log("Backfill de delegados completado.");
}

main().catch((err) => {
  console.error("Error durante el backfill de delegados:", err);
  process.exit(1);
});
