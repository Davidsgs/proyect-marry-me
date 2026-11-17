"use client";

import type { families, users } from "@/db/schema";
import { CalendarClock, Check, Heart, Lock, Pencil, UserCheck, UserMinus, Users, Utensils } from "lucide-react";
import { PetalBurst } from "@/components/Brand";
import { dietaryText } from "@/lib/diet";
import { formatDeadline } from "./RsvpForm";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    deadline: Date | null;
    isLockedHard: boolean;
    onModify: () => void;
    /** Recién confirmado: lluvia de pétalos alrededor del ícono. */
    celebrate?: boolean;
}

export default function RsvpSubmittedView({ family, members, deadline, isLockedHard, onModify, celebrate }: Props) {
    const isConfirmed = family.globalRsvpStatus === "CONFIRMED";
    const attending = members.filter((m) => m.isConfirmed);
    const notAttending = members.filter((m) => !m.isConfirmed);
    const formattedDeadline = formatDeadline(deadline);

    // Confirmados en escritorio: mensaje y botón a la izquierda, quién viene a la derecha.
    return (
        <div className={`flex flex-col gap-8 ${isConfirmed ? "lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-10" : "max-w-xl mx-auto"}`}>
            <div className="flex flex-col gap-8">
            <div className="text-center space-y-3">
                <span
                    className={`mg-pop relative mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
                        isConfirmed ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container text-on-primary-container"
                    }`}
                >
                    {isConfirmed ? <Check className="w-7 h-7" strokeWidth={2.5} aria-hidden /> : <Heart className="w-6 h-6" aria-hidden />}
                    {celebrate && isConfirmed && <PetalBurst />}
                </span>
                <h2 className="mg-mask mg-d-2 font-serif text-4xl sm:text-5xl leading-display text-oliva-profundo text-balance">
                    {isConfirmed ? "¡Gracias por confirmar!" : "Gracias por avisarnos"}
                </h2>
                <p className="mg-rise mg-d-4 max-w-md mx-auto text-base leading-relaxed text-pretty">
                    {isConfirmed
                        ? "Nos emociona muchísimo compartir este día con ustedes. Sigue para ver todo lo que necesitas saber."
                        : "Lamentamos que no puedan venir. Los tendremos muy presentes ese día."}
                </p>
            </div>
            {isConfirmed && <div className="mg-rise mg-d-5"><InvitationValidity count={members.length} /></div>}

            {isLockedHard ? (
                <div className="mg-rise mg-d-6 p-5 rounded-2xl bg-surface-container-low flex flex-col items-center gap-2 text-center">
                    <Lock className="w-5 h-5 text-oliva-profundo shrink-0" aria-hidden />
                    <p className="text-sm text-on-surface-variant leading-relaxed text-pretty">
                        El plazo para cambiar la respuesta terminó el <strong className="font-medium text-on-surface">{formattedDeadline}</strong>.
                        Si necesitas cambiar algo, escríbeles directamente a David o Rocío.
                    </p>
                </div>
            ) : (
                <div className="mg-rise mg-d-6 flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={onModify}
                        className="inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-surface-container-low font-sans text-on-surface hover:bg-surface-container transition-colors font-medium"
                    >
                        <Pencil className="w-4 h-4" aria-hidden />
                        Cambiar respuesta
                    </button>
                    {formattedDeadline && (
                        <p className="text-sm text-on-surface-variant text-center flex items-center justify-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-oliva-profundo shrink-0" aria-hidden />
                            <span>Puedes cambiarla hasta el <strong className="font-medium text-on-surface">{formattedDeadline}</strong>.</span>
                        </p>
                    )}
                </div>
            )}
            </div>

            {isConfirmed && <div className="mg-rise mg-d-5"><AttendanceLists attending={attending} notAttending={notAttending} /></div>}
        </div>
    );
}

type Member = typeof users.$inferSelect;

// Bloques «Vienen» / «No vienen». Quien no viene va en su propio bloque, sin rojo.
export function AttendanceLists({ attending, notAttending }: { attending: Member[]; notAttending: Member[] }) {
    return (
        // Flex centrado: si solo hay bloque «Vienen», queda en el medio y no a la izquierda.
        <div className="flex flex-wrap justify-center gap-4 text-center [&>div]:w-full sm:[&>div]:w-[calc(50%-0.5rem)]">
            <div className="rounded-2xl bg-secondary-container/70 p-5">
                <h3 className="text-sm font-medium text-on-secondary-container mb-2 flex items-center justify-center gap-1.5">
                    <UserCheck className="w-4 h-4" aria-hidden />
                    {attending.length === 1 ? "Viene" : `Vienen ${attending.length}`}
                </h3>
                <ul className="space-y-1.5 text-base text-on-surface">
                    {attending.map((m) => {
                        const diet = dietaryText(m.dietary, m.dietaryNote);
                        return (
                            <li key={m.id}>
                                {m.name} {m.lastName}
                                {diet && (
                                    <span className="flex items-center justify-center gap-1 text-sm text-on-surface-variant">
                                        <Utensils className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                        {diet}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
            {notAttending.length > 0 && (
                <div className="rounded-2xl bg-surface-container-low p-5">
                    <h3 className="text-sm font-medium text-on-surface-variant mb-2 flex items-center justify-center gap-1.5">
                        <UserMinus className="w-4 h-4" aria-hidden />
                        {notAttending.length === 1 ? "No viene" : "No vienen"}
                    </h3>
                    <ul className="space-y-1.5 text-base text-on-surface-variant">
                        {notAttending.map((m) => <li key={m.id}>{m.name} {m.lastName}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Para cuántos vale la invitación (todos los integrantes de la familia) y la
// letra chica: no se cede el lugar de quien no viene.
export function InvitationValidity({ count }: { count: number }) {
    return (
        <div className="text-center space-y-1.5">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3.5 py-1 text-sm text-on-surface">
                <Users className="w-4 h-4 text-oliva-profundo" aria-hidden />
                Invitación válida para <strong className="font-semibold tabular-nums">{count}</strong> {count === 1 ? "persona" : "personas"}
            </p>
            <p className="mx-auto max-w-sm text-xs text-on-surface-variant text-pretty">
                La invitación es personal e intransferible: si alguien no puede venir, su lugar no puede cederse a otra persona.
            </p>
        </div>
    );
}
