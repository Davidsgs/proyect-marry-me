"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { tables as tablesTable, families as familiesTable, users as usersTable } from "@/db/schema";
import {
    createTable,
    updateTable,
    deleteTable,
    clearTable,
    assignUserToTable,
    assignFamilyToTable,
} from "@/app/actions/tables";
import {
    Plus,
    X,
    Loader2,
    Armchair,
    Pencil,
    Trash2,
    GripVertical,
    Users as UsersIcon,
    Baby,
    Smile,
    List,
    LayoutGrid,
    Printer,
    Eraser,
} from "lucide-react";
import TablePlan from "./TablePlan";

type Table = typeof tablesTable.$inferSelect;
type Family = typeof familiesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type AgeCategory = "BABY" | "CHILD" | "ADULT";

interface Props {
    initialTables: Table[];
    families: Family[];
    users: User[];
}

const UNASSIGNED = "unassigned";

export default function TablesManager({ initialTables, families, users }: Props) {
    const [localUsers, setLocalUsers] = useState<User[]>(users);
    const [syncedUsers, setSyncedUsers] = useState(users);
    const [view, setView] = useState<"list" | "plan">("list");
    const [showTableForm, setShowTableForm] = useState(false);
    const [editingTableId, setEditingTableId] = useState<number | null>(null);
    const [activeUserId, setActiveUserId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    // Re-sync from the server after a revalidate, but never clobber optimistic
    // state mid-transition (would snap a chip back then forward). Render-time
    // sync per https://react.dev/learn/you-might-not-need-an-effect
    if (users !== syncedUsers && !isPending) {
        setSyncedUsers(users);
        setLocalUsers(users);
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    const seatable = useMemo(() => localUsers.filter((u) => u.familyId != null), [localUsers]);
    const membersByTable = useMemo(() => {
        const map = new Map<number, User[]>();
        for (const u of seatable) {
            if (u.tableId == null) continue;
            const arr = map.get(u.tableId) ?? [];
            arr.push(u);
            map.set(u.tableId, arr);
        }
        return map;
    }, [seatable]);
    const unassigned = useMemo(() => seatable.filter((u) => u.tableId == null), [seatable]);

    const totalSeats = initialTables.reduce((sum, t) => sum + t.capacity, 0);
    const seated = seatable.length - unassigned.length;

    function handleMove(userId: number, tableId: number | null) {
        setLocalUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, tableId } : u)));
        startTransition(() => assignUserToTable(userId, tableId));
    }

    function handleMoveFamily(familyId: number, tableId: number | null) {
        if (tableId === null) {
            setLocalUsers((prev) => prev.map((u) => (u.familyId === familyId ? { ...u, tableId: null } : u)));
            startTransition(() => assignFamilyToTable(familyId, null));
            return;
        }
        // Mirror the server's capacity-aware fill so the optimistic UI matches:
        // seat up to the remaining seats, leave the overflow unassigned.
        const table = initialTables.find((t) => t.id === tableId);
        const capacity = table?.capacity ?? 0;
        const occupancyOthers = localUsers.filter((u) => u.tableId === tableId && u.familyId !== familyId).length;
        const available = Math.max(0, capacity - occupancyOthers);
        const members = localUsers.filter((u) => u.familyId === familyId);
        const ordered = [
            ...members.filter((u) => u.tableId === tableId),
            ...members.filter((u) => u.tableId !== tableId),
        ];
        const seatIds = new Set(ordered.slice(0, available).map((u) => u.id));
        setLocalUsers((prev) =>
            prev.map((u) => (u.familyId === familyId ? { ...u, tableId: seatIds.has(u.id) ? tableId : null } : u)),
        );
        startTransition(() => assignFamilyToTable(familyId, tableId));
    }

    function onDragStart(event: DragStartEvent) {
        const id = String(event.active.id);
        if (id.startsWith("user-")) setActiveUserId(Number(id.replace("user-", "")));
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveUserId(null);
        const { active, over } = event;
        if (!over) return;
        const userId = Number(String(active.id).replace("user-", ""));
        const overId = String(over.id);
        let target: number | null;
        if (overId === UNASSIGNED) target = null;
        else if (overId.startsWith("table-")) target = Number(overId.replace("table-", ""));
        else return;
        const current = localUsers.find((u) => u.id === userId)?.tableId ?? null;
        if (current === target) return;
        handleMove(userId, target);
    }

    const activeUser = activeUserId != null ? localUsers.find((u) => u.id === activeUserId) ?? null : null;
    const nextNumber = initialTables.length > 0 ? Math.max(...initialTables.map((t) => t.number)) + 1 : 1;

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Mesas" value={initialTables.length} icon={<Armchair className="w-4 h-4" />} />
                <StatCard label="Asientos" value={totalSeats} icon={<UsersIcon className="w-4 h-4" />} />
                <StatCard label="Sentados" value={`${seated}/${seatable.length}`} icon={<Smile className="w-4 h-4" />} />
                <StatCard label="Sin asignar" value={unassigned.length} icon={<X className="w-4 h-4" />} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 w-fit">
                    <ViewTab active={view === "list"} onClick={() => setView("list")} icon={<List className="w-4 h-4" />}>Lista</ViewTab>
                    <ViewTab active={view === "plan"} onClick={() => setView("plan")} icon={<LayoutGrid className="w-4 h-4" />}>Plano</ViewTab>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/seating-chart"
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-surface-container-low text-on-surface-variant hover:text-primary px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Link>
                    <button
                        onClick={() => setShowTableForm((v) => !v)}
                        className="flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium"
                    >
                        {showTableForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showTableForm ? "Cerrar" : "Nueva mesa"}
                    </button>
                </div>
            </div>

            {showTableForm && (
                <TableFormInline defaultNumber={nextNumber} onDone={() => setShowTableForm(false)} />
            )}

            {view === "plan" ? (
                <TablePlan tables={initialTables} membersByTable={membersByTable} />
            ) : (
                <DndContext id="tables-board" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                        <UnassignedPool
                            unassigned={unassigned}
                            families={families}
                            tables={initialTables}
                            onMove={handleMove}
                            onMoveFamily={handleMoveFamily}
                        />

                        <div>
                            {initialTables.length === 0 ? (
                                <EmptyState message="Aún no hay mesas. Crea la primera con «Nueva mesa»." />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {initialTables.map((table) => (
                                        <TableCard
                                            key={table.id}
                                            table={table}
                                            members={membersByTable.get(table.id) ?? []}
                                            families={families}
                                            tables={initialTables}
                                            isEditing={editingTableId === table.id}
                                            onMove={handleMove}
                                            onEdit={() => setEditingTableId(table.id)}
                                            onCancelEdit={() => setEditingTableId(null)}
                                            onClear={() => {
                                                const count = membersByTable.get(table.id)?.length ?? 0;
                                                if (count === 0) return;
                                                if (confirm(`¿Vaciar la mesa ${table.number}? Sus ${count} invitado(s) volverán a «sin asignar».`)) {
                                                    setLocalUsers((prev) => prev.map((u) => (u.tableId === table.id ? { ...u, tableId: null } : u)));
                                                    startTransition(() => clearTable(table.id));
                                                }
                                            }}
                                            onDelete={() => {
                                                const count = membersByTable.get(table.id)?.length ?? 0;
                                                const msg = count > 0
                                                    ? `La mesa ${table.number} tiene ${count} invitado(s). Se quedarán sin asignar. ¿Eliminar?`
                                                    : `¿Eliminar la mesa ${table.number}?`;
                                                if (confirm(msg)) startTransition(() => deleteTable(table.id));
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeUser ? <ChipBody user={activeUser} dragging /> : null}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
}

function ViewTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans tracking-widest uppercase font-medium transition-all ${active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
        >
            {icon}
            {children}
        </button>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
    return (
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_4px_20px_rgba(81,68,67,0.03)]">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">{label}</p>
                <span className="text-on-surface-variant opacity-60">{icon}</span>
            </div>
            <span className="text-2xl font-serif text-primary">{value}</span>
        </div>
    );
}

function AgeMark({ category }: { category: AgeCategory }) {
    if (category === "BABY") return <Baby className="w-3 h-3 text-on-surface-variant/70" aria-label="Bebé" />;
    if (category === "CHILD") return <Smile className="w-3 h-3 text-on-surface-variant/70" aria-label="Niño" />;
    return null;
}

function ChipBody({ user, dragging }: { user: User; dragging?: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface text-on-surface text-xs shadow-sm ${dragging ? "ring-2 ring-primary/40" : ""}`}>
            <GripVertical className="w-3 h-3 text-on-surface-variant/50 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{user.name} {user.lastName}</span>
            <AgeMark category={user.ageCategory as AgeCategory} />
        </div>
    );
}

function GuestChip({
    user,
    tables,
    onMove,
}: {
    user: User;
    tables: Table[];
    onMove: (userId: number, tableId: number | null) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `user-${user.id}` });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-1 ${isDragging ? "opacity-40" : ""}`}
        >
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing touch-none">
                <ChipBody user={user} />
            </div>
            <select
                value={user.tableId ?? ""}
                onChange={(e) => onMove(user.id, e.target.value === "" ? null : Number(e.target.value))}
                className="text-[10px] py-1 pl-1.5 pr-5 rounded-md bg-surface-container-low border-none outline-none text-on-surface-variant appearance-none cursor-pointer focus:ring-2 focus:ring-primary/40"
                aria-label={`Mover a mesa a ${user.name}`}
            >
                <option value="">Sin asignar</option>
                {tables.map((t) => (
                    <option key={t.id} value={t.id}>Mesa {t.number}</option>
                ))}
            </select>
        </div>
    );
}

function UnassignedPool({
    unassigned,
    families,
    tables,
    onMove,
    onMoveFamily,
}: {
    unassigned: User[];
    families: Family[];
    tables: Table[];
    onMove: (userId: number, tableId: number | null) => void;
    onMoveFamily: (familyId: number, tableId: number | null) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED });

    const groups = useMemo(() => {
        const map = new Map<number, User[]>();
        for (const u of unassigned) {
            if (u.familyId == null) continue;
            const arr = map.get(u.familyId) ?? [];
            arr.push(u);
            map.set(u.familyId, arr);
        }
        return Array.from(map.entries()).map(([familyId, members]) => ({
            family: families.find((f) => f.id === familyId),
            members,
        }));
    }, [unassigned, families]);

    return (
        <div
            ref={setNodeRef}
            className={`bg-surface-container-lowest rounded-2xl p-4 shadow-sm h-fit lg:sticky lg:top-6 transition-colors ${isOver ? "ring-2 ring-primary/40" : ""}`}
        >
            <h3 className="font-serif text-lg text-on-surface mb-1">Sin asignar</h3>
            <p className="text-[11px] text-on-surface-variant mb-4">{unassigned.length} invitado(s) por sentar</p>

            {groups.length === 0 ? (
                <p className="text-xs text-on-surface-variant/60 italic py-6 text-center">Todos los invitados tienen mesa.</p>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {groups.map(({ family, members }) => (
                        <div key={family?.id ?? "none"} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant truncate">
                                    {family?.name ?? "Sin familia"}
                                </span>
                                {family && tables.length > 0 && (
                                    <select
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value !== "") onMoveFamily(family.id, Number(e.target.value));
                                            e.target.value = "";
                                        }}
                                        className="text-[10px] py-0.5 pl-1.5 pr-5 rounded-md bg-surface-container-low border-none outline-none text-primary appearance-none cursor-pointer focus:ring-2 focus:ring-primary/40"
                                        aria-label={`Sentar a ${family.name} en una mesa`}
                                    >
                                        <option value="">Sentar todos…</option>
                                        {tables.map((t) => (
                                            <option key={t.id} value={t.id}>Mesa {t.number}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {members.map((u) => (
                                    <GuestChip key={u.id} user={u} tables={tables} onMove={onMove} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TableCard({
    table,
    members,
    families,
    tables,
    isEditing,
    onMove,
    onEdit,
    onCancelEdit,
    onClear,
    onDelete,
}: {
    table: Table;
    members: User[];
    families: Family[];
    tables: Table[];
    isEditing: boolean;
    onMove: (userId: number, tableId: number | null) => void;
    onEdit: () => void;
    onCancelEdit: () => void;
    onClear: () => void;
    onDelete: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `table-${table.id}` });
    const occupancy = members.length;
    const over = occupancy > table.capacity;

    if (isEditing) {
        return <TableEditCard table={table} onCancel={onCancelEdit} />;
    }

    return (
        <div
            ref={setNodeRef}
            className={`relative flex flex-col gap-3 bg-surface-container-lowest p-5 rounded-2xl shadow-sm transition-all group ${isOver ? "ring-2 ring-primary/50 shadow-md" : ""}`}
        >
            <div className="flex items-start justify-between gap-2 pr-1">
                <div className="min-w-0">
                    <h3 className="font-serif text-lg text-on-surface leading-tight truncate">
                        Mesa {table.number}
                    </h3>
                    {table.name && <p className="text-xs text-on-surface-variant italic truncate">{table.name}</p>}
                </div>
                <span className={`flex-shrink-0 text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full ${over ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
                    {occupancy}/{table.capacity}
                </span>
            </div>

            <div className="min-h-[60px] flex flex-wrap gap-1.5 content-start">
                {members.length === 0 ? (
                    <p className="text-[11px] text-on-surface-variant/50 italic py-3">Arrastra invitados aquí…</p>
                ) : (
                    members.map((u) => {
                        const family = families.find((f) => f.id === u.familyId);
                        return (
                            <SeatedChip key={u.id} user={u} family={family} tables={tables} onMove={onMove} />
                        );
                    })
                )}
            </div>

            <div className="flex items-center justify-end gap-1 mt-auto pt-2 border-t border-outline-variant/20">
                <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" aria-label="Editar mesa">
                    <Pencil className="w-4 h-4" />
                </button>
                <button onClick={onClear} disabled={occupancy === 0} className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Vaciar mesa">
                    <Eraser className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-colors" aria-label="Eliminar mesa">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function SeatedChip({
    user,
    family,
    tables,
    onMove,
}: {
    user: User;
    family: Family | undefined;
    tables: Table[];
    onMove: (userId: number, tableId: number | null) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `user-${user.id}` });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-1 ${isDragging ? "opacity-40" : ""}`}>
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing touch-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface text-on-surface text-xs shadow-sm">
                    <GripVertical className="w-3 h-3 text-on-surface-variant/50 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{user.name} {user.lastName}</span>
                    <AgeMark category={user.ageCategory as AgeCategory} />
                </div>
            </div>
            <select
                value={user.tableId ?? ""}
                onChange={(e) => onMove(user.id, e.target.value === "" ? null : Number(e.target.value))}
                className="text-[10px] py-1 pl-1.5 pr-5 rounded-md bg-surface-container-low border-none outline-none text-on-surface-variant appearance-none cursor-pointer focus:ring-2 focus:ring-primary/40"
                aria-label={`Mover a ${user.name}`}
                title={family?.name ?? ""}
            >
                <option value="">Sin asignar</option>
                {tables.map((t) => (
                    <option key={t.id} value={t.id}>Mesa {t.number}</option>
                ))}
            </select>
        </div>
    );
}

function TableFormInline({ defaultNumber, onDone }: { defaultNumber: number; onDone: () => void }) {
    const [pending, startTransition] = useTransition();
    return (
        <form
            action={(formData) => {
                startTransition(async () => {
                    await createTable({
                        number: Number(formData.get("number")),
                        name: (formData.get("name") as string) || "",
                        capacity: Number(formData.get("capacity")) || 10,
                    });
                    onDone();
                });
            }}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
            <div className="md:col-span-2">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Número</label>
                <input required type="number" name="number" defaultValue={defaultNumber} min={1} className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" />
            </div>
            <div className="md:col-span-5">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Nombre (opcional)</label>
                <input name="name" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" placeholder="Mesa de honor" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Capacidad</label>
                <input required type="number" name="capacity" defaultValue={10} min={1} className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" />
            </div>
            <div className="md:col-span-2">
                <button disabled={pending} type="submit" className="w-full bg-primary text-on-primary py-3 rounded-xl shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 h-[48px] disabled:opacity-60">
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Añadir
                </button>
            </div>
        </form>
    );
}

function TableEditCard({ table, onCancel }: { table: Table; onCancel: () => void }) {
    const [pending, startTransition] = useTransition();
    return (
        <form
            action={(formData) => {
                startTransition(async () => {
                    await updateTable(table.id, {
                        number: Number(formData.get("number")),
                        name: (formData.get("name") as string) || "",
                        capacity: Number(formData.get("capacity")) || 10,
                    });
                    onCancel();
                });
            }}
            className="bg-surface-container-lowest p-5 rounded-2xl shadow-md ring-2 ring-primary/30 grid grid-cols-2 gap-3"
        >
            <div className="col-span-2 flex items-center justify-between">
                <p className="text-[10px] font-sans tracking-widest uppercase font-medium text-primary">Editando mesa</p>
                <button type="button" onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div>
                <label className="block text-[10px] tracking-widest uppercase font-medium text-on-surface-variant mb-1">Número</label>
                <input required type="number" name="number" defaultValue={table.number} min={1} className="w-full px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface shadow-sm" />
            </div>
            <div>
                <label className="block text-[10px] tracking-widest uppercase font-medium text-on-surface-variant mb-1">Capacidad</label>
                <input required type="number" name="capacity" defaultValue={table.capacity} min={1} className="w-full px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface shadow-sm" />
            </div>
            <div className="col-span-2">
                <label className="block text-[10px] tracking-widest uppercase font-medium text-on-surface-variant mb-1">Nombre (opcional)</label>
                <input name="name" defaultValue={table.name} className="w-full px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface shadow-sm" placeholder="Mesa de honor" />
            </div>
            <button disabled={pending} type="submit" className="col-span-2 bg-primary text-on-primary py-2 rounded-lg shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
                {pending && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar cambios
            </button>
        </form>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm h-full flex items-center justify-center">
            <p className="text-on-surface-variant font-sans text-sm">{message}</p>
        </div>
    );
}
