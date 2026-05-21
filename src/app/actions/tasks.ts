"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const fetchAllTasks = unstable_cache(
    async () => db.select().from(tasks).orderBy(asc(tasks.isCompleted), asc(tasks.dueDate)).all(),
    ["all-tasks"],
    { tags: ["tasks"] }
);

function invalidateTasks() {
    updateTag("tasks");
    revalidatePath("/admin/tasks");
    revalidatePath("/admin");
}

export async function getTasks() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tasks.read")) {
        throw new Error("Sin permisos");
    }
    return await fetchAllTasks();
}

export async function createTask(data: { title: string; description?: string; dueDate?: string }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tasks.write")) {
        throw new Error("Sin permisos");
    }

    await db.insert(tasks).values({
        title: data.title,
        description: data.description || "",
        dueDate: data.dueDate || null,
        createdBy: session?.user?.id ?? null,
    });

    invalidateTasks();
}

export async function updateTask(id: number, data: { title?: string; description?: string; dueDate?: string }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tasks.write")) {
        throw new Error("Sin permisos");
    }

    const updateSet: Record<string, unknown> = {};
    if (data.title !== undefined) updateSet.title = data.title;
    if (data.description !== undefined) updateSet.description = data.description;
    if (data.dueDate !== undefined) updateSet.dueDate = data.dueDate;

    if (Object.keys(updateSet).length > 0) {
        await db.update(tasks).set(updateSet).where(eq(tasks.id, id));
    }

    invalidateTasks();
}

export async function toggleTask(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tasks.write")) {
        throw new Error("Sin permisos");
    }

    const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!task) throw new Error("Tarea no encontrada");

    await db.update(tasks).set({ isCompleted: !task.isCompleted }).where(eq(tasks.id, id));

    invalidateTasks();
}

export async function deleteTask(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "tasks.write")) {
        throw new Error("Sin permisos");
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    invalidateTasks();
}
