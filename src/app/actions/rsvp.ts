"use server";

import { db } from "@/db";
import { families, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateFamilyRsvp(familyId: number, status: 'PENDING' | 'CONFIRMED' | 'DECLINED', userUpdates: { userId: number, isConfirmed: boolean }[]) {
    // 1. Verify user permission
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("No autenticado");
    }

    if (session.user.role !== "MAIN_GUEST" && session.user.role !== "ADMIN") {
        throw new Error("No tienes permisos para confirmar asistencia familiar.");
    }

    if (session.user.familyId !== familyId && session.user.role !== "ADMIN") {
         throw new Error("No puedes confirmar por otra familia.");
    }

    // 2. Update global family status
    await db.update(families)
            .set({ globalRsvpStatus: status })
            .where(eq(families.id, familyId));

    // 3. Update individual users
    for (const update of userUpdates) {
        await db.update(users)
                .set({ isConfirmed: update.isConfirmed })
                .where(eq(users.id, update.userId));
    }

    revalidatePath("/dashboard");
    return { success: true };
}
