"use server";

import { db } from "@/db";
import { menuItems, scheduleActivities, scheduleSections } from "@/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export type MenuType = "PASAPALO" | "ENTRADA" | "PRINCIPAL" | "ACOMPANAMIENTO" | "POSTRE" | "BEBIDA" | "TORTA" | "OTRO";
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
      // Mismo orden que el cronograma: por sección y, dentro, por posición.
      .leftJoin(scheduleSections, eq(scheduleActivities.sectionId, scheduleSections.id))
      .orderBy(sql`COALESCE(${scheduleSections.sortOrder}, 1000000)`, asc(scheduleActivities.sortOrder), asc(scheduleActivities.id))
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
  revalidatePath("/dashboard"); // menú público de los invitados
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

// Menú para los invitados (solo lectura): ítems marcados como visibles y no
// descartados, agrupados por momento. Nunca expone proveedor, cantidades,
// notas internas ni estado.
export type PublicMenuItem = Pick<MenuItem, "id" | "name" | "type" | "description" | "isVegetarian" | "isVegan" | "isGlutenFree" | "isLactoseFree" | "allergens">;
export type PublicMenuGroup = { id: number | null; title: string; time: string | null; items: PublicMenuItem[] };

export async function getPublicMenu(): Promise<PublicMenuGroup[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Sin sesión");
  const { items, moments } = await fetchMenu();
  const shown = items
    .filter((i) => i.isPublic && i.status !== "DISCARDED")
    .map(({ id, name, type, description, isVegetarian, isVegan, isGlutenFree, isLactoseFree, allergens, activityId }) => ({
      activityId,
      item: { id, name, type, description, isVegetarian, isVegan, isGlutenFree, isLactoseFree, allergens },
    }));
  const groups: PublicMenuGroup[] = moments.map((m) => ({
    id: m.id,
    title: m.title,
    time: m.time,
    items: shown.filter((s) => s.activityId === m.id).map((s) => s.item),
  }));
  const loose = shown.filter((s) => s.activityId === null || !moments.some((m) => m.id === s.activityId));
  if (loose.length) groups.push({ id: null, title: "Y además", time: null, items: loose.map((s) => s.item) });
  return groups.filter((g) => g.items.length > 0);
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
  isPublic?: boolean;
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
    isPublic: data.isPublic ?? false,
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
  if (data.isPublic !== undefined) set.isPublic = data.isPublic;

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

// Muestra u oculta el ítem en el menú de los invitados.
export async function setMenuItemPublic(id: number, isPublic: boolean) {
  await requireWrite();
  await db.update(menuItems).set({ isPublic }).where(eq(menuItems.id, id));
  invalidate();
}

// Muestra a los invitados varios ítems de una vez (p. ej. todos los confirmados).
export async function showMenuItems(ids: number[]) {
  await requireWrite();
  if (ids.length > 0) {
    await db.update(menuItems).set({ isPublic: true }).where(inArray(menuItems.id, ids));
  }
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
