// Auditoría de respuestas (tabla rsvp_events). Módulo de servidor sin "use server":
// lo usan las acciones que escriben respuestas; nunca se expone como acción.
import { db } from "@/db";
import { rsvpEvents } from "@/db/schema";
import { cachedUsers } from "@/lib/data";

export type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type ActorKind = "DELEGATE" | "ADMIN";
export type RsvpAttendee = { userId: number; name: string; attending: boolean };

export type RsvpEvent = {
    id: number;
    familyId: number;
    status: RsvpStatus;
    actorName: string;
    actorKind: ActorKind;
    attendees: RsvpAttendee[];
    createdAt: string;
};

/** Quién está respondiendo: el delegado de la familia o un administrador. */
export async function rsvpActor(sessionUserId: number | undefined, delegateUserId: number | null) {
    const actor = (await cachedUsers()).find((u) => u.id === sessionUserId);
    return {
        actorUserId: actor?.id ?? null,
        actorName: actor ? `${actor.name} ${actor.lastName}`.trim() : "",
        actorKind: (sessionUserId != null && sessionUserId === delegateUserId ? "DELEGATE" : "ADMIN") as ActorKind,
    };
}

/** Sentencia de inserción, para sumarla al db.batch de la escritura que audita. */
export function rsvpEventInsert(data: {
    familyId: number;
    status: RsvpStatus;
    actor: Awaited<ReturnType<typeof rsvpActor>>;
    attendees?: RsvpAttendee[];
}) {
    return db.insert(rsvpEvents).values({
        familyId: data.familyId,
        status: data.status,
        ...data.actor,
        attendees: JSON.stringify(data.attendees ?? []),
    });
}
