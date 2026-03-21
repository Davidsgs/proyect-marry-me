"use server";

import { db } from "@/db";
import { families, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createFamily(data: { name: string, globalRsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED' }) {
    await db.insert(families).values(data);
    revalidatePath("/admin");
}

export async function getFamilies() {
    return await db.select().from(families).all();
}

export async function deleteFamily(id: number) {
    await db.delete(families).where(eq(families.id, id));
    revalidatePath("/admin");
}

export async function createUser(data: { email: string, name: string, familyId: number, role: 'ADMIN' | 'MAIN_GUEST' | 'GUEST' }) {
    await db.insert(users).values(data);
    revalidatePath("/admin");
}

export async function getUsers() {
    return await db.select().from(users).all();
}

export async function deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin");
}
