"use client";

import type { tasks } from "@/db/schema";
import { parseLocalDate, todayLocalISO } from "@/lib/dates";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { btnGhost, btnPrimary, btnSecondary, iconBtn, iconBtnDanger, inputCls } from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import { DatePicker } from "@/components/DatePicker";
import { Trash2, Check, Calendar, Pencil, User, Clock } from "lucide-react";
import { useState } from "react";
import { useTasks } from "./TasksSync";
import { isTemp, pendingRowCls } from "@/app/admin/_components/optimistic";
import { GrowText } from "@/components/GrowText";
import { PRIORITY_LABEL, type Priority } from "@/lib/priority";
import { PriorityIcon, PriorityPicker } from "./PriorityIcon";

export type Task = typeof tasks.$inferSelect & { completedByName?: string | null };

interface Props {
    task: Task;
    canWrite: boolean;
}

const fmtShort = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });
const fmtLong = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
const fmtStamp = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function TaskItem({ task, canWrite }: Props) {
    const confirm = useConfirm();
    const { toggle, update, remove } = useTasks();
    const [mode, setMode] = useState<"closed" | "view" | "edit">("closed");

    const isPastDue = Boolean(task.dueDate && !task.isCompleted && task.dueDate < todayLocalISO());
    const shortDate = task.dueDate ? fmtShort.format(parseLocalDate(task.dueDate)) : null;

    async function handleDelete() {
        const ok = await confirm({
            title: `¿Eliminar la tarea «${task.title}»?`,
            description: "No se puede deshacer.",
            confirmLabel: "Eliminar",
        });
        if (!ok) return;
        setMode("closed");
        remove(task);
    }

    function handleSave(data: { title: string; description: string; dueDate: string | null; priority: Priority }) {
        setMode("closed");
        update(task, data);
    }

    function handleToggle() {
        setMode("closed");
        toggle(task);
    }

    return (
        <>
            <div aria-busy={isTemp(task.id) || undefined} className={`group flex items-center gap-1 pr-2 rounded-xl transition-colors ${isTemp(task.id) ? pendingRowCls : ""} ${
                task.isCompleted ? "bg-surface-container-low" : "bg-surface-container-lowest hover:bg-[#fffdf8]"
            }`}>
                {canWrite ? (
                    <button
                        type="button"
                        onClick={handleToggle}
                        aria-pressed={task.isCompleted}
                        aria-label={task.isCompleted ? `Reabrir «${task.title}»` : `Completar «${task.title}»`}
                        className="shrink-0 w-12 h-14 flex items-center justify-center cursor-pointer group/check"
                    >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            task.isCompleted ? "bg-primary text-on-primary" : "bg-surface-container text-transparent group-hover/check:text-primary"
                        }`}>
                            <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                    </button>
                ) : (
                    <span className="shrink-0 w-12 h-14 flex items-center justify-center">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            task.isCompleted ? "bg-primary text-on-primary" : "bg-surface-container text-transparent"
                        }`}>
                            <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                    </span>
                )}

                {/* Tocar abre el detalle con el texto completo (útil en móvil) */}
                <button type="button" onClick={() => setMode("view")} className="flex-1 min-w-0 py-3 text-left cursor-pointer">
                    <p className={`flex items-center gap-1.5 text-[15px] font-medium ${task.isCompleted ? "line-through text-on-surface-variant" : "text-on-surface"}`}>
                        {!task.isCompleted && <PriorityIcon priority={task.priority} />}
                        <span className="truncate">{task.title}</span>
                    </p>
                    {task.isCompleted ? (
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                            Hecha por {task.completedByName ?? "un administrador"}
                            {task.completedAt && ` · ${fmtShort.format(new Date(task.completedAt))}`}
                        </p>
                    ) : task.description ? (
                        <p className="text-sm text-on-surface-variant truncate mt-0.5">{task.description}</p>
                    ) : null}
                </button>

                {!task.isCompleted && shortDate && (
                    <span className={`text-xs font-medium tabular-nums px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                        isPastDue ? "bg-error/10 text-error" : "bg-surface-container text-on-surface-variant"
                    }`}>
                        <Calendar className="w-3 h-3" aria-hidden />
                        {isPastDue && <span className="sr-only">Vencida: </span>}
                        {shortDate}
                    </span>
                )}

                {canWrite && (
                    <div className="flex items-center pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {!task.isCompleted && (
                            <button type="button" onClick={() => setMode("edit")} className={iconBtn} aria-label={`Editar «${task.title}»`}>
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                        <button type="button" onClick={handleDelete} className={iconBtnDanger} aria-label={`Eliminar «${task.title}»`}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <Dialog
                open={mode !== "closed"}
                onClose={() => setMode("closed")}
                title={mode === "edit" ? "Editar tarea" : task.title}
                description={mode === "view" && task.isCompleted ? "Tarea completada" : undefined}
                size="md"
            >
                {mode === "edit" ? (
                    <EditTaskForm task={task} onCancel={() => setMode("view")} onSave={handleSave} />
                ) : mode === "view" ? (
                    <TaskDetail task={task} canWrite={canWrite} isPastDue={isPastDue} onEdit={() => setMode("edit")} onToggle={handleToggle} onDelete={handleDelete} />
                ) : null}
            </Dialog>
        </>
    );
}

function TaskDetail({
    task,
    canWrite,
    isPastDue,
    onEdit,
    onToggle,
    onDelete,
}: {
    task: Task;
    canWrite: boolean;
    isPastDue: boolean;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
}) {
    const longDate = task.dueDate ? fmtLong.format(parseLocalDate(task.dueDate)) : null;
    const h = "text-sm font-semibold text-on-surface mb-2";

    return (
        <div className="space-y-5">
            <section>
                <h3 className={h}>Descripción</h3>
                {task.description ? (
                    <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{task.description}</p>
                ) : (
                    <p className="text-sm text-on-surface-variant">Sin descripción.</p>
                )}
            </section>

            {!task.isCompleted && (
                <section>
                    <h3 className={h}>Importancia</h3>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-surface-container text-on-surface">
                        <PriorityIcon priority={task.priority} />
                        {PRIORITY_LABEL[task.priority]}
                    </span>
                </section>
            )}

            {longDate && !task.isCompleted && (
                <section>
                    <h3 className={h}>Fecha límite</h3>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${isPastDue ? "bg-error/10 text-error" : "bg-surface-container text-on-surface"}`}>
                        <Calendar className="w-3.5 h-3.5" aria-hidden />
                        {longDate}{isPastDue && " · vencida"}
                    </span>
                </section>
            )}

            {task.isCompleted && (
                <section className="space-y-2">
                    <h3 className={h}>Finalizada</h3>
                    <p className="flex items-center gap-2 text-sm text-on-surface">
                        <User className="w-4 h-4 text-primary shrink-0" aria-hidden />
                        {task.completedByName ?? "Un administrador"}
                    </p>
                    {task.completedAt && (
                        <p className="flex items-center gap-2 text-sm text-on-surface">
                            <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden />
                            {fmtStamp.format(new Date(task.completedAt))}
                        </p>
                    )}
                </section>
            )}

            {canWrite && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button type="button" onClick={onToggle} className={`${btnPrimary} flex-1`}>
                        <Check className="w-4 h-4" aria-hidden />
                        {task.isCompleted ? "Reabrir" : "Completar"}
                    </button>
                    {!task.isCompleted && (
                        <button type="button" onClick={onEdit} className={btnSecondary}>
                            <Pencil className="w-4 h-4" aria-hidden />
                            Editar
                        </button>
                    )}
                    <button type="button" onClick={onDelete} aria-label="Eliminar tarea" className={`${btnGhost} text-error hover:text-error hover:bg-error/10`}>
                        <Trash2 className="w-4 h-4" aria-hidden />
                    </button>
                </div>
            )}
        </div>
    );
}

function EditTaskForm({ task, onCancel, onSave }: {
    task: Task;
    onCancel: () => void;
    onSave: (data: { title: string; description: string; dueDate: string | null; priority: Priority }) => void;
}) {
    const [title, setTitle] = useState(task.title);
    const [desc, setDesc] = useState(task.description ?? "");
    const [date, setDate] = useState(task.dueDate ?? "");
    const [priority, setPriority] = useState<Priority>(task.priority);
    const [error, setError] = useState<string | null>(null);
    const label = "block text-[13px] font-medium text-on-surface-variant mb-1.5";

    function save() {
        if (!title.trim()) return setError("La tarea necesita un título.");
        setError(null);
        onSave({ title: title.trim(), description: desc.trim(), dueDate: date || null, priority });
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
            <label className="block">
                <span className={label}>Título</span>
                <GrowText autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
                <span className={label}>Descripción <span className="font-normal">(opcional)</span></span>
                <GrowText multiline value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} min-h-18`} />
            </label>
            <div>
                <label htmlFor={`task-due-${task.id}`} className={label}>Fecha límite <span className="font-normal">(opcional)</span></label>
                <DatePicker id={`task-due-${task.id}`} value={date} onChange={setDate} />
            </div>
            <PriorityPicker value={priority} onChange={setPriority} idPrefix={`task-${task.id}`} />
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className={btnGhost}>Cancelar</button>
                <button type="submit" disabled={!title.trim()} className={btnPrimary}>
                    Guardar cambios
                </button>
            </div>
        </form>
    );
}
