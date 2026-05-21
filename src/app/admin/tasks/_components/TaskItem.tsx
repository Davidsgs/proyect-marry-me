"use client";

import { toggleTask, deleteTask } from "@/app/actions/tasks";
import type { tasks } from "@/db/schema";
import { Trash2, Check, Calendar } from "lucide-react";

interface Props {
    task: typeof tasks.$inferSelect;
    canWrite: boolean;
}

export default function TaskItem({ task, canWrite }: Props) {
    const formattedDate = task.dueDate
        ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(task.dueDate))
        : null;

    const isPastDue = task.dueDate && !task.isCompleted && new Date(task.dueDate) < new Date();

    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl transition-all group ${
            task.isCompleted 
                ? "bg-surface-container-low/50 opacity-60" 
                : "bg-surface-container-lowest shadow-sm hover:shadow-md"
        }`}>
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

            {/* Due date badge */}
            {formattedDate && (
                <span className={`text-[10px] font-sans tracking-wider uppercase font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                    isPastDue
                        ? "bg-error/10 text-error"
                        : task.isCompleted
                            ? "bg-primary/10 text-primary/60"
                            : "bg-surface-container text-on-surface-variant"
                }`}>
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                </span>
            )}

            {/* Delete button */}
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
