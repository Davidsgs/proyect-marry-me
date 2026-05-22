import { db } from "@/db";
import { userRoles, roles, rolePermissions, permissions, userPermissions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Permiso base "es administrador": se concede vía el rol `admin` y NO es editable
// por usuario (siempre activo). El resto de permisos se conceden por administrador
// en user_permissions y SÍ son editables. Mantener en sync con scripts/rbac-catalog.ts.
export const BASELINE_ADMIN_PERMS = ["admin.dashboard"];

/**
 * Recupera todas las claves de permisos efectivas de un usuario: las heredadas
 * por sus roles MÁS las concedidas directamente al usuario (user_permissions).
 * La edición tipo Discord por administrador escribe en user_permissions, así que
 * ambas fuentes deben unirse aquí.
 * @param userId ID del usuario
 * @returns Array de strings con las claves de los permisos deduplicados.
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const rolePerms = await db
      .select({
        permissionKey: permissions.key,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))
      .all();

    const directPerms = await db
      .select({
        permissionKey: permissions.key,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId))
      .all();

    // Deduplicar permisos de ambas fuentes (rol + directos)
    const permKeys = [...rolePerms, ...directPerms].map((r) => r.permissionKey);
    return Array.from(new Set(permKeys));
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
}

/**
 * Helper para verificar si un conjunto de permisos contiene un permiso específico.
 * @param perms Lista de permisos del usuario
 * @param key Permiso a buscar
 */
export function hasPermission(perms: string[] | undefined, key: string): boolean {
  if (!perms) return false;
  return perms.includes(key);
}
