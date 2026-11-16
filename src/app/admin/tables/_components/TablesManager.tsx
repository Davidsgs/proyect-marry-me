"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isTemp, pendingRowCls, tempId, useOptimisticState } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { useNotify } from "@/app/admin/_components/Notice";
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
import { declined } from "@/lib/attendance";
import { Plus, X, UserX, Armchair, Pencil, Trash2, GripVertical, Baby, Smile, List, LayoutGrid, Printer, Eraser, ChevronDown } from "lucide-react";
import { EmptyState, StatCard, Tabs, btnGhost, btnPrimary, btnSecondary, iconBtn, iconBtnDanger, inputCls, selectCls } from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import TablePlan from "./TablePlan";
import type { FloorPlan } from "@/app/actions/floor";

type Table = typeof tablesTable.$inferSelect;
type Family = typeof familiesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type AgeCategory = "BABY" | "CHILD" | "ADULT";

interface Props {
    initialTables: Table[];
    families: Family[];
    users: User[];
    floor: FloorPlan;
    canWrite: boolean;
}

const UNASSIGNED = "unassigned";

// A quién se está sentando con el selector de un toque.
type Picking = { kind: "user"; user: User } | { kind: "family"; family: Family; count: number } | null;
type TableData = { number: number; name: string; capacity: number; areaId: number | null };
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export default function TablesManager({ initialTables, families, users, floor, canWrite }: Props) {
    const confirm = useConfirm();
    const notify = useNotify();
    // Mesas e invitados con cambios optimistas: sentar, mover, vaciar, crear,
    // editar y borrar se ven al momento; si el servidor falla, se deshace.
    const server = useMemo(() => ({ tables: initialTables, users }), [initialTables, users]);
    const [board, mutate] = useOptimisticState(server);
    const tables = board.tables;
    const localUsers = board.users;
    const [view, setView] = useState<"list" | "plan">("list");
    // Área que se está viendo en el plano; también es el área por defecto de una mesa nueva.
    const [planAreaId, setPlanAreaId] = useState<number | null>(null);
    const areas = floor.areas;
    const currentAreaId = areas.find((a) => a.id === planAreaId)?.id ?? areas[0]?.id ?? null;
    const areaName = (t: Table) => (areas.length > 1 ? areas.find((a) => a.id === t.areaId)?.name ?? areas[0]?.name : undefined);
    const [newTableOpen, setNewTableOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [picking, setPicking] = useState<Picking>(null);
    const [activeUserId, setActiveUserId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
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

    const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
    const seated = seatable.length - unassigned.length;

    function handleMove(userId: number, tableId: number | null) {
        mutate(
            (b) => ({ ...b, users: b.users.map((u) => (u.id === userId ? { ...u, tableId } : u)) }),
            () => assignUserToTable(userId, tableId),
            { error: "No se pudo cambiar de mesa" },
        );
    }

    function handleMoveFamily(familyId: number, tableId: number | null) {
        if (tableId === null) {
            mutate(
                (b) => ({ ...b, users: b.users.map((u) => (u.familyId === familyId ? { ...u, tableId: null } : u)) }),
                () => assignFamilyToTable(familyId, null),
                { error: "No se pudo quitar a la familia de la mesa" },
            );
            return;
        }
        // Mirror the server's capacity-aware fill so the optimistic UI matches:
        // seat up to the remaining seats, leave the overflow unassigned.
        const table = tables.find((t) => t.id === tableId);
        const capacity = table?.capacity ?? 0;
        const occupancyOthers = localUsers.filter((u) => u.tableId === tableId && u.familyId !== familyId).length;
        const available = Math.max(0, capacity - occupancyOthers);
        const members = localUsers.filter((u) => u.familyId === familyId);
        const ordered = [
            ...members.filter((u) => u.tableId === tableId),
            ...members.filter((u) => u.tableId !== tableId),
        ];
        const seatIds = new Set(ordered.slice(0, available).map((u) => u.id));
        mutate(
            (b) => ({ ...b, users: b.users.map((u) => (u.familyId === familyId ? { ...u, tableId: seatIds.has(u.id) ? tableId : null } : u)) }),
            () => assignFamilyToTable(familyId, tableId),
            { error: "No se pudo sentar a la familia" },
        );
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

    function pickTable(tableId: number | null) {
        if (!picking) return;
        const table = tables.find((t) => t.id === tableId);
        const where = table ? `la mesa ${table.number}` : "«Sin mesa»";
        if (picking.kind === "user") {
            handleMove(picking.user.id, tableId);
            notify(`${picking.user.name} → ${where}`);
        } else {
            handleMoveFamily(picking.family.id, tableId);
            notify(`${picking.family.name} → ${where}`);
        }
        setPicking(null);
    }

    const activeUser = activeUserId != null ? localUsers.find((u) => u.id === activeUserId) ?? null : null;
    const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    const openPicker = canWrite && tables.length > 0 ? setPicking : undefined;

    function saveTable(table: Table | undefined, data: TableData) {
        if (table) {
            mutate(
                (b) => ({ ...b, tables: b.tables.map((t) => (t.id === table.id ? { ...t, ...data } : t)) }),
                () => updateTable(table.id, data),
                { ok: "Mesa guardada", error: "No se pudo guardar la mesa" },
            );
        } else {
            mutate(
                (b) => ({ ...b, tables: [...b.tables, { ...data, id: tempId(), notes: "", posX: null, posY: null, createdAt: nowSql(), updatedAt: nowSql() }].sort((x, y) => x.number - y.number) }),
                () => createTable(data),
                { ok: "Mesa creada", error: "No se pudo crear la mesa" },
            );
        }
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Mesas" value={tables.length} />
                <StatCard label="Asientos" value={totalSeats} />
                <StatCard label="Sentados" value={<>{seated}<span className="text-sm font-normal text-on-surface-variant"> / {seatable.length}</span></>} tone="good" />
                <StatCard label="Sin mesa" value={unassigned.length} tone={unassigned.length > 0 ? "warn" : "default"} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Tabs
                    label="Vista de mesas"
                    value={view}
                    onChange={setView}
                    options={[
                        { value: "list", label: "Lista", icon: List },
                        { value: "plan", label: "Plano", icon: LayoutGrid },
                    ]}
                />
                <div className="flex items-center gap-2">
                    <Link href="/seating-chart" target="_blank" className={`${btnSecondary} flex-1 sm:flex-none`}>
                        <Printer className="w-4 h-4" aria-hidden />
                        Imprimir
                    </Link>
                    {canWrite && (
                        <button type="button" onClick={() => setNewTableOpen(true)} className={`${btnPrimary} flex-1 sm:flex-none`}>
                            <Plus className="w-4 h-4" aria-hidden />
                            Nueva mesa
                        </button>
                    )}
                </div>
            </div>

            {view === "plan" ? (
                <TablePlan tables={tables} floor={floor} membersByTable={membersByTable} canWrite={canWrite} areaId={planAreaId} onAreaChange={setPlanAreaId} onEditTable={setEditingTable} />
            ) : (
                <DndContext id="tables-board" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6 items-start">
                        <UnassignedPool unassigned={unassigned} families={families} canWrite={canWrite} onPick={openPicker} />

                        <div>
                            {tables.length === 0 ? (
                                <EmptyState icon={Armchair} message={canWrite ? "Aún no hay mesas. Crea la primera con «Nueva mesa»." : "Aún no hay mesas."} />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {tables.map((table) => (
                                        <TableCard
                                            key={table.id}
                                            table={table}
                                            areaName={areaName(table)}
                                            members={membersByTable.get(table.id) ?? []}
                                            families={families}
                                            canWrite={canWrite}
                                            onPick={openPicker}
                                            onRemove={(u) => handleMove(u.id, null)}
                                            onEdit={() => setEditingTable(table)}
                                            onClear={async () => {
                                                const count = membersByTable.get(table.id)?.length ?? 0;
                                                if (count === 0) return;
                                                if (await confirm({
                                                    title: `¿Vaciar la mesa ${table.number}?`,
                                                    description: `Sus ${count} ${count === 1 ? "invitado vuelve" : "invitados vuelven"} a «Sin mesa». La mesa se conserva.`,
                                                    confirmLabel: "Vaciar mesa",
                                                })) {
                                                    mutate(
                                                        (b) => ({ ...b, users: b.users.map((u) => (u.tableId === table.id ? { ...u, tableId: null } : u)) }),
                                                        () => clearTable(table.id),
                                                        { ok: `Mesa ${table.number} vaciada`, error: "No se pudo vaciar la mesa" },
                                                    );
                                                }
                                            }}
                                            onDelete={async () => {
                                                const count = membersByTable.get(table.id)?.length ?? 0;
                                                const ok = await confirm({
                                                    title: `¿Eliminar la mesa ${table.number}?`,
                                                    description: count > 0
                                                        ? `Sus ${count} ${count === 1 ? "invitado quedará" : "invitados quedarán"} sin mesa.`
                                                        : "La mesa está vacía.",
                                                    confirmLabel: "Eliminar mesa",
                                                });
                                                if (ok) mutate(
                                                    (b) => ({
                                                        tables: b.tables.filter((t) => t.id !== table.id),
                                                        users: b.users.map((u) => (u.tableId === table.id ? { ...u, tableId: null } : u)),
                                                    }),
                                                    () => deleteTable(table.id),
                                                    { ok: `Mesa ${table.number} eliminada`, error: "No se pudo eliminar la mesa" },
                                                );
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

            {/* Selector de un toque: alternativa al arrastre, pensada para el dedo */}
            <Dialog
                open={!!picking}
                onClose={() => setPicking(null)}
                title={picking?.kind === "family" ? `Sentar a ${picking.family.name}` : picking ? `Sentar a ${picking.user.name} ${picking.user.lastName}` : ""}
                description={picking?.kind === "family" ? `${picking.count} sin mesa. Si no caben todos, el resto queda sin mesa.` : undefined}
                size="md"
            >
                {picking && (
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                        {tables.filter((t) => !isTemp(t.id)).map((t) => {
                            const used = (membersByTable.get(t.id)?.length ?? 0);
                            const free = t.capacity - used;
                            const current = picking.kind === "user" && picking.user.tableId === t.id;
                            return (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => pickTable(t.id)}
                                        disabled={current}
                                        className="w-full min-h-14 flex items-center justify-between gap-3 px-4 rounded-xl bg-surface-container-low text-left hover:bg-surface-container disabled:opacity-60 transition-colors"
                                    >
                                        <span className="min-w-0">
                                            <span className="block text-[15px] font-medium text-on-surface">Mesa {t.number}</span>
                                            {t.name && <span className="block text-xs text-on-surface-variant truncate">{t.name}</span>}
                                        </span>
                                        <span className={`text-sm tabular-nums shrink-0 ${free <= 0 ? "text-error" : "text-on-secondary-container"}`}>
                                            {current ? "Aquí" : free > 0 ? `${free} ${free === 1 ? "libre" : "libres"}` : "Completa"}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                        {picking.kind === "user" && picking.user.tableId != null && (
                            <li className="sm:col-span-2">
                                <button type="button" onClick={() => pickTable(null)} className={`${btnGhost} w-full text-error hover:text-error hover:bg-error/10`}>
                                    <X className="w-4 h-4" aria-hidden /> Quitar de la mesa
                                </button>
                            </li>
                        )}
                    </ul>
                )}
            </Dialog>

            <Dialog open={newTableOpen} onClose={() => setNewTableOpen(false)} title="Nueva mesa" size="sm">
                <TableForm defaultNumber={nextNumber} tables={tables} areas={areas} defaultAreaId={currentAreaId} onSave={(d) => saveTable(undefined, d)} onDone={() => setNewTableOpen(false)} />
            </Dialog>
            <Dialog open={!!editingTable} onClose={() => setEditingTable(null)} title={editingTable ? `Editar mesa ${editingTable.number}` : ""} size="sm">
                {editingTable && <TableForm key={editingTable.id} table={editingTable} tables={tables} areas={areas} defaultAreaId={editingTable.areaId ?? areas[0]?.id ?? null} onSave={(d) => saveTable(editingTable, d)} onDone={() => setEditingTable(null)} />}
            </Dialog>
        </div>
    );
}

function AgeMark({ category }: { category: AgeCategory }) {
    if (category === "BABY") return <Baby className="w-3.5 h-3.5 text-on-surface-variant" aria-label="Bebé" />;
    if (category === "CHILD") return <Smile className="w-3.5 h-3.5 text-on-surface-variant" aria-label="Niño" />;
    return null;
}

function ChipBody({ user, dragging }: { user: User; dragging?: boolean }) {
    return (
        <span className={`flex items-center gap-1.5 min-h-10 pointer-fine:min-h-8 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-sm shadow-sm ${dragging ? "ring-2 ring-primary/40 shadow-md" : ""}`}>
            <GripVertical className="w-3.5 h-3.5 text-on-surface-variant shrink-0 hidden pointer-fine:block" aria-hidden />
            <span className="truncate max-w-40">{user.name} {user.lastName}</span>
            <AgeMark category={user.ageCategory as AgeCategory} />
        </span>
    );
}

// Persona sin mesa: tocar abre el selector; con ratón también se puede arrastrar.
function GuestChip({ user, canWrite, onPick }: { user: User; canWrite: boolean; onPick?: (p: Picking) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `user-${user.id}`, disabled: !canWrite });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

    if (!canWrite) return <ChipBody user={user} />;
    return (
        <button
            ref={setNodeRef}
            type="button"
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onPick?.({ kind: "user", user })}
            aria-label={`Sentar a ${user.name} ${user.lastName}`}
            aria-roledescription="invitado arrastrable"
            className={`cursor-pointer pointer-fine:cursor-grab active:cursor-grabbing touch-manipulation rounded-lg ${isDragging ? "opacity-40" : ""}`}
        >
            <ChipBody user={user} />
        </button>
    );
}

function UnassignedPool({
    unassigned,
    families,
    canWrite,
    onPick,
}: {
    unassigned: User[];
    families: Family[];
    canWrite: boolean;
    onPick?: (p: Picking) => void;
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
        <details
            ref={setNodeRef}
            open
            className={`group/pool bg-surface-container-lowest rounded-2xl lg:sticky lg:top-6 transition-shadow ${isOver ? "ring-2 ring-primary/40" : ""}`}
        >
            <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none lg:pointer-events-none [&::-webkit-details-marker]:hidden">
                <span>
                    <span className="block font-serif text-3xl leading-none text-on-surface">Sin mesa</span>
                    <span className={`mt-1 block text-sm ${unassigned.length > 0 ? "text-error" : "text-on-secondary-container"}`}>
                        {unassigned.length === 0 ? "Todos tienen mesa" : unassigned.length === 1 ? "1 invitado por sentar" : `${unassigned.length} invitados por sentar`}
                    </span>
                </span>
                <ChevronDown className="w-5 h-5 text-on-surface-variant transition-transform group-open/pool:rotate-180 lg:hidden" aria-hidden />
            </summary>

            <div className="px-4 pb-4">
                {canWrite && unassigned.length > 0 && (
                    <p className="text-xs text-on-surface-variant mb-4">Toca a alguien para elegir su mesa. Con ratón también puedes arrastrarlo.</p>
                )}
                {groups.length > 0 && (
                    <div className="space-y-4 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
                        {groups.map(({ family, members }) => (
                            <div key={family?.id ?? "none"} className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[13px] font-medium text-on-surface-variant truncate">{family?.name ?? "Sin familia"}</span>
                                    {canWrite && onPick && family && members.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => onPick({ kind: "family", family, count: members.length })}
                                            className="shrink-0 min-h-9 px-2.5 rounded-lg text-[13px] font-medium text-primary hover:bg-surface-container-low transition-colors"
                                        >
                                            Sentar familia
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {members.map((u) => <GuestChip key={u.id} user={u} canWrite={canWrite} onPick={onPick} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </details>
    );
}

function TableCard({
    table,
    areaName,
    members,
    families,
    canWrite,
    onPick,
    onRemove,
    onEdit,
    onClear,
    onDelete,
}: {
    table: Table;
    areaName?: string;
    members: User[];
    families: Family[];
    canWrite: boolean;
    onPick?: (p: Picking) => void;
    onRemove: (u: User) => void;
    onEdit: () => void;
    onClear: () => void;
    onDelete: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `table-${table.id}` });
    const occupancy = members.length;
    const over = occupancy > table.capacity;
    const full = occupancy === table.capacity;
    const pct = Math.min(100, Math.round((occupancy / Math.max(1, table.capacity)) * 100));
    const notComing = members.filter((u) => declined(u, families.find((f) => f.id === u.familyId))).length;

    return (
        <div
            ref={setNodeRef}
            aria-busy={isTemp(table.id) || undefined}
            className={`group flex flex-col gap-3 bg-surface-container-lowest p-5 rounded-2xl transition-shadow ${isOver ? "ring-2 ring-primary/50 shadow-md" : ""} ${isTemp(table.id) ? pendingRowCls : ""}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-serif text-3xl leading-none text-on-surface">Mesa {table.number}</h3>
                    {(table.name || areaName) && (
                        <p className="mt-1 text-sm text-on-surface-variant truncate">{[table.name, areaName].filter(Boolean).join(" · ")}</p>
                    )}
                </div>
                <span className={`shrink-0 text-sm font-medium tabular-nums ${over ? "text-error" : full ? "text-on-secondary-container" : "text-on-surface-variant"}`}>
                    {occupancy}/{table.capacity}
                    <span className="sr-only"> asientos ocupados</span>
                </span>
            </div>
            <span className="block h-1.5 rounded-full bg-surface-container overflow-hidden" aria-hidden>
                <span className={`block h-full rounded-full ${over ? "bg-error" : full ? "bg-on-secondary-container" : "bg-salvia"}`} style={{ width: `${pct}%` }} />
            </span>

            {over && (
                <p className="text-sm text-error">Sobra{occupancy - table.capacity === 1 ? "" : "n"} {occupancy - table.capacity}: mueve a alguien o amplía la mesa.</p>
            )}
            {notComing > 0 && (
                <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <UserX className="w-4 h-4 shrink-0" aria-hidden />
                    {notComing === 1 ? "1 persona no viene: puedes liberar su silla." : `${notComing} personas no vienen: puedes liberar sus sillas.`}
                </p>
            )}
            <div className="min-h-14 flex flex-wrap gap-1.5 content-start">
                {members.length === 0 ? (
                    <p className="text-sm text-on-surface-variant py-3">{canWrite ? "Mesa vacía. Sienta a alguien desde «Sin mesa»." : "Mesa vacía."}</p>
                ) : (
                    members.map((u) => (
                        <SeatedChip key={u.id} user={u} family={families.find((f) => f.id === u.familyId)} canWrite={canWrite} onPick={onPick} onRemove={() => onRemove(u)} />
                    ))
                )}
            </div>

            {canWrite && (
                <div className="flex items-center justify-end gap-0.5 mt-auto pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button type="button" onClick={onEdit} className={iconBtn} aria-label={`Editar mesa ${table.number}`}>
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={onClear} disabled={occupancy === 0} className={iconBtn} aria-label={`Vaciar mesa ${table.number}`}>
                        <Eraser className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={onDelete} className={iconBtnDanger} aria-label={`Eliminar mesa ${table.number}`}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

function SeatedChip({
    user,
    family,
    canWrite,
    onPick,
    onRemove,
}: {
    user: User;
    family: Family | undefined;
    canWrite: boolean;
    onPick?: (p: Picking) => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `user-${user.id}`, disabled: !canWrite });
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
    const out = declined(user, family);
    const name = (
        <span className={`truncate max-w-32 ${out ? "line-through text-on-surface-variant" : ""}`}>
            {user.name} {user.lastName}
            {out && <span className="sr-only"> (no viene)</span>}
        </span>
    );

    if (!canWrite) {
        return (
            <span title={out ? `${family?.name ?? ""} · No viene` : family?.name ?? ""} className="flex items-center gap-1.5 min-h-10 pointer-fine:min-h-8 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-sm shadow-sm">
                {out && <UserX className="w-3.5 h-3.5 text-on-surface-variant shrink-0" aria-hidden />}
                {name}
                <AgeMark category={user.ageCategory as AgeCategory} />
            </span>
        );
    }
    return (
        <span ref={setNodeRef} style={style} className={`flex items-center rounded-lg bg-surface-container-lowest shadow-sm ${isDragging ? "opacity-40" : ""}`} title={out ? `${family?.name ?? ""} · No viene` : family?.name ?? ""}>
            <button
                type="button"
                {...listeners}
                {...attributes}
                onClick={() => onPick?.({ kind: "user", user })}
                aria-label={`Cambiar de mesa a ${user.name} ${user.lastName}`}
                className="flex items-center gap-1.5 min-h-10 pointer-fine:min-h-8 pl-3 pr-1 text-sm text-on-surface cursor-pointer pointer-fine:cursor-grab active:cursor-grabbing touch-manipulation"
            >
                <GripVertical className="w-3.5 h-3.5 text-on-surface-variant shrink-0 hidden pointer-fine:block" aria-hidden />
                {out && <UserX className="w-3.5 h-3.5 text-on-surface-variant shrink-0" aria-hidden />}
                {name}
                <AgeMark category={user.ageCategory as AgeCategory} />
            </button>
            <button
                type="button"
                onClick={onRemove}
                className="w-9 h-10 pointer-fine:w-7 pointer-fine:h-8 flex items-center justify-center rounded-r-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                aria-label={`Quitar a ${user.name} ${user.lastName} de la mesa`}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </span>
    );
}

// Crear (sin table) o editar una mesa.
function TableForm({ table, tables, areas, defaultAreaId, defaultNumber, onSave, onDone }: {
    table?: Table;
    tables: Table[];
    areas: FloorPlan["areas"];
    defaultAreaId: number | null;
    defaultNumber?: number;
    onSave: (data: TableData) => void;
    onDone: () => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const label = "block text-[13px] font-medium text-on-surface-variant mb-1.5";
    return (
        <form
            action={(formData) => {
                setError(null);
                const data = {
                    number: Number(formData.get("number")),
                    name: ((formData.get("name") as string) || "").trim(),
                    capacity: Number(formData.get("capacity")) || 10,
                    areaId: formData.get("areaId") ? Number(formData.get("areaId")) : defaultAreaId,
                };
                if (tables.some((t) => t.number === data.number && t.id !== table?.id)) {
                    setError(`Ya existe la mesa ${data.number}. Elige otro número.`);
                    return;
                }
                onSave(data);
                onDone();
            }}
            className="grid grid-cols-2 gap-4"
        >
            <label className="block">
                <span className={label}>Número</span>
                <input required type="number" inputMode="numeric" name="number" defaultValue={table?.number ?? defaultNumber} min={1} className={inputCls} />
            </label>
            <label className="block">
                <span className={label}>Capacidad</span>
                <input required type="number" inputMode="numeric" name="capacity" defaultValue={table?.capacity ?? 10} min={1} className={inputCls} />
            </label>
            <label className="block col-span-2">
                <span className={label}>Nombre <span className="font-normal">(opcional)</span></span>
                <input name="name" defaultValue={table?.name ?? ""} className={inputCls} placeholder="Mesa de honor" />
            </label>
            {areas.length > 1 && (
                <label className="block col-span-2">
                    <span className={label}>Área del plano</span>
                    <select name="areaId" defaultValue={defaultAreaId ?? ""} className={selectCls}>
                        {areas.filter((a) => !isTemp(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </label>
            )}
            {error && <p role="alert" className="col-span-2 text-sm text-error">{error}</p>}
            <div className="col-span-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
                <button type="submit" className={btnPrimary}>
                    {!table && <Plus className="w-4 h-4" aria-hidden />}
                    {table ? "Guardar cambios" : "Crear mesa"}
                </button>
            </div>
        </form>
    );
}
