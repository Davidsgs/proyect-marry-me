"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFamilyRsvp } from "@/app/actions/rsvp";
import type { families, users } from "@/db/schema";
import { Check, X, CalendarClock } from "lucide-react";
import { DIETARY, DIETARY_LABEL, DIETARY_NOTE_MAX, type Dietary } from "@/lib/diet";
import RsvpSubmittedView from "./RsvpSubmittedView";
import AdultsNote from "./AdultsNote";

interface Props {
    family: typeof families.$inferSelect;
    members: typeof users.$inferSelect[];
    isLocked: boolean;
    isLockedHard: boolean;
    deadline: Date | null;
    adultsNote: string | null;
}

type Status = "PENDING" | "CONFIRMED" | "DECLINED";
type Diet = { dietary: Dietary; note: string };

// Fecha y hora por separado y con zona fija: el formato combinado cambia entre
// el ICU de Node («, 23:59») y el del navegador («a las 23:59»), y eso rompía la
// hidratación; sin zona, un servidor en UTC mostraría otra hora.
const TZ = "America/Argentina/Buenos_Aires";
export function formatDeadline(deadline: Date | null): string {
    if (!deadline) return "";
    const d = new Date(deadline);
    const date = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(d);
    const time = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(d);
    return `${date} a las ${time}`;
}

export default function RsvpForm({ family, members, isLocked, isLockedHard, deadline, adultsNote }: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState(!isLocked);
    const [status, setStatus] = useState<Status>(family.globalRsvpStatus as Status);
    const [memberStatus, setMemberStatus] = useState<Record<number, boolean>>(
        Object.fromEntries(members.map((m) => [m.id, family.globalRsvpStatus === "PENDING" ? true : Boolean(m.isConfirmed)])),
    );
    const [diet, setDiet] = useState<Record<number, Diet>>(
        Object.fromEntries(members.map((m) => [m.id, { dietary: (m.dietary ?? "NONE") as Dietary, note: m.dietaryNote ?? "" }])),
    );
    const [error, setError] = useState("");
    // Respuesta optimista: al enviar se muestra ya el resumen con lo elegido mientras
    // se guarda; si falla, vuelve el formulario con lo elegido y un mensaje de error.
    const [optimistic, setOptimistic] = useOptimistic<{ family: Props["family"]; members: Props["members"] } | null>(null);
    const [, startTransition] = useTransition();
    // Al enviar un «sí», el resumen se abre con pétalos (una vez por envío).
    const [celebrate, setCelebrate] = useState(false);

    const attendingCount = members.filter((m) => memberStatus[m.id]).length;
    const needsSomeone = status === "CONFIRMED" && attendingCount === 0;
    const missingNote = status === "CONFIRMED" && members.some((m) => memberStatus[m.id] && diet[m.id]?.dietary === "OTHER" && !diet[m.id].note.trim());
    const canSubmit = status !== "PENDING" && !needsSomeone && !missingNote;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError("");
        const updates = members.map((m) => ({
            userId: m.id,
            isConfirmed: status === "CONFIRMED" && Boolean(memberStatus[m.id]),
            dietary: diet[m.id]?.dietary ?? "NONE",
            dietaryNote: diet[m.id]?.note ?? "",
        }));
        const byId = new Map(updates.map((u) => [u.userId, u]));
        startTransition(async () => {
            setOptimistic({
                family: { ...family, globalRsvpStatus: status },
                members: members.map((m) => ({ ...m, ...byId.get(m.id) })),
            });
            setEditing(false);
            setCelebrate(status === "CONFIRMED");
            try {
                await updateFamilyRsvp(family.id, status, updates);
                router.refresh();
            } catch {
                startTransition(() => setEditing(true));
                setError("No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.");
            }
        });
    };

    if (!editing) {
        const shown = optimistic ?? { family, members };
        return (
            <div aria-busy={optimistic ? true : undefined} className={optimistic ? "motion-safe:animate-pulse pointer-events-none" : ""}>
                <RsvpSubmittedView
                    family={shown.family}
                    members={shown.members}
                    deadline={deadline}
                    isLockedHard={isLockedHard}
                    onModify={() => { setCelebrate(false); setEditing(true); }}
                    celebrate={celebrate}
                />
            </div>
        );
    }

    const formattedDeadline = formatDeadline(deadline);

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
                <h2 className="font-serif text-4xl sm:text-5xl leading-display text-oliva-profundo">¿Nos acompañan?</h2>
                {formattedDeadline && (
                    <p className="text-sm text-on-surface-variant flex items-start gap-2">
                        <CalendarClock className="w-4 h-4 text-oliva-profundo shrink-0 mt-0.5" aria-hidden />
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
                <fieldset className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <legend className="text-base font-medium text-on-surface">¿Quiénes vendrán?</legend>
                    <p className="text-sm text-on-surface-variant">Desmarca a quien no pueda venir. Si alguien tiene una restricción alimentaria, indícala debajo de su nombre.</p>
                    <ul className="space-y-2">
                        {members.map((m) => {
                            const checked = Boolean(memberStatus[m.id]);
                            const d = diet[m.id] ?? { dietary: "NONE", note: "" };
                            const selectId = `diet-${m.id}`;
                            const noteId = `diet-note-${m.id}`;
                            return (
                                <li key={m.id} className={`rounded-xl transition-colors duration-200 ${checked ? "bg-secondary-container/70" : "bg-surface-container-low"}`}>
                                    <label className="flex items-center gap-3 min-h-14 px-4 py-3 rounded-xl cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => setMemberStatus((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                                            className="sr-only"
                                        />
                                        <span
                                            aria-hidden
                                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                                checked ? "bg-on-secondary-container text-crema" : "bg-surface-container-lowest ring-1 ring-inset ring-outline-variant"
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
                                    {checked && (
                                        <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor={selectId} className="block text-sm text-on-surface-variant mb-1">Restricción alimentaria</label>
                                                <select
                                                    id={selectId}
                                                    value={d.dietary}
                                                    onChange={(e) => setDiet((prev) => ({ ...prev, [m.id]: { ...d, dietary: e.target.value as Dietary } }))}
                                                    className="w-full min-h-12 px-3 rounded-xl bg-surface-container-lowest text-base text-on-surface outline-none focus:ring-2 focus:ring-primary/45 cursor-pointer"
                                                >
                                                    {DIETARY.map((k) => <option key={k} value={k}>{DIETARY_LABEL[k]}</option>)}
                                                </select>
                                            </div>
                                            {d.dietary === "OTHER" && (
                                                <div>
                                                    <label htmlFor={noteId} className="block text-sm text-on-surface-variant mb-1">¿Cuál?</label>
                                                    <input
                                                        id={noteId}
                                                        type="text"
                                                        required
                                                        maxLength={DIETARY_NOTE_MAX}
                                                        value={d.note}
                                                        onChange={(e) => setDiet((prev) => ({ ...prev, [m.id]: { ...d, note: e.target.value.slice(0, DIETARY_NOTE_MAX) } }))}
                                                        aria-describedby={`${noteId}-count`}
                                                        placeholder="Ej.: sin mariscos"
                                                        className="w-full min-h-12 px-3 rounded-xl bg-surface-container-lowest text-base text-on-surface outline-none focus:ring-2 focus:ring-primary/45 placeholder:text-on-surface-variant/70"
                                                    />
                                                    <p id={`${noteId}-count`} className="mt-1 text-right text-xs tabular-nums text-on-surface-variant">
                                                        {d.note.length} de {DIETARY_NOTE_MAX}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    {needsSomeone && (
                        <p className="text-sm text-error" role="status">
                            Marca al menos a una persona, o elige «No podremos asistir».
                        </p>
                    )}
                    {missingNote && (
                        <p className="text-sm text-error" role="status">
                            Escribe cuál es la restricción en «Otra».
                        </p>
                    )}
                    {!family.isDirectFamily && <AdultsNote text={adultsNote} />}
                </fieldset>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
                {isLocked && (
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="min-h-14 px-6 rounded-xl font-sans font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    disabled={!canSubmit}
                    type="submit"
                    className="flex-1 min-h-14 px-6 bg-primary text-on-primary rounded-xl font-sans font-medium text-base shadow-sm hover:bg-[#4a5745] active:scale-[0.99] transition-[background-color,transform] duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                    Enviar respuesta
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
        : "bg-primary-container text-on-primary-container ring-2 ring-rosa-profundo";
    return (
        <label
            className={`flex items-center justify-center gap-2 min-h-16 px-4 rounded-2xl cursor-pointer text-base font-medium transition-[background-color,color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                checked ? on : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
        >
            <input type="radio" name="rsvp" checked={checked} onChange={onChange} className="sr-only" />
            <Icon className="w-5 h-5" aria-hidden />
            {label}
        </label>
    );
}
