"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFamilyRsvp } from "@/app/actions/rsvp";
import type { families, users } from "@/db/schema";
import { Check, X, Loader2, CalendarClock } from "lucide-react";
import RsvpSubmittedView from "./RsvpSubmittedView";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    isLocked: boolean;
    isLockedHard: boolean;
    deadline: Date | null;
}

type Status = "PENDING" | "CONFIRMED" | "DECLINED";

export function formatDeadline(deadline: Date | null): string {
    if (!deadline) return "";
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(deadline));
}

export default function RsvpForm({ family, members, isLocked, isLockedHard, deadline }: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState(!isLocked);
    const [status, setStatus] = useState<Status>(family.globalRsvpStatus as Status);
    const [memberStatus, setMemberStatus] = useState<Record<number, boolean>>(
        Object.fromEntries(members.map((m) => [m.id, family.globalRsvpStatus === "PENDING" ? true : Boolean(m.isConfirmed)])),
    );
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");

    const attendingCount = members.filter((m) => memberStatus[m.id]).length;
    const needsSomeone = status === "CONFIRMED" && attendingCount === 0;
    const canSubmit = status !== "PENDING" && !needsSomeone && !isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsPending(true);
        setError("");
        try {
            const updates = members.map((m) => ({ userId: m.id, isConfirmed: status === "CONFIRMED" && Boolean(memberStatus[m.id]) }));
            await updateFamilyRsvp(family.id, status, updates);
            router.refresh();
            setEditing(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "No pudimos guardar tu respuesta. Inténtalo de nuevo.");
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

    const formattedDeadline = formatDeadline(deadline);

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
                <h2 className="font-serif italic text-3xl text-primary">¿Nos acompañan?</h2>
                {formattedDeadline && (
                    <p className="text-sm text-on-surface-variant flex items-start gap-2">
                        <CalendarClock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Puedes responder o cambiar tu respuesta hasta el <strong className="font-medium text-on-surface">{formattedDeadline}</strong>.</span>
                    </p>
                )}
            </div>

            {error && (
                <p role="alert" className="p-4 rounded-xl bg-error/10 text-error text-sm">{error}</p>
            )}

            <fieldset className="space-y-3">
                <legend className="text-base font-medium text-on-surface mb-3">Tu respuesta</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                    <Choice
                        checked={status === "CONFIRMED"}
                        onChange={() => setStatus("CONFIRMED")}
                        icon={Check}
                        label="Sí, asistiremos"
                        tone="good"
                    />
                    <Choice
                        checked={status === "DECLINED"}
                        onChange={() => setStatus("DECLINED")}
                        icon={X}
                        label="No podremos asistir"
                        tone="muted"
                    />
                </div>
            </fieldset>

            {status === "CONFIRMED" && (
                <fieldset className="space-y-3 animate-in fade-in duration-300">
                    <legend className="text-base font-medium text-on-surface">¿Quiénes vendrán?</legend>
                    <p className="text-sm text-on-surface-variant">Desmarca a quien no pueda venir.</p>
                    <ul className="space-y-2">
                        {members.map((m) => {
                            const checked = Boolean(memberStatus[m.id]);
                            return (
                                <li key={m.id}>
                                    <label
                                        className={`flex items-center gap-3 min-h-14 px-4 py-3 rounded-xl cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                                            checked ? "bg-secondary-container/60" : "bg-surface-container-low"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => setMemberStatus((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                                            className="sr-only"
                                        />
                                        <span
                                            aria-hidden
                                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                                checked ? "bg-on-secondary-container text-on-primary" : "bg-surface-container-lowest shadow-[inset_0_1px_3px_rgba(81,68,67,0.2)]"
                                            }`}
                                        >
                                            {checked && <Check className="w-4 h-4" strokeWidth={3} />}
                                        </span>
                                        <span className="flex-1 text-base text-on-surface">
                                            {m.name} {m.lastName}
                                        </span>
                                        <span className="text-sm text-on-surface-variant">
                                            {checked ? "Viene" : "No viene"}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    {needsSomeone && (
                        <p className="text-sm text-error" role="status">
                            Marca al menos a una persona, o elige «No podremos asistir».
                        </p>
                    )}
                </fieldset>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
                {isLocked && (
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="py-4 px-6 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    disabled={!canSubmit}
                    type="submit"
                    className="flex-1 py-4 px-6 bg-primary text-on-primary rounded-xl font-medium text-base shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isPending ? "Enviando…" : "Enviar respuesta"}
                </button>
            </div>
            {status === "PENDING" && (
                <p className="text-sm text-on-surface-variant text-center -mt-4">Elige una respuesta para poder enviarla.</p>
            )}
        </form>
    );
}

function Choice({
    checked, onChange, icon: Icon, label, tone,
}: {
    checked: boolean;
    onChange: () => void;
    icon: typeof Check;
    label: string;
    tone: "good" | "muted";
}) {
    const on = tone === "good"
        ? "bg-secondary-container text-on-secondary-container ring-2 ring-on-secondary-container"
        : "bg-primary-container/50 text-on-primary-container ring-2 ring-primary";
    return (
        <label
            className={`flex items-center justify-center gap-2 min-h-16 px-4 rounded-2xl cursor-pointer text-base font-medium transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                checked ? on : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
        >
            <input type="radio" name="rsvp" checked={checked} onChange={onChange} className="sr-only" />
            <Icon className="w-5 h-5" />
            {label}
        </label>
    );
}
