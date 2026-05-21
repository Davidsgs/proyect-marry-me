"use client";

import { toggleTask, deleteTask, updateTask } from "@/app/actions/tasks";
import type { tasks } from "@/db/schema";
import { Trash2, Check, Calendar, Pencil, X, Save, MoreVertical, User, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

                {/* Content */}
                <div className="flex-1 min-w-0">
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
                </div>

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
                    onClick={() => deleteTask(task.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 border-none cursor-pointer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
