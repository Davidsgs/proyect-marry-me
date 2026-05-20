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
    
    // Safety check for next-auth serialized dates
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
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header state card */}
            <div className={`p-6 md:p-8 rounded-2xl border text-center space-y-4 shadow-sm relative overflow-hidden transition-all ${
                isConfirmed 
                    ? "bg-wedding-sage/5 border-wedding-sage/20 text-wedding-sage-darkest"
                    : "bg-wedding-blush/5 border-wedding-blush/20 text-wedding-blush"
            }`}>
                {/* Backdrop Glow */}
                <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
                    isConfirmed ? "bg-wedding-sage" : "bg-wedding-blush"
                }`} />

                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-inner transition-transform hover:scale-105 duration-300">
                    {isConfirmed ? (
                        <div className="w-12 h-12 rounded-full bg-wedding-sage/25 flex items-center justify-center text-wedding-olive animate-pulse">
                            <Check className="w-6 h-6 stroke-[3]" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-wedding-blush/25 flex items-center justify-center text-wedding-blush animate-pulse">
                            <X className="w-6 h-6 stroke-[3]" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-serif tracking-wide">
                        {isConfirmed ? "¡Asistencia Confirmada!" : "No Podrán Asistir"}
                    </h3>
                    <p className="max-w-md mx-auto text-sm text-gray-600 font-light leading-relaxed">
                        {isConfirmed 
                            ? "¡Qué gran alegría! Nos emociona muchísimo saber que compartiremos este día tan especial con ustedes. Nos vemos muy pronto."
                            : "Lamentamos que no puedan asistir, pero sabemos que nos acompañarán con el cariño de siempre a la distancia."}
                    </p>
                </div>
            </div>

            {/* List of members with reduced opacity (disabled view) */}
            {isConfirmed && (
                <div className="space-y-4 opacity-75">
                    <h4 className="text-sm font-serif text-wedding-sage-darkest tracking-wider uppercase border-b border-wedding-sage/10 pb-2">
                        Miembros confirmados
                    </h4>
                    <ul className="space-y-3">
                        {members.map(m => (
                            <li 
                                key={m.id} 
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all ${
                                    m.isConfirmed 
                                        ? "border-wedding-sage/30 bg-wedding-cream/20 text-wedding-sage-darkest" 
                                        : "border-gray-100 bg-gray-50/50 text-gray-400"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                        m.isConfirmed ? "bg-wedding-olive text-white" : "bg-gray-200 text-transparent"
                                    }`}>
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                    <span className={`font-medium ${m.isConfirmed ? "" : "line-through text-gray-400"}`}>
                                        {m.name} {m.lastName}
                                    </span>
                                </div>
                                <span className="text-xs uppercase tracking-wider text-gray-400 px-2.5 py-0.5 rounded-full bg-gray-100/50">
                                    {m.isConfirmed ? "Asistirá" : "No asiste"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action panel or Locked banner */}
            <div className="pt-4">
                {isLockedHard ? (
                    <div className="p-4 md:p-5 rounded-xl bg-gray-50 border border-gray-200/60 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all hover:bg-gray-100/50">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-semibold text-gray-800 text-sm">Respuesta bloqueada permanentemente</h5>
                            <p className="text-xs text-gray-500 font-light leading-relaxed">
                                El plazo límite para modificar confirmaciones venció el <strong className="text-gray-700">{formattedDeadline}</strong>. 
                                Si necesitas realizar un cambio de fuerza mayor, contacta directamente a David o Rocío.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button 
                            type="button" 
                            onClick={onModify}
                            className="w-full py-3.5 px-6 border border-wedding-sage hover:bg-wedding-sage hover:text-wedding-cream text-wedding-olive font-serif tracking-widest uppercase rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group duration-300"
                        >
                            <Edit2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                            Modificar mi respuesta
                        </button>
                        
                        {deadlineDate && (
                            <p className="text-center text-xs text-gray-500 font-light flex items-center justify-center gap-1">
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
