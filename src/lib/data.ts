// Lecturas cacheadas compartidas (Data Cache de Next, invalidadas por tag).
// La base (Turso) está lejos: cada consulta cuesta ~160 ms, así que las páginas
// leen de aquí y solo van a la base cuando una escritura invalida el tag.
// OJO: este módulo NO es "use server"; no exponer estas funciones como acciones
// (no comprueban permisos: eso lo hace quien llama).
import { unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventConfig, families, tables, users } from "@/db/schema";

export const cachedFamilies = unstable_cache(
    async () => db.select().from(families).all(),
    ["all-families"],
    { tags: ["families"] },
);

export const cachedUsers = unstable_cache(
    async () => db.select().from(users).all(),
    ["all-users"],
    { tags: ["users"] },
);

export const cachedTables = unstable_cache(
    async () => db.select().from(tables).orderBy(asc(tables.number)).all(),
    ["all-tables"],
    { tags: ["tables"] },
);

/** Valor de event_config (tag "config"; quien escribe debe hacer updateTag("config")). */
export const cachedConfig = unstable_cache(
    async (key: string): Promise<string | null> => {
        const record = await db
            .select({ value: eventConfig.value })
            .from(eventConfig)
            .where(eq(eventConfig.key, key))
            .get();
        return record?.value ?? null;
    },
    ["event-config"],
    { tags: ["config"] },
);

export async function getRsvpDeadline(): Promise<Date | null> {
    const value = await cachedConfig("rsvp_deadline");
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}
