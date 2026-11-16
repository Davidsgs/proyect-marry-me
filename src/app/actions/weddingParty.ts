"use server";

import { db } from "@/db";
import { users, weddingParty } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { PARTY_MESSAGE_MAX, PARTY_NAME_MAX, PARTY_ROLE_MAX } from "@/lib/wedding";

// Padrinos y cortejo: se editan en Ajustes (settings.write) y se muestran en la
// invitación. Las lecturas van por cachedWeddingParty (src/lib/data.ts).
export type WeddingPartyMember = typeof weddingParty.$inferSelect;


type Input = { role: string; name: string; userId?: number | null; message?: string };

async function requireWrite() {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "settings.write")) throw new Error("Sin permisos");
}

function invalidate() {
    updateTag("wedding-party");
    revalidatePath("/admin/settings");
    revalidatePath("/dashboard");
}

async function clean(data: Input) {
    const role = data.role.trim().slice(0, PARTY_ROLE_MAX);
    let name = data.name.trim().slice(0, PARTY_NAME_MAX);
    if (!role) throw new Error("Falta el papel (padrino, madrina, testigo…)");
    const userId = data.userId ?? null;
    if (userId) {
        const user = await db.select({ fullname: users.fullname, name: users.name }).from(users).where(eq(users.id, userId)).get();
        if (!user) throw new Error("Invitado no encontrado");
        name ||= user.fullname || user.name;
    }
    if (!name) throw new Error("Falta el nombre");
    return { role, name, userId, message: (data.message ?? "").trim().slice(0, PARTY_MESSAGE_MAX) };
}

export async function createPartyMember(data: Input) {
    await requireWrite();
    const values = await clean(data);
    const max = await db.select({ v: sql<number>`COALESCE(MAX(${weddingParty.sortOrder}), -1)` }).from(weddingParty).get();
    await db.insert(weddingParty).values({ ...values, sortOrder: (max?.v ?? -1) + 1 });
    invalidate();
}

export async function updatePartyMember(id: number, data: Input) {
    await requireWrite();
    await db.update(weddingParty).set(await clean(data)).where(eq(weddingParty.id, id));
    invalidate();
}

export async function deletePartyMember(id: number) {
    await requireWrite();
    await db.delete(weddingParty).where(eq(weddingParty.id, id));
    invalidate();
}

export async function reorderPartyMembers(orderedIds: number[]) {
    await requireWrite();
    if (orderedIds.length > 0) {
        const [first, ...rest] = orderedIds.map((memberId, i) =>
            db.update(weddingParty).set({ sortOrder: i }).where(eq(weddingParty.id, memberId)),
        );
        await db.batch([first, ...rest]);
    }
    invalidate();
}
