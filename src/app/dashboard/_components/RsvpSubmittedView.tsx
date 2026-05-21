"use client";

import type { families, users } from "@/db/schema";
import { Check, X, Lock, Calendar, Edit2 } from "lucide-react";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    deadline: Date | null;
    isLockedHard: boolean;
    onModify: () => void;
}

export default function RsvpSubmittedView({ family, members, deadline, isLockedHard, onModify }: Props) {
    const isConfirmed = family.globalRsvpStatus === "CONFIRMED";

    const deadlineDate = deadline ? new Date(deadline) : null;
    const formattedDeadline = deadlineDate
        ? new Intl.DateTimeFormat("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: false
          }).format(deadlineDate)
        : "";

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 relative">
            {/* Header state card */}
            <div className={`p-8 md:p-10 rounded-3xl text-center space-y-5 relative overflow-hidden transition-all ${
                isConfirmed
                    ? "bg-wedding-sage/10 border border-wedding-sage/25"
                    : "bg-wedding-terracotta/10 border border-wedding-terracotta/25"
            }`}>
                {/* Botanical glow */}
                <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none ${
                    isConfirmed ? "bg-wedding-sage" : "bg-wedding-terracotta"
                }`} />
                <div className={`absolute -left-16 -bottom-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    isConfirmed ? "bg-wedding-sage" : "bg-wedding-blush"
                }`} />

                <div className="relative mx-auto w-20 h-20 rounded-full flex items-center justify-center">
                    {isConfirmed ? (
                        <div className="w-16 h-16 rounded-full bg-white/[0.08] border border-wedding-sage/40 flex items-center justify-center text-wedding-sage shadow-[0_4px_20px_rgba(175,195,177,0.2)]">
                            <Check className="w-7 h-7 stroke-[2.5]" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-white/[0.08] border border-wedding-terracotta/40 flex items-center justify-center text-wedding-terracotta shadow-[0_4px_20px_rgba(217,163,160,0.2)]">
                            <X className="w-7 h-7 stroke-[2.5]" />
                        </div>
                    )}
                </div>

                <div className="space-y-3 relative">
                    <h3 className="text-3xl md:text-4xl font-serif italic text-wedding-cream tracking-wide">
                        {isConfirmed ? "¡Asistencia Confirmada!" : "No Podrán Asistir"}
                    </h3>
                    <p className="max-w-md mx-auto text-sm md:text-base text-wedding-cream/60 font-light leading-relaxed">
                        {isConfirmed
                            ? "¡Qué gran alegría! Nos emociona muchísimo saber que compartiremos este día tan especial con ustedes. Nos vemos muy pronto."
                            : "Lamentamos que no puedan asistir, pero sabemos que nos acompañarán con el cariño de siempre a la distancia."}
                    </p>
                </div>
            </div>

            {/* Member list */}
            {isConfirmed && (
                <div className="space-y-4 relative">
                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-wedding-sage/25"></span>
                        <h4 className="text-[11px] font-light text-wedding-sage/80 tracking-[0.3em] uppercase">
                            Miembros confirmados
                        </h4>
                        <span className="h-px flex-1 bg-wedding-sage/25"></span>
                    </div>
                    <ul className="space-y-2.5">
                        {members.map(m => (
                            <li
                                key={m.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                    m.isConfirmed
                                        ? "border-wedding-sage/25 bg-wedding-sage/10 text-wedding-cream"
                                        : "border-wedding-sage/10 bg-white/[0.03] text-wedding-cream/30"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                        m.isConfirmed ? "bg-wedding-sage text-wedding-sage-darkest" : "bg-white/10 border border-wedding-sage/15 text-transparent"
                                    }`}>
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                    <span className={`font-medium ${m.isConfirmed ? "" : "line-through"}`}>
                                        {m.name} {m.lastName}
                                    </span>
                                </div>
                                <span className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                                    m.isConfirmed
                                        ? "text-wedding-sage bg-wedding-sage/15"
                                        : "text-wedding-cream/25 bg-white/[0.04]"
                                }`}>
                                    {m.isConfirmed ? "Asistirá" : "No asiste"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action panel */}
            <div className="pt-2 relative">
                {isLockedHard ? (
                    <div className="p-5 md:p-6 rounded-2xl bg-wedding-terracotta/10 border border-wedding-terracotta/25 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="p-3 bg-wedding-terracotta/15 text-wedding-terracotta rounded-2xl shrink-0">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-serif italic text-wedding-cream text-base">Respuesta bloqueada</h5>
                            <p className="text-xs text-wedding-cream/50 font-light leading-relaxed">
                                El plazo límite para modificar confirmaciones venció el <strong className="text-wedding-cream/70 font-medium">{formattedDeadline}</strong>.
                                Si necesitas realizar un cambio de fuerza mayor, contacta directamente a David o Rocío.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={onModify}
                            className="w-full py-4 px-6 border border-wedding-sage/30 hover:border-wedding-sage hover:bg-wedding-sage/10 text-wedding-cream/70 hover:text-wedding-cream font-serif italic tracking-[0.2em] uppercase text-sm rounded-2xl transition-all flex items-center justify-center gap-2 group duration-300"
                        >
                            <Edit2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                            Modificar mi respuesta
                        </button>

                        {deadlineDate && (
                            <p className="text-center text-xs text-wedding-cream/40 font-light flex items-center justify-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-wedding-sage" />
                                Tienes tiempo para modificar tu respuesta hasta el {formattedDeadline}.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
