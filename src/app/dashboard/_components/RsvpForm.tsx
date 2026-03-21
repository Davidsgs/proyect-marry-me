"use client";

import { useState } from "react";
import { updateFamilyRsvp } from "@/app/actions/rsvp";
import type { families, users } from "@/db/schema";
import { Check, X, Loader2 } from "lucide-react";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
}

export default function RsvpForm({ family, members }: Props) {
    const [status, setStatus] = useState<'PENDING' | 'CONFIRMED' | 'DECLINED'>(family.globalRsvpStatus as 'PENDING' | 'CONFIRMED' | 'DECLINED');
    const [memberStatus, setMemberStatus] = useState<Record<number, boolean>>(
        members.reduce((acc, m) => ({ ...acc, [m.id]: Boolean(m.isConfirmed) }), {})
    );
    const [isPending, setIsPending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleToggleMember = (id: number) => {
        setMemberStatus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");
        setSuccess(false);

        try {
            const updates = Object.entries(memberStatus).map(([id, isConfirmed]) => ({
                userId: Number(id),
                isConfirmed
            }));
            await updateFamilyRsvp(family.id, status, updates);
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ocurrió un error al confirmar.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-4 bg-wedding-olive/10 text-wedding-olive rounded-lg text-sm font-medium flex items-center gap-2"><Check className="w-5 h-5"/> ¡Confirmación guardada con éxito!</div>}

            <div className="space-y-4">
                <h3 className="text-xl font-serif text-wedding-sage-darkest border-b border-wedding-sage/20 pb-2">Estado General</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 flex items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition-all ${status === 'CONFIRMED' ? 'border-wedding-olive bg-wedding-olive/5 text-wedding-olive' : 'border-gray-200 text-gray-500 hover:border-wedding-sage'}`}>
                        <input type="radio" name="globalStatus" value="CONFIRMED" checked={status === 'CONFIRMED'} onChange={() => setStatus('CONFIRMED')} className="sr-only" />
                        <Check className={`w-5 h-5 mr-2 ${status === 'CONFIRMED' ? 'opacity-100' : 'opacity-50'}`} />
                        <span className="font-semibold tracking-wide">Asistiremos</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition-all ${status === 'DECLINED' ? 'border-wedding-blush bg-wedding-blush/5 text-wedding-blush' : 'border-gray-200 text-gray-500 hover:border-wedding-sage'}`}>
                        <input type="radio" name="globalStatus" value="DECLINED" checked={status === 'DECLINED'} onChange={() => { setStatus('DECLINED'); setMemberStatus(members.reduce((acc, m) => ({...acc, [m.id]: false}), {})) }} className="sr-only" />
                        <X className={`w-5 h-5 mr-2 ${status === 'DECLINED' ? 'opacity-100' : 'opacity-50'}`} />
                        <span className="font-semibold tracking-wide">No Podremos</span>
                    </label>
                </div>
            </div>

            {status !== 'DECLINED' && (
               <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-500">
                    <h3 className="text-xl font-serif text-wedding-sage-darkest border-b border-wedding-sage/20 pb-2">Invitados a Confirmar</h3>
                    <p className="text-xs text-gray-500 font-light mb-4">Por favor selecciona quiénes asistirán marcando la casilla correspondiente.</p>
                    <ul className="space-y-3">
                        {members.map(m => (
                            <li key={m.id} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all ${memberStatus[m.id] ? 'border-wedding-sage/40 bg-wedding-cream/30' : 'border-gray-100 bg-gray-50 cursor-pointer'}`} onClick={() => handleToggleMember(m.id)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${memberStatus[m.id] ? 'bg-wedding-olive text-white' : 'bg-gray-200 text-transparent'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className={`font-medium sm:text-lg ${memberStatus[m.id] ? 'text-wedding-sage-darkest' : 'text-gray-500 line-through'}`}>{m.name}</span>
                                </div>
                                <span className="text-xs text-gray-400 capitalize">{m.role === 'MAIN_GUEST' ? 'Principal' : 'Invitado'}</span>
                            </li>
                        ))}
                    </ul>
               </div>
            )}

            <button disabled={isPending || status === 'PENDING'} type="submit" className="w-full py-4 bg-wedding-sage hover:bg-wedding-olive text-wedding-cream rounded-xl font-serif tracking-widest uppercase transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isPending ? "Guardando..." : "Confirmar Asistencia"}
            </button>
        </form>
    )
}
