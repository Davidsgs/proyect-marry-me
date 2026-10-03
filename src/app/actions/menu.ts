"use server";

import { db } from "@/db";
import { menuItems, scheduleActivities } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export type MenuType = "PASAPALO" | "ENTRADA" | "PRINCIPAL" | "POSTRE" | "BEBIDA" | "TORTA" | "OTRO";
export type MenuStatus = "IDEA" | "CONFIRMED" | "DISCARDED";

export type MenuItem = typeof menuItems.$inferSelect;

// Momento de la boda = actividad del cronograma. Solo se necesitan estos campos
// para agrupar el menú; el detalle vive en la sección Cronograma.
export type MenuMoment = { id: number; title: string; time: string | null; sortOrder: number };

export type MenuData = {
  items: MenuItem[];
  moments: MenuMoment[];
};

// ─── Lecturas (cacheadas, tag "menu") ────────────────────────────────────────
// El tag "schedule" también invalida esta caché: si cambian las actividades del
// cronograma, los momentos del menú deben reflejarlo.
const fetchMenu = unstable_cache(
  async (): Promise<MenuData> => {
    const items = await db
      .select()
      .from(menuItems)
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.id))
      .all();
    const moments = await db
      .select({
        id: scheduleActivities.id,
        title: scheduleActivities.title,
        time: scheduleActivities.time,
        sortOrder: scheduleActivities.sortOrder,
      })
      .from(scheduleActivities)
      .orderBy(asc(scheduleActivities.sortOrder), asc(scheduleActivities.id))
      .all();
    return { items, moments };
  },
  ["menu"],
  { tags: ["menu", "schedule"] },
);

function invalidate() {
  updateTag("menu");
  revalidatePath("/admin/menu");
  revalidatePath("/admin");
}

async function requireRead() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "menu.read")) throw new Error("Sin permisos");
  return session;
}

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "menu.write")) throw new Error("Sin permisos");
  return session;
}

export async function getMenu(): Promise<MenuData> {
  await requireRead();
  return await fetchMenu();
}

// Resumen para el dashboard: cuántos ítems hay, cuántos cerrados con el
// proveedor y cuántos siguen sin momento asignado.
export async function getMenuSummary() {
  await requireRead();
  const { items } = await fetchMenu();
  const active = items.filter((i) => i.status !== "DISCARDED");
  return {
    total: active.length,
    confirmed: active.filter((i) => i.status === "CONFIRMED").length,
    unassigned: active.filter((i) => i.activityId === null).length,
    drinks: active.filter((i) => i.type === "BEBIDA").length,
  };
}

// ─── Escrituras ──────────────────────────────────────────────────────────────

type ItemInput = {
  name: string;
  type: MenuType;
  activityId?: number | null;
  description?: string;
  quantity?: number | null;
  unit?: string;
  supplier?: string;
  notes?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  allergens?: string;
  status?: MenuStatus;
};

export async function createMenuItem(data: ItemInput) {
  const session = await requireWrite();
  if (!data.name?.trim()) throw new Error("El nombre es obligatorio");
  if (data.quantity != null && (!Number.isFinite(data.quantity) || data.quantity < 0)) {
    throw new Error("La cantidad no puede ser negativa");
  }

  // Nuevo ítem al final de su momento (o del bloque "Por asignar").
  const last = await db
    .select({ max: sql<number>`COALESCE(MAX(${menuItems.sortOrder}), -1)` })
    .from(menuItems)
    .get();

  await db.insert(menuItems).values({
    activityId: data.activityId ?? null,
    name: data.name.trim(),
    type: data.type,
    description: data.description?.trim() || "",
    quantity: data.quantity ?? null,
    unit: data.unit?.trim() || "",
    supplier: data.supplier?.trim() || "",
    notes: data.notes?.trim() || "",
    isVegetarian: data.isVegetarian ?? false,
    isVegan: data.isVegan ?? false,
    isGlutenFree: data.isGlutenFree ?? false,
    isLactoseFree: data.isLactoseFree ?? false,
    allergens: data.allergens?.trim() || "",
    status: data.status ?? "IDEA",
    sortOrder: (last?.max ?? -1) + 1,
    createdBy: session?.user?.id ? Number(session.user.id) : null,
  });
  invalidate();
}

export async function updateMenuItem(id: number, data: Partial<ItemInput>) {
  await requireWrite();
  const set: Record<string, unknown> = {};
  if (data.name !== undefined) {
    if (!data.name.trim()) throw new Error("El nombre es obligatorio");
    set.name = data.name.trim();
  }
  if (data.type !== undefined) set.type = data.type;
  if (data.activityId !== undefined) set.activityId = data.activityId ?? null;
  if (data.description !== undefined) set.description = data.description.trim();
  if (data.quantity !== undefined) {
    if (data.quantity != null && (!Number.isFinite(data.quantity) || data.quantity < 0)) {
      throw new Error("La cantidad no puede ser negativa");
    }
    set.quantity = data.quantity ?? null;
  }
  if (data.unit !== undefined) set.unit = data.unit.trim();
  if (data.supplier !== undefined) set.supplier = data.supplier.trim();
  if (data.notes !== undefined) set.notes = data.notes.trim();
  if (data.isVegetarian !== undefined) set.isVegetarian = data.isVegetarian;
  if (data.isVegan !== undefined) set.isVegan = data.isVegan;
  if (data.isGlutenFree !== undefined) set.isGlutenFree = data.isGlutenFree;
  if (data.isLactoseFree !== undefined) set.isLactoseFree = data.isLactoseFree;
  if (data.allergens !== undefined) set.allergens = data.allergens.trim();
  if (data.status !== undefined) set.status = data.status;

  if (Object.keys(set).length > 0) {
    await db.update(menuItems).set(set).where(eq(menuItems.id, id));
  }
  invalidate();
}

export async function deleteMenuItem(id: number) {
  await requireWrite();
  await db.delete(menuItems).where(eq(menuItems.id, id));
  invalidate();
}

export async function setMenuItemStatus(id: number, status: MenuStatus) {
  await requireWrite();
  await db.update(menuItems).set({ status }).where(eq(menuItems.id, id));
  invalidate();
}

// Mueve un ítem a otro momento del cronograma (o lo deja sin asignar).
export async function assignMenuItemMoment(id: number, activityId: number | null) {
  await requireWrite();
  await db.update(menuItems).set({ activityId }).where(eq(menuItems.id, id));
  invalidate();
}

// Reordena por drag & drop. Recibe los ids en el orden final GLOBAL (todos los
// momentos concatenados), así el sortOrder queda consistente entre grupos.
export async function reorderMenuItems(orderedIds: number[]) {
  await requireWrite();
  if (orderedIds.length > 0) {
    // Un solo viaje a la base para todo el reordenado.
    const [first, ...rest] = orderedIds.map((itemId, i) =>
      db.update(menuItems).set({ sortOrder: i }).where(eq(menuItems.id, itemId)),
    );
    await db.batch([first, ...rest]);
  }
  invalidate();
}

// Drag & drop entre momentos: cambia el momento del ítem arrastrado y reescribe
// el orden global en una sola llamada, para no dejar estados intermedios raros.
export async function moveMenuItem(id: number, activityId: number | null, orderedIds: number[]) {
  await requireWrite();
  await db.batch([
    db.update(menuItems).set({ activityId }).where(eq(menuItems.id, id)),
    ...orderedIds.map((itemId, i) =>
      db.update(menuItems).set({ sortOrder: i }).where(eq(menuItems.id, itemId)),
    ),
  ]);
  invalidate();
}
