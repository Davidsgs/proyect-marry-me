"use server";

import { db } from "@/db";
import { families, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@/auth";
import { getRsvpDeadline } from "@/app/actions/config";

export async function updateFamilyRsvp(familyId: number, status: 'PENDING' | 'CONFIRMED' | 'DECLINED', userUpdates: { userId: number, isConfirmed: boolean }[]) {
    // 1. Verify user authentication
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autenticado");
    }

    // 2. Fetch the active family record to verify delegate and existing status
    const dbFamily = await db.select().from(families).where(eq(families.id, familyId)).get();
    if (!dbFamily) {
        throw new Error("Familia no encontrada.");
    }

    // 3. Enforce dynamic delegate and admin checks
    const isDelegate = session.user.id === dbFamily.delegateUserId || 
                       session.user.role === "ADMIN" || 
                       session.user.permissions?.includes("admin.dashboard");

    if (!isDelegate) {
        throw new Error("No tienes permisos para confirmar la asistencia de esta familia.");
    }

    // 4. Enforce deadline validations (except for system admins)
    const deadline = await getRsvpDeadline();
    const now = new Date();
    const isPastDeadline = deadline ? now > deadline : false;
    const hasResponded = dbFamily.globalRsvpStatus !== 'PENDING';

    if (hasResponded && isPastDeadline && session.user.role !== "ADMIN") {
        throw new Error("El plazo límite para realizar cambios ha vencido. Por favor ponte en contacto con los novios.");
    }

    // 5. Validar la respuesta: solo miembros de ESTA familia, y coherencia con el estado.
    if (status !== "CONFIRMED" && status !== "DECLINED") {
        throw new Error("Elige si asistirán o no.");
    }
    const members = await db.select({ id: users.id }).from(users).where(eq(users.familyId, familyId)).all();
    const memberIds = new Set(members.map((m) => m.id));
    const updates = userUpdates
        .filter((u) => memberIds.has(u.userId))
        .map((u) => ({ userId: u.userId, isConfirmed: status === "CONFIRMED" && u.isConfirmed }));
    if (status === "CONFIRMED" && !updates.some((u) => u.isConfirmed)) {
        throw new Error("Marca al menos a una persona que asistirá.");
    }

    // 6. Update global family status
    await db.update(families)
            .set({ globalRsvpStatus: status })
            .where(eq(families.id, familyId));

    // 7. Update individual users (acotado a la familia aunque el cliente envíe otros ids)
    for (const update of updates) {
        await db.update(users)
                .set({ isConfirmed: update.isConfirmed })
                .where(and(eq(users.id, update.userId), eq(users.familyId, familyId)));
    }

    updateTag("families");
    updateTag("users");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
    return { success: true };
}

