import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and } from "drizzle-orm";

/**
 * Migración idempotente de la sección Menú.
 *
 * Pasos:
 *   1. DDL: crea menu_items (CREATE TABLE IF NOT EXISTS). activity_id apunta a
 *      schedule_activities: el "momento" de la boda en que se sirve el ítem.
 *   2. Inserta los permisos menu.read / menu.write si faltan (y refresca su
 *      label/descripción desde el catálogo).
 *   3. Concede ambos permisos a todos los administradores existentes, para que
 *      la sección aparezca de inmediato (se pueden quitar luego con los toggles).
 *
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-menu.ts
 */
async function main() {
  console.log("Migrando sección Menú...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { permissions, users, userPermissions } = await import("../src/db/schema");

  // 1. DDL idempotente -------------------------------------------------------
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      activity_id integer REFERENCES schedule_activities(id) ON DELETE SET NULL,
      name text NOT NULL,
      type text DEFAULT 'OTRO' NOT NULL,
      description text DEFAULT '' NOT NULL,
      quantity integer,
      unit text DEFAULT '' NOT NULL,
      supplier text DEFAULT '' NOT NULL,
      notes text DEFAULT '' NOT NULL,
      is_vegetarian integer DEFAULT false NOT NULL,
      is_vegan integer DEFAULT false NOT NULL,
      is_gluten_free integer DEFAULT false NOT NULL,
      is_lactose_free integer DEFAULT false NOT NULL,
      allergens text DEFAULT '' NOT NULL,
      status text DEFAULT 'IDEA' NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      created_by integer REFERENCES users(id) ON DELETE SET NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
      updated_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )
  `);
  console.log("Tabla menu_items lista.");

  // 2. Permisos --------------------------------------------------------------
  const menuPerms = [
    { key: "menu.read", label: "Leer Menú", section: "menu", description: "Ver el menú de la boda: pasapalos, platos, bebidas y en qué momento se sirven." },
    { key: "menu.write", label: "Escribir/Modificar Menú", section: "menu", description: "Crear, editar, reordenar y eliminar ítems del menú; asignarlos a un momento del cronograma." },
  ];
  for (const perm of menuPerms) {
    const existing = await db.select().from(permissions).where(eq(permissions.key, perm.key)).get();
    if (!existing) {
      await db.insert(permissions).values(perm);
      console.log(`Permiso creado: ${perm.key}`);
    } else {
      await db.update(permissions)
        .set({ label: perm.label, section: perm.section, description: perm.description })
        .where(eq(permissions.key, perm.key));
      console.log(`Permiso existente (refrescado): ${perm.key}`);
    }
  }

  // 3. Conceder a administradores existentes ----------------------------------
  const permRows = await db.select().from(permissions)
    .where(eq(permissions.section, "menu")).all();
  const adminUsers = await db.select().from(users).where(eq(users.role, "ADMIN")).all();
  for (const user of adminUsers) {
    for (const perm of permRows) {
      const existing = await db.select().from(userPermissions)
        .where(and(eq(userPermissions.userId, user.id), eq(userPermissions.permissionId, perm.id)))
        .get();
      if (!existing) {
        await db.insert(userPermissions).values({ userId: user.id, permissionId: perm.id });
      }
    }
    console.log(`Permisos de Menú concedidos a admin ${user.email}`);
  }

  console.log("Migración de Menú completada.");
}

main().catch((err) => {
  console.error("Error en la migración de Menú:", err);
  process.exit(1);
});
