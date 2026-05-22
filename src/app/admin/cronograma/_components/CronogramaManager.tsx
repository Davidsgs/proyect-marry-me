"use client";

import { useState, useTransition } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Plus,
    X,
    Check,
    Clock,
    GripVertical,
    Pencil,
    Trash2,
    Lock,
    Unlock,
    ChevronRight,
    ChevronLeft,
    ListChecks,
    StickyNote,
    Loader2,
    CalendarClock,
    Users,
    User,
} from "lucide-react";
import {
    createActivity,
    updateActivity,
    deleteActivity,
    toggleActivity,
    reorderActivities,
    addScheduleTask,
    toggleScheduleTask,
    deleteScheduleTask,
    addResponsible,
    deleteResponsible,
    assignTaskResponsible,
    setScheduleLocked,
    type ActivityWithTasks,
} from "@/app/actions/schedule";

interface Props {
    initialActivities: ActivityWithTasks[];
    initialLocked: boolean;
    canWrite: boolean;
}

export default function CronogramaManager({ initialActivities, initialLocked, canWrite }: Props) {
    const [activities, setActivities] = useState(initialActivities);
    const [synced, setSynced] = useState(initialActivities);
    const [locked, setLocked] = useState(initialLocked);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    // Re-sync from the server after a revalidate, but never clobber optimistic
    // state mid-transition. Render-time sync per react.dev "you might not need an effect".
    if (initialActivities !== synced && !isPending) {
        setSynced(initialActivities);
        setActivities(initialActivities);
    }

    // Lock freezes structural edits (drag, add, edit, delete, notes). Ticking
    // activities/tasks complete stays allowed — that's the day-of-event use.
    const editable = canWrite && !locked;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    const selected = selectedId != null ? activities.find((a) => a.id === selectedId) ?? null : null;

    function handleToggleLock() {
        if (!canWrite) return;
        const next = !locked;
        setLocked(next);
        startTransition(() => setScheduleLocked(next));
    }

    function handleToggleActivity(id: number) {
        if (!canWrite) return;
        setActivities((prev) =>
            prev.map((a) =>
                a.id === id
                    ? { ...a, isCompleted: !a.isCompleted, completedAt: a.isCompleted ? null : new Date().toISOString() }
                    : a,
            ),
        );
        startTransition(() => toggleActivity(id));
    }

    function handleToggleTask(taskId: number, activityId: number) {
        if (!canWrite) return;
        setActivities((prev) =>
            prev.map((a) =>
                a.id === activityId
                    ? { ...a, tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)) }
                    : a,
            ),
        );
        startTransition(() => toggleScheduleTask(taskId));
    }

    function handleAssignTask(taskId: number, activityId: number, responsibleId: number | null) {
        if (!editable) return;
        setActivities((prev) =>
            prev.map((a) =>
                a.id === activityId
                    ? { ...a, tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, responsibleId } : t)) }
                    : a,
            ),
        );
        startTransition(() => assignTaskResponsible(taskId, responsibleId));
    }

    function handleDelete(id: number) {
        if (!editable) return;
        if (!confirm("¿Eliminar esta actividad y sus tareas?")) return;
        if (selectedId === id) setSelectedId(null);
        startTransition(() => deleteActivity(id));
    }

    function onDragStart(e: DragStartEvent) {
        setActiveId(Number(e.active.id));
    }

    function onDragEnd(e: DragEndEvent) {
        setActiveId(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = activities.findIndex((a) => a.id === Number(active.id));
        const newIndex = activities.findIndex((a) => a.id === Number(over.id));
        if (oldIndex === -1 || newIndex === -1) return;
        const next = arrayMove(activities, oldIndex, newIndex);
        setActivities(next);
        startTransition(() => reorderActivities(next.map((a) => a.id)));
    }

    const completedCount = activities.filter((a) => a.isCompleted).length;
    const activeDrag = activeId != null ? activities.find((a) => a.id === activeId) ?? null : null;

    return (
        <div className="space-y-6">
            {/* Toolbar: progreso + candado + nueva actividad */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant">
                    <CalendarClock className="w-4 h-4 opacity-60" />
                    {activities.length} actividad{activities.length === 1 ? "" : "es"}
                    <span className="text-on-surface-variant/50">· {completedCount} completada{completedCount === 1 ? "" : "s"}</span>
                </div>

                <div className="flex items-center gap-2">
                    {canWrite && (
                        <button
                            onClick={handleToggleLock}
                            title={locked ? "Desbloquear edición" : "Bloquear edición (modo día del evento)"}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium ${
                                locked
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container-low text-on-surface-variant hover:text-primary"
                            }`}
                        >
                            {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            {locked ? "Bloqueado" : "Editable"}
                        </button>
                    )}
                    {editable && (
                        <button
                            onClick={() => setShowForm((v) => !v)}
                            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium"
                        >
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showForm ? "Cerrar" : "Nueva actividad"}
                        </button>
                    )}
                </div>
            </div>

            {showForm && editable && <NewActivityForm onDone={() => setShowForm(false)} />}

            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
                {/* Master: lista cronológica */}
                <div>
                    {activities.length === 0 ? (
                        <EmptyState message="Aún no hay actividades. Empieza por la primera con «Nueva actividad»." />
                    ) : (
                        <DndContext
                            id="cronograma-board"
                            sensors={sensors}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                        >
                            <SortableContext items={activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {activities.map((a) => (
                                        <ActivityRow
                                            key={a.id}
                                            activity={a}
                                            selected={selectedId === a.id}
                                            editable={editable}
                                            canWrite={canWrite}
                                            onSelect={() => setSelectedId(a.id)}
                                            onToggle={() => handleToggleActivity(a.id)}
                                            onDelete={() => handleDelete(a.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {activeDrag ? <ActivityRowBody activity={activeDrag} dragging /> : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>

                {/* Detail: panel derecho (desktop) */}
                <div className="hidden lg:block lg:sticky lg:top-6">
                    {selected ? (
                        <ActivityDetail
                            key={selected.id}
                            activity={selected}
                            editable={editable}
                            canWrite={canWrite}
                            onToggleTask={(taskId) => handleToggleTask(taskId, selected.id)}
                            onAssignTask={(taskId, rid) => handleAssignTask(taskId, selected.id, rid)}
                        />
                    ) : (
                        <DetailPlaceholder />
                    )}
                </div>
            </div>

            {/* Detail: overlay (móvil) */}
            {selected && (
                <div className="lg:hidden fixed inset-0 z-50 bg-surface flex flex-col">
                    <ActivityDetail
                        key={`m-${selected.id}`}
                        activity={selected}
                        editable={editable}
                        canWrite={canWrite}
                        mobile
                        onClose={() => setSelectedId(null)}
                        onToggleTask={(taskId) => handleToggleTask(taskId, selected.id)}
                        onAssignTask={(taskId, rid) => handleAssignTask(taskId, selected.id, rid)}
                    />
                </div>
            )}
        </div>
    );
}

// ── Fila de actividad (sortable) ─────────────────────────────────────────────

function ActivityRow({
    activity,
    selected,
    editable,
    canWrite,
    onSelect,
    onToggle,
    onDelete,
}: {
    activity: ActivityWithTasks;
    selected: boolean;
    editable: boolean;
    canWrite: boolean;
    onSelect: () => void;
    onToggle: () => void;
    onDelete: () => void;
}) {
    const [showResp, setShowResp] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: activity.id,
        disabled: !editable,
    });
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };
    const done = activity.isCompleted;
    const taskCount = activity.tasks.length;
    const taskDone = activity.tasks.filter((t) => t.isCompleted).length;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-2 rounded-2xl pl-2 pr-3 py-2.5 shadow-sm transition-all ${
                isDragging ? "opacity-40" : ""
            } ${
                selected
                    ? "bg-surface-container-lowest ring-2 ring-primary/40"
                    : done
                      ? "bg-surface-container-low/50"
                      : "bg-surface-container-lowest hover:shadow-md"
            }`}
        >
            {/* Drag handle */}
            {editable ? (
                <button
                    {...listeners}
                    {...attributes}
                    className="shrink-0 w-6 h-9 flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface-variant cursor-grab active:cursor-grabbing touch-none"
                    aria-label="Reordenar"
                >
                    <GripVertical className="w-4 h-4" />
                </button>
            ) : (
                <span className="shrink-0 w-2" />
            )}

            {/* Checkbox completar */}
            {canWrite ? (
                <button
                    onClick={onToggle}
                    aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
                    className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all border-none cursor-pointer ${
                        done
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-transparent hover:bg-primary/20 hover:text-primary"
                    }`}
                >
                    <Check className="w-4 h-4 stroke-[3]" />
                </button>
            ) : (
                <span
                    className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
                        done ? "bg-primary text-on-primary" : "bg-surface-container-low text-transparent"
                    }`}
                >
                    <Check className="w-4 h-4 stroke-[3]" />
                </span>
            )}

            {/* Cuerpo (abre detalle) */}
            <button
                onClick={onSelect}
                className="flex-1 min-w-0 flex items-center gap-3 text-left border-none bg-transparent cursor-pointer"
            >
                <div className={`min-w-0 flex-1 ${done ? "opacity-50" : ""}`}>
                    <p
                        className={`font-serif text-base leading-tight truncate ${
                            done ? "line-through text-on-surface-variant" : "text-on-surface"
                        }`}
                    >
                        {activity.title}
                    </p>
                    {taskCount > 0 && (
                        <p className="text-[11px] text-on-surface-variant/70 mt-0.5 flex items-center gap-1">
                            <ListChecks className="w-3 h-3" />
                            {taskDone}/{taskCount}
                        </p>
                    )}
                </div>
                {activity.time && (
                    <span
                        className={`shrink-0 text-[11px] font-sans tracking-wider font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            done ? "bg-surface-container text-on-surface-variant/60" : "bg-primary/10 text-primary"
                        }`}
                    >
                        <Clock className="w-3 h-3" />
                        {activity.time}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 shrink-0 text-on-surface-variant/40" />
            </button>

            {/* Responsables: icono + modal (resumen) */}
            {activity.responsibles.length > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowResp(true);
                    }}
                    aria-label="Ver responsables"
                    title="Responsables"
                    className="shrink-0 flex items-center gap-1 px-2 h-8 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all border-none cursor-pointer"
                >
                    <Users className="w-4 h-4" />
                    <span className="text-[11px] font-medium">{activity.responsibles.length}</span>
                </button>
            )}

            {/* Eliminar */}
            {editable && (
                <button
                    onClick={onDelete}
                    aria-label="Eliminar actividad"
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 border-none cursor-pointer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {showResp && <ResponsiblesModal activity={activity} onClose={() => setShowResp(false)} />}
        </div>
    );
}

function ResponsiblesModal({ activity, onClose }: { activity: ActivityWithTasks; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative w-full max-w-xs bg-surface-container-lowest rounded-3xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant">
                            Responsables
                        </p>
                        <h3 className="font-serif text-lg text-primary truncate">{activity.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors border-none cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <ul className="space-y-2">
                    {activity.responsibles.map((r) => (
                        <li key={r.id} className="flex items-center gap-3 bg-surface rounded-xl px-3 py-2 shadow-sm">
                            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </span>
                            <span className="text-sm text-on-surface truncate">{r.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// Ghost mostrado bajo el cursor durante el drag.
function ActivityRowBody({ activity, dragging }: { activity: ActivityWithTasks; dragging?: boolean }) {
    return (
        <div
            className={`flex items-center gap-2 rounded-2xl pl-2 pr-3 py-2.5 bg-surface-container-lowest shadow-lg ${
                dragging ? "ring-2 ring-primary/40" : ""
            }`}
        >
            <span className="w-6 h-9 flex items-center justify-center text-on-surface-variant/40">
                <GripVertical className="w-4 h-4" />
            </span>
            <span className="w-6 h-6 rounded-lg bg-surface-container-low shrink-0" />
            <span className="font-serif text-base text-on-surface truncate flex-1">{activity.title}</span>
            {activity.time && (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                </span>
            )}
        </div>
    );
}

// ── Panel de detalle ─────────────────────────────────────────────────────────

function ActivityDetail({
    activity,
    editable,
    canWrite,
    mobile,
    onClose,
    onToggleTask,
    onAssignTask,
}: {
    activity: ActivityWithTasks;
    editable: boolean;
    canWrite: boolean;
    mobile?: boolean;
    onClose?: () => void;
    onToggleTask: (taskId: number) => void;
    onAssignTask: (taskId: number, responsibleId: number | null) => void;
}) {
    const [editingHeader, setEditingHeader] = useState(false);
    const [newTask, setNewTask] = useState("");
    const [newResp, setNewResp] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleAddTask() {
        const label = newTask.trim();
        if (!label) return;
        setNewTask("");
        startTransition(() => addScheduleTask(activity.id, label));
    }

    function handleAddResponsible() {
        const name = newResp.trim();
        if (!name) return;
        setNewResp("");
        startTransition(() => addResponsible(activity.id, name));
    }

    function handleSaveNotes(value: string) {
        if (value === activity.notes) return;
        startTransition(() => updateActivity(activity.id, { notes: value }));
    }

    const done = activity.isCompleted;

    return (
        <div
            className={`flex flex-col bg-surface-container-lowest shadow-sm ${
                mobile ? "h-full rounded-none" : "rounded-3xl max-h-[calc(100vh-3rem)]"
            }`}
        >
            {/* Header */}
            <div className="shrink-0 p-5 border-b border-outline-variant/20">
                <div className="flex items-start gap-3">
                    {mobile && (
                        <button
                            onClick={onClose}
                            aria-label="Volver"
                            className="shrink-0 -ml-1 w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors border-none cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    {editingHeader && editable ? (
                        <HeaderEditForm activity={activity} onDone={() => setEditingHeader(false)} />
                    ) : (
                        <>
                            <div className="min-w-0 flex-1">
                                <h2
                                    className={`font-serif text-2xl leading-tight ${
                                        done ? "line-through text-on-surface-variant" : "text-primary"
                                    }`}
                                >
                                    {activity.title}
                                </h2>
                                {activity.time && (
                                    <p className="mt-1 text-sm text-on-surface-variant flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 opacity-70" />
                                        {activity.time}
                                    </p>
                                )}
                            </div>
                            {editable && (
                                <button
                                    onClick={() => setEditingHeader(true)}
                                    aria-label="Editar actividad"
                                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors border-none cursor-pointer"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Scrollable: responsables + lista de tareas + notas */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
                {/* Responsables */}
                <section>
                    <h3 className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5" />
                        Responsables
                        <span className="text-on-surface-variant/50">({activity.responsibles.length})</span>
                    </h3>

                    {activity.responsibles.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/50 italic py-1">Sin responsables todavía.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {activity.responsibles.map((r) => (
                                <span
                                    key={r.id}
                                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full bg-surface text-on-surface text-sm shadow-sm"
                                >
                                    <User className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                    <span className="truncate max-w-[140px]">{r.name}</span>
                                    {editable && (
                                        <button
                                            onClick={() => startTransition(() => deleteResponsible(r.id))}
                                            aria-label={`Quitar a ${r.name}`}
                                            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-all border-none cursor-pointer"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}

                    {editable && (
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                value={newResp}
                                onChange={(e) => setNewResp(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddResponsible();
                                    }
                                }}
                                placeholder="Añadir responsable…"
                                className="flex-1 px-3 py-2 rounded-lg bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm"
                            />
                            <button
                                onClick={handleAddResponsible}
                                disabled={!newResp.trim() || isPending}
                                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-40 transition-all border-none cursor-pointer"
                                aria-label="Añadir responsable"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </section>

                {/* Lista de tareas */}
                <section>
                    <h3 className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant flex items-center gap-2 mb-3">
                        <ListChecks className="w-3.5 h-3.5" />
                        Lista de tareas
                        <span className="text-on-surface-variant/50">({activity.tasks.length})</span>
                    </h3>

                    {activity.tasks.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/50 italic py-2">Sin tareas todavía.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {activity.tasks.map((t) => (
                                <TaskRow
                                    key={t.id}
                                    task={t}
                                    responsibles={activity.responsibles}
                                    canWrite={canWrite}
                                    editable={editable}
                                    onToggle={() => onToggleTask(t.id)}
                                    onAssign={(rid) => onAssignTask(t.id, rid)}
                                />
                            ))}
                        </div>
                    )}

                    {editable && (
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTask();
                                    }
                                }}
                                placeholder="Añadir tarea…"
                                className="flex-1 px-3 py-2 rounded-lg bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm"
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={!newTask.trim() || isPending}
                                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-40 transition-all border-none cursor-pointer"
                                aria-label="Añadir tarea"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </section>

                {/* Notas */}
                <section>
                    <h3 className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant flex items-center gap-2 mb-3">
                        <StickyNote className="w-3.5 h-3.5" />
                        Notas
                    </h3>
                    {editable ? (
                        <textarea
                            defaultValue={activity.notes}
                            onBlur={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Detalles importantes, contactos, recordatorios…"
                            rows={5}
                            className="w-full px-3 py-2.5 rounded-xl bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm resize-y leading-relaxed"
                        />
                    ) : activity.notes ? (
                        <p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed bg-surface rounded-xl p-3 shadow-sm">
                            {activity.notes}
                        </p>
                    ) : (
                        <p className="text-xs text-on-surface-variant/50 italic">Sin notas.</p>
                    )}
                </section>
            </div>
        </div>
    );
}

function TaskRow({
    task,
    responsibles,
    canWrite,
    editable,
    onToggle,
    onAssign,
}: {
    task: ActivityWithTasks["tasks"][number];
    responsibles: ActivityWithTasks["responsibles"];
    canWrite: boolean;
    editable: boolean;
    onToggle: () => void;
    onAssign: (responsibleId: number | null) => void;
}) {
    const [isPending, startTransition] = useTransition();
    const done = task.isCompleted;
    const assignee = responsibles.find((r) => r.id === task.responsibleId) ?? null;

    return (
        <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface/60 transition-colors">
            {canWrite ? (
                <button
                    onClick={onToggle}
                    aria-label={done ? "Desmarcar" : "Marcar"}
                    className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all border-none cursor-pointer ${
                        done
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-transparent hover:bg-primary/20 hover:text-primary"
                    }`}
                >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
            ) : (
                <span
                    className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${
                        done ? "bg-primary text-on-primary" : "bg-surface-container-low text-transparent"
                    }`}
                >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
            )}
            <span className={`flex-1 min-w-0 text-sm truncate ${done ? "line-through text-on-surface-variant/60" : "text-on-surface"}`}>
                {task.label}
            </span>

            {/* Responsable de la tarea: selector si editable, chip si no */}
            {editable && responsibles.length > 0 ? (
                <select
                    value={task.responsibleId ?? ""}
                    onChange={(e) => onAssign(e.target.value === "" ? null : Number(e.target.value))}
                    className="shrink-0 max-w-[110px] text-[11px] py-1 pl-2 pr-5 rounded-md bg-surface-container-low border-none outline-none text-on-surface-variant appearance-none cursor-pointer focus:ring-2 focus:ring-primary/40"
                    aria-label="Asignar responsable"
                    title={assignee?.name ?? "Sin responsable"}
                >
                    <option value="">Sin resp.</option>
                    {responsibles.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </select>
            ) : assignee ? (
                <span
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium max-w-[120px]"
                    title={assignee.name}
                >
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">{assignee.name}</span>
                </span>
            ) : null}

            {editable && (
                <button
                    onClick={() => startTransition(() => deleteScheduleTask(task.id))}
                    disabled={isPending}
                    aria-label="Eliminar tarea"
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 border-none cursor-pointer"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

function HeaderEditForm({ activity, onDone }: { activity: ActivityWithTasks; onDone: () => void }) {
    const [title, setTitle] = useState(activity.title);
    const [time, setTime] = useState(activity.time ?? "");
    const [pending, startTransition] = useTransition();

    function save() {
        if (!title.trim()) return;
        startTransition(async () => {
            await updateActivity(activity.id, { title: title.trim(), time: time || null });
            onDone();
        });
    }

    return (
        <div className="min-w-0 flex-1 space-y-2">
            <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título"
                className="w-full px-3 py-2 rounded-lg bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm"
            />
            <div className="flex items-center gap-2">
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm"
                />
                <div className="flex-1" />
                <button
                    onClick={onDone}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    onClick={save}
                    disabled={pending || !title.trim()}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-primary text-on-primary disabled:opacity-50 transition-all border-none cursor-pointer"
                >
                    {pending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Guardar
                </button>
            </div>
        </div>
    );
}

function NewActivityForm({ onDone }: { onDone: () => void }) {
    const [pending, startTransition] = useTransition();
    return (
        <form
            action={(formData) => {
                const title = (formData.get("title") as string)?.trim();
                if (!title) return;
                startTransition(async () => {
                    await createActivity({
                        title,
                        time: (formData.get("time") as string) || undefined,
                    });
                    onDone();
                });
            }}
            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
            <div className="sm:col-span-7">
                <label className="block text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">
                    Título de la actividad
                </label>
                <input
                    required
                    autoFocus
                    name="title"
                    placeholder="Ceremonia, Recepción, Primer baile…"
                    className="w-full px-4 py-3 rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm border-none"
                />
            </div>
            <div className="sm:col-span-3">
                <label className="block text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">
                    Hora
                </label>
                <input
                    type="time"
                    name="time"
                    className="w-full px-4 py-3 rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm border-none"
                />
            </div>
            <div className="sm:col-span-2">
                <button
                    disabled={pending}
                    type="submit"
                    className="w-full bg-primary text-on-primary py-3 rounded-xl shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 h-[48px] disabled:opacity-60"
                >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Añadir
                </button>
            </div>
        </form>
    );
}

function DetailPlaceholder() {
    return (
        <div className="rounded-3xl bg-surface-container-lowest/60 border border-dashed border-outline-variant/40 p-10 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
            <CalendarClock className="w-8 h-8 text-on-surface-variant/40" />
            <p className="text-sm text-on-surface-variant max-w-[220px]">
                Selecciona una actividad para ver y editar sus tareas y notas.
            </p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
            <p className="text-on-surface-variant font-sans text-sm">{message}</p>
        </div>
    );
}
