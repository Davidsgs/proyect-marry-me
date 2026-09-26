"use client";

import type { families, users } from "@/db/schema";
import { Check, Heart, Lock, Pencil } from "lucide-react";
import { formatDeadline } from "./RsvpForm";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    deadline: Date | null;
    isLockedHard: boolean;
    onModify: () => void;
}

export default function RsvpSubmittedView({ family, members, deadline, isLockedHard, onModify }: Props) {
    const isConfirmed = family.globalRsvpStatus === "CONFIRMED";
    const attending = members.filter((m) => m.isConfirmed);
    const notAttending = members.filter((m) => !m.isConfirmed);
    const formattedDeadline = formatDeadline(deadline);

    return (
        <div className="space-y-8">
            <div className="text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
                <span
                    className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
                        isConfirmed ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
                    }`}
                >
                    {isConfirmed ? <Check className="w-7 h-7" strokeWidth={2.5} /> : <Heart className="w-6 h-6" />}
                </span>
                <h2 className="text-3xl md:text-4xl font-serif italic text-primary text-balance">
                    {isConfirmed ? "¡Gracias por confirmar!" : "Gracias por avisarnos"}
                </h2>
                <p className="max-w-md mx-auto text-base text-on-surface-variant leading-relaxed text-pretty">
                    {isConfirmed
                        ? "Nos emociona muchísimo compartir este día con ustedes. Abajo tienes todo lo que necesitas saber."
                        : "Lamentamos que no puedan venir. Los tendremos muy presentes ese día."}
                </p>
            </div>

            {isConfirmed && (
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-secondary-container/50 p-5">
                        <h3 className="text-sm font-medium text-on-secondary-container mb-2">
                            {attending.length === 1 ? "Viene" : `Vienen ${attending.length}`}
                        </h3>
                        <ul className="space-y-1 text-base text-on-surface">
                            {attending.map((m) => <li key={m.id}>{m.name} {m.lastName}</li>)}
                        </ul>
                    </div>
                    {notAttending.length > 0 && (
                        <div className="rounded-2xl bg-surface-container-low p-5">
                            <h3 className="text-sm font-medium text-on-surface-variant mb-2">No vienen</h3>
                            <ul className="space-y-1 text-base text-on-surface-variant">
                                {notAttending.map((m) => <li key={m.id}>{m.name} {m.lastName}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {isLockedHard ? (
                <div className="p-5 rounded-2xl bg-surface-container-low flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                        El plazo para cambiar la respuesta terminó el <strong className="font-medium text-on-surface">{formattedDeadline}</strong>.
                        Si necesitas cambiar algo, escríbeles directamente a David o Rocío.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={onModify}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-medium"
                    >
                        <Pencil className="w-4 h-4" />
                        Cambiar respuesta
                    </button>
                    {formattedDeadline && (
                        <p className="text-sm text-on-surface-variant text-center">Puedes cambiarla hasta el {formattedDeadline}.</p>
                    )}
                </div>
            )}
        </div>
    );
}
