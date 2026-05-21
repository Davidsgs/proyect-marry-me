"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFamilyRsvp } from "@/app/actions/rsvp";
import type { families, users } from "@/db/schema";
import { Check, X, Loader2, Calendar } from "lucide-react";
import RsvpSubmittedView from "./RsvpSubmittedView";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    isLocked: boolean;
    isLockedHard: boolean;
    deadline: Date | null;
}

export default function RsvpForm({ family, members, isLocked, isLockedHard, deadline }: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState(!isLocked);
    const [status, setStatus] = useState<'PENDING' | 'CONFIRMED' | 'DECLINED'>(family.globalRsvpStatus as 'PENDING' | 'CONFIRMED' | 'DECLINED');
    const [memberStatus, setMemberStatus] = useState<Record<number, boolean>>(
        members.reduce((acc, m) => ({
            ...acc,
            [m.id]: family.globalRsvpStatus === 'PENDING' ? true : Boolean(m.isConfirmed),
        }), {})
    );
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");

    const handleToggleMember = (id: number) => {
        setMemberStatus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const updates = Object.entries(memberStatus).map(([id, isConfirmed]) => ({
                userId: Number(id),
                isConfirmed
            }));
            await updateFamilyRsvp(family.id, status, updates);
            router.refresh();
            setEditing(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ocurrió un error al confirmar.");
        } finally {
            setIsPending(false);
        }
    };

    if (!editing) {
        return (
            <RsvpSubmittedView
                family={family}
                members={members}
                deadline={deadline}
                isLockedHard={isLockedHard}
                onModify={() => setEditing(true)}
            />
        );
    }

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
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
            {error && (
                <div className="p-4 bg-wedding-terracotta/15 border border-wedding-terracotta/30 text-wedding-blush rounded-lg text-sm">
                    {error}
                </div>
            )}

            {deadlineDate && (
                <div className="p-4 bg-wedding-sage/10 border border-wedding-sage/25 text-wedding-cream/80 rounded-xl text-xs font-light flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-wedding-sage shrink-0" />
                    <span>
                        Puedes modificar tus respuestas en cualquier momento hasta el{" "}
                        <strong className="font-semibold text-wedding-sage">{formattedDeadline}</strong>.
                    </span>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-xl font-serif text-wedding-cream border-b border-wedding-sage/20 pb-2">Estado General</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 flex items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        status === 'CONFIRMED'
                            ? 'border-wedding-sage bg-wedding-sage/15 text-wedding-sage'
                            : 'border-wedding-sage/20 text-wedding-cream/40 hover:border-wedding-sage/50 hover:text-wedding-cream/60'
                    }`}>
                        <input type="radio" name="globalStatus" value="CONFIRMED" checked={status === 'CONFIRMED'} onChange={() => setStatus('CONFIRMED')} className="sr-only" />
                        <Check className={`w-5 h-5 mr-2 ${status === 'CONFIRMED' ? 'opacity-100' : 'opacity-50'}`} />
                        <span className="font-semibold tracking-wide">Asistiremos</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        status === 'DECLINED'
                            ? 'border-wedding-terracotta bg-wedding-terracotta/15 text-wedding-terracotta'
                            : 'border-wedding-sage/20 text-wedding-cream/40 hover:border-wedding-terracotta/40 hover:text-wedding-cream/60'
                    }`}>
                        <input type="radio" name="globalStatus" value="DECLINED" checked={status === 'DECLINED'} onChange={() => { setStatus('DECLINED'); setMemberStatus(members.reduce((acc, m) => ({...acc, [m.id]: false}), {})) }} className="sr-only" />
                        <X className={`w-5 h-5 mr-2 ${status === 'DECLINED' ? 'opacity-100' : 'opacity-50'}`} />
                        <span className="font-semibold tracking-wide">No Podremos</span>
                    </label>
                </div>
            </div>

            {status !== 'DECLINED' && (
               <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-500">
                    <h3 className="text-xl font-serif text-wedding-cream border-b border-wedding-sage/20 pb-2">Invitados a Confirmar</h3>
                    <p className="text-xs text-wedding-cream/40 font-light mb-4">Por favor selecciona quiénes asistirán marcando la casilla correspondiente.</p>
                    <ul className="space-y-3">
                        {members.map(m => (
                            <li
                                key={m.id}
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all cursor-pointer ${
                                    memberStatus[m.id]
                                        ? 'border-wedding-sage/35 bg-wedding-sage/10'
                                        : 'border-wedding-sage/15 bg-white/[0.03]'
                                }`}
                                onClick={() => handleToggleMember(m.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                                        memberStatus[m.id] ? 'bg-wedding-sage text-wedding-sage-darkest' : 'bg-white/10 text-transparent'
                                    }`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className={`font-medium sm:text-lg ${memberStatus[m.id] ? 'text-wedding-cream' : 'text-wedding-cream/30 line-through'}`}>
                                        {m.name}
                                    </span>
                                </div>
                                <span className="text-xs text-wedding-cream/30 capitalize">
                                    {family.delegateUserId === m.id ? 'Titular' : 'Invitado'}
                                </span>
                            </li>
                        ))}
                    </ul>
               </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {isLocked && (
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="py-4 px-6 border border-wedding-sage/30 hover:bg-wedding-sage/10 text-wedding-cream/70 rounded-xl font-serif tracking-widest uppercase transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    disabled={isPending || status === 'PENDING'}
                    type="submit"
                    className="flex-1 py-4 bg-wedding-sage hover:bg-wedding-olive text-wedding-sage-darkest rounded-xl font-serif tracking-widest uppercase transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {isPending ? "Guardando..." : "Confirmar Asistencia"}
                </button>
            </div>
        </form>
    )
}
