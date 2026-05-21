"use server";

import { db } from "@/db";
import { families, users, roles, userRoles } from "@/db/schema";
import { and, eq, ne, inArray } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

type UserRole = "ADMIN" | "MAIN_GUEST" | "GUEST";

// Maps the legacy users.role enum to the RBAC roles.key used for permissions.
const ROLE_KEY: Record<UserRole, string> = {
    ADMIN: "admin",
    MAIN_GUEST: "main_guest",
    GUEST: "guest",
};

/**
 * Keeps the RBAC user_roles table in sync with a user's users.role value.
 * Admin/guest gating reads permissions from user_roles, not users.role, so any
 * write to users.role must mirror here or the user gets the wrong permissions
 * (e.g. a new ADMIN with no admin.dashboard permission).
 *
 * Replaces only the user's *system* role link, preserving any custom roles.
 */
async function syncSystemRole(userId: number, role: UserRole) {
    const systemRoles = await db.select().from(roles).where(eq(roles.isSystem, true)).all();
    const target = systemRoles.find((r) => r.key === ROLE_KEY[role]);
    if (!target) {
        console.error(`syncSystemRole: rol de sistema '${ROLE_KEY[role]}' no existe. Ejecuta seed-rbac.`);
        return;
    }
    const systemRoleIds = systemRoles.map((r) => r.id);
    await db.delete(userRoles).where(
        and(eq(userRoles.userId, userId), inArray(userRoles.roleId, systemRoleIds))
    );
    await db.insert(userRoles).values({ userId, roleId: target.id });
}

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

        // Mirror the role changes into the RBAC user_roles table so members get the
        // correct permissions (e.g. the delegate gains rsvp.confirm_own_family).
        const members = await db.select().from(users).where(eq(users.familyId, id)).all();
        for (const member of members) {
            await syncSystemRole(member.id, member.role as UserRole);
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
    const inserted = await db.insert(users).values({
        email,
        name: data.name,
        lastName: data.lastName,
        fullname,
        familyId: data.familyId,
        role: data.role,
        ageCategory: data.ageCategory ?? "ADULT",
    }).returning({ id: users.id });

    const newUserId = inserted[0]?.id;
    if (newUserId) {
        await syncSystemRole(newUserId, data.role);
    }
    invalidateUsers();
}

export async function createManyUsers(
    familyId: number,
    members: { email?: string | null; name: string; lastName: string; role: 'ADMIN' | 'MAIN_GUEST' | 'GUEST'; ageCategory?: 'BABY' | 'CHILD' | 'ADULT' }[]
) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }

    const clean = members.filter((m) => m.name.trim() !== "" || m.lastName.trim() !== "");
    if (clean.length === 0) return;

    for (const member of clean) {
        const fullname = `${member.name} ${member.lastName}`.trim();
        const email = member.email && member.email.trim() !== "" ? member.email.trim() : null;
        const inserted = await db.insert(users).values({
            email,
            name: member.name,
            lastName: member.lastName,
            fullname,
            familyId,
            role: member.role,
            ageCategory: member.ageCategory ?? "ADULT",
        }).returning({ id: users.id });

        const newUserId = inserted[0]?.id;
        if (newUserId) {
            await syncSystemRole(newUserId, member.role);
        }
    }

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

    if (data.role !== undefined) {
        await syncSystemRole(id, data.role);
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
