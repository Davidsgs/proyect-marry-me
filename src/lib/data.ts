// Lecturas cacheadas compartidas (Data Cache de Next, invalidadas por tag).
// La base (Turso) está lejos: cada consulta cuesta ~160 ms, así que las páginas
// leen de aquí y solo van a la base cuando una escritura invalida el tag.
// OJO: este módulo NO es "use server"; no exponer estas funciones como acciones
// (no comprueban permisos: eso lo hace quien llama).
import { unstable_cache } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventConfig, families, faqItems, rsvpEvents, tables, users, weddingParty } from "@/db/schema";
import type { RsvpAttendee, RsvpEvent } from "@/lib/rsvpAudit";

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

/**
 * Historial de respuestas, el más reciente primero. Tag "families": toda
 * escritura que lo amplía ya invalida familias.
 */
export const cachedRsvpEvents = unstable_cache(
    async (): Promise<RsvpEvent[]> => {
        const rows = await db
            .select({
                id: rsvpEvents.id,
                familyId: rsvpEvents.familyId,
                status: rsvpEvents.status,
                actorName: rsvpEvents.actorName,
                actorKind: rsvpEvents.actorKind,
                attendees: rsvpEvents.attendees,
                createdAt: rsvpEvents.createdAt,
            })
            .from(rsvpEvents)
            .orderBy(desc(rsvpEvents.createdAt), desc(rsvpEvents.id))
            .all();
        return rows.map((r) => ({ ...r, attendees: parseAttendees(r.attendees) }));
    },
    ["rsvp-events"],
    { tags: ["families"] },
);

function parseAttendees(raw: string): RsvpAttendee[] {
    try {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

/** Padrinos y cortejo en su orden (tag "wedding-party"). */
/** Preguntas y respuestas en su orden (tag "faq"). */
export const cachedFaq = unstable_cache(
    async () => db.select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.id)).all(),
    ["faq"],
    { tags: ["faq"] },
);

export const cachedWeddingParty = unstable_cache(
    async () => db.select().from(weddingParty).orderBy(asc(weddingParty.sortOrder), asc(weddingParty.id)).all(),
    ["wedding-party"],
    { tags: ["wedding-party"] },
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

/**
 * Si los invitados ven su mesa (clave tables_visible). Sin valor = ocultas:
 * se muestran recién cuando las activan en Mesas.
 */
export async function getTablesVisible(): Promise<boolean> {
    return (await cachedConfig("tables_visible")) === "true";
}

export async function getRsvpDeadline(): Promise<Date | null> {
    const value = await cachedConfig("rsvp_deadline");
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}
