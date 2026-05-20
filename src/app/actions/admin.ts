"use server";

import { db } from "@/db";
import { families, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export async function createFamily(data: { name: string; alias?: string; globalRsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }
    await db.insert(families).values({
        name: data.name,
        alias: data.alias || "",
        globalRsvpStatus: data.globalRsvpStatus,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
}

export async function updateFamily(id: number, data: { name?: string; alias?: string; delegateUserId?: number | null; globalRsvpStatus?: 'PENDING' | 'CONFIRMED' | 'DECLINED' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }

    // Build the set object with only defined fields
    const updateSet: Record<string, unknown> = {};
    if (data.name !== undefined) updateSet.name = data.name;
    if (data.alias !== undefined) updateSet.alias = data.alias;
    if (data.globalRsvpStatus !== undefined) updateSet.globalRsvpStatus = data.globalRsvpStatus;

    // Handle delegate change with role synchronization
    if (data.delegateUserId !== undefined) {
        updateSet.delegateUserId = data.delegateUserId;

        // Reset all family members to GUEST
        await db.update(users)
            .set({ role: "GUEST" })
            .where(eq(users.familyId, id));

        // Set the new delegate as MAIN_GUEST
        if (data.delegateUserId !== null) {
            await db.update(users)
                .set({ role: "MAIN_GUEST" })
                .where(eq(users.id, data.delegateUserId));
        }
    }

    if (Object.keys(updateSet).length > 0) {
        await db.update(families)
            .set(updateSet)
            .where(eq(families.id, id));
    }

    revalidatePath("/admin");
    revalidatePath("/admin/guests");
    revalidatePath("/dashboard");
}

export async function getFamilies() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.read")) {
        throw new Error("Sin permisos");
    }
    return await db.select().from(families).all();
}

export async function deleteFamily(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }
    await db.delete(families).where(eq(families.id, id));
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
}

export async function createUser(data: { email: string, name: string, lastName: string, familyId: number, role: 'ADMIN' | 'MAIN_GUEST' | 'GUEST' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }
    const fullname = `${data.name} ${data.lastName}`.trim();
    await db.insert(users).values({ ...data, fullname });
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
}

export async function getUsers() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.read")) {
        throw new Error("Sin permisos");
    }
    return await db.select().from(users).all();
}

export async function deleteUser(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
}

