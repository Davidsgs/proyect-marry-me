"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { isTemp, pendingRowCls, tempId, useOptimisticState } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { EmptyState, btnGhost, btnGhostSm, btnPrimary, btnPrimarySm, btnSecondary, iconBtn, inputCls } from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import { GrowText } from "@/components/GrowText";
import { FAQ_ANSWER_MAX, FAQ_QUESTION_MAX } from "@/lib/wedding";
import { createFaqItem, deleteFaqItem, reorderFaqItems, updateFaqItem, type FaqItem } from "@/app/actions/faq";

type Data = { question: string; answer: string };
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// Preguntas y respuestas de la invitación: alta, orden y, desde el detalle de cada
// una (modal), lectura completa, edición y borrado. Todo optimista.
export default function FaqForm({ initial }: { initial: FaqItem[] }) {
    const confirm = useConfirm();
    const [items, mutate] = useOptimisticState(initial);
    const [openId, setOpenId] = useState<number | null>(null);
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const open = openId != null ? items.find((q) => q.id === openId) ?? null : null;

    function close() {
        setOpenId(null);
        setEditing(false);
    }

    function save(id: number | null, data: Data) {
        if (id == null) {
            mutate(
                (list) => [...list, { id: tempId(), ...data, sortOrder: list.length, createdAt: nowSql() }],
                () => createFaqItem(data),
                { ok: "Pregunta añadida", error: "No se pudo añadir la pregunta" },
            );
            setAdding(false);
        } else {
            mutate((list) => list.map((q) => (q.id === id ? { ...q, ...data } : q)), () => updateFaqItem(id, data), { ok: "Pregunta guardada", error: "No se pudo guardar la pregunta" });
            setEditing(false);
        }
    }

    function move(index: number, dir: -1 | 1) {
        const next = [...items];
        const [it] = next.splice(index, 1);
        next.splice(index + dir, 0, it);
        const ordered = next.map((q, i) => ({ ...q, sortOrder: i }));
        mutate(() => ordered, () => reorderFaqItems(ordered.map((q) => q.id)), { error: "No se pudo reordenar" });
    }

    async function remove(q: FaqItem) {
        const ok = await confirm({ title: "¿Eliminar esta pregunta?", description: `«${q.question}» deja de aparecer en la invitación.`, confirmLabel: "Eliminar" });
        if (!ok) return;
        close();
        mutate((list) => list.filter((x) => x.id !== q.id), () => deleteFaqItem(q.id), { ok: "Pregunta eliminada", error: "No se pudo eliminar la pregunta" });
    }

    return (
        <div className="space-y-4">
            {items.length === 0 && !adding && <EmptyState message="Aún no hay preguntas. Añade las dudas que suelen tener los invitados." />}

            <ol className="space-y-2">
                {items.map((q, i) => (
                    <li key={q.id} aria-busy={isTemp(q.id) || undefined} className={`flex items-center gap-1 pr-1 rounded-2xl bg-surface-container-low ${isTemp(q.id) ? pendingRowCls : ""}`}>
                        {/* Tocar la pregunta abre su detalle; las flechas solo cambian el orden. */}
                        <button
                            type="button"
                            disabled={isTemp(q.id)}
                            onClick={() => setOpenId(q.id)}
                            className="group flex-1 min-w-0 flex items-center gap-3 pl-4 pr-2 py-3 rounded-2xl text-left cursor-pointer hover:bg-surface-container transition-colors"
                        >
                            <span className="flex-1 min-w-0">
                                <span className="block font-serif text-xl leading-tight text-on-surface text-pretty">{q.question}</span>
                                <span className="mt-1 text-sm text-on-surface-variant text-pretty line-clamp-1">{q.answer}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 shrink-0 text-on-surface-variant" aria-hidden />
                        </button>
                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn} aria-label={`Subir «${q.question}»`}><ChevronUp className="w-4 h-4" /></button>
                        <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className={iconBtn} aria-label={`Bajar «${q.question}»`}><ChevronDown className="w-4 h-4" /></button>
                    </li>
                ))}
            </ol>

            {adding ? (
                <div className="rounded-2xl bg-surface-container-low">
                    <ItemForm onSave={(d) => save(null, d)} onCancel={() => setAdding(false)} />
                </div>
            ) : (
                <button type="button" onClick={() => setAdding(true)} className={`${btnSecondary} w-full`}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Añadir pregunta
                </button>
            )}

            {/* Detalle de la pregunta: se lee completa; «Editar» la convierte en formulario en el mismo modal. */}
            <Dialog open={!!open} onClose={close} title={editing ? "Editar pregunta" : "Pregunta"} size="md">
                {open && (editing ? (
                    <ItemForm key={open.id} initial={open} onSave={(d) => save(open.id, d)} onCancel={() => setEditing(false)} bare />
                ) : (
                    <div className="space-y-5">
                        <p className="font-serif text-3xl leading-tight text-primary text-pretty">{open.question}</p>
                        <p className="text-base leading-relaxed text-on-surface text-pretty whitespace-pre-line">{open.answer}</p>
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-2">
                            <button type="button" onClick={() => remove(open)} className={`${btnGhost} text-error hover:text-error hover:bg-error/10 sm:mr-auto`}>
                                <Trash2 className="w-4 h-4" aria-hidden />
                                Eliminar
                            </button>
                            <button type="button" onClick={close} className={btnGhost}>Cerrar</button>
                            <button type="button" onClick={() => setEditing(true)} className={btnPrimary}>
                                <Pencil className="w-4 h-4" aria-hidden />
                                Editar
                            </button>
                        </div>
                    </div>
                ))}
            </Dialog>
        </div>
    );
}

// bare: dentro del modal (sin relleno propio; el modal ya lo tiene).
function ItemForm({ initial, onSave, onCancel, bare }: { initial?: FaqItem; onSave: (data: Data) => void; onCancel: () => void; bare?: boolean }) {
    const [question, setQuestion] = useState(initial?.question ?? "");
    const [answer, setAnswer] = useState(initial?.answer ?? "");
    const label = "block text-label font-medium text-on-surface-variant mb-1.5";
    const canSave = question.trim() && answer.trim();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (canSave) onSave({ question: question.trim(), answer: answer.trim() });
            }}
            className={`${bare ? "" : "p-4"} space-y-3`}
        >
            <label className="block">
                <span className={label}>Pregunta</span>
                <GrowText
                    autoFocus
                    required
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={FAQ_QUESTION_MAX}
                    placeholder="¿Hay estacionamiento en el salón?"
                    className={`${inputCls} ${bare ? "" : "bg-surface-container-lowest"}`}
                />
            </label>
            <label className="block">
                <span className={label}>Respuesta</span>
                <GrowText
                    multiline
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={FAQ_ANSWER_MAX}
                    placeholder="Sí, el salón tiene estacionamiento propio sin cargo."
                    className={`${inputCls} ${bare ? "" : "bg-surface-container-lowest"} min-h-24 leading-relaxed`}
                />
                <span className="mt-1 block text-xs text-on-surface-variant tabular-nums">{answer.length} de {FAQ_ANSWER_MAX}</span>
            </label>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className={btnGhostSm}>Cancelar</button>
                <button type="submit" disabled={!canSave} className={btnPrimarySm}>
                    {initial ? <Save className="w-3.5 h-3.5" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
                    {initial ? "Guardar" : "Añadir"}
                </button>
            </div>
        </form>
    );
}
