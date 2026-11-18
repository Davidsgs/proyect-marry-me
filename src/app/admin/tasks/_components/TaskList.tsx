"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, ChevronDown, Search } from "lucide-react";
import { EmptyState, inputCls } from "@/app/admin/_components/ui";
import TaskItem, { type Task } from "./TaskItem";
import { useTasks } from "./TasksSync";
import { PRIORITY_RANK } from "@/lib/priority";

// Orden de las listas, elegido por cada administrador y recordado en su navegador.
type Sort = "none" | "priority" | "due" | "created";

const SORTS: { value: Sort; label: string; hint: string }[] = [
    { value: "none", label: "Sin orden", hint: "Orden predeterminado." },
    { value: "priority", label: "Importancia", hint: "Primero las más importantes; a igual importancia, la que vence antes." },
    { value: "due", label: "Fecha límite", hint: "Primero las que vencen antes; las que no tienen fecha, al final." },
    { value: "created", label: "Creación", hint: "Primero las creadas más recientemente." },
];

const KEY = "tareas-orden";
const listeners = new Set<() => void>();
let memory: Sort | null = null; // por si localStorage no está disponible

function readSort(): Sort {
    if (memory) return memory;
    try {
        const v = localStorage.getItem(KEY);
        if (SORTS.some((s) => s.value === v)) return v as Sort;
    } catch {}
    return "none";
}

function writeSort(v: Sort) {
    memory = v;
    try { localStorage.setItem(KEY, v); } catch {}
    listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
}

// Búsqueda por título sin distinguir mayúsculas ni tildes.
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const SEARCH_DELAY_MS = 250;

function sortTasks(list: Task[], sort: Sort): Task[] {
    if (sort === "none") return list;
    const copy = [...list];
    // Sin fecha al final; a igual fecha, la más antigua primero.
    const byDue = (a: Task, b: Task) =>
        a.dueDate === b.dueDate ? a.id - b.id : !a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.localeCompare(b.dueDate);
    if (sort === "priority") return copy.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b));
    if (sort === "due") return copy.sort(byDue);
    return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

export default function TaskList({ canWrite }: { canWrite: boolean }) {
    const { tasks } = useTasks();
    const [query, setQuery] = useState("");
    const [debounced, setTerm] = useState("");
    // Al vaciar el buscador se vuelve a ver todo sin esperar.
    const term = query.trim() ? debounced : "";
    // Los resultados se actualizan mientras se escribe, una vez que se deja de teclear un instante.
    useEffect(() => {
        const id = setTimeout(() => setTerm(norm(query.trim())), SEARCH_DELAY_MS);
        return () => clearTimeout(id);
    }, [query]);
    const visible = term ? tasks.filter((t) => norm(t.title).includes(term)) : tasks;
    const pending = visible.filter((t) => !t.isCompleted);
    const completed = visible.filter((t) => t.isCompleted);
    const sort = useSyncExternalStore(subscribe, readSort, () => "none" as Sort);
    const hint = SORTS.find((s) => s.value === sort)!.hint;
    const pendingSorted = sortTasks(pending, sort);
    const completedSorted = sortTasks(completed, sort);

    return (
        <>
            <div className="space-y-6">
            {tasks.length > 1 && (
                <label className="relative block">
                    <span className="sr-only">Buscar tarea por título</span>
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar tarea…"
                        className={`${inputCls} pl-11 bg-surface-container-lowest`}
                    />
                </label>
            )}
            {term && pending.length + completed.length === 0 && (
                <EmptyState icon={Search} message={`Ninguna tarea coincide con «${query.trim()}».`} />
            )}

            {pending.length + completed.length > 1 && (
                <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span id="task-sort-label" className="text-label font-medium text-on-surface-variant">Ordenar por</span>
                        <div role="radiogroup" aria-labelledby="task-sort-label" className="flex w-full sm:w-fit gap-1 bg-surface-container-low rounded-xl p-1">
                            {SORTS.map((s) => {
                                const active = s.value === sort;
                                return (
                                    <button
                                        key={s.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => writeSort(s.value)}
                                        className={`flex-1 sm:flex-none min-h-11 pointer-fine:min-h-9 px-3 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ${
                                            active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <p className="text-label text-on-surface-variant" aria-live="polite">{hint}</p>
                </div>
            )}

            <div className="space-y-3">
                <h2 className="font-serif text-3xl leading-display text-primary flex items-baseline gap-2">
                    Pendientes
                    <span className="font-sans text-sm text-on-surface-variant tabular-nums">{pending.length}</span>
                </h2>
                {pending.length === 0 ? (
                    term ? (
                        completed.length > 0 && <p className="text-sm text-on-surface-variant">Ninguna tarea pendiente coincide con la búsqueda.</p>
                    ) : (
                        <EmptyState icon={CheckCircle2} message="No hay tareas pendientes. Todo al día." />
                    )
                ) : (
                    <div className="space-y-2">
                        {pendingSorted.map((task) => <TaskItem key={task.id} task={task} canWrite={canWrite} />)}
                    </div>
                )}
            </div>
            </div>

            {completed.length > 0 && (
                // Al buscar, las completadas que coinciden se muestran abiertas.
                <details key={term ? "busqueda" : "todas"} open={!!term} className="group">
                    <summary className="cursor-pointer min-h-11 font-serif text-3xl leading-display text-primary flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                        <ChevronDown className="w-5 h-5 text-on-surface-variant transition-transform group-open:rotate-180" aria-hidden />
                        Completadas
                        <span className="font-sans text-sm text-on-surface-variant tabular-nums">{completed.length}</span>
                    </summary>
                    <div className="space-y-2 mt-3">
                        {completedSorted.map((task) => <TaskItem key={task.id} task={task} canWrite={canWrite} />)}
                    </div>
                </details>
            )}
        </>
    );
}
