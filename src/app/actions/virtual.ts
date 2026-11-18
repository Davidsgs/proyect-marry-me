"use server";

import { db } from "@/db";
import { eventConfig } from "@/db/schema";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { LIVE_STREAM_KEY, parseStreamUrl } from "@/lib/virtual";

/**
 * Enlace de la transmisión en vivo que ven las familias virtuales. Vacío = aún no
 * publicado. Lo edita quien administra familias (sección Virtuales).
 */
export async function setLiveStreamUrl(raw: string) {
    const session = await auth();
    if (!hasPermission(session?.user?.permissions, "families.write")) {
        throw new Error("Sin permisos");
    }
    const value = raw.trim() === "" ? "" : parseStreamUrl(raw);
    if (value === null) throw new Error("El enlace debe empezar con https://");

    await db
        .insert(eventConfig)
        .values({ key: LIVE_STREAM_KEY, value })
        .onConflictDoUpdate({ target: eventConfig.key, set: { value } });

    updateTag("config");
    revalidatePath("/admin/virtuales");
    revalidatePath("/dashboard/en-vivo");
}
