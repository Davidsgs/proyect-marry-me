"use server";

import { db } from "@/db";
import { families, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export async function createFamily(data: { name: string, globalRsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }
    await db.insert(families).values(data);
    revalidatePath("/admin");
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
}

export async function createUser(data: { email: string, name: string, lastName: string, familyId: number, role: 'ADMIN' | 'MAIN_GUEST' | 'GUEST' }) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "users.write")) {
        throw new Error("Sin permisos");
    }
    const fullname = `${data.name} ${data.lastName}`.trim();
    await db.insert(users).values({ ...data, fullname });
    revalidatePath("/admin");
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
}
