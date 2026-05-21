"use server";

import { db } from "@/db";
import { families, users } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

const fetchAllFamilies = unstable_cache(
    async () => db.select().from(families).all(),
    ["all-families"],
    { tags: ["families"] }
);

const fetchAllUsers = unstable_cache(
    async () => db.select().from(users).all(),
    ["all-users"],
    { tags: ["users"] }
);

function invalidateFamilies() {
    updateTag("families");
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
    revalidatePath("/dashboard");
}

function invalidateUsers() {
    updateTag("users");
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
    revalidatePath("/dashboard");
}

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
    invalidateFamilies();
}

export async function updateFamily(id: number, data: { name?: string; alias?: string; delegateUserId?: number | null; globalRsvpStatus?: 'PENDING' | 'CONFIRMED' | 'DECLINED' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }

    const updateSet: Record<string, unknown> = {};
    if (data.name !== undefined) updateSet.name = data.name;
    if (data.alias !== undefined) updateSet.alias = data.alias;
    if (data.globalRsvpStatus !== undefined) updateSet.globalRsvpStatus = data.globalRsvpStatus;

    let touchedUsers = false;
    if (data.delegateUserId !== undefined) {
        updateSet.delegateUserId = data.delegateUserId;

        // Reset non-admin family members to GUEST. ADMIN role is preserved so admins
        // remain administrators while also being attendees / guests / delegates.
        await db.update(users)
            .set({ role: "GUEST" })
            .where(and(eq(users.familyId, id), ne(users.role, "ADMIN")));

        if (data.delegateUserId !== null) {
            // Only promote to MAIN_GUEST if not already ADMIN. Delegate identity is
            // tracked by families.delegateUserId, not by the role column.
            await db.update(users)
                .set({ role: "MAIN_GUEST" })
                .where(and(eq(users.id, data.delegateUserId), ne(users.role, "ADMIN")));
        }
        touchedUsers = true;
    }

    if (Object.keys(updateSet).length > 0) {
        await db.update(families)
            .set(updateSet)
            .where(eq(families.id, id));
    }

    invalidateFamilies();
    if (touchedUsers) invalidateUsers();
}

export async function getFamilies() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.read")) {
        throw new Error("Sin permisos");
    }
    return await fetchAllFamilies();
}

export async function deleteFamily(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }
    await db.delete(families).where(eq(families.id, id));
    invalidateFamilies();
    invalidateUsers();
}

export async function createUser(data: { email?: string | null, name: string, lastName: string, familyId: number, role: 'ADMIN' | 'MAIN_GUEST' | 'GUEST', ageCategory?: 'BABY' | 'CHILD' | 'ADULT' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }
    const fullname = `${data.name} ${data.lastName}`.trim();
    const email = data.email && data.email.trim() !== "" ? data.email.trim() : null;
    await db.insert(users).values({
        email,
        name: data.name,
        lastName: data.lastName,
        fullname,
        familyId: data.familyId,
        role: data.role,
        ageCategory: data.ageCategory ?? "ADULT",
    });
    invalidateUsers();
}

export async function getUsers() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.read")) {
        throw new Error("Sin permisos");
    }
    return await fetchAllUsers();
}

export async function updateUser(id: number, data: { email?: string | null; name?: string; lastName?: string; familyId?: number | null; role?: 'ADMIN' | 'MAIN_GUEST' | 'GUEST'; ageCategory?: 'BABY' | 'CHILD' | 'ADULT' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }

    const updateSet: Record<string, unknown> = {};
    if (data.email !== undefined) {
        updateSet.email = data.email && data.email.trim() !== "" ? data.email.trim() : null;
    }
    if (data.name !== undefined) updateSet.name = data.name;
    if (data.lastName !== undefined) updateSet.lastName = data.lastName;
    if (data.familyId !== undefined) updateSet.familyId = data.familyId;
    if (data.role !== undefined) updateSet.role = data.role;
    if (data.ageCategory !== undefined) updateSet.ageCategory = data.ageCategory;

    if (data.name !== undefined || data.lastName !== undefined) {
        const current = await db.select().from(users).where(eq(users.id, id)).get();
        const nextName = data.name ?? current?.name ?? "";
        const nextLast = data.lastName ?? current?.lastName ?? "";
        updateSet.fullname = `${nextName} ${nextLast}`.trim();
    }

    if (Object.keys(updateSet).length > 0) {
        await db.update(users).set(updateSet).where(eq(users.id, id));
    }

    invalidateUsers();
}

export async function deleteUser(id: number) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }
    await db.delete(users).where(eq(users.id, id));
    invalidateUsers();
}
