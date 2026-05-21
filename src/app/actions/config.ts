"use server";

import { db } from "@/db";
import { eventConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getConfig(key: string): Promise<string | null> {
  try {
    const record = await db
      .select({ value: eventConfig.value })
      .from(eventConfig)
      .where(eq(eventConfig.key, key))
      .get();
    return record?.value ?? null;
  } catch (error) {
    console.error(`Error fetching config for key ${key}:`, error);
    return null;
  }
}

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

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
  } catch (error) {
    console.error(`Error setting config for key ${key}:`, error);
    throw new Error("Error al guardar la configuración");
  }
}

export async function getRsvpDeadline(): Promise<Date | null> {
  const value = await getConfig("rsvp_deadline");
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
