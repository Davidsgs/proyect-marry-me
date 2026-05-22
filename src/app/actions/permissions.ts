"use server";

import { db } from "@/db";
import { users, permissions, userPermissions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { hasPermission, BASELINE_ADMIN_PERMS } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export interface PermissionDef {
  id: number;
  key: string;
  label: string;
  description: string;
  section: string;
}

export interface AdminWithPermissions {
  id: number;
  name: string;
  fullname: string;
  email: string | null;
  permissionKeys: string[];
}

// Permisos base (no editables): se conceden vía el rol `admin` y siempre están
// activos. Se ocultan de los toggles para evitar bloquear el acceso al panel.
const BASELINE = new Set(BASELINE_ADMIN_PERMS);

/** Catálogo de permisos editables, ordenado por sección. Gated por settings.write. */
export async function getEditablePermissions(): Promise<PermissionDef[]> {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    throw new Error("Sin permisos");
  }
  const all = await db.select().from(permissions).all();
  return all
    .filter((p) => !BASELINE.has(p.key))
    .sort((a, b) => a.section.localeCompare(b.section) || a.key.localeCompare(b.key));
}

/** Lista de administradores con sus permisos directos. Gated por settings.write. */
export async function getAdminsWithPermissions(): Promise<AdminWithPermissions[]> {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    throw new Error("Sin permisos");
  }

  const admins = await db.select().from(users).where(eq(users.role, "ADMIN")).all();

  const grants = await db
    .select({ userId: userPermissions.userId, key: permissions.key })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .all();

  const byUser = new Map<number, string[]>();
  for (const g of grants) {
    const list = byUser.get(g.userId) ?? [];
    list.push(g.key);
    byUser.set(g.userId, list);
  }

  return admins.map((a) => ({
    id: a.id,
    name: a.name,
    fullname: a.fullname || a.name,
    email: a.email,
    permissionKeys: byUser.get(a.id) ?? [],
  }));
}

/**
 * Activa o desactiva un permiso para un administrador concreto.
 * Guardas: no permite tocar permisos base, ni que un admin se quite a sí mismo
 * settings.write (evita autobloqueo del editor de permisos).
 */
export async function setUserPermission(
  targetUserId: number,
  permissionKey: string,
  enabled: boolean
): Promise<void> {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    throw new Error("Sin permisos");
  }

  if (BASELINE.has(permissionKey)) {
    throw new Error("Permiso base no editable");
  }

  // Anti-autobloqueo: no puedes quitarte settings.write a ti mismo.
  const selfId = session?.user?.id as number | undefined;
  if (selfId === targetUserId && permissionKey === "settings.write" && !enabled) {
    throw new Error("No puedes quitarte tu propio permiso de Ajustes");
  }

  const target = await db.select().from(users).where(eq(users.id, targetUserId)).get();
  if (!target || target.role !== "ADMIN") {
    throw new Error("El usuario no es administrador");
  }

  const perm = await db.select().from(permissions).where(eq(permissions.key, permissionKey)).get();
  if (!perm) {
    throw new Error("Permiso desconocido");
  }

  if (enabled) {
    const existing = await db
      .select()
      .from(userPermissions)
      .where(and(eq(userPermissions.userId, targetUserId), eq(userPermissions.permissionId, perm.id)))
      .get();
    if (!existing) {
      await db.insert(userPermissions).values({ userId: targetUserId, permissionId: perm.id });
    }
  } else {
    await db
      .delete(userPermissions)
      .where(and(eq(userPermissions.userId, targetUserId), eq(userPermissions.permissionId, perm.id)));
  }

  revalidatePath("/admin/settings");
}
