"use client";

import { useState, useTransition } from "react";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
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
    AlertTriangle,
} from "lucide-react";
import { btnPrimary, btnSecondary, btnGhost } from "@/app/admin/_components/ui";
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
    const confirm = useConfirm();
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

    async function handleToggleLock() {
        if (!canWrite) return;
        const next = !locked;
        if (next) {
            const ok = await confirm({
                title: "¿Activar el modo día del evento?",
                description: "Se congela el cronograma: nadie podrá mover, añadir, editar ni borrar actividades. Solo se podrán marcar actividades y tareas como hechas.",
                confirmLabel: "Activar",
                tone: "default",
            });
            if (!ok) return;
        }
        setLocked(next);
        startTransition(() => setScheduleLocked(next));
    }

    // Ordena por hora (las actividades sin hora quedan al final, en su orden actual).
    function handleSortByTime() {
        if (!editable) return;
        const next = [...activities].sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
        setActivities(next);
        startTransition(() => reorderActivities(next.map((a) => a.id)));
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

    async function handleDelete(id: number) {
        if (!editable) return;
        const ok = await confirm({
            title: "¿Eliminar esta actividad?",
            description: "También se borrarán sus pasos, responsables y notas. No se puede deshacer.",
            confirmLabel: "Eliminar",
        });
        if (!ok) return;
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
    // El orden es manual (arrastre): avisar si ya no coincide con las horas.
    const timed = activities.filter((a) => a.time);
    const outOfOrder = timed.some((a, i) => i > 0 && a.time! < timed[i - 1].time!);
    const activeDrag = activeId != null ? activities.find((a) => a.id === activeId) ?? null : null;

    return (
        <div className="space-y-6">
            {/* Toolbar: progreso + modo día del evento + nueva actividad */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm font-sans text-on-surface-variant">
                    <CalendarClock className="w-4 h-4 opacity-60" />
                    {activities.length} {activities.length === 1 ? "actividad" : "actividades"}
                    <span className="text-on-surface-variant/80">· {completedCount} {completedCount === 1 ? "hecha" : "hechas"}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {canWrite && !locked && (
                        <button onClick={handleToggleLock} className={btnSecondary}>
                            <Lock className="w-4 h-4" />
                            Activar modo día del evento
                        </button>
                    )}
                    {editable && (
                        <button onClick={() => setShowForm((v) => !v)} className={showForm ? btnSecondary : btnPrimary}>
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showForm ? "Cerrar" : "Nueva actividad"}
                        </button>
                    )}
                </div>
            </div>

            {locked && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-primary-container/40 px-5 py-4">
                    <Lock className="w-5 h-5 text-on-primary-container shrink-0" />
                    <p className="text-sm text-on-primary-container flex-1">
                        <span className="font-medium">Modo día del evento activado.</span> El cronograma está congelado: solo se pueden marcar actividades y tareas como hechas.
                    </p>
                    {canWrite && (
                        <button onClick={handleToggleLock} className={btnGhost}>
                            <Unlock className="w-4 h-4" />
                            Desactivar
                        </button>
                    )}
                </div>
            )}

            {outOfOrder && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-surface-container-low px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                    <p className="text-sm text-on-surface flex-1">Hay actividades fuera de orden según su hora.</p>
                    {editable && (
                        <button onClick={handleSortByTime} className={btnSecondary}>
                            Ordenar por hora
                        </button>
                    )}
                </div>
            )}

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
                            onDelete={() => handleDelete(selected.id)}
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
                        onDelete={() => handleDelete(selected.id)}
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
}: {
    activity: ActivityWithTasks;
    selected: boolean;
    editable: boolean;
    canWrite: boolean;
    onSelect: () => void;
    onToggle: () => void;
}) {
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
                    {(taskCount > 0 || activity.responsibles.length > 0) && (
                        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-3">
                            {taskCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <ListChecks className="w-3 h-3" />
                                    {taskDone}/{taskCount} pasos
                                </span>
                            )}
                            {activity.responsibles.length > 0 && (
                                <span className="flex items-center gap-1 truncate">
                                    <Users className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{activity.responsibles.map((r) => r.name).join(", ")}</span>
                                </span>
                            )}
                        </p>
                    )}
                </div>
                {activity.time && (
                    <span
                        className={`shrink-0 text-xs font-sans font-medium tabular-nums px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            done ? "bg-surface-container text-on-surface-variant/60" : "bg-primary/10 text-primary"
                        }`}
                    >
                        <Clock className="w-3 h-3" />
                        {activity.time}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 shrink-0 text-on-surface-variant/40" />
            </button>

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
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
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
    onDelete,
}: {
    activity: ActivityWithTasks;
    editable: boolean;
    canWrite: boolean;
    mobile?: boolean;
    onClose?: () => void;
    onDelete: () => void;
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

    const [notesSaved, setNotesSaved] = useState(false);
    function handleSaveNotes(value: string) {
        if (value === activity.notes) return;
        startTransition(async () => {
            await updateActivity(activity.id, { notes: value });
            setNotesSaved(true);
        });
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
                                <div className="shrink-0 flex items-center gap-1">
                                    <button
                                        onClick={() => setEditingHeader(true)}
                                        aria-label="Editar actividad"
                                        title="Editar"
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors border-none cursor-pointer"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        aria-label="Eliminar actividad"
                                        title="Eliminar"
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-colors border-none cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Scrollable: responsables + lista de tareas + notas */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
                {/* Responsables */}
                <section>
                    <h3 className="text-sm font-sans font-medium text-on-surface flex items-center gap-2 mb-3">
                        <Users className="w-3.5 h-3.5" />
                        Responsables
                        <span className="text-on-surface-variant font-normal">({activity.responsibles.length})</span>
                    </h3>

                    {activity.responsibles.length === 0 ? (
                        <p className="text-xs text-on-surface-variant py-1">Sin responsables todavía.</p>
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
                    <h3 className="text-sm font-sans font-medium text-on-surface flex items-center gap-2 mb-3">
                        <ListChecks className="w-3.5 h-3.5" />
                        Pasos
                        <span className="text-on-surface-variant font-normal">({activity.tasks.length})</span>
                    </h3>

                    {activity.tasks.length === 0 ? (
                        <p className="text-xs text-on-surface-variant py-2">Sin pasos todavía. Ej.: «Llevar los anillos».</p>
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
                                placeholder="Añadir paso…"
                                className="flex-1 px-3 py-2 rounded-lg bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm"
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={!newTask.trim() || isPending}
                                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-40 transition-all border-none cursor-pointer"
                                aria-label="Añadir paso"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </section>

                {/* Notas */}
                <section>
                    <h3 className="text-sm font-sans font-medium text-on-surface flex items-center gap-2 mb-3">
                        <StickyNote className="w-3.5 h-3.5" />
                        Notas
                    </h3>
                    {editable ? (
                        <>
                        <textarea
                            defaultValue={activity.notes}
                            onChange={() => setNotesSaved(false)}
                            onBlur={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Detalles importantes, contactos, recordatorios…"
                            rows={5}
                            className="w-full px-3 py-2.5 rounded-xl bg-surface text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm resize-y leading-relaxed"
                        />
                        <p className="text-xs text-on-surface-variant mt-1.5" aria-live="polite">
                            {notesSaved ? "Notas guardadas." : "Se guardan solas al salir del campo."}
                        </p>
                        </>
                    ) : activity.notes ? (
                        <p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed bg-surface rounded-xl p-3 shadow-sm">
                            {activity.notes}
                        </p>
                    ) : (
                        <p className="text-xs text-on-surface-variant">Sin notas.</p>
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
                    className="shrink-0 max-w-[110px] text-xs py-1 pl-2 pr-5 rounded-md bg-surface-container-low border-none outline-none text-on-surface-variant appearance-none cursor-pointer focus:ring-2 focus:ring-primary/40"
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
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium max-w-[120px]"
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
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-all pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus:opacity-100 border-none cursor-pointer"
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
                    className="w-full bg-primary text-on-primary py-3 rounded-xl shadow-sm font-sans text-sm font-medium flex items-center justify-center gap-2 h-[48px] disabled:opacity-60"
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
        <div className="rounded-3xl bg-surface-container-low p-10 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
            <CalendarClock className="w-8 h-8 text-on-surface-variant/40" />
            <p className="text-sm text-on-surface-variant max-w-[220px]">
                Selecciona una actividad para ver sus pasos, responsables y notas.
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
