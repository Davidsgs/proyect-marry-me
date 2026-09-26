import type { families, users } from "@/db/schema";
import { Check, Clock, Heart } from "lucide-react";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    delegate: { name: string; lastName: string; email: string | null } | null;
}

// Vista para miembros que no son delegados: ven la respuesta de su familia,
// pero la confirma el delegado.
export default function ReadOnlyRsvp({ family, members, delegate }: Props) {
    const status = family.globalRsvpStatus;
    const delegateName = delegate ? `${delegate.name} ${delegate.lastName}` : null;

    if (status === "PENDING") {
        return (
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <span className="w-12 h-12 rounded-full bg-surface-container-low text-primary flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                    </span>
                    <div className="space-y-2">
                        <h2 className="font-serif italic text-3xl text-primary">Tu familia aún no ha respondido</h2>
                        <p className="text-base text-on-surface-variant leading-relaxed">
                            {delegateName ? (
                                <>
                                    <strong className="font-medium text-on-surface">{delegateName}</strong> confirma la asistencia por toda la familia
                                    {delegate?.email ? <> entrando con <span className="text-on-surface">{delegate.email}</span></> : null}.
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
            </div>
        );
    }

    if (status === "DECLINED") {
        return (
            <div className="text-center space-y-3">
                <span className="mx-auto w-14 h-14 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                </span>
                <h2 className="font-serif italic text-3xl text-primary">Tu familia avisó que no podrá venir</h2>
                <p className="text-base text-on-surface-variant">
                    {delegateName ? `Si algo cambia, habla con ${delegateName} o con David y Rocío.` : "Si algo cambia, escríbeles a David o Rocío."}
                </p>
            </div>
        );
    }

    const attending = members.filter((m) => m.isConfirmed);
    const notAttending = members.filter((m) => !m.isConfirmed);
    return (
        <div className="space-y-6">
            <div className="text-center space-y-3">
                <span className="mx-auto w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <Check className="w-7 h-7" strokeWidth={2.5} />
                </span>
                <h2 className="font-serif italic text-3xl text-primary">¡Tu familia ya confirmó!</h2>
                {delegateName && (
                    <p className="text-base text-on-surface-variant">Respondió {delegateName}. Si algo cambia, avísale.</p>
                )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-secondary-container/50 p-5">
                    <h3 className="text-sm font-medium text-on-secondary-container mb-2">Vienen</h3>
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
        </div>
    );
}
