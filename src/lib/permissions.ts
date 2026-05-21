import { db } from "@/db";
import { userRoles, roles, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Recupera todas las claves de permisos asignadas a un usuario a través de sus roles.
 * @param userId ID del usuario
 * @returns Array de strings con las claves de los permisos deduplicados.
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const results = await db
      .select({
        permissionKey: permissions.key,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))
      .all();

    // Deduplicar permisos
    const permKeys = results.map((r) => r.permissionKey);
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
