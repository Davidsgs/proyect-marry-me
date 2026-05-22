"use client";

import { toggleTask, deleteTask, updateTask } from "@/app/actions/tasks";
import type { tasks } from "@/db/schema";
import { Trash2, Check, Calendar, Pencil, X, Save, MoreVertical, User, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useTransition } from "react";

type Task = typeof tasks.$inferSelect & { completedByName?: string | null };

interface Props {
    task: Task;
    canWrite: boolean;
}

function truncateName(name: string | null | undefined, maxLen = 22): string {
    if (!name) return "Admin";
    if (name.length <= maxLen) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        const firstLast = `${parts[0]} ${parts[parts.length - 1][0]}.`;
        if (firstLast.length <= maxLen) return firstLast;
        return parts[0].slice(0, maxLen - 1) + ".";
    }
    return name.slice(0, maxLen - 1) + ".";
}

function CompletionMenu({ task }: { task: Task }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const completedDate = task.completedAt
        ? new Intl.DateTimeFormat("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(task.completedAt))
        : null;

    const completedTime = task.completedAt
        ? new Intl.DateTimeFormat("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(task.completedAt))
        : null;

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer"
                title="Ver información"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 top-10 z-50 w-56 bg-white rounded-2xl shadow-xl border border-surface-container p-3 space-y-2.5">
                    <p className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant/60">
                        Finalizada por
                    </p>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary/70 shrink-0" />
                        <span
                            className="text-sm font-medium text-on-surface truncate"
                            title={task.completedByName ?? undefined}
                        >
                            {truncateName(task.completedByName)}
                        </span>
                    </div>
                    {completedDate && (
                        <div className="space-y-1 pt-1 border-t border-surface-container">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                <span className="text-xs text-on-surface-variant">{completedDate}</span>
                            </div>
                            {completedTime && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                    <span className="text-xs text-on-surface-variant">{completedTime}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TaskItem({ task, canWrite }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDesc, setEditDesc] = useState(task.description ?? "");
    const [editDate, setEditDate] = useState(task.dueDate ?? "");
    const [saving, setSaving] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, startDelete] = useTransition();

    function handleDelete() {
        startDelete(async () => {
            await deleteTask(task.id);
            setConfirmOpen(false);
            setShowDetail(false);
        });
    }

    const formattedDate = task.dueDate
        ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(task.dueDate))
        : null;

    const isPastDue = task.dueDate && !task.isCompleted && new Date(task.dueDate) < new Date();

    async function handleSave() {
        if (!editTitle.trim()) return;
        setSaving(true);
        try {
            await updateTask(task.id, {
                title: editTitle.trim(),
                description: editDesc.trim(),
                dueDate: editDate || undefined,
            });
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setEditTitle(task.title);
        setEditDesc(task.description ?? "");
        setEditDate(task.dueDate ?? "");
        setIsEditing(false);
    }

    if (isEditing && !task.isCompleted) {
        return (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container-lowest shadow-md border border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Título"
                        className="md:col-span-5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/50 border-none"
                    />
                    <input
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="Descripción (opcional)"
                        className="md:col-span-4 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/50 border-none"
                    />
                    <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="md:col-span-3 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/50 border-none"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !editTitle.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-on-primary hover:bg-primary/90 transition-all border-none cursor-pointer disabled:opacity-50"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? "Guardando…" : "Guardar"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className={`flex items-center gap-2 p-4 rounded-xl transition-all group ${
            task.isCompleted
                ? "bg-surface-container-low/50"
                : "bg-surface-container-lowest shadow-sm hover:shadow-md"
        }`}>
            {/* Dimmed wrapper — opacity only here, not on action buttons/popover */}
            <div className={`flex items-center gap-4 flex-1 min-w-0 ${task.isCompleted ? "opacity-60" : ""}`}>
                {/* Toggle checkbox */}
                {canWrite ? (
                    <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all border-none cursor-pointer ${
                            task.isCompleted
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-low text-transparent hover:bg-primary/20 hover:text-primary"
                        }`}
                    >
                        <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                ) : (
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        task.isCompleted ? "bg-primary text-on-primary" : "bg-surface-container-low text-transparent"
                    }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                )}

                {/* Content — tap abre el detalle (texto completo, útil en móvil) */}
                <button
                    type="button"
                    onClick={() => setShowDetail(true)}
                    className="flex-1 min-w-0 text-left border-none bg-transparent cursor-pointer"
                >
                    <p className={`font-sans text-sm font-medium truncate ${
                        task.isCompleted ? "line-through text-on-surface-variant" : "text-on-surface"
                    }`}>
                        {task.title}
                    </p>
                    {task.description && (
                        <p className="text-xs text-on-surface-variant/70 font-light truncate mt-0.5">
                            {task.description}
                        </p>
                    )}
                </button>

                {/* Due date badge (pending only) */}
                {!task.isCompleted && formattedDate && (
                    <span className={`text-[10px] font-sans tracking-wider uppercase font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                        isPastDue
                            ? "bg-error/10 text-error"
                            : "bg-surface-container text-on-surface-variant"
                    }`}>
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                    </span>
                )}
            </div>

            {/* Edit button (pending only) — outside opacity wrapper */}
            {canWrite && !task.isCompleted && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 border-none cursor-pointer"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            )}

            {/* 3-dot menu (completed only) — outside opacity wrapper so popover is fully opaque */}
            {task.isCompleted && task.completedAt && (
                <CompletionMenu task={task} />
            )}

            {/* Delete button — outside opacity wrapper */}
            {canWrite && (
                <button
                    onClick={() => setConfirmOpen(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 border-none cursor-pointer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>

        {showDetail && (
            <TaskDetailModal
                task={task}
                canWrite={canWrite}
                onClose={() => setShowDetail(false)}
                onEdit={() => { setShowDetail(false); setIsEditing(true); }}
                onToggle={() => toggleTask(task.id)}
                onDelete={() => setConfirmOpen(true)}
            />
        )}

        {confirmOpen && (
            <ConfirmDeleteModal
                taskTitle={task.title}
                deleting={deleting}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
            />
        )}
        </>
    );
}

function TaskDetailModal({
    task,
    canWrite,
    onClose,
    onEdit,
    onToggle,
    onDelete,
}: {
    task: Task;
    canWrite: boolean;
    onClose: () => void;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
}) {
    const formattedDate = task.dueDate
        ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(task.dueDate))
        : null;
    const isPastDue = task.dueDate && !task.isCompleted && new Date(task.dueDate) < new Date();
    const completedDate = task.completedAt
        ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(task.completedAt))
        : null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 sm:fade-in duration-200">
                {/* Header */}
                <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-surface-container">
                    <div className="min-w-0">
                        <p className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-1">
                            {task.isCompleted ? "Tarea completada" : "Detalle de la tarea"}
                        </p>
                        <h3 className={`font-serif text-xl leading-snug ${task.isCompleted ? "line-through text-on-surface-variant" : "text-primary"}`}>
                            {task.title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors border-none cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cuerpo scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
                    <section>
                        <h4 className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Descripción</h4>
                        {task.description ? (
                            <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{task.description}</p>
                        ) : (
                            <p className="text-sm text-on-surface-variant/50 italic">Sin descripción.</p>
                        )}
                    </section>

                    {formattedDate && !task.isCompleted && (
                        <section>
                            <h4 className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Fecha límite</h4>
                            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${isPastDue ? "bg-error/10 text-error" : "bg-surface-container text-on-surface-variant"}`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {formattedDate}{isPastDue && " · vencida"}
                            </span>
                        </section>
                    )}

                    {task.isCompleted && (
                        <section className="space-y-2">
                            <h4 className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant">Finalizada</h4>
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                <User className="w-4 h-4 text-primary/70 shrink-0" />
                                <span>{task.completedByName ?? "Admin"}</span>
                            </div>
                            {completedDate && (
                                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                    <Clock className="w-4 h-4 text-primary/70 shrink-0" />
                                    <span>{completedDate}</span>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                {/* Acciones */}
                {canWrite && (
                    <div className="shrink-0 flex items-center gap-2 p-4 border-t border-surface-container">
                        <button
                            onClick={onToggle}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-medium hover:bg-surface-container transition-all border-none cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            {task.isCompleted ? "Reabrir" : "Completar"}
                        </button>
                        {!task.isCompleted && (
                            <button
                                onClick={onEdit}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-medium hover:bg-surface-container transition-all border-none cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                                Editar
                            </button>
                        )}
                        <button
                            onClick={onDelete}
                            aria-label="Eliminar tarea"
                            className="flex items-center justify-center px-4 py-3 rounded-xl text-error hover:bg-error/10 transition-all border-none cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ConfirmDeleteModal({
    taskTitle,
    deleting,
    onCancel,
    onConfirm,
}: {
    taskTitle: string;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden />
            <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-xl text-on-surface">¿Eliminar tarea?</h3>
                    <p className="text-sm text-on-surface-variant">
                        Vas a eliminar <span className="font-medium text-on-surface">«{taskTitle}»</span>. Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className="flex-1 py-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-medium hover:bg-surface-container transition-all border-none cursor-pointer disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/90 transition-all border-none cursor-pointer disabled:opacity-60"
                    >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
