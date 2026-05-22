"use server";

import { db } from "@/db";
import { scheduleActivities, scheduleTasks, scheduleResponsibles, eventConfig } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const LOCK_KEY = "schedule_locked";

export type ScheduleTask = typeof scheduleTasks.$inferSelect;
export type Responsible = typeof scheduleResponsibles.$inferSelect;
export type ActivityWithTasks = typeof scheduleActivities.$inferSelect & {
    tasks: ScheduleTask[];
    responsibles: Responsible[];
};

const fetchSchedule = unstable_cache(
    async (): Promise<ActivityWithTasks[]> => {
        const activities = await db
            .select()
            .from(scheduleActivities)
            .orderBy(asc(scheduleActivities.sortOrder), asc(scheduleActivities.id))
            .all();
        const allTasks = await db
            .select()
            .from(scheduleTasks)
            .orderBy(asc(scheduleTasks.sortOrder), asc(scheduleTasks.id))
            .all();
        const allResponsibles = await db
            .select()
            .from(scheduleResponsibles)
            .orderBy(asc(scheduleResponsibles.sortOrder), asc(scheduleResponsibles.id))
            .all();

        const tasksByActivity = new Map<number, ScheduleTask[]>();
        for (const t of allTasks) {
            const arr = tasksByActivity.get(t.activityId) ?? [];
            arr.push(t);
            tasksByActivity.set(t.activityId, arr);
        }
        const respByActivity = new Map<number, Responsible[]>();
        for (const r of allResponsibles) {
            const arr = respByActivity.get(r.activityId) ?? [];
            arr.push(r);
            respByActivity.set(r.activityId, arr);
        }
        return activities.map((a) => ({
            ...a,
            tasks: tasksByActivity.get(a.id) ?? [],
            responsibles: respByActivity.get(a.id) ?? [],
        }));
    },
    ["schedule"],
    { tags: ["schedule"] },
);

function invalidate() {
    updateTag("schedule");
    revalidatePath("/admin/cronograma");
}

async function requireRead() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "calendar.read")) {
        throw new Error("Sin permisos");
    }
}

async function requireWrite() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "calendar.write")) {
        throw new Error("Sin permisos");
    }
}

// ── Cronograma ────────────────────────────────────────────────────────────

export async function getSchedule(): Promise<ActivityWithTasks[]> {
    await requireRead();
    return await fetchSchedule();
}

export async function getScheduleLocked(): Promise<boolean> {
    const record = await db
        .select({ value: eventConfig.value })
        .from(eventConfig)
        .where(eq(eventConfig.key, LOCK_KEY))
        .get();
    return record?.value === "1";
}

export async function setScheduleLocked(locked: boolean): Promise<void> {
    await requireWrite();
    const value = locked ? "1" : "0";
    const existing = await db.select().from(eventConfig).where(eq(eventConfig.key, LOCK_KEY)).get();
    if (existing) {
        await db.update(eventConfig).set({ value }).where(eq(eventConfig.key, LOCK_KEY));
    } else {
        await db.insert(eventConfig).values({ key: LOCK_KEY, value });
    }
    revalidatePath("/admin/cronograma");
}

// ── Actividades ───────────────────────────────────────────────────────────

export async function createActivity(data: { title: string; time?: string; notes?: string }) {
    await requireWrite();
    const max = await db
        .select({ v: sql<number>`COALESCE(MAX(${scheduleActivities.sortOrder}), -1)` })
        .from(scheduleActivities)
        .get();
    await db.insert(scheduleActivities).values({
        title: data.title,
        time: data.time || null,
        notes: data.notes ?? "",
        sortOrder: (max?.v ?? -1) + 1,
    });
    invalidate();
}

export async function updateActivity(id: number, data: { title?: string; time?: string | null; notes?: string }) {
    await requireWrite();
    const set: Record<string, unknown> = {};
    if (data.title !== undefined) set.title = data.title;
    if (data.time !== undefined) set.time = data.time || null;
    if (data.notes !== undefined) set.notes = data.notes;
    if (Object.keys(set).length > 0) {
        await db.update(scheduleActivities).set(set).where(eq(scheduleActivities.id, id));
    }
    invalidate();
}

export async function toggleActivity(id: number) {
    await requireWrite();
    const activity = await db.select().from(scheduleActivities).where(eq(scheduleActivities.id, id)).get();
    if (!activity) throw new Error("Actividad no encontrada");
    const nowCompleting = !activity.isCompleted;
    await db
        .update(scheduleActivities)
        .set({ isCompleted: nowCompleting, completedAt: nowCompleting ? new Date().toISOString() : null })
        .where(eq(scheduleActivities.id, id));
    invalidate();
}

export async function deleteActivity(id: number) {
    await requireWrite();
    await db.delete(scheduleActivities).where(eq(scheduleActivities.id, id));
    invalidate();
}

/** Persiste el nuevo orden tras un drag & drop: orderedIds en su orden final. */
export async function reorderActivities(orderedIds: number[]) {
    await requireWrite();
    for (let i = 0; i < orderedIds.length; i++) {
        await db.update(scheduleActivities).set({ sortOrder: i }).where(eq(scheduleActivities.id, orderedIds[i]));
    }
    invalidate();
}

// ── Responsables de una actividad ───────────────────────────────────────────

export async function addResponsible(activityId: number, name: string) {
    await requireWrite();
    const max = await db
        .select({ v: sql<number>`COALESCE(MAX(${scheduleResponsibles.sortOrder}), -1)` })
        .from(scheduleResponsibles)
        .where(eq(scheduleResponsibles.activityId, activityId))
        .get();
    await db.insert(scheduleResponsibles).values({
        activityId,
        name,
        sortOrder: (max?.v ?? -1) + 1,
    });
    invalidate();
}

export async function deleteResponsible(id: number) {
    await requireWrite();
    // El FK (responsible_id ON DELETE SET NULL) deja sin asignar las tareas
    // que apuntaban a este responsable.
    await db.delete(scheduleResponsibles).where(eq(scheduleResponsibles.id, id));
    invalidate();
}

// ── Tareas de una actividad ─────────────────────────────────────────────────

export async function addScheduleTask(activityId: number, label: string, responsibleId?: number | null) {
    await requireWrite();
    const max = await db
        .select({ v: sql<number>`COALESCE(MAX(${scheduleTasks.sortOrder}), -1)` })
        .from(scheduleTasks)
        .where(eq(scheduleTasks.activityId, activityId))
        .get();
    await db.insert(scheduleTasks).values({
        activityId,
        label,
        responsibleId: responsibleId ?? null,
        sortOrder: (max?.v ?? -1) + 1,
    });
    invalidate();
}

export async function assignTaskResponsible(taskId: number, responsibleId: number | null) {
    await requireWrite();
    await db.update(scheduleTasks).set({ responsibleId }).where(eq(scheduleTasks.id, taskId));
    invalidate();
}

export async function toggleScheduleTask(id: number) {
    await requireWrite();
    const task = await db.select().from(scheduleTasks).where(eq(scheduleTasks.id, id)).get();
    if (!task) throw new Error("Tarea no encontrada");
    await db.update(scheduleTasks).set({ isCompleted: !task.isCompleted }).where(eq(scheduleTasks.id, id));
    invalidate();
}

export async function deleteScheduleTask(id: number) {
    await requireWrite();
    await db.delete(scheduleTasks).where(eq(scheduleTasks.id, id));
    invalidate();
}
