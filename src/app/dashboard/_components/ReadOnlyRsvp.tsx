"use client";

import type { families, users } from "@/db/schema";
import { Check, X } from "lucide-react";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    delegate: { name: string; lastName: string; email: string | null } | null;
}

export default function ReadOnlyRsvp({ family, members, delegate }: Props) {
    const isDeclined = family.globalRsvpStatus === 'DECLINED';

    return (
        <div className="space-y-10 relative">
            <div className="text-center p-8 md:p-10 bg-gradient-to-br from-wedding-cream/60 via-white/40 to-wedding-sage/10 rounded-3xl border border-wedding-sage/25 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-wedding-sage/15 blur-3xl pointer-events-none"></div>
                <h3 className="text-[11px] font-light text-wedding-olive/70 tracking-[0.35em] uppercase mb-4 relative">
                    Estado actual
                </h3>
                <div className="relative">
                    {family.globalRsvpStatus === 'PENDING' ? (
                        <span className="inline-block px-5 py-2 bg-wedding-blush/25 text-wedding-terracotta rounded-full font-light tracking-[0.25em] text-xs uppercase border border-wedding-blush/40">
                            Pendiente de confirmación
                        </span>
                    ) : isDeclined ? (
                        <span className="inline-block px-5 py-2 bg-wedding-blush/20 text-wedding-terracotta rounded-full font-light tracking-[0.25em] text-xs uppercase border border-wedding-terracotta/30">
                            Han declinado
                        </span>
                    ) : (
                        <span className="inline-block px-5 py-2 bg-wedding-sage/25 text-wedding-olive rounded-full font-light tracking-[0.25em] text-xs uppercase border border-wedding-sage/40">
                            Asistencia confirmada
                        </span>
                    )}
                </div>
            </div>

            {!isDeclined && members.length > 0 && (
                <div className="space-y-4 relative">
                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-wedding-sage/30"></span>
                        <h3 className="text-[11px] font-light text-wedding-olive/80 tracking-[0.3em] uppercase">
                            Lista de invitados
                        </h3>
                        <span className="h-px flex-1 bg-wedding-sage/30"></span>
                    </div>
                    <ul className="space-y-2.5">
                        {members.map(m => (
                            <li key={m.id} className="flex items-center justify-between p-4 rounded-2xl border border-wedding-sage/20 bg-white/70">
                                <span className={`font-medium ${m.isConfirmed ? 'text-wedding-olive' : 'text-wedding-olive/40 line-through'}`}>{m.name}</span>
                                {m.isConfirmed ? (
                                    <span className="flex items-center text-[10px] uppercase tracking-[0.2em] text-wedding-olive bg-wedding-sage/20 px-3 py-1 rounded-full">
                                        <Check className="w-3 h-3 mr-1.5" /> Asistirá
                                    </span>
                                ) : (
                                    <span className="flex items-center text-[10px] uppercase tracking-[0.2em] text-wedding-olive/40 bg-wedding-cream/60 px-3 py-1 rounded-full">
                                        <X className="w-3 h-3 mr-1.5" /> No asistirá
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {delegate ? (
                <div className="p-6 rounded-2xl bg-wedding-blush/10 border border-wedding-blush/30 text-wedding-olive text-sm font-light flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
                    <div className="p-2.5 bg-white/60 border border-wedding-blush/30 rounded-xl text-wedding-terracotta shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-serif italic text-wedding-olive block mb-1 text-base">Confirmación a través de tu delegado</span>
                        <span className="text-wedding-olive/75 leading-relaxed">
                            Para confirmar tu asistencia, <span className="font-medium text-wedding-olive">{delegate.name} {delegate.lastName}</span>{delegate.email ? <> ({delegate.email})</> : null} debe ingresar y hacerlo por todo el grupo.
                        </span>
                    </div>
                </div>
            ) : (
                <p className="text-center text-xs font-light text-wedding-olive/60 italic pt-4 border-t border-wedding-sage/20">
                    Si deseas modificar tu asistencia, por favor contacta al representante de tu familia o a los novios.
                </p>
            )}
        </div>
    )
}
