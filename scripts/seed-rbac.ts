import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and } from "drizzle-orm";
import { systemRoles, systemPermissions, rolePermAssignments, BASELINE_ADMIN_PERMS } from "./rbac-catalog";

async function main() {
  console.log("Iniciando sembrado del sistema RBAC...");

  // Import dynamically to ensure dotenv is loaded first
  const { db } = await import("../src/db");
  const { roles, permissions, rolePermissions, userRoles, userPermissions, users, eventConfig } = await import("../src/db/schema");

  // 1. Insertar roles del sistema
  for (const role of systemRoles) {
    const existing = await db.select().from(roles).where(eq(roles.key, role.key)).get();
    if (!existing) {
      await db.insert(roles).values(role);
      console.log(`Rol creado: ${role.key}`);
    } else {
      console.log(`Rol existente: ${role.key}`);
    }
  }

  // 2. Insertar permisos (con descripción). Si ya existe, refresca su descripción.
  for (const perm of systemPermissions) {
    const existing = await db.select().from(permissions).where(eq(permissions.key, perm.key)).get();
    if (!existing) {
      await db.insert(permissions).values(perm);
      console.log(`Permiso creado: ${perm.key}`);
    } else {
      await db.update(permissions)
        .set({ label: perm.label, section: perm.section, description: perm.description })
        .where(eq(permissions.key, perm.key));
      console.log(`Permiso existente (descripción actualizada): ${perm.key}`);
    }
  }

  // Obtener todos los roles y permisos de la base de datos para mapear IDs
  const allRoles = await db.select().from(roles).all();
  const allPerms = await db.select().from(permissions).all();

  const roleMap = new Map(allRoles.map((r) => [r.key, r.id]));
  const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

  // 3. Vincular permisos a roles (asignaciones desde el catálogo compartido).
  // El rol `admin` solo concede el acceso base; el resto de permisos de cada
  // administrador viven en user_permissions (ver paso 4b).
  for (const assignment of rolePermAssignments) {
    const roleId = roleMap.get(assignment.roleKey);
    if (!roleId) continue;

    for (const permKey of assignment.perms) {
      const permId = permMap.get(permKey);
      if (!permId) continue;

      const existing = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permId)
          )
        )
        .get();

      if (!existing) {
        await db.insert(rolePermissions).values({ roleId, permissionId: permId });
        console.log(`Permiso ${permKey} asignado a rol ${assignment.roleKey}`);
      }
    }
  }

  // 3b. Recortar el rol `admin` al acceso base: elimina cualquier permiso extra
  // heredado de un modelo anterior (cuando el rol admin concedía todo). Así el
  // seed converge al modelo de permisos por administrador de forma idempotente.
  const adminRoleId = roleMap.get("admin");
  if (adminRoleId) {
    const baseline = new Set(BASELINE_ADMIN_PERMS);
    for (const perm of allPerms) {
      if (baseline.has(perm.key)) continue;
      await db.delete(rolePermissions).where(
        and(eq(rolePermissions.roleId, adminRoleId), eq(rolePermissions.permissionId, perm.id))
      );
    }
  }

  // 4. Vincular usuarios existentes a sus nuevos roles basados en users.role
  const allUsers = await db.select().from(users).all();
  for (const user of allUsers) {
    let roleKey = "guest";
    if (user.role === "ADMIN") {
      roleKey = "admin";
    } else if (user.role === "MAIN_GUEST") {
      roleKey = "main_guest";
    }

    const roleId = roleMap.get(roleKey);
    if (!roleId) continue;

    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, user.id), eq(userRoles.roleId, roleId)))
      .get();

    if (!existing) {
      await db.insert(userRoles).values({ userId: user.id, roleId });
      console.log(`Usuario ${user.email} vinculado al rol ${roleKey}`);
    }
  }

  // 4b. Dar a cada administrador el set completo de permisos editables en
  // user_permissions, solo si nunca fue configurado (0 filas). Así un admin nuevo
  // arranca con plenos poderes y luego se restringe con los toggles; re-ejecutar
  // el seed NO pisa permisos ya desactivados manualmente.
  const baseline = new Set(BASELINE_ADMIN_PERMS);
  const editablePerms = systemPermissions.filter((p) => !baseline.has(p.key));
  for (const user of allUsers) {
    if (user.role !== "ADMIN") continue;
    const existingDirect = await db.select().from(userPermissions).where(eq(userPermissions.userId, user.id)).all();
    if (existingDirect.length > 0) continue;
    for (const perm of editablePerms) {
      const permId = permMap.get(perm.key);
      if (!permId) continue;
      await db.insert(userPermissions).values({ userId: user.id, permissionId: permId });
    }
    console.log(`Permisos completos sembrados para admin ${user.email}`);
  }

  // 5. Insertar fecha límite inicial de RSVP en event_config
  const existingDeadline = await db.select().from(eventConfig).where(eq(eventConfig.key, "rsvp_deadline")).get();
  if (!existingDeadline) {
    await db.insert(eventConfig).values({
      key: "rsvp_deadline",
      value: "2027-03-01T23:59:00",
    });
    console.log("Fecha límite de RSVP inicial sembrada: 2027-03-01T23:59:00");
  } else {
    console.log("Fecha límite de RSVP ya existe.");
  }

  console.log("Sembrado del sistema RBAC completado de forma idempotente.");
}

main().catch((err) => {
  console.error("Error durante el sembrado RBAC:", err);
  process.exit(1);
});
