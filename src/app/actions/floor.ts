"use server";

import { db } from "@/db";
import { floorAreas, floorElements, floorLayouts, layoutPositions, tables } from "@/db/schema";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

// Planos de mesas: áreas → alternativas (una vigente) → posiciones de mesas y
// elementos. Lecturas cacheadas con el tag "floor". Los borrados limpian a mano
// las filas dependientes: no se confía en las cascadas de la base (ver deleteTable).
export type FloorArea = typeof floorAreas.$inferSelect;
export type FloorLayout = typeof floorLayouts.$inferSelect;
export type FloorElement = typeof floorElements.$inferSelect;
export type LayoutPosition = typeof layoutPositions.$inferSelect;
export type ElementKind = FloorElement["kind"];
export type ElementShape = FloorElement["shape"];
export type FloorPlan = { areas: FloorArea[]; layouts: FloorLayout[]; elements: FloorElement[]; positions: LayoutPosition[] };

const fetchFloor = unstable_cache(
    async (): Promise<FloorPlan> => {
        const [areas, layouts, elements, positions] = await db.batch([
            db.select().from(floorAreas).orderBy(asc(floorAreas.sortOrder), asc(floorAreas.id)),
            db.select().from(floorLayouts).orderBy(asc(floorLayouts.sortOrder), asc(floorLayouts.id)),
            db.select().from(floorElements).orderBy(asc(floorElements.id)),
            db.select().from(layoutPositions),
        ]);
        return { areas, layouts, elements, positions };
    },
    ["floor-plan"],
    { tags: ["floor"] },
);

async function requireRead() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.read")) throw new Error("Sin permisos");
}

async function requireWrite() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) throw new Error("Sin permisos");
}

function invalidate() {
    updateTag("floor");
    revalidatePath("/admin/tables");
}

const cleanName = (name: string, what: string) => {
    const n = name.trim().slice(0, 60);
    if (!n) throw new Error(`${what} necesita un nombre`);
    return n;
};
const clampSize = (v: number) => Math.min(1200, Math.max(40, Math.round(v)));
const clampPos = (v: number) => Math.min(5000, Math.max(0, Math.round(v)));

export async function getFloorPlan(): Promise<FloorPlan> {
    await requireRead();
    return await fetchFloor();
}

// ── Áreas ─────────────────────────────────────────────────────────────────

/** Crea un área con su primera alternativa («Principal», vigente). */
export async function createArea(name: string) {
    await requireWrite();
    const max = await db.select({ v: sql<number>`COALESCE(MAX(${floorAreas.sortOrder}), -1)` }).from(floorAreas).get();
    const [area] = await db.insert(floorAreas).values({ name: cleanName(name, "El área"), sortOrder: (max?.v ?? -1) + 1 }).returning();
    await db.insert(floorLayouts).values({ areaId: area.id, name: "Principal", isActive: true });
    invalidate();
    return area.id;
}

export async function renameArea(id: number, name: string) {
    await requireWrite();
    await db.update(floorAreas).set({ name: cleanName(name, "El área") }).where(eq(floorAreas.id, id));
    invalidate();
}

/** Borra el área, sus alternativas y elementos. Sus mesas no se borran: pasan a la primera área. */
export async function deleteArea(id: number) {
    await requireWrite();
    const all = await db.select({ id: floorAreas.id }).from(floorAreas).all();
    if (all.length <= 1) throw new Error("Tiene que quedar al menos un área");
    const layoutIds = (await db.select({ id: floorLayouts.id }).from(floorLayouts).where(eq(floorLayouts.areaId, id)).all()).map((l) => l.id);
    const elementIds = (await db.select({ id: floorElements.id }).from(floorElements).where(eq(floorElements.areaId, id)).all()).map((e) => e.id);
    await db.batch([
        db.update(tables).set({ areaId: null }).where(eq(tables.areaId, id)),
        db.delete(layoutPositions).where(inArray(layoutPositions.layoutId, layoutIds.length ? layoutIds : [-1])),
        db.delete(layoutPositions).where(inArray(layoutPositions.elementId, elementIds.length ? elementIds : [-1])),
        db.delete(floorElements).where(eq(floorElements.areaId, id)),
        db.delete(floorLayouts).where(eq(floorLayouts.areaId, id)),
        db.delete(floorAreas).where(eq(floorAreas.id, id)),
    ]);
    updateTag("tables");
    invalidate();
}

// ── Alternativas ──────────────────────────────────────────────────────────

/** Nueva alternativa del área; si se indica, copia las posiciones de otra. */
export async function createLayout(areaId: number, name: string, copyFromLayoutId?: number | null) {
    await requireWrite();
    const max = await db.select({ v: sql<number>`COALESCE(MAX(${floorLayouts.sortOrder}), -1)` }).from(floorLayouts).where(eq(floorLayouts.areaId, areaId)).get();
    const [layout] = await db.insert(floorLayouts).values({ areaId, name: cleanName(name, "La alternativa"), sortOrder: (max?.v ?? -1) + 1 }).returning();
    if (copyFromLayoutId) {
        const source = await db.select().from(layoutPositions).where(eq(layoutPositions.layoutId, copyFromLayoutId)).all();
        if (source.length > 0) {
            await db.insert(layoutPositions).values(source.map(({ tableId, elementId, x, y }) => ({ layoutId: layout.id, tableId, elementId, x, y })));
        }
    }
    invalidate();
    return layout.id;
}

export async function renameLayout(id: number, name: string) {
    await requireWrite();
    await db.update(floorLayouts).set({ name: cleanName(name, "La alternativa") }).where(eq(floorLayouts.id, id));
    invalidate();
}

/** Marca la alternativa como vigente (y desmarca las demás de su área). */
export async function setActiveLayout(id: number) {
    await requireWrite();
    const layout = await db.select().from(floorLayouts).where(eq(floorLayouts.id, id)).get();
    if (!layout) throw new Error("Alternativa no encontrada");
    await db.batch([
        db.update(floorLayouts).set({ isActive: false }).where(and(eq(floorLayouts.areaId, layout.areaId), ne(floorLayouts.id, id))),
        db.update(floorLayouts).set({ isActive: true }).where(eq(floorLayouts.id, id)),
    ]);
    invalidate();
}

export async function deleteLayout(id: number) {
    await requireWrite();
    const layout = await db.select().from(floorLayouts).where(eq(floorLayouts.id, id)).get();
    if (!layout) return;
    const siblings = await db.select().from(floorLayouts).where(and(eq(floorLayouts.areaId, layout.areaId), ne(floorLayouts.id, id))).orderBy(asc(floorLayouts.sortOrder)).all();
    if (siblings.length === 0) throw new Error("Cada área necesita al menos una alternativa");
    await db.batch([
        db.delete(layoutPositions).where(eq(layoutPositions.layoutId, id)),
        db.delete(floorLayouts).where(eq(floorLayouts.id, id)),
        // Si era la vigente, pasa a serlo la primera que queda.
        ...(layout.isActive ? [db.update(floorLayouts).set({ isActive: true }).where(eq(floorLayouts.id, siblings[0].id))] : []),
    ]);
    invalidate();
}

// ── Elementos ─────────────────────────────────────────────────────────────

type ElementInput = { kind: ElementKind; label: string; shape: ElementShape; width: number; height: number; color?: string | null };

const HEX_RE = /^#[0-9a-f]{6}$/i;
function cleanElement(data: ElementInput) {
    const color = data.color ? data.color.toLowerCase() : null;
    if (color && !HEX_RE.test(color)) throw new Error("Color no válido");
    return { kind: data.kind, label: data.label.trim().slice(0, 40), shape: data.shape, width: clampSize(data.width), height: clampSize(data.height), color };
}

/** Crea el elemento en el área y lo coloca en la alternativa indicada. */
export async function createElement(areaId: number, layoutId: number, data: ElementInput, x: number, y: number) {
    await requireWrite();
    const [el] = await db.insert(floorElements).values({ areaId, ...cleanElement(data) }).returning();
    await db.insert(layoutPositions).values({ layoutId, elementId: el.id, x: clampPos(x), y: clampPos(y) });
    invalidate();
}

export async function updateElement(id: number, data: ElementInput) {
    await requireWrite();
    await db.update(floorElements).set(cleanElement(data)).where(eq(floorElements.id, id));
    invalidate();
}

export async function deleteElement(id: number) {
    await requireWrite();
    await db.batch([
        db.delete(layoutPositions).where(eq(layoutPositions.elementId, id)),
        db.delete(floorElements).where(eq(floorElements.id, id)),
    ]);
    invalidate();
}

// ── Posiciones ────────────────────────────────────────────────────────────

/** Guarda dónde está una mesa o un elemento en una alternativa (crea o actualiza). */
export async function setItemPosition(layoutId: number, item: { tableId: number } | { elementId: number }, x: number, y: number) {
    await requireWrite();
    const pos = { x: clampPos(x), y: clampPos(y) };
    if ("tableId" in item) {
        await db.insert(layoutPositions).values({ layoutId, tableId: item.tableId, ...pos })
            .onConflictDoUpdate({ target: [layoutPositions.layoutId, layoutPositions.tableId], set: pos });
    } else {
        await db.insert(layoutPositions).values({ layoutId, elementId: item.elementId, ...pos })
            .onConflictDoUpdate({ target: [layoutPositions.layoutId, layoutPositions.elementId], set: pos });
    }
    invalidate();
}
