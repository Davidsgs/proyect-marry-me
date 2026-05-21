"use server";

import { db } from "@/db";
import { tables, users } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const fetchAllTables = unstable_cache(
    async () => db.select().from(tables).orderBy(asc(tables.number)).all(),
    ["all-tables"],
    { tags: ["tables"] }
);

function invalidateTables() {
    updateTag("tables");
    updateTag("users");
    revalidatePath("/admin/tables");
    revalidatePath("/dashboard");
}

export async function getTables() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.read")) {
        throw new Error("Sin permisos");
    }
    return await fetchAllTables();
}

export async function createTable(data: { number: number; name?: string; capacity?: number; notes?: string }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }
    await db.insert(tables).values({
        number: data.number,
        name: data.name ?? "",
        capacity: data.capacity ?? 10,
        notes: data.notes ?? "",
    });
    invalidateTables();
}

export async function updateTable(id: number, data: { number?: number; name?: string; capacity?: number; notes?: string }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }
    const updateSet: Record<string, unknown> = {};
    if (data.number !== undefined) updateSet.number = data.number;
    if (data.name !== undefined) updateSet.name = data.name;
    if (data.capacity !== undefined) updateSet.capacity = data.capacity;
    if (data.notes !== undefined) updateSet.notes = data.notes;

    if (Object.keys(updateSet).length > 0) {
        await db.update(tables).set(updateSet).where(eq(tables.id, id));
    }
    invalidateTables();
}

export async function deleteTable(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }
    // Null assignments explicitly: the table_id column was added via ALTER TABLE
    // ADD COLUMN, which in SQLite carries no ON DELETE action, so orphaned rows
    // would otherwise keep pointing at the deleted table and vanish from the UI.
    await db.update(users).set({ tableId: null }).where(eq(users.tableId, id));
    await db.delete(tables).where(eq(tables.id, id));
    invalidateTables();
}

export async function updateTablePosition(id: number, posX: number, posY: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }
    await db.update(tables).set({ posX: Math.round(posX), posY: Math.round(posY) }).where(eq(tables.id, id));
    invalidateTables();
}

export async function clearTable(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }
    await db.update(users).set({ tableId: null }).where(eq(users.tableId, id));
    invalidateTables();
}

export async function assignUserToTable(userId: number, tableId: number | null) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }
    await db.update(users).set({ tableId }).where(eq(users.id, userId));
    invalidateTables();
}

/**
 * Seats a whole family at a table without exceeding its capacity: fills the
 * remaining seats, and any members that don't fit are left unassigned. The
 * capacity limit is only ever surpassed by an intentional single-person drag
 * (assignUserToTable), never by this bulk action.
 */
export async function assignFamilyToTable(familyId: number, tableId: number | null) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tables.write")) {
        throw new Error("Sin permisos");
    }

    if (tableId === null) {
        await db.update(users).set({ tableId: null }).where(eq(users.familyId, familyId));
        invalidateTables();
        return;
    }

    const table = await db.select().from(tables).where(eq(tables.id, tableId)).get();
    if (!table) throw new Error("Mesa no encontrada");

    const allUsers = await db.select().from(users).all();
    const occupancyOthers = allUsers.filter((u) => u.tableId === tableId && u.familyId !== familyId).length;
    const available = Math.max(0, table.capacity - occupancyOthers);

    const members = allUsers.filter((u) => u.familyId === familyId);
    // Members already at this table keep their seat first, so a re-run doesn't
    // needlessly evict someone who already fit.
    const ordered = [
        ...members.filter((u) => u.tableId === tableId),
        ...members.filter((u) => u.tableId !== tableId),
    ];
    const seatIds = ordered.slice(0, available).map((u) => u.id);
    const unseatIds = ordered.slice(available).map((u) => u.id);

    if (seatIds.length > 0) await db.update(users).set({ tableId }).where(inArray(users.id, seatIds));
    if (unseatIds.length > 0) await db.update(users).set({ tableId: null }).where(inArray(users.id, unseatIds));

    invalidateTables();
}

/**
 * Returns the logged-in user's assigned table plus their tablemates.
 * Gated by session only — a guest may always read their own seating.
 */
export async function getMyTable() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    const me = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!me?.tableId) return null;

    const table = await db.select().from(tables).where(eq(tables.id, me.tableId)).get();
    if (!table) return null;

    const tablemates = await db.select().from(users).where(eq(users.tableId, me.tableId)).all();
    return { table, members: tablemates };
}
