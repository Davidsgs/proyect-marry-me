"use server";

import { db } from "@/db";
import { scheduleActivities, scheduleTasks, scheduleResponsibles, scheduleSections, eventConfig, users } from "@/db/schema";
import { eq, asc, sql, and } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { cachedConfig } from "@/lib/data";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const LOCK_KEY = "schedule_locked";

export type ScheduleTask = typeof scheduleTasks.$inferSelect;
export type ScheduleSection = typeof scheduleSections.$inferSelect;
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

const fetchSections = unstable_cache(
    async (): Promise<ScheduleSection[]> =>
        db.select().from(scheduleSections).orderBy(asc(scheduleSections.sortOrder), asc(scheduleSections.id)).all(),
    ["schedule-sections"],
    { tags: ["schedule"] },
);

function invalidate() {
    updateTag("schedule");
    revalidatePath("/admin/cronograma");
    revalidatePath("/admin/menu"); // los momentos del menú son actividades
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

export async function getScheduleSections(): Promise<ScheduleSection[]> {
    await requireRead();
    return await fetchSections();
}

export async function getScheduleLocked(): Promise<boolean> {
    return (await cachedConfig(LOCK_KEY)) === "1";
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
    updateTag("config");
    revalidatePath("/admin/cronograma");
}

// ── Actividades ───────────────────────────────────────────────────────────

// ── Secciones ─────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function cleanSection(data: { name: string; date?: string | null }) {
    const name = data.name.trim();
    if (!name) throw new Error("La sección necesita un nombre");
    const date = data.date || null;
    if (date && !DATE_RE.test(date)) throw new Error("Fecha no válida");
    return { name, date };
}

export async function createSection(data: { name: string; date?: string | null }) {
    await requireWrite();
    const clean = cleanSection(data);
    const max = await db
        .select({ v: sql<number>`COALESCE(MAX(${scheduleSections.sortOrder}), -1)` })
        .from(scheduleSections)
        .get();
    await db.insert(scheduleSections).values({ ...clean, sortOrder: (max?.v ?? -1) + 1 });
    invalidate();
}

export async function updateSection(id: number, data: { name: string; date?: string | null }) {
    await requireWrite();
    await db.update(scheduleSections).set(cleanSection(data)).where(eq(scheduleSections.id, id));
    invalidate();
}

/** Borra la sección; sus actividades quedan «Sin sección» (FK ON DELETE SET NULL). */
export async function deleteSection(id: number) {
    await requireWrite();
    // Explícito: no se confía en la cascada de la base.
    await db.batch([
        db.update(scheduleActivities).set({ sectionId: null }).where(eq(scheduleActivities.sectionId, id)),
        db.delete(scheduleSections).where(eq(scheduleSections.id, id)),
    ]);
    invalidate();
}

export async function reorderSections(orderedIds: number[]) {
    await requireWrite();
    if (orderedIds.length > 0) {
        const [first, ...rest] = orderedIds.map((sectionId, i) =>
            db.update(scheduleSections).set({ sortOrder: i }).where(eq(scheduleSections.id, sectionId)),
        );
        await db.batch([first, ...rest]);
    }
    invalidate();
}

export async function createActivity(data: { title: string; time?: string; notes?: string; sectionId?: number | null }) {
    await requireWrite();
    const max = await db
        .select({ v: sql<number>`COALESCE(MAX(${scheduleActivities.sortOrder}), -1)` })
        .from(scheduleActivities)
        .get();
    await db.insert(scheduleActivities).values({
        title: data.title,
        time: data.time || null,
        notes: data.notes ?? "",
        sectionId: data.sectionId ?? null,
        sortOrder: (max?.v ?? -1) + 1,
    });
    invalidate();
}

export async function updateActivity(id: number, data: { title?: string; time?: string | null; notes?: string; sectionId?: number | null }) {
    await requireWrite();
    const set: Record<string, unknown> = {};
    if (data.sectionId !== undefined) set.sectionId = data.sectionId;
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
    if (orderedIds.length > 0) {
        // Un solo viaje a la base para todo el reordenado.
        const [first, ...rest] = orderedIds.map((activityId, i) =>
            db.update(scheduleActivities).set({ sortOrder: i }).where(eq(scheduleActivities.id, activityId)),
        );
        await db.batch([first, ...rest]);
    }
    invalidate();
}

/** Arrastre a otra sección: cambia la sección y reescribe el orden global en un solo viaje. */
export async function moveActivity(id: number, sectionId: number | null, orderedIds: number[]) {
    await requireWrite();
    await db.batch([
        db.update(scheduleActivities).set({ sectionId }).where(eq(scheduleActivities.id, id)),
        ...orderedIds.map((activityId, i) =>
            db.update(scheduleActivities).set({ sortOrder: i }).where(eq(scheduleActivities.id, activityId)),
        ),
    ]);
    invalidate();
}

// ── Responsables de una actividad ───────────────────────────────────────────

/** Responsable libre (`name`) o vinculado a un invitado (`userId`; el nombre se toma de su ficha). */
export async function addResponsible(activityId: number, name: string, userId?: number | null) {
    await requireWrite();
    if (userId) {
        const user = await db.select({ fullname: users.fullname, name: users.name }).from(users).where(eq(users.id, userId)).get();
        if (!user) throw new Error("Invitado no encontrado");
        const dup = await db.select({ id: scheduleResponsibles.id }).from(scheduleResponsibles)
            .where(and(eq(scheduleResponsibles.activityId, activityId), eq(scheduleResponsibles.userId, userId))).get();
        if (dup) throw new Error("Ya es responsable de esta actividad");
        name = user.fullname || user.name;
    }
    name = name.trim();
    if (!name) throw new Error("El responsable necesita un nombre");
    const max = await db
        .select({ v: sql<number>`COALESCE(MAX(${scheduleResponsibles.sortOrder}), -1)` })
        .from(scheduleResponsibles)
        .where(eq(scheduleResponsibles.activityId, activityId))
        .get();
    await db.insert(scheduleResponsibles).values({
        activityId,
        name,
        userId: userId ?? null,
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

/** Edita el texto, el detalle o el responsable de un paso. */
export async function updateScheduleTask(id: number, data: { label?: string; description?: string; responsibleId?: number | null }) {
    await requireWrite();
    const set: Record<string, unknown> = {};
    if (data.label !== undefined) {
        if (!data.label.trim()) throw new Error("El paso necesita un texto");
        set.label = data.label.trim();
    }
    if (data.description !== undefined) set.description = data.description.trim();
    if (data.responsibleId !== undefined) set.responsibleId = data.responsibleId;
    if (Object.keys(set).length > 0) {
        await db.update(scheduleTasks).set(set).where(eq(scheduleTasks.id, id));
    }
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
