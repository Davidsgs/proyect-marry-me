"use client";

import { useState } from "react";
import { isTemp, pendingRowCls, tempId, useOptimisticState, type Patch } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
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
    ChevronUp,
    ChevronDown,
    ListChecks,
    StickyNote,
    CalendarClock,
    CalendarDays,
    Layers,
    Users,
    User,
    UserCheck,
    AlertTriangle,
    Save,
} from "lucide-react";
import { EmptyState, btnPrimary, btnSecondary, btnGhost, btnGhostSm, btnPrimarySm, iconBtn, iconBtnDanger, inputCls, inputSmCls, selectCls } from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import { DatePicker } from "@/components/DatePicker";
import { GrowText } from "@/components/GrowText";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { PersonPicker, type Person } from "@/app/admin/_components/PersonPicker";
import { parseLocalDate } from "@/lib/dates";
import {
    createActivity,
    updateActivity,
    deleteActivity,
    toggleActivity,
    reorderActivities,
    moveActivity,
    addScheduleTask,
    updateScheduleTask,
    toggleScheduleTask,
    deleteScheduleTask,
    addResponsible,
    deleteResponsible,
    assignTaskResponsible,
    setScheduleLocked,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    type ActivityWithTasks,
    type ScheduleSection,
    type ScheduleTask,
} from "@/app/actions/schedule";

type Activity = ActivityWithTasks;
type Responsible = Activity["responsibles"][number];

const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const patchActivity = (id: number, fn: (a: Activity) => Activity): Patch<Activity[]> => (s) => s.map((a) => (a.id === id ? fn(a) : a));
const fmtSectionDate = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// Grupos de la lista: cada sección, y «Sin sección» para lo que no tenga (o
// cuya sección se borró). La clave también es el id del contenedor del arrastre.
type Group = { key: string; section: ScheduleSection | null; items: Activity[] };
const NONE = "section:none";
const groupKey = (sectionId: number | null) => (sectionId == null ? NONE : `section:${sectionId}`);

function buildGroups(sections: ScheduleSection[], activities: Activity[]): Group[] {
    const known = new Set(sections.map((s) => s.id));
    const groups: Group[] = sections.map((s) => ({ key: groupKey(s.id), section: s, items: activities.filter((a) => a.sectionId === s.id) }));
    const loose = activities.filter((a) => a.sectionId == null || !known.has(a.sectionId));
    if (loose.length > 0 || sections.length === 0) groups.push({ key: NONE, section: null, items: loose });
    return groups;
}

// Acciones del panel de detalle: todas optimistas (se ven al momento, se deshacen si fallan).
type DetailOps = {
    addTask: (label: string) => void;
    updateTask: (taskId: number, data: { label: string; description: string; responsibleId: number | null }) => void;
    deleteTask: (taskId: number) => void;
    addResponsible: (name: string, userId?: number) => void;
    deleteResponsible: (id: number) => void;
    saveNotes: (notes: string) => Promise<boolean>;
    saveHeader: (data: { title: string; time: string | null; sectionId: number | null }) => void;
};

interface Props {
    initialActivities: ActivityWithTasks[];
    initialSections: ScheduleSection[];
    people: Person[];
    initialLocked: boolean;
    canWrite: boolean;
}

export default function CronogramaManager({ initialActivities, initialSections, people, initialLocked, canWrite }: Props) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const confirm = useConfirm();
    // Cambios optimistas: se ven al momento y se deshacen si el servidor falla.
    const [activities, mutate] = useOptimisticState(initialActivities);
    const [sections, mutateSections] = useOptimisticState(initialSections);
    const [locked, mutateLocked] = useOptimisticState(initialLocked);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showSections, setShowSections] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);

    // Lock freezes structural edits (drag, add, edit, delete, notes). Ticking
    // activities/tasks complete stays allowed — that's the day-of-event use.
    const editable = canWrite && !locked;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    const groups = buildGroups(sections, activities);
    const selected = selectedId != null ? activities.find((a) => a.id === selectedId) ?? null : null;

    async function handleToggleLock() {
        if (!canWrite) return;
        const next = !locked;
        if (next) {
            const ok = await confirm({
                title: "¿Activar el modo día del evento?",
                description: "Se congela el cronograma: nadie podrá mover, añadir, editar ni borrar actividades. Solo se podrán marcar actividades y pasos como hechos.",
                confirmLabel: "Activar",
                tone: "default",
            });
            if (!ok) return;
        }
        mutateLocked(() => next, () => setScheduleLocked(next), { error: next ? "No se pudo activar el modo día del evento" : "No se pudo desactivar el modo día del evento" });
    }

    // Ordena por hora dentro de cada sección (sin hora, al final y en su orden actual).
    function handleSortByTime() {
        if (!editable) return;
        const byTime = (a: Activity, b: Activity) => (!a.time && !b.time ? 0 : !a.time ? 1 : !b.time ? -1 : a.time.localeCompare(b.time));
        const next = groups.flatMap((g) => [...g.items].sort(byTime)).map((a, i) => ({ ...a, sortOrder: i }));
        mutate(() => next, () => reorderActivities(next.map((a) => a.id)), { ok: "Ordenado por hora", error: "No se pudo reordenar" });
    }

    function handleToggleActivity(id: number) {
        if (!canWrite) return;
        mutate(
            patchActivity(id, (a) => ({ ...a, isCompleted: !a.isCompleted, completedAt: a.isCompleted ? null : new Date().toISOString() })),
            () => toggleActivity(id),
            { error: "No se pudo marcar la actividad" },
        );
    }

    function handleToggleTask(taskId: number, activityId: number) {
        if (!canWrite) return;
        mutate(
            patchActivity(activityId, (a) => ({ ...a, tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)) })),
            () => toggleScheduleTask(taskId),
            { error: "No se pudo marcar el paso" },
        );
    }

    function handleAssignTask(taskId: number, activityId: number, responsibleId: number | null) {
        if (!editable) return;
        mutate(
            patchActivity(activityId, (a) => ({ ...a, tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, responsibleId } : t)) })),
            () => assignTaskResponsible(taskId, responsibleId),
            { error: "No se pudo asignar el responsable" },
        );
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
        mutate((s) => s.filter((a) => a.id !== id), () => deleteActivity(id), { ok: "Actividad eliminada", error: "No se pudo eliminar la actividad" });
    }

    function handleCreate(data: { title: string; time?: string; sectionId: number | null }) {
        mutate(
            (s) => [...s, {
                id: tempId(), sectionId: data.sectionId, title: data.title, time: data.time ?? null, notes: "", isCompleted: false, completedAt: null,
                sortOrder: s.length, createdAt: nowSql(), updatedAt: nowSql(), tasks: [], responsibles: [],
            }],
            () => createActivity(data),
            { ok: "Actividad creada", error: "No se pudo crear la actividad" },
        );
    }

    function detailOps(activityId: number): DetailOps {
        return {
            addTask: (label) => mutate(
                patchActivity(activityId, (a) => ({ ...a, tasks: [...a.tasks, { id: tempId(), activityId, label, description: "", isCompleted: false, responsibleId: null, sortOrder: a.tasks.length, createdAt: nowSql() }] })),
                () => addScheduleTask(activityId, label),
                { error: "No se pudo añadir el paso" },
            ),
            updateTask: (taskId, data) => mutate(
                patchActivity(activityId, (a) => ({ ...a, tasks: a.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)) })),
                () => updateScheduleTask(taskId, data),
                { ok: "Paso guardado", error: "No se pudo guardar el paso" },
            ),
            deleteTask: (taskId) => mutate(
                patchActivity(activityId, (a) => ({ ...a, tasks: a.tasks.filter((t) => t.id !== taskId) })),
                () => deleteScheduleTask(taskId),
                { error: "No se pudo eliminar el paso" },
            ),
            addResponsible: (name, userId) => mutate(
                patchActivity(activityId, (a) => ({ ...a, responsibles: [...a.responsibles, { id: tempId(), activityId, name, userId: userId ?? null, sortOrder: a.responsibles.length, createdAt: nowSql() }] })),
                () => addResponsible(activityId, name, userId),
                { error: "No se pudo añadir el responsable" },
            ),
            deleteResponsible: (id) => mutate(
                patchActivity(activityId, (a) => ({
                    ...a,
                    responsibles: a.responsibles.filter((r) => r.id !== id),
                    tasks: a.tasks.map((t) => (t.responsibleId === id ? { ...t, responsibleId: null } : t)),
                })),
                () => deleteResponsible(id),
                { error: "No se pudo quitar el responsable" },
            ),
            saveNotes: (notes) => mutate(
                patchActivity(activityId, (a) => ({ ...a, notes })),
                () => updateActivity(activityId, { notes }),
                { error: "No se pudieron guardar las notas" },
            ),
            saveHeader: (data) => mutate(
                patchActivity(activityId, (a) => ({ ...a, ...data })),
                () => updateActivity(activityId, data),
                { ok: "Actividad guardada", error: "No se pudo guardar la actividad" },
            ),
        };
    }

    function onDragStart(e: DragStartEvent) {
        setActiveId(Number(e.active.id));
    }

    // Soltar sobre otra actividad (misma u otra sección) o sobre una sección vacía.
    function onDragEnd(e: DragEndEvent) {
        setActiveId(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const draggedId = Number(active.id);
        const dragged = activities.find((a) => a.id === draggedId);
        if (!dragged) return;

        const overKey = String(over.id);
        const overGroup = overKey.startsWith("section:")
            ? groups.find((g) => g.key === overKey)
            : groups.find((g) => g.items.some((a) => a.id === Number(over.id)));
        if (!overGroup) return;
        const fromGroup = groups.find((g) => g.items.some((a) => a.id === draggedId));
        const targetSectionId = overGroup.section?.id ?? null;
        const moved = { ...dragged, sectionId: targetSectionId };

        const ordered = groups.flatMap((g) => {
            const rest = g.items.filter((a) => a.id !== draggedId);
            if (g.key !== overGroup.key) return rest;
            if (overKey.startsWith("section:")) return [...rest, moved];
            const idx = rest.findIndex((a) => a.id === Number(over.id));
            // Dentro de la misma sección, bajar = quedar después del destino.
            const oldIdx = g.items.findIndex((a) => a.id === draggedId);
            const at = idx === -1 ? rest.length : fromGroup?.key === g.key && oldIdx !== -1 && oldIdx <= idx ? idx + 1 : idx;
            return [...rest.slice(0, at), moved, ...rest.slice(at)];
        });
        const next = ordered.map((a, i) => ({ ...a, sortOrder: i }));
        const ids = next.map((a) => a.id);
        const sameSection = fromGroup?.key === overGroup.key;
        mutate(
            () => next,
            () => (sameSection ? reorderActivities(ids) : moveActivity(draggedId, targetSectionId, ids)),
            { ok: sameSection ? undefined : `Movida a «${overGroup.section?.name ?? "Sin sección"}»`, error: "No se pudo mover la actividad" },
        );
    }

    const completedCount = activities.filter((a) => a.isCompleted).length;
    // El orden es manual (arrastre): avisar si dentro de una sección ya no coincide con las horas.
    const outOfOrder = groups.some((g) => {
        const timed = g.items.filter((a) => a.time);
        return timed.some((a, i) => i > 0 && a.time! < timed[i - 1].time!);
    });
    const activeDrag = activeId != null ? activities.find((a) => a.id === activeId) ?? null : null;

    const detailProps = selected && {
        activity: selected,
        sections,
        people,
        editable,
        canWrite,
        ops: detailOps(selected.id),
        onToggleTask: (taskId: number) => handleToggleTask(taskId, selected.id),
        onAssignTask: (taskId: number, rid: number | null) => handleAssignTask(taskId, selected.id, rid),
        onDelete: () => handleDelete(selected.id),
    };

    return (
        <div className="space-y-6">
            {/* Toolbar: progreso + secciones + modo día del evento + nueva actividad */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm font-sans text-on-surface-variant">
                    <CalendarClock className="w-4 h-4" aria-hidden />
                    {activities.length} {activities.length === 1 ? "actividad" : "actividades"}
                    <span>· {completedCount} {completedCount === 1 ? "hecha" : "hechas"}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                    {editable && (
                        <button type="button" onClick={() => setShowSections(true)} className={btnSecondary}>
                            <Layers className="w-4 h-4" aria-hidden />
                            Secciones
                        </button>
                    )}
                    {canWrite && !locked && (
                        <button onClick={handleToggleLock} className={btnSecondary}>
                            <Lock className="w-4 h-4" />
                            Activar modo día del evento
                        </button>
                    )}
                    {editable && (
                        <button type="button" onClick={() => setShowForm(true)} className={btnPrimary}>
                            <Plus className="w-4 h-4" aria-hidden />
                            Nueva actividad
                        </button>
                    )}
                </div>
            </div>

            {locked && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-oliva-profundo text-crema px-5 py-4">
                    <Lock className="w-5 h-5 shrink-0" aria-hidden />
                    <p className="text-sm flex-1">
                        <span className="font-medium">Modo día del evento activado.</span> El cronograma está congelado: solo se pueden marcar actividades y pasos como hechos.
                    </p>
                    {canWrite && (
                        <button type="button" onClick={handleToggleLock} className={`${btnGhost} text-crema hover:text-crema hover:bg-crema/10`}>
                            <Unlock className="w-4 h-4" aria-hidden />
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

            <Dialog open={showForm && editable} onClose={() => setShowForm(false)} title="Nueva actividad" size="sm">
                <NewActivityForm sections={sections} onCreate={handleCreate} onDone={() => setShowForm(false)} />
            </Dialog>

            <Dialog open={showSections && editable} onClose={() => setShowSections(false)} title="Secciones" description="Agrupan las actividades: pre-boda, boda, fiesta… La fecha es opcional." size="md">
                <SectionsEditor sections={sections} activities={activities} mutateSections={mutateSections} />
            </Dialog>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
                {/* Master: lista cronológica por secciones */}
                <div>
                    {activities.length === 0 && sections.length === 0 ? (
                        <EmptyState message="Aún no hay actividades. Empieza por la primera con «Nueva actividad»." />
                    ) : (
                        <DndContext id="cronograma-board" sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                            <div className="space-y-8">
                                {groups.map((g) => (
                                    <SectionGroup key={g.key} group={g} editable={editable} showSectionTitle={sections.length > 0}>
                                        {g.items.map((a) => (
                                            <ActivityRow
                                                key={a.id}
                                                activity={a}
                                                selected={selectedId === a.id}
                                                editable={editable}
                                                canWrite={canWrite}
                                                dayMode={locked}
                                                onSelect={() => setSelectedId(a.id)}
                                                onToggle={() => handleToggleActivity(a.id)}
                                            />
                                        ))}
                                    </SectionGroup>
                                ))}
                            </div>
                            <DragOverlay>
                                {activeDrag ? <ActivityRowBody activity={activeDrag} dragging /> : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>

                {/* Detail: panel derecho (desktop) */}
                {isDesktop && <div className="sticky top-6">
                    {detailProps ? <ActivityDetail key={detailProps.activity.id} {...detailProps} /> : <DetailPlaceholder />}
                </div>}
            </div>

            {/* Detail: overlay (móvil) */}
            {!isDesktop && (
                <Dialog open={!!selected} onClose={() => setSelectedId(null)} size="lg" labelledBy="activity-detail-title">
                    {detailProps && (
                        <div className="-mx-6 -mt-2">
                            <ActivityDetail key={`m-${detailProps.activity.id}`} {...detailProps} mobile onClose={() => setSelectedId(null)} />
                        </div>
                    )}
                </Dialog>
            )}
        </div>
    );
}

// ── Sección (contenedor del arrastre) ────────────────────────────────────────

function SectionGroup({ group, editable, showSectionTitle, children }: { group: Group; editable: boolean; showSectionTitle: boolean; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: group.key, disabled: !editable });
    const { section, items } = group;
    const headingId = `sec-${group.key.replace(":", "-")}`;

    return (
        <section ref={setNodeRef} aria-labelledby={showSectionTitle ? headingId : undefined} className={`rounded-3xl transition-colors ${isOver ? "bg-secondary-container/50 ring-2 ring-primary/30 p-2 -m-2" : ""}`}>
            {showSectionTitle && (
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3 px-1">
                    <h2 id={headingId} className="font-serif text-3xl leading-none text-primary">{section?.name ?? "Sin sección"}</h2>
                    {section?.date && (
                        <span className="text-sm text-on-surface-variant first-letter:uppercase">{fmtSectionDate.format(parseLocalDate(section.date))}</span>
                    )}
                    <span className="ml-auto text-sm text-on-surface-variant tabular-nums">
                        {items.length} {items.length === 1 ? "actividad" : "actividades"}
                    </span>
                </header>
            )}
            <SortableContext items={items.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {items.length === 0 && (
                        <p className="text-sm text-on-surface-variant rounded-2xl outline-2 outline-dashed outline-outline-variant px-4 py-3">
                            {editable ? "Sin actividades. Arrastra una aquí o elige esta sección al crearla." : "Sin actividades."}
                        </p>
                    )}
                    {children}
                </div>
            </SortableContext>
        </section>
    );
}

// ── Editor de secciones ──────────────────────────────────────────────────────

function SectionsEditor({
    sections,
    activities,
    mutateSections,
}: {
    sections: ScheduleSection[];
    activities: Activity[];
    mutateSections: (patch: Patch<ScheduleSection[]>, action: () => Promise<unknown>, msg: { ok?: string; error: string }) => Promise<boolean>;
}) {
    const confirm = useConfirm();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [adding, setAdding] = useState(sections.length === 0);

    function move(index: number, dir: -1 | 1) {
        const next = [...sections];
        const [it] = next.splice(index, 1);
        next.splice(index + dir, 0, it);
        const ordered = next.map((s, i) => ({ ...s, sortOrder: i }));
        mutateSections(() => ordered, () => reorderSections(ordered.map((s) => s.id)), { error: "No se pudo reordenar las secciones" });
    }

    async function remove(s: ScheduleSection) {
        const count = activities.filter((a) => a.sectionId === s.id).length;
        const ok = await confirm({
            title: `¿Eliminar la sección «${s.name}»?`,
            description: count > 0 ? `Sus ${count} ${count === 1 ? "actividad queda" : "actividades quedan"} en «Sin sección»; no se borra ninguna.` : "No tiene actividades.",
            confirmLabel: "Eliminar sección",
        });
        if (!ok) return;
        mutateSections((list) => list.filter((x) => x.id !== s.id), () => deleteSection(s.id), { ok: "Sección eliminada", error: "No se pudo eliminar la sección" });
    }

    function save(id: number | null, data: { name: string; date: string | null }) {
        if (id == null) {
            mutateSections(
                (list) => [...list, { id: tempId(), ...data, sortOrder: list.length, createdAt: nowSql() }],
                () => createSection(data),
                { ok: `Sección «${data.name}» creada`, error: "No se pudo crear la sección" },
            );
            setAdding(false);
        } else {
            mutateSections((list) => list.map((x) => (x.id === id ? { ...x, ...data } : x)), () => updateSection(id, data), { ok: "Sección guardada", error: "No se pudo guardar la sección" });
            setEditingId(null);
        }
    }

    return (
        <div className="space-y-4">
            {sections.length === 0 && !adding && <p className="text-sm text-on-surface-variant">Aún no hay secciones.</p>}
            <ol className="space-y-2">
                {sections.map((s, i) => (
                    <li key={s.id} aria-busy={isTemp(s.id) || undefined} className={`rounded-2xl bg-surface-container-low ${isTemp(s.id) ? pendingRowCls : ""}`}>
                        {editingId === s.id ? (
                            <SectionForm initial={s} onSave={(d) => save(s.id, d)} onCancel={() => setEditingId(null)} />
                        ) : (
                            <div className="flex items-center gap-1 pl-4 pr-1 py-1.5">
                                <div className="flex-1 min-w-0 py-1">
                                    <p className="font-serif text-xl leading-tight text-on-surface truncate">{s.name}</p>
                                    <p className="text-xs text-on-surface-variant first-letter:uppercase">
                                        {s.date ? fmtSectionDate.format(parseLocalDate(s.date)) : "Sin fecha"}
                                        {" · "}
                                        {activities.filter((a) => a.sectionId === s.id).length} actividades
                                    </p>
                                </div>
                                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn} aria-label={`Subir «${s.name}»`}><ChevronUp className="w-4 h-4" /></button>
                                <button type="button" disabled={i === sections.length - 1} onClick={() => move(i, 1)} className={iconBtn} aria-label={`Bajar «${s.name}»`}><ChevronDown className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setEditingId(s.id)} className={iconBtn} aria-label={`Editar «${s.name}»`}><Pencil className="w-4 h-4" /></button>
                                <button type="button" onClick={() => remove(s)} className={iconBtnDanger} aria-label={`Eliminar «${s.name}»`}><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    </li>
                ))}
            </ol>

            {adding ? (
                <div className="rounded-2xl bg-surface-container-low">
                    <SectionForm onSave={(d) => save(null, d)} onCancel={() => setAdding(false)} />
                </div>
            ) : (
                <button type="button" onClick={() => setAdding(true)} className={`${btnSecondary} w-full`}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Nueva sección
                </button>
            )}
        </div>
    );
}

function SectionForm({ initial, onSave, onCancel }: { initial?: ScheduleSection; onSave: (data: { name: string; date: string | null }) => void; onCancel: () => void }) {
    const [name, setName] = useState(initial?.name ?? "");
    const [date, setDate] = useState(initial?.date ?? "");
    const label = "block text-[13px] font-medium text-on-surface-variant mb-1.5";

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) onSave({ name: name.trim(), date: date || null });
            }}
            className="p-4 space-y-3"
        >
            <label className="block">
                <span className={label}>Nombre</span>
                <GrowText autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Pre-boda, Boda, Fiesta…" className={`${inputCls} bg-surface-container-lowest`} />
            </label>
            <div>
                <span className={label}>Fecha <span className="font-normal">(opcional)</span></span>
                <DatePicker value={date} onChange={setDate} aria-label="Fecha de la sección" />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className={btnGhostSm}>Cancelar</button>
                <button type="submit" disabled={!name.trim()} className={btnPrimarySm}>
                    {initial ? <Save className="w-3.5 h-3.5" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
                    {initial ? "Guardar" : "Añadir sección"}
                </button>
            </div>
        </form>
    );
}

// ── Fila de actividad (sortable) ─────────────────────────────────────────────

function ActivityRow({
    activity,
    selected,
    editable,
    canWrite,
    dayMode,
    onSelect,
    onToggle,
}: {
    activity: ActivityWithTasks;
    selected: boolean;
    editable: boolean;
    canWrite: boolean;
    dayMode?: boolean;
    onSelect: () => void;
    onToggle: () => void;
}) {
    const temp = isTemp(activity.id);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: activity.id,
        disabled: !editable || temp,
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
            aria-busy={temp || undefined}
            className={`group flex items-center gap-1 rounded-2xl pl-1 pr-3 ${dayMode ? "py-3" : "py-1.5"} transition-[background-color,box-shadow] ${
                isDragging ? "opacity-40" : ""
            } ${temp ? pendingRowCls : ""} ${
                selected
                    ? "bg-surface-container-lowest ring-2 ring-primary/50"
                    : done
                      ? "bg-surface-container-low"
                      : "bg-surface-container-lowest hover:bg-[#fffdf8]"
            }`}
        >
            {/* Drag handle */}
            {editable ? (
                <button
                    {...listeners}
                    {...attributes}
                    className="shrink-0 w-8 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-grab active:cursor-grabbing touch-none"
                    aria-label={`Reordenar o mover «${activity.title}»`}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
            ) : (
                <span className="shrink-0 w-2" />
            )}

            {/* Checkbox completar */}
            {canWrite ? (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-pressed={done}
                    aria-label={done ? `Marcar «${activity.title}» como pendiente` : `Marcar «${activity.title}» como hecha`}
                    className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer group/check"
                >
                    <span className={`${dayMode ? "w-8 h-8" : "w-6 h-6"} rounded-lg flex items-center justify-center transition-colors ${
                        done
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-transparent group-hover/check:text-primary"
                    }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                </button>
            ) : (
                <span className="shrink-0 w-11 h-11 flex items-center justify-center">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        done ? "bg-primary text-on-primary" : "bg-surface-container text-transparent"
                    }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                </span>
            )}

            {/* Cuerpo (abre detalle) */}
            <button
                type="button"
                onClick={onSelect}
                aria-current={selected ? "true" : undefined}
                className="flex-1 min-w-0 min-h-11 flex items-center gap-3 text-left cursor-pointer"
            >
                <div className="min-w-0 flex-1">
                    <p
                        className={`font-serif ${dayMode ? "text-2xl" : "text-xl"} leading-tight truncate ${
                            done ? "line-through text-on-surface-variant" : "text-on-surface"
                        }`}
                    >
                        {activity.title}
                    </p>
                    {(taskCount > 0 || activity.responsibles.length > 0) && (
                        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-3">
                            {taskCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <ListChecks className="w-3.5 h-3.5" aria-hidden />
                                    {taskDone}/{taskCount} pasos
                                </span>
                            )}
                            {activity.responsibles.length > 0 && (
                                <span className="flex items-center gap-1 truncate">
                                    <Users className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                    <span className="truncate">{activity.responsibles.map((r) => r.name).join(", ")}</span>
                                </span>
                            )}
                        </p>
                    )}
                </div>
                {activity.time && (
                    <span
                        className={`shrink-0 ${dayMode ? "text-base" : "text-sm"} font-medium tabular-nums px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            done ? "bg-surface-container text-on-surface-variant" : "bg-secondary-container text-on-secondary-container"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" aria-hidden />
                        {activity.time}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 shrink-0 text-on-surface-variant" aria-hidden />
            </button>
        </div>
    );
}

// Ghost mostrado bajo el cursor durante el drag.
function ActivityRowBody({ activity, dragging }: { activity: ActivityWithTasks; dragging?: boolean }) {
    return (
        <div
            className={`flex items-center gap-2 rounded-2xl pl-2 pr-3 py-2.5 bg-surface-container-lowest shadow-md ${
                dragging ? "ring-2 ring-primary/40" : ""
            }`}
        >
            <span className="w-6 h-9 flex items-center justify-center text-on-surface-variant">
                <GripVertical className="w-4 h-4" />
            </span>
            <span className="w-6 h-6 rounded-lg bg-surface-container-low shrink-0" />
            <span className="font-serif text-xl text-on-surface truncate flex-1">{activity.title}</span>
            {activity.time && (
                <span className="text-sm font-medium tabular-nums px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container flex items-center gap-1">
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
    sections,
    people,
    editable,
    canWrite,
    mobile,
    ops,
    onClose,
    onToggleTask,
    onAssignTask,
    onDelete,
}: {
    activity: ActivityWithTasks;
    sections: ScheduleSection[];
    people: Person[];
    editable: boolean;
    canWrite: boolean;
    ops: DetailOps;
    mobile?: boolean;
    onClose?: () => void;
    onDelete: () => void;
    onToggleTask: (taskId: number) => void;
    onAssignTask: (taskId: number, responsibleId: number | null) => void;
}) {
    const [editingHeader, setEditingHeader] = useState(false);
    const [newTask, setNewTask] = useState("");
    const [openTaskId, setOpenTaskId] = useState<number | null>(null);
    const openTask = activity.tasks.find((t) => t.id === openTaskId) ?? null;

    function handleAddTask() {
        const label = newTask.trim();
        if (!label) return;
        setNewTask("");
        ops.addTask(label);
    }

    const [notesSaved, setNotesSaved] = useState(false);
    function handleSaveNotes(value: string) {
        if (value === activity.notes) return;
        ops.saveNotes(value).then(setNotesSaved);
    }

    const done = activity.isCompleted;
    const section = sections.find((s) => s.id === activity.sectionId);

    return (
        <div
            className={`flex flex-col bg-surface-container-lowest ${
                mobile ? "" : "rounded-3xl max-h-[calc(100dvh-3rem)]"
            }`}
        >
            {/* Header */}
            <div className={`shrink-0 p-5 ${mobile ? "pt-6" : "rounded-t-3xl"} bg-surface-container-low`}>
                <div className="flex items-start gap-3">
                    {editingHeader && editable ? (
                        <HeaderEditForm activity={activity} sections={sections} onSave={ops.saveHeader} onDone={() => setEditingHeader(false)} />
                    ) : (
                        <>
                            <div className="min-w-0 flex-1">
                                {section && <p className="text-xs font-medium text-on-surface-variant mb-1">{section.name}</p>}
                                <h2
                                    id="activity-detail-title"
                                    className={`font-serif text-4xl leading-tight break-words ${
                                        done ? "line-through text-on-surface-variant" : "text-primary"
                                    }`}
                                >
                                    {activity.title}
                                </h2>
                                {activity.time && (
                                    <p className="mt-1 text-sm text-on-surface-variant flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" aria-hidden />
                                        {activity.time}
                                    </p>
                                )}
                            </div>
                            {editable && (
                                <div className="shrink-0 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setEditingHeader(true)}
                                        aria-label="Editar actividad"
                                        className={iconBtn}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDelete}
                                        aria-label="Eliminar actividad"
                                        className={iconBtnDanger}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {mobile && (
                                <button type="button" onClick={onClose} aria-label="Cerrar" className={`${iconBtn} -mr-2`}>
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Scrollable: responsables + lista de pasos + notas */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
                {/* Responsables */}
                <section>
                    <h3 className="text-sm font-sans font-medium text-on-surface flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4" aria-hidden />
                        Responsables
                        <span className="text-on-surface-variant font-normal">({activity.responsibles.length})</span>
                    </h3>

                    {activity.responsibles.length === 0 ? (
                        <p className="text-sm text-on-surface-variant py-1">Sin responsables todavía.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {activity.responsibles.map((r) => (
                                <ResponsibleChip key={r.id} responsible={r} people={people} onRemove={editable ? () => ops.deleteResponsible(r.id) : undefined} />
                            ))}
                        </div>
                    )}

                    {editable && (
                        <div className="mt-3">
                            <PersonPicker
                                people={people}
                                excludeIds={new Set(activity.responsibles.map((r) => r.userId).filter((id): id is number => id != null))}
                                onPick={(p) => ops.addResponsible(p.name, p.id)}
                                onFree={(name) => ops.addResponsible(name)}
                                label="Añadir responsable"
                                hint="Elige a un invitado por nombre o @alias, o escribe un nombre para quien no tiene cuenta (DJ, catering…)."
                            />
                        </div>
                    )}
                </section>

                {/* Lista de pasos */}
                <section>
                    <h3 className="text-sm font-sans font-medium text-on-surface flex items-center gap-2 mb-3">
                        <ListChecks className="w-4 h-4" aria-hidden />
                        Pasos
                        <span className="text-on-surface-variant font-normal">({activity.tasks.length})</span>
                    </h3>

                    {activity.tasks.length === 0 ? (
                        <p className="text-sm text-on-surface-variant py-2">Sin pasos todavía. Ej.: «Llevar los anillos».</p>
                    ) : (
                        <div className="space-y-1.5">
                            {activity.tasks.map((t) => (
                                <TaskRow
                                    key={t.id}
                                    task={t}
                                    responsibles={activity.responsibles}
                                    canWrite={canWrite}
                                    editable={editable}
                                    onOpen={() => setOpenTaskId(t.id)}
                                    onToggle={() => onToggleTask(t.id)}
                                    onAssign={(rid) => onAssignTask(t.id, rid)}
                                    onDelete={() => ops.deleteTask(t.id)}
                                />
                            ))}
                        </div>
                    )}

                    {editable && (
                        <div className="flex items-start gap-2 mt-3">
                            <GrowText
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddTask();
                                    }
                                }}
                                placeholder="Añadir paso…"
                                aria-label="Nuevo paso"
                                className={`${inputSmCls} flex-1 min-w-0 min-h-11 pointer-fine:min-h-9 py-2.5 pointer-fine:py-1.5`}
                            />
                            <button
                                type="button"
                                onClick={handleAddTask}
                                disabled={!newTask.trim()}
                                className="shrink-0 w-11 h-11 pointer-fine:w-9 pointer-fine:h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-40 transition-colors cursor-pointer"
                                aria-label="Añadir paso"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </section>

                {/* Notas */}
                <section>
                    <h3 className="text-sm font-sans font-medium text-on-surface flex items-center gap-2 mb-3">
                        <StickyNote className="w-4 h-4" aria-hidden />
                        Notas
                    </h3>
                    {editable ? (
                        <>
                        <GrowText
                            multiline
                            defaultValue={activity.notes}
                            onChange={() => setNotesSaved(false)}
                            onBlur={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Detalles importantes, contactos, recordatorios…"
                            aria-label="Notas de la actividad"
                            className={`${inputCls} min-h-32 leading-relaxed`}
                        />
                        <p className="text-xs text-on-surface-variant mt-1.5" aria-live="polite">
                            {notesSaved ? "Notas guardadas." : "Se guardan solas al salir del campo."}
                        </p>
                        </>
                    ) : activity.notes ? (
                        <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed bg-surface-container-low rounded-xl p-3">
                            {activity.notes}
                        </p>
                    ) : (
                        <p className="text-sm text-on-surface-variant">Sin notas.</p>
                    )}
                </section>
            </div>

            <Dialog open={!!openTask} onClose={() => setOpenTaskId(null)} title={editable ? "Paso" : openTask?.label ?? "Paso"} description={activity.title} size="md">
                {openTask && (
                    <TaskDetail
                        key={openTask.id}
                        task={openTask}
                        responsibles={activity.responsibles}
                        people={people}
                        editable={editable}
                        canWrite={canWrite}
                        onToggle={() => onToggleTask(openTask.id)}
                        onSave={(data) => {
                            ops.updateTask(openTask.id, data);
                            setOpenTaskId(null);
                        }}
                        onDelete={() => {
                            ops.deleteTask(openTask.id);
                            setOpenTaskId(null);
                        }}
                    />
                )}
            </Dialog>
        </div>
    );
}

// ── Responsables ─────────────────────────────────────────────────────────────

function ResponsibleChip({ responsible: r, people, onRemove }: { responsible: Responsible; people: Person[]; onRemove?: () => void }) {
    const person = r.userId ? people.find((p) => p.id === r.userId) : undefined;
    const Icon = r.userId ? UserCheck : User;
    return (
        <span
            aria-busy={isTemp(r.id) || undefined}
            className={`flex items-center gap-1.5 pl-3 ${onRemove ? "pr-1" : "pr-3"} min-h-9 rounded-full bg-surface-container-low text-on-surface text-sm ${isTemp(r.id) ? pendingRowCls : ""}`}
            title={r.userId ? "Invitado de la lista" : "Nombre libre"}
        >
            <Icon className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            <span className="truncate max-w-[160px]">{r.name}</span>
            {person?.alias && <span className="text-xs text-on-surface-variant truncate max-w-[120px]">@{person.alias}</span>}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Quitar a ${r.name}`}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}

// ── Pasos ────────────────────────────────────────────────────────────────────

function TaskRow({
    task,
    responsibles,
    canWrite,
    editable,
    onOpen,
    onToggle,
    onAssign,
    onDelete,
}: {
    task: ScheduleTask;
    responsibles: Responsible[];
    canWrite: boolean;
    editable: boolean;
    onOpen: () => void;
    onToggle: () => void;
    onAssign: (responsibleId: number | null) => void;
    onDelete: () => void;
}) {
    const done = task.isCompleted;
    const assignee = responsibles.find((r) => r.id === task.responsibleId) ?? null;
    const temp = isTemp(task.id);

    return (
        <div aria-busy={temp || undefined} className={`group flex items-center gap-1 rounded-lg pr-1 hover:bg-surface-container-low transition-colors ${temp ? pendingRowCls : ""}`}>
            {canWrite ? (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-pressed={done}
                    aria-label={done ? `Desmarcar «${task.label}»` : `Marcar «${task.label}» como hecho`}
                    className="shrink-0 w-11 h-11 pointer-fine:w-9 pointer-fine:h-9 flex items-center justify-center cursor-pointer group/check"
                >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        done ? "bg-primary text-on-primary" : "bg-surface-container text-transparent group-hover/check:text-primary"
                    }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                </button>
            ) : (
                <span className="shrink-0 w-11 h-11 pointer-fine:w-9 pointer-fine:h-9 flex items-center justify-center">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        done ? "bg-primary text-on-primary" : "bg-surface-container text-transparent"
                    }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                </span>
            )}

            {/* Tocar el texto abre el detalle del paso */}
            <button
                type="button"
                onClick={onOpen}
                disabled={temp}
                className="flex-1 min-w-0 min-h-11 pointer-fine:min-h-9 flex items-center gap-1.5 text-left text-sm cursor-pointer"
                aria-label={`Ver detalle de «${task.label}»`}
            >
                <span className={`truncate ${done ? "line-through text-on-surface-variant" : "text-on-surface"}`}>{task.label}</span>
                {task.description && <StickyNote className="w-3.5 h-3.5 shrink-0 text-on-surface-variant" aria-label="Tiene detalle" role="img" />}
            </button>

            {/* Responsable del paso: selector si editable, chip si no */}
            {editable && responsibles.length > 0 ? (
                <select
                    value={task.responsibleId ?? ""}
                    onChange={(e) => onAssign(e.target.value === "" ? null : Number(e.target.value))}
                    className={`${inputSmCls} shrink-0 max-w-32 text-[13px] cursor-pointer`}
                    aria-label={`Responsable de «${task.label}»`}
                >
                    <option value="">Sin responsable</option>
                    {responsibles.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </select>
            ) : assignee ? (
                <span
                    className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-medium max-w-32"
                    title={assignee.name}
                >
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">{assignee.name}</span>
                </span>
            ) : null}

            {editable && (
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Eliminar el paso «${task.label}»`}
                    className={`${iconBtnDanger} pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus:opacity-100`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

// Detalle de un paso: editable (texto, detalle, responsable) o de solo lectura.
function TaskDetail({
    task,
    responsibles,
    people,
    editable,
    canWrite,
    onToggle,
    onSave,
    onDelete,
}: {
    task: ScheduleTask;
    responsibles: Responsible[];
    people: Person[];
    editable: boolean;
    canWrite: boolean;
    onToggle: () => void;
    onSave: (data: { label: string; description: string; responsibleId: number | null }) => void;
    onDelete: () => void;
}) {
    const [label, setLabel] = useState(task.label);
    const [description, setDescription] = useState(task.description);
    const [responsibleId, setResponsibleId] = useState<number | null>(task.responsibleId);
    const assignee = responsibles.find((r) => r.id === task.responsibleId) ?? null;
    const lbl = "block text-[13px] font-medium text-on-surface-variant mb-1.5";
    const h = "text-sm font-semibold text-on-surface mb-2";

    const status = (
        <button type="button" onClick={onToggle} aria-pressed={task.isCompleted} className={task.isCompleted ? btnSecondary : btnPrimary}>
            <Check className="w-4 h-4" aria-hidden />
            {task.isCompleted ? "Marcar como pendiente" : "Marcar como hecho"}
        </button>
    );

    if (!editable) {
        return (
            <div className="space-y-5">
                <section>
                    <h3 className={h}>Detalle</h3>
                    {task.description ? (
                        <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">{task.description}</p>
                    ) : (
                        <p className="text-sm text-on-surface-variant">Sin detalle.</p>
                    )}
                </section>
                <section>
                    <h3 className={h}>Responsable</h3>
                    {assignee ? <ResponsibleChip responsible={assignee} people={people} /> : <p className="text-sm text-on-surface-variant">Sin responsable.</p>}
                </section>
                <section>
                    <h3 className={h}>Estado</h3>
                    <p className="text-sm text-on-surface">{task.isCompleted ? "Hecho" : "Pendiente"}</p>
                </section>
                {canWrite && <div className="pt-2">{status}</div>}
            </div>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (label.trim()) onSave({ label: label.trim(), description: description.trim(), responsibleId });
            }}
            className="space-y-4"
        >
            <label className="block">
                <span className={lbl}>Paso</span>
                <GrowText autoFocus required value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
                <span className={lbl}>Detalle <span className="font-normal">(opcional)</span></span>
                <GrowText multiline value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qué hay que hacer exactamente, contactos, horarios…" className={`${inputCls} min-h-24 leading-relaxed`} />
            </label>
            <label className="block">
                <span className={lbl}>Responsable</span>
                <select value={responsibleId ?? ""} onChange={(e) => setResponsibleId(e.target.value === "" ? null : Number(e.target.value))} disabled={responsibles.length === 0} className={selectCls}>
                    <option value="">{responsibles.length === 0 ? "Añade responsables a la actividad primero" : "Sin responsable"}</option>
                    {responsibles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </label>
            <p className="text-sm text-on-surface-variant">Estado: <span className="font-medium text-on-surface">{task.isCompleted ? "hecho" : "pendiente"}</span></p>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-2">
                <button type="button" onClick={onDelete} className={`${btnGhost} text-error hover:text-error hover:bg-error/10 sm:mr-auto`}>
                    <Trash2 className="w-4 h-4" aria-hidden />
                    Eliminar paso
                </button>
                {status}
                <button type="submit" disabled={!label.trim()} className={btnPrimary}>
                    <Save className="w-4 h-4" aria-hidden />
                    Guardar
                </button>
            </div>
        </form>
    );
}

// ── Formularios de actividad ─────────────────────────────────────────────────

function SectionSelect({ sections, value, onChange, name }: { sections: ScheduleSection[]; value?: number | null; onChange?: (v: number | null) => void; name?: string }) {
    return (
        <select
            name={name}
            value={onChange ? (value ?? "") : undefined}
            defaultValue={onChange ? undefined : (value ?? "")}
            onChange={onChange ? (e) => onChange(e.target.value === "" ? null : Number(e.target.value)) : undefined}
            aria-label="Sección"
            className={selectCls}
        >
            <option value="">Sin sección</option>
            {sections.filter((s) => !isTemp(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
    );
}

function HeaderEditForm({ activity, sections, onSave, onDone }: { activity: ActivityWithTasks; sections: ScheduleSection[]; onSave: DetailOps["saveHeader"]; onDone: () => void }) {
    const [title, setTitle] = useState(activity.title);
    const [time, setTime] = useState(activity.time ?? "");
    const [sectionId, setSectionId] = useState<number | null>(activity.sectionId);

    function save() {
        if (!title.trim()) return;
        onSave({ title: title.trim(), time: time || null, sectionId });
        onDone();
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="min-w-0 flex-1 space-y-2">
            <GrowText
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título"
                aria-label="Título de la actividad"
                className={inputCls}
            />
            <div className="grid grid-cols-[auto_1fr] gap-2">
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-label="Hora"
                    className={`${inputCls} w-auto`}
                />
                {sections.length > 0 && <SectionSelect sections={sections} value={sectionId} onChange={setSectionId} />}
            </div>
            <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={onDone} className={btnGhostSm}>
                    Cancelar
                </button>
                <button type="submit" disabled={!title.trim()} className={btnPrimarySm}>
                    Guardar
                </button>
            </div>
        </form>
    );
}

function NewActivityForm({ sections, onCreate, onDone }: { sections: ScheduleSection[]; onCreate: (data: { title: string; time?: string; sectionId: number | null }) => void; onDone: () => void }) {
    const firstSection = sections.find((s) => !isTemp(s.id))?.id ?? null;
    return (
        <form
            action={(formData) => {
                const title = (formData.get("title") as string)?.trim();
                if (!title) return;
                const raw = formData.get("sectionId") as string | null;
                onCreate({ title, time: (formData.get("time") as string) || undefined, sectionId: raw ? Number(raw) : null });
                onDone();
            }}
            className="space-y-4"
        >
            <label className="block">
                <span className="block text-[13px] font-medium text-on-surface-variant mb-1.5">Título de la actividad</span>
                <GrowText required autoFocus name="title" placeholder="Ceremonia, recepción, primer baile…" className={inputCls} />
            </label>
            {sections.length > 0 && (
                <label className="block">
                    <span className="block text-[13px] font-medium text-on-surface-variant mb-1.5">Sección</span>
                    <SectionSelect sections={sections} value={firstSection} name="sectionId" />
                </label>
            )}
            <label className="block">
                <span className="block text-[13px] font-medium text-on-surface-variant mb-1.5">Hora <span className="font-normal">(opcional)</span></span>
                <input type="time" name="time" className={inputCls} />
            </label>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
                <button type="submit" className={btnPrimary}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Crear actividad
                </button>
            </div>
        </form>
    );
}

function DetailPlaceholder() {
    return (
        <div className="rounded-3xl bg-surface-container-low p-10 text-center flex flex-col items-center justify-center gap-3 min-h-[300px]">
            <CalendarDays className="w-7 h-7 text-on-surface-variant" strokeWidth={1.5} aria-hidden />
            <p className="text-sm text-on-surface-variant max-w-[240px]">
                Selecciona una actividad para ver sus pasos, responsables y notas.
            </p>
        </div>
    );
}
