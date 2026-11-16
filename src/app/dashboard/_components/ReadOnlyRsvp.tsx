import type { families, users } from "@/db/schema";
import { Check, Clock, Heart } from "lucide-react";
import { AttendanceLists } from "./RsvpSubmittedView";
import AdultsNote from "./AdultsNote";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    delegate: { name: string; lastName: string; email: string | null } | null;
    adultsNote: string | null;
}

const title = "font-serif text-4xl sm:text-5xl leading-none text-oliva-profundo text-balance";

// Vista para acompañantes: ven la respuesta de su familia, pero la confirma el delegado.
export default function ReadOnlyRsvp({ family, members, delegate, adultsNote }: Props) {
    const status = family.globalRsvpStatus;
    const delegateName = delegate ? `${delegate.name} ${delegate.lastName}` : null;

    if (status === "PENDING") {
        return (
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-full bg-surface-container-low text-oliva-profundo flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" aria-hidden />
                    </span>
                    <div className="space-y-3">
                        <h2 className={title}>Tu familia aún no ha respondido</h2>
                        <p className="text-base leading-relaxed">
                            {delegateName ? (
                                <>
                                    <strong className="font-medium">{delegateName}</strong> confirma la asistencia por toda la familia
                                    {delegate?.email ? <> entrando con <span className="break-all">{delegate.email}</span></> : null}.
                                    Si vas a venir (o no), avísale.
                                </>
                            ) : (
                                "Todavía no hay una persona encargada de confirmar por tu familia. Escríbeles a David o Rocío."
                            )}
                        </p>
                    </div>
                </div>
                {members.length > 1 && (
                    <div>
                        <h3 className="text-sm font-medium text-on-surface-variant mb-2">En esta invitación</h3>
                        <ul className="flex flex-wrap gap-2">
                            {members.map((m) => (
                                <li key={m.id} className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface text-sm">
                                    {m.name} {m.lastName}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {!family.isDirectFamily && <AdultsNote text={adultsNote} />}
            </div>
        );
    }

    if (status === "DECLINED") {
        return (
            <div className="text-center space-y-3">
                <span className="mx-auto w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                    <Heart className="w-6 h-6" aria-hidden />
                </span>
                <h2 className={title}>Tu familia avisó que no podrá venir</h2>
                <p className="text-base">
                    {delegateName ? `Si algo cambia, habla con ${delegateName} o con David y Rocío.` : "Si algo cambia, escríbeles a David o Rocío."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-3">
                <span className="mx-auto w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <Check className="w-7 h-7" strokeWidth={2.5} aria-hidden />
                </span>
                <h2 className={title}>¡Tu familia ya confirmó!</h2>
                {delegateName && (
                    <p className="text-base">Respondió {delegateName}. Si algo cambia, avísale.</p>
                )}
            </div>
            <AttendanceLists attending={members.filter((m) => m.isConfirmed)} notAttending={members.filter((m) => !m.isConfirmed)} />
            {!family.isDirectFamily && <AdultsNote text={adultsNote} />}
        </div>
    );
}
