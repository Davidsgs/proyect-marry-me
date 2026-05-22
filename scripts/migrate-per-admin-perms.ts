import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and, inArray } from "drizzle-orm";
import { systemPermissions, BASELINE_ADMIN_PERMS } from "./rbac-catalog";

/**
 * Migración idempotente al modelo de "permisos por administrador" (estilo Discord).
 *
 * Antes: el rol `admin` concedía TODOS los permisos a todos los administradores.
 * Después: el rol `admin` solo concede el acceso base (admin.dashboard) y cada
 * permiso extra se concede por usuario en user_permissions, de modo que se puede
 * activar/desactivar por cada administrador.
 *
 * Pasos:
 *   1. DDL idempotente: añade permissions.description y crea user_permissions.
 *   2. Refresca las descripciones de los permisos desde el catálogo.
 *   3. Copia los permisos efectivos actuales de cada admin a user_permissions
 *      (así nada cambia de cara al usuario), ANTES de recortar el rol.
 *   4. Recorta el rol `admin` para que solo conceda el acceso base.
 *
 * Re-ejecutable sin efectos secundarios.
 */
async function main() {
  console.log("Migrando a permisos por administrador...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { roles, permissions, rolePermissions, userRoles, userPermissions, users } = await import("../src/db/schema");

  // 1. DDL idempotente -------------------------------------------------------
  const cols = await db.all(sql`PRAGMA table_info(permissions)`);
  const hasDescription = (cols as Array<{ name: string }>).some((c) => c.name === "description");
  if (!hasDescription) {
    await db.run(sql`ALTER TABLE permissions ADD COLUMN description text DEFAULT '' NOT NULL`);
    console.log("Columna permissions.description añadida.");
  } else {
    console.log("Columna permissions.description ya existe.");
  }

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_id integer NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, permission_id)
    )
  `);
  console.log("Tabla user_permissions lista.");

  // 2. Refrescar descripciones ----------------------------------------------
  for (const perm of systemPermissions) {
    await db.update(permissions)
      .set({ label: perm.label, section: perm.section, description: perm.description })
      .where(eq(permissions.key, perm.key));
  }
  console.log("Descripciones de permisos actualizadas.");

  // IDs de roles/permisos
  const adminRole = await db.select().from(roles).where(eq(roles.key, "admin")).get();
  if (!adminRole) {
    console.error("Rol 'admin' inexistente. Ejecuta primero: npx tsx scripts/seed-rbac.ts");
    process.exit(1);
  }
  const allPerms = await db.select().from(permissions).all();
  const permIdByKey = new Map(allPerms.map((p) => [p.key, p.id]));
  const baselineSet = new Set(BASELINE_ADMIN_PERMS);
  const baselineIds = BASELINE_ADMIN_PERMS
    .map((k) => permIdByKey.get(k))
    .filter((id): id is number => typeof id === "number");

  // 3. Copiar permisos efectivos de cada admin a user_permissions ------------
  // (se hace ANTES de recortar el rol, mientras el rol aún concede todo)
  const adminUsers = await db.select().from(users).where(eq(users.role, "ADMIN")).all();
  for (const user of adminUsers) {
    // Permisos efectivos actuales vía roles del usuario.
    const effective = await db
      .select({ key: permissions.key, id: permissions.id })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, user.id))
      .all();

    const toGrant = effective.filter((p) => !baselineSet.has(p.key));
    for (const p of toGrant) {
      const existing = await db
        .select()
        .from(userPermissions)
        .where(and(eq(userPermissions.userId, user.id), eq(userPermissions.permissionId, p.id)))
        .get();
      if (!existing) {
        await db.insert(userPermissions).values({ userId: user.id, permissionId: p.id });
      }
    }
    console.log(`Permisos copiados a user_permissions para admin ${user.email} (${toGrant.length}).`);
  }

  // 4. Recortar el rol `admin` al acceso base --------------------------------
  // Asegurar que la baseline esté presente en el rol.
  for (const baseId of baselineIds) {
    const existing = await db
      .select()
      .from(rolePermissions)
      .where(and(eq(rolePermissions.roleId, adminRole.id), eq(rolePermissions.permissionId, baseId)))
      .get();
    if (!existing) {
      await db.insert(rolePermissions).values({ roleId: adminRole.id, permissionId: baseId });
    }
  }
  // Eliminar del rol todo lo que no sea baseline.
  if (baselineIds.length > 0) {
    const toRemove = allPerms.filter((p) => !baselineSet.has(p.key)).map((p) => p.id);
    if (toRemove.length > 0) {
      await db.delete(rolePermissions).where(
        and(eq(rolePermissions.roleId, adminRole.id), inArray(rolePermissions.permissionId, toRemove))
      );
    }
  }
  console.log("Rol 'admin' recortado al acceso base (admin.dashboard).");

  console.log("Migración completada. Los administradores conservan sus permisos; ahora son editables.");
}

main().catch((err) => {
  console.error("Error en la migración:", err);
  process.exit(1);
});
