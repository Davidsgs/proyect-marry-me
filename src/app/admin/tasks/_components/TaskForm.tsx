"use client";

import { Plus } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { useRef, useState } from "react";
import { useTasks } from "./TasksSync";
import { btnPrimary, inputCls } from "@/app/admin/_components/ui";
import { parseLocalDate, todayLocalISO } from "@/lib/dates";
import { WEDDING_DATE_ISO } from "@/lib/wedding";
import { GrowText } from "@/components/GrowText";
import { DEFAULT_PRIORITY, type Priority } from "@/lib/priority";
import { PriorityPicker } from "./PriorityIcon";

// Alta rápida: escribir el título y pulsar Enter basta. Detalle y fecha límite
// son opcionales y aparecen al empezar a escribir.

function addDaysISO(from: string, days: number) {
    const d = parseLocalDate(from);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-CA");
}

const fmtLong = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });

const chipBase = "inline-flex items-center gap-1.5 min-h-11 pointer-fine:min-h-9 px-3.5 rounded-full text-label font-medium transition-colors ";
const chipIdle = "bg-surface-container-low text-on-surface hover:bg-surface-container ";
const chipOn = "bg-primary text-on-primary ";
const chipCls = chipBase + "bg-surface-container-low text-on-surface hover:bg-surface-container aria-pressed:bg-primary aria-pressed:text-on-primary";

export default function TaskForm() {
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY);
    const [focused, setFocused] = useState(false);
    const { add } = useTasks();

    const today = todayLocalISO();
    const quick = [
        { label: "Mañana", iso: addDaysISO(today, 1) },
        { label: "En una semana", iso: addDaysISO(today, 7) },
        { label: "En un mes", iso: addDaysISO(today, 30) },
        { label: "Antes de la boda", iso: addDaysISO(WEDDING_DATE_ISO.slice(0, 10), -1) },
    ].filter((q) => q.iso >= today);
    const isQuick = quick.some((q) => q.iso === dueDate);

    const open = focused || title.length > 0 || description.length > 0 || dueDate !== "" || priority !== DEFAULT_PRIORITY;
    const canSubmit = title.trim().length > 0;

    function pickDate(iso: string) {
        setDueDate((cur) => (cur === iso ? "" : iso));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        // La tarea aparece al momento en la lista; el formulario queda libre para la siguiente.
        // Si el servidor falla, se devuelve lo escrito para no perderlo.
        const draft = { title, description, dueDate, priority };
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority(DEFAULT_PRIORITY);
        titleRef.current?.focus();
        add({ title: draft.title.trim(), description: draft.description.trim(), dueDate: draft.dueDate || undefined, priority: draft.priority }).then((ok) => {
            if (ok) return;
            setTitle(draft.title);
            setDescription(draft.description);
            setDueDate(draft.dueDate);
            setPriority(draft.priority);
        });
    }

    return (
        <form
            onSubmit={submit}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
            }}
            className="bg-surface-container-lowest rounded-2xl p-2 sm:p-3 shadow-sm"
        >
            <div className="flex items-start gap-2">
                <Plus className="w-5 h-5 ml-2 mt-3.5 shrink-0 text-on-surface-variant" aria-hidden />
                <label htmlFor="task-title" className="sr-only">Nueva tarea</label>
                <GrowText
                    ref={titleRef}
                    id="task-title"
                    name="title"
                    required
                    autoComplete="off"
                    enterKeyHint="done"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Añadir una tarea, por ejemplo «Pagar al fotógrafo»"
                    className="flex-1 min-w-0 min-h-12 bg-transparent px-1 py-3 text-base sm:text-item text-on-surface placeholder:text-on-surface-variant/80 outline-none"
                />
                <button type="submit" disabled={!canSubmit} className={`${btnPrimary} hidden sm:inline-flex disabled:opacity-50`}>
                    Añadir
                </button>
            </div>

            {open && (
                <div className="px-2 pb-2 pt-1 space-y-4">
                    <div>
                        <label htmlFor="task-desc" className="block text-label font-medium text-on-surface-variant mb-1.5">
                            Detalle <span className="font-normal">(opcional)</span>
                        </label>
                        <GrowText
                            multiline
                            id="task-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Monto, contacto, qué falta…"
                            className={`${inputCls} min-h-18`}
                        />
                    </div>

                    <PriorityPicker value={priority} onChange={setPriority} idPrefix="task-new" />

                    <fieldset>
                        <legend className="block text-label font-medium text-on-surface-variant mb-1.5">
                            Fecha límite <span className="font-normal">(opcional)</span>
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {quick.map((q) => (
                                <button key={q.label} type="button" aria-pressed={dueDate === q.iso} onClick={() => pickDate(q.iso)} className={chipCls}>
                                    {q.label}
                                </button>
                            ))}
                            <DatePicker
                                value={isQuick ? "" : dueDate}
                                onChange={setDueDate}
                                min={today}
                                placeholder="Otra fecha"
                                aria-label="Elegir otra fecha límite"
                                clearable={false}
                                triggerClassName={chipBase + (dueDate && !isQuick ? chipOn : chipIdle)}
                            />
                        </div>
                        <p className="mt-2 text-label text-on-surface-variant" aria-live="polite">
                            {dueDate ? (
                                <>
                                    Vence el <span className="font-medium text-on-surface">{fmtLong.format(parseLocalDate(dueDate))}</span>.{" "}
                                    <button type="button" onClick={() => setDueDate("")} className="underline hover:no-underline">
                                        Quitar fecha
                                    </button>
                                </>
                            ) : (
                                "Sin fecha límite."
                            )}
                        </p>
                    </fieldset>

                    <button type="submit" disabled={!canSubmit} className={`${btnPrimary} w-full sm:hidden disabled:opacity-50`}>
                        <Plus className="w-4 h-4" aria-hidden />
                        Añadir tarea
                    </button>
                </div>
            )}
        </form>
    );
}
