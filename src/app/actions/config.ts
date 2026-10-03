"use server";

import { db } from "@/db";
import { eventConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath, updateTag } from "next/cache";

export async function setConfig(key: string, value: string): Promise<void> {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    throw new Error("Sin permisos");
  }

  try {
    const existing = await db
      .select()
      .from(eventConfig)
      .where(eq(eventConfig.key, key))
      .get();

    if (existing) {
      await db
        .update(eventConfig)
        .set({ value })
        .where(eq(eventConfig.key, key));
    } else {
      await db.insert(eventConfig).values({ key, value });
    }

    updateTag("config");
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error(`Error setting config for key ${key}:`, error);
    throw new Error("Error al guardar la configuración");
  }
}
