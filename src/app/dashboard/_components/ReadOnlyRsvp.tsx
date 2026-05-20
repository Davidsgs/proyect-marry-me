"use client";

import type { families, users } from "@/db/schema";
import { Check, X } from "lucide-react";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    delegate: { name: string; lastName: string; email: string } | null;
}

export default function ReadOnlyRsvp({ family, members, delegate }: Props) {
    const isDeclined = family.globalRsvpStatus === 'DECLINED';

    return (
        <div className="space-y-8">
            <div className="text-center p-6 bg-wedding-cream/30 rounded-xl border border-wedding-sage/10">
                <h3 className="text-lg font-serif tracking-wide text-wedding-sage-darkest mb-2">Estado Actual de Asistencia</h3>
                {family.globalRsvpStatus === 'PENDING' ? (
                    <span className="inline-block px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full font-medium tracking-widest text-sm border border-yellow-200">
                        PENDIENTE DE CONFIRMACIÓN
                    </span>
                ) : isDeclined ? (
                    <span className="inline-block px-4 py-2 bg-wedding-blush/10 text-wedding-blush rounded-full font-medium tracking-widest text-sm border border-wedding-blush/20">
                        HAN DECLINADO
                    </span>
                 ) : (
                    <span className="inline-block px-4 py-2 bg-wedding-olive/10 text-wedding-olive rounded-full font-medium tracking-widest text-sm border border-wedding-olive/20">
                        ASISTENCIA CONFIRMADA
                    </span>
                )}
            </div>

            {!isDeclined && members.length > 0 && (
               <div className="space-y-4">
                    <h3 className="text-xl font-serif text-wedding-sage-darkest border-b border-wedding-sage/20 pb-2">Lista de Invitados</h3>
                    <ul className="space-y-3">
                        {members.map(m => (
                            <li key={m.id} className="flex items-center justify-between p-4 rounded-lg border border-wedding-sage/10 bg-white shadow-sm">
                                <span className={`font-medium ${m.isConfirmed ? 'text-wedding-sage-darkest' : 'text-gray-400 line-through'}`}>{m.name}</span>
                                {m.isConfirmed ? (
                                     <span className="flex items-center text-xs text-wedding-olive bg-wedding-olive/10 px-2 py-1 rounded-full"><Check className="w-3 h-3 mr-1"/> Asistirá</span>
                                ) : (
                                     <span className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"><X className="w-3 h-3 mr-1"/> No asistirá</span>
                                )}
                            </li>
                        ))}
                    </ul>
               </div>
            )}
            
            {delegate ? (
                <div className="p-5 rounded-xl bg-wedding-blush/5 border border-wedding-blush/20 text-wedding-sage-darkest text-sm font-light flex items-start gap-4 mt-8 pt-6 border-t border-wedding-sage/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-2 bg-wedding-blush/10 rounded-lg text-wedding-blush shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <span className="font-medium text-wedding-olive block mb-1">Confirmación a través de tu Delegado</span>
                        Para confirmar tu asistencia, <span className="font-semibold text-wedding-sage-darkest">{delegate.name} {delegate.lastName}</span> ({delegate.email}) debe ingresar y hacerlo por todo el grupo.
                    </div>
                </div>
            ) : (
                <p className="text-center text-sm font-light text-gray-500 italic mt-8 pt-4 border-t border-wedding-sage/10">
                    Si deseas modificar tu asistencia, por favor contacta al representante de tu familia o a los novios.
                </p>
            )}
        </div>
    )
}
