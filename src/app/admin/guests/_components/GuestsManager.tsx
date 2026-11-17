"use client";

import { useMemo, useRef, useState } from "react";
import { GrowText } from "@/components/GrowText";
import { isTemp, pendingRowCls, tempId, useOptimisticState } from "@/app/admin/_components/optimistic";
import { ALIAS_MAX, aliasError } from "@/lib/alias";
import { GuestsCtx, draftUser, nowSql, useGuestsMutate, withoutUser, type Family, type User } from "./guestsStore";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { createFamily, createManyUsers, deleteUser, updateUser } from "@/app/actions/admin";
import { Plus, Search, Trash2, AlertTriangle, Pencil, Users as UsersIcon, Home, ChevronRight, MousePointerClick } from "lucide-react";
import {
    Chip, EmptyState, RsvpChip, StatCard, Tabs,
    btnGhost, btnPrimary, btnSecondary, iconBtn, iconBtnDanger, inputCls, rsvpSelectCls, selectCls,
} from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { dietaryText } from "@/lib/diet";
import FamilyDetail, { AgePicker } from "./FamilyDetail";
import type { RsvpEvent } from "@/lib/rsvpAudit";

type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
type Role = "ADMIN" | "MAIN_GUEST" | "GUEST";
type AgeCategory = "BABY" | "CHILD" | "ADULT";

const AGE_LABEL: Record<AgeCategory, string> = { ADULT: "Adulto", CHILD: "Niño", BABY: "Bebé" };

interface Props {
    families: Family[];
    users: User[];
    canWriteFamilies: boolean;
    canWriteUsers: boolean;
    initialTab?: "families" | "users";
    initialFamilyFilter?: FamilyFilter;
    /** Plazo para responder («1 de marzo»), para el recordatorio a familias pendientes. */
    deadlineLabel?: string | null;
    /** Historial de respuestas (más reciente primero), para la ficha de cada familia. */
    rsvpEvents?: RsvpEvent[];
}

// "minors": familias con menores que no están marcadas como «familia directa»
// (ven la nota de celebración sin niños aunque traigan niños).
export type FamilyFilter = "all" | "pending" | "no-delegate" | "minors";

export default function GuestsManager({ families: serverFamilies, users: serverUsers, canWriteFamilies, canWriteUsers, initialTab = "families", initialFamilyFilter = "all", deadlineLabel = null, rsvpEvents = [] }: Props) {
    const confirm = useConfirm();
    // Familias e invitados con cambios optimistas (ver guestsStore.tsx).
    const server = useMemo(() => ({ families: serverFamilies, users: serverUsers }), [serverFamilies, serverUsers]);
    const [data, mutate] = useOptimisticState(server);
    const { families, users } = data;
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [tab, setTab] = useState<"families" | "users">(initialTab);
    const [familyStatus, setFamilyStatus] = useState<FamilyFilter>(initialFamilyFilter);
    const [openFamilyId, setOpenFamilyId] = useState<number | null>(null);
    const openFamily = openFamilyId != null ? families.find((f) => f.id === openFamilyId) ?? null : null;
    const [query, setQuery] = useState("");
    const [newFamilyOpen, setNewFamilyOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [familyFilter, setFamilyFilter] = useState<number | "all">("all");
    // La hoja móvil pide el cierre a la ficha, que comprueba cambios sin guardar.
    const requestClose = useRef<() => void>(() => setOpenFamilyId(null));

    const totalFamilies = families.length;
    const withoutDelegate = families.filter((f) => f.delegateUserId == null).length;
    const pendingFamilies = families.filter((f) => f.globalRsvpStatus === "PENDING").length;
    const familiesWithMinors = useMemo(
        () => new Set(users.filter((u) => u.familyId != null && u.ageCategory !== "ADULT").map((u) => u.familyId as number)),
        [users],
    );
    const minorsNotDirect = families.filter((f) => !f.isDirectFamily && familiesWithMinors.has(f.id)).length;
    const guestUsers = users.filter((u) => u.familyId != null);
    const totalGuests = guestUsers.length;
    const confirmedGuests = guestUsers.filter((u) => u.isConfirmed).length;
    const adultGuests = guestUsers.filter((u) => u.ageCategory === "ADULT").length;
    const minorGuests = totalGuests - adultGuests;

    const filteredFamilies = useMemo(() => {
        const q = query.trim().toLowerCase();
        return families.filter((f) => {
            if (familyStatus === "pending" && f.globalRsvpStatus !== "PENDING") return false;
            if (familyStatus === "no-delegate" && f.delegateUserId != null) return false;
            if (familyStatus === "minors" && (f.isDirectFamily || !familiesWithMinors.has(f.id))) return false;
            if (!q) return true;
            return f.name.toLowerCase().includes(q) || (f.alias ?? "").toLowerCase().includes(q);
        });
    }, [families, query, familyStatus, familiesWithMinors]);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) => {
            if (familyFilter !== "all" && u.familyId !== familyFilter) return false;
            if (!q) return true;
            const family = families.find((f) => f.id === u.familyId);
            return (
                u.fullname.toLowerCase().includes(q) ||
                (u.alias ?? "").includes(q.replace(/^@/, "")) ||
                (u.email ?? "").toLowerCase().includes(q) ||
                (family?.name ?? "").toLowerCase().includes(q)
            );
        });
    }, [users, families, query, familyFilter]);

    const detail = openFamily && (
        <FamilyDetail
            key={openFamily.id}
            family={openFamily}
            users={users}
            canWriteFamilies={canWriteFamilies}
            canWriteUsers={canWriteUsers}
            deadlineLabel={deadlineLabel}
            history={rsvpEvents.filter((e) => e.familyId === openFamily.id)}
            onClose={() => setOpenFamilyId(null)}
            registerClose={(fn) => { requestClose.current = fn; }}
        />
    );

    return (
        <GuestsCtx.Provider value={mutate}>
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Familias"
                    value={totalFamilies}
                    tone={withoutDelegate > 0 ? "warn" : "default"}
                    hint={withoutDelegate > 0 ? `${withoutDelegate} sin delegado` : "Todas con delegado"}
                />
                <StatCard label="Sin responder" value={pendingFamilies} hint={pendingFamilies === 1 ? "familia" : "familias"} />
                <StatCard
                    label="Invitados"
                    value={totalGuests}
                    hint={`${adultGuests} ${adultGuests === 1 ? "adulto" : "adultos"} · ${minorGuests} ${minorGuests === 1 ? "menor" : "menores"}`}
                />
                <StatCard label="Asisten" value={<>{confirmedGuests}<span className="text-sm font-normal text-on-surface-variant"> / {totalGuests}</span></>} tone="good" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Tabs
                    label="Ver familias o invitados"
                    value={tab}
                    onChange={(t) => { setTab(t); setQuery(""); }}
                    options={[
                        { value: "families", label: "Familias", icon: Home, count: totalFamilies },
                        { value: "users", label: "Invitados", icon: UsersIcon, count: totalGuests },
                    ]}
                />
                {(tab === "families" ? canWriteFamilies : canWriteUsers) && (
                    <button
                        type="button"
                        onClick={() => (tab === "families" ? setNewFamilyOpen(true) : setBulkOpen(true))}
                        className={btnPrimary}
                    >
                        <Plus className="w-4 h-4" aria-hidden />
                        {tab === "families" ? "Nueva familia" : "Añadir invitados"}
                    </button>
                )}
            </div>

            {/* Búsqueda y filtros */}
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                <label className="relative flex-1">
                    <span className="sr-only">{tab === "families" ? "Buscar familia" : "Buscar invitado"}</span>
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tab === "families" ? "Buscar familia…" : "Buscar invitado, @alias, correo o familia…"}
                        className={`${inputCls} pl-11 bg-surface-container-lowest`}
                    />
                </label>
                {tab === "families" ? (
                    <div role="group" aria-label="Filtrar familias" className="flex gap-1.5 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                        <FilterChip active={familyStatus === "all"} onClick={() => setFamilyStatus("all")}>Todas</FilterChip>
                        <FilterChip active={familyStatus === "pending"} onClick={() => setFamilyStatus("pending")}>Sin responder · {pendingFamilies}</FilterChip>
                        <FilterChip active={familyStatus === "no-delegate"} onClick={() => setFamilyStatus("no-delegate")} warn={withoutDelegate > 0}>Sin delegado · {withoutDelegate}</FilterChip>
                        {(minorsNotDirect > 0 || familyStatus === "minors") && (
                            <FilterChip active={familyStatus === "minors"} onClick={() => setFamilyStatus("minors")} warn={minorsNotDirect > 0}>Con niños sin marcar · {minorsNotDirect}</FilterChip>
                        )}
                    </div>
                ) : (
                    <label className="lg:w-64">
                        <span className="sr-only">Filtrar por familia</span>
                        <select
                            value={familyFilter === "all" ? "all" : familyFilter.toString()}
                            onChange={(e) => setFamilyFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                            className={`${selectCls} bg-surface-container-lowest`}
                        >
                            <option value="all">Todas las familias</option>
                            {families.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {tab === "families" ? (
                <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 items-start">
                    <FamiliesList
                        families={filteredFamilies}
                        users={users}
                        isEmpty={families.length === 0}
                        selectedId={openFamilyId}
                        onOpen={(family) => setOpenFamilyId(family.id)}
                    />
                    {isDesktop && (
                        <aside aria-labelledby={openFamily ? "family-detail-title" : undefined} className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-3xl bg-surface-container-lowest">
                            {detail || (
                                <div className="p-10 text-center flex flex-col items-center justify-center gap-3 min-h-80">
                                    <MousePointerClick className="w-7 h-7 text-on-surface-variant" strokeWidth={1.5} aria-hidden />
                                    <p className="text-sm text-on-surface-variant max-w-60">Elige una familia para ver y editar sus datos e integrantes.</p>
                                </div>
                            )}
                        </aside>
                    )}
                </div>
            ) : (
                <UsersList
                    users={filteredUsers}
                    families={families}
                    isEmpty={users.length === 0}
                    canWrite={canWriteUsers}
                    onEdit={setEditingUser}
                    onDelete={async (user) => {
                        const ok = await confirm({
                            title: `¿Eliminar a ${user.fullname || user.email}?`,
                            description: "Perderá el acceso a la invitación y se quitará de su mesa.",
                            confirmLabel: "Eliminar",
                        });
                        if (ok) mutate(withoutUser(user.id), () => deleteUser(user.id), { ok: "Invitado eliminado", error: "No se pudo eliminar al invitado" });
                    }}
                />
            )}

            {/* Ficha de familia en móvil */}
            {!isDesktop && (
                <Dialog open={!!openFamily} onClose={() => requestClose.current()} size="lg" labelledBy="family-detail-title">
                    <div className="-mx-6 -mt-2">{detail}</div>
                </Dialog>
            )}

            <Dialog open={newFamilyOpen} onClose={() => setNewFamilyOpen(false)} title="Nueva familia" size="md">
                <NewFamilyForm onDone={() => setNewFamilyOpen(false)} />
            </Dialog>

            <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} title="Añadir invitados" description="Los niños y bebés no necesitan correo porque no inician sesión. El delegado se elige luego en la ficha de la familia." size="xl">
                <BulkUserForm families={families} onDone={() => setBulkOpen(false)} />
            </Dialog>

            <Dialog open={!!editingUser} onClose={() => setEditingUser(null)} title="Editar invitado" size="md">
                {editingUser && (
                    <UserEditForm
                        key={editingUser.id}
                        user={editingUser}
                        users={users}
                        families={families}
                        onDone={() => setEditingUser(null)}
                    />
                )}
            </Dialog>
        </div>
        </GuestsCtx.Provider>
    );
}

function FilterChip({ active, onClick, warn, children }: { active: boolean; onClick: () => void; warn?: boolean; children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`shrink-0 min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                active ? "bg-primary text-on-primary" : warn ? "bg-error/10 text-error hover:bg-error/15" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
            }`}
        >
            {children}
        </button>
    );
}

function NewFamilyForm({ onDone }: { onDone: () => void }) {
    const mutate = useGuestsMutate();
    return (
        <form
            action={(formData) => {
                const data = {
                    name: (formData.get("name") as string).trim(),
                    alias: ((formData.get("alias") as string) || "").trim(),
                    globalRsvpStatus: formData.get("globalRsvpStatus") as RsvpStatus,
                };
                mutate(
                    (d) => ({ ...d, families: [...d.families, { ...data, id: tempId(), delegateUserId: null, isDirectFamily: false, createdAt: nowSql(), updatedAt: nowSql() }] }),
                    () => createFamily(data),
                    { ok: "Familia creada", error: "No se pudo crear la familia" },
                );
                onDone();
            }}
            className="space-y-4"
        >
            <label className="block">
                <span className="block text-label font-medium text-on-surface-variant mb-1.5">Nombre</span>
                <GrowText required name="name" autoFocus className={inputCls} placeholder="Familia García López" />
            </label>
            <label className="block">
                <span className="block text-label font-medium text-on-surface-variant mb-1.5">Descripción <span className="font-normal">(opcional)</span></span>
                <GrowText name="alias" className={inputCls} placeholder="Tíos paternos" />
            </label>
            <label className="block">
                <span className="block text-label font-medium text-on-surface-variant mb-1.5">Estado</span>
                <select name="globalRsvpStatus" className={rsvpSelectCls} defaultValue="PENDING">
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="DECLINED">No asiste</option>
                </select>
            </label>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
                <button type="submit" className={btnPrimary}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Crear familia
                </button>
            </div>
        </form>
    );
}

type BulkRow = {
    key: number;
    name: string;
    lastName: string;
    email: string;
    ageCategory: AgeCategory;
    role: Role;
};

function makeBulkRow(key: number): BulkRow {
    return { key, name: "", lastName: "", email: "", ageCategory: "ADULT", role: "GUEST" };
}

function BulkUserForm({ families, onDone }: { families: Family[]; onDone: () => void }) {
    const mutate = useGuestsMutate();
    const [familyId, setFamilyId] = useState<string>("");
    const [sharedLastName, setSharedLastName] = useState("");
    const [rows, setRows] = useState<BulkRow[]>([makeBulkRow(0)]);
    const [error, setError] = useState<string | null>(null);
    const nextKey = useRef(1);

    const addRow = () => setRows((rs) => [...rs, makeBulkRow(nextKey.current++)]);
    const removeRow = (key: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
    const updateRow = (key: number, patch: Partial<BulkRow>) =>
        setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const handleSubmit = () => {
        setError(null);
        if (!familyId) {
            setError("Selecciona una familia.");
            return;
        }
        const members = rows
            .map((r) => ({
                ...r,
                lastName: r.lastName.trim() || sharedLastName.trim(),
            }))
            .filter((r) => r.name.trim() !== "" || r.lastName.trim() !== "");

        if (members.length === 0) {
            setError("Añade al menos un invitado con nombre.");
            return;
        }
        if (members.some((r) => r.name.trim() === "")) {
            setError("Cada invitado necesita un nombre.");
            return;
        }
        if (members.some((r) => r.ageCategory === "ADULT" && r.email.trim() === "")) {
            setError("Los adultos necesitan correo.");
            return;
        }

        const fid = Number(familyId);
        const payload = members.map((r) => ({
            name: r.name.trim(),
            lastName: r.lastName.trim(),
            email: r.ageCategory === "ADULT" ? r.email.trim() : null,
            role: (r.ageCategory === "ADULT" ? r.role : "GUEST") as Role,
            ageCategory: r.ageCategory,
        }));
        const n = payload.length;
        mutate(
            (d) => ({ ...d, users: [...d.users, ...payload.map((u) => draftUser(tempId(), { ...u, familyId: fid, isConfirmed: d.families.find((f) => f.id === fid)?.globalRsvpStatus === "CONFIRMED" }))] }),
            () => createManyUsers(fid, payload),
            { ok: `${n} ${n === 1 ? "invitado añadido" : "invitados añadidos"}`, error: "No se pudieron registrar (¿algún correo ya existe?)" },
        );
        onDone();
    };

    const validCount = rows.filter((r) => r.name.trim() !== "").length;
    const label = "block text-label font-medium text-on-surface-variant mb-1.5";

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                    <span className={label}>Familia</span>
                    <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className={selectCls}>
                        <option value="" disabled>Selecciona…</option>
                        {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className={label}>Apellido común <span className="font-normal">(opcional, para filas sin apellido)</span></span>
                    <input value={sharedLastName} onChange={(e) => setSharedLastName(e.target.value)} className={inputCls} placeholder="García" />
                </label>
            </div>

            <ol className="space-y-3">
                {rows.map((row, idx) => {
                    const isMinor = row.ageCategory !== "ADULT";
                    return (
                        <li key={row.key} className="rounded-2xl bg-surface-container-low p-4">
                            <div className="flex items-center justify-between mb-3 md:hidden">
                                <span className="text-sm font-medium text-on-surface">Invitado {idx + 1}</span>
                                <button type="button" onClick={() => removeRow(row.key)} disabled={rows.length === 1} className={iconBtnDanger} aria-label={`Quitar invitado ${idx + 1}`}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.3fr_auto_auto] gap-2 md:items-center">
                                <input aria-label={`Nombre del invitado ${idx + 1}`} value={row.name} onChange={(e) => updateRow(row.key, { name: e.target.value })} className={`${inputCls} bg-surface-container-lowest`} placeholder="Nombre(s)" />
                                <input aria-label={`Apellido del invitado ${idx + 1}`} value={row.lastName} onChange={(e) => updateRow(row.key, { lastName: e.target.value })} className={`${inputCls} bg-surface-container-lowest`} placeholder={sharedLastName ? `Apellido (${sharedLastName})` : "Apellido"} />
                                <input
                                    aria-label={`Correo del invitado ${idx + 1}`}
                                    type="email"
                                    value={isMinor ? "" : row.email}
                                    onChange={(e) => updateRow(row.key, { email: e.target.value })}
                                    disabled={isMinor}
                                    className={`${inputCls} bg-surface-container-lowest`}
                                    placeholder={isMinor ? "Sin correo (menor)" : "Correo"}
                                />
                                <AgePicker value={row.ageCategory} onChange={(cat) => updateRow(row.key, { ageCategory: cat })} className="md:w-60" />
                                <button type="button" onClick={() => removeRow(row.key)} disabled={rows.length === 1} className={`${iconBtnDanger} hidden md:inline-flex`} aria-label={`Quitar invitado ${idx + 1}`}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ol>

            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button type="button" onClick={addRow} className={btnSecondary}>
                    <Plus className="w-4 h-4" aria-hidden /> Añadir fila
                </button>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
                    <button type="button" onClick={handleSubmit} className={btnPrimary}>
                        <Plus className="w-4 h-4" aria-hidden />
                        Registrar {validCount > 0 ? `(${validCount})` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FamiliesList({
    families,
    users,
    isEmpty,
    selectedId,
    onOpen,
}: {
    families: Family[];
    users: User[];
    isEmpty: boolean;
    selectedId: number | null;
    onOpen: (family: Family) => void;
}) {
    if (isEmpty) return <EmptyState icon={Home} message="No hay familias registradas aún. Crea la primera con «Nueva familia»." />;
    if (families.length === 0) return <EmptyState icon={Search} message="Ninguna familia coincide con la búsqueda o el filtro." />;

    return (
        <ul className="space-y-1.5">
            {families.map((family) => {
                const familyUsers = users.filter((u) => u.familyId === family.id);
                const delegate = familyUsers.find((u) => u.id === family.delegateUserId);
                const status = family.globalRsvpStatus as RsvpStatus;
                const selected = selectedId === family.id;

                return (
                    <li key={family.id} aria-busy={isTemp(family.id) || undefined} className={isTemp(family.id) ? pendingRowCls : ""}>
                        <button
                            type="button"
                            onClick={() => onOpen(family)}
                            aria-current={selected ? "true" : undefined}
                            className={`group w-full text-left flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                                selected ? "bg-secondary-container/70" : "bg-surface-container-lowest hover:bg-[#fffdf8]"
                            }`}
                        >
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="font-serif text-2xl leading-tight text-on-surface">{family.name}</span>
                                    <RsvpChip status={status} />
                                </span>
                                <span className="mt-1 block text-sm text-on-surface-variant truncate">
                                    {family.alias ? `${family.alias} · ` : ""}
                                    {familyUsers.length} {familyUsers.length === 1 ? "integrante" : "integrantes"}
                                    {family.isDirectFamily ? " · Familia directa" : ""}
                                </span>
                                {delegate ? (
                                    <span className="mt-0.5 block text-sm text-on-surface-variant truncate">
                                        Delegado: <span className="text-on-surface">{delegate.name} {delegate.lastName}</span>
                                    </span>
                                ) : status === "PENDING" ? (
                                    <span className="mt-1 flex items-start gap-1.5 text-sm text-error">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                                        Sin delegado: nadie puede confirmar.
                                    </span>
                                ) : null}
                            </span>
                            <ChevronRight className="w-4 h-4 shrink-0 text-on-surface-variant group-hover:text-primary transition-colors" aria-hidden />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function UsersList({
    users,
    families,
    isEmpty,
    canWrite,
    onEdit,
    onDelete,
}: {
    users: User[];
    families: Family[];
    isEmpty: boolean;
    canWrite: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}) {
    if (isEmpty) return <EmptyState icon={UsersIcon} message="No hay invitados registrados. Añádelos con «Añadir invitados»." />;
    if (users.length === 0) return <EmptyState icon={Search} message="Ningún invitado coincide con la búsqueda." />;

    return (
        <ul className="grid grid-cols-1 xl:grid-cols-2 gap-1.5">
            {users.map((user) => {
                const family = families.find((f) => f.id === user.familyId);
                const ageCategory = user.ageCategory as AgeCategory;
                const isMinor = ageCategory !== "ADULT";
                const isDelegate = family?.delegateUserId === user.id;
                const isAdmin = user.role === "ADMIN";
                const diet = dietaryText(user.dietary, user.dietaryNote);

                return (
                    <li key={user.id} aria-busy={isTemp(user.id) || undefined} className={`group flex items-start gap-3 bg-surface-container-lowest px-4 py-3.5 rounded-2xl ${isTemp(user.id) ? pendingRowCls : ""}`}>
                        <div className="flex-1 min-w-0">
                            <p className="flex items-baseline gap-2 min-w-0">
                                <span className="text-item font-medium text-on-surface truncate">{user.fullname || `${user.name} ${user.lastName}`}</span>
                                {user.alias && <span className="text-xs text-on-surface-variant truncate shrink-0 max-w-[45%]">@{user.alias}</span>}
                            </p>
                            <p className="text-sm text-on-surface-variant truncate">
                                {family?.name ?? "Sin familia"} · {isMinor ? AGE_LABEL[ageCategory] : (user.email ?? "Sin correo")}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {isAdmin && <Chip tone="brand">Admin</Chip>}
                                {isDelegate ? <Chip tone="brand">Delegado</Chip> : !isMinor && !isAdmin && <Chip>Acompañante</Chip>}
                                {user.isConfirmed && <Chip tone="yes">Confirmado</Chip>}
                                {diet && <Chip>{diet}</Chip>}
                            </div>
                        </div>
                        {canWrite && (
                            <div className="flex items-center gap-0.5 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button type="button" onClick={() => onEdit(user)} className={iconBtn} aria-label={`Editar a ${user.name}`}>
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => onDelete(user)} className={iconBtnDanger} aria-label={`Eliminar a ${user.name}`}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function UserEditForm({ user, users, families, onDone }: { user: User; users: User[]; families: Family[]; onDone: () => void }) {
    const mutate = useGuestsMutate();
    const [ageCategory, setAgeCategory] = useState<AgeCategory>(user.ageCategory as AgeCategory);
    const [alias, setAlias] = useState(user.alias ?? "");
    const cleanAlias = alias.trim().toLowerCase();
    // Validación en el cliente para avisar antes de guardar; el servidor la repite.
    const aliasProblem = cleanAlias === (user.alias ?? "")
        ? null
        : aliasError(cleanAlias) ?? (users.some((u) => u.id !== user.id && u.alias === cleanAlias) ? "Ese alias ya lo usa otra persona." : null);
    const isMinor = ageCategory !== "ADULT";
    const label = "block text-label font-medium text-on-surface-variant mb-1.5";

    return (
        <form
            action={(formData) => {
                if (aliasProblem) return;
                const data = {
                    ...(cleanAlias !== (user.alias ?? "") ? { alias: cleanAlias } : {}),
                    name: formData.get("name") as string,
                    lastName: formData.get("lastName") as string,
                    email: isMinor ? null : (((formData.get("email") as string) || "").trim() || null),
                    familyId: Number(formData.get("familyId")),
                    role: isMinor ? "GUEST" : ((formData.get("role") as Role) || "GUEST"),
                    ageCategory,
                };
                const movedFamily = data.familyId !== user.familyId;
                mutate(
                    (d) => ({
                        // Si cambia de familia y era delegado, la familia anterior se queda sin delegado.
                        families: movedFamily ? d.families.map((f) => (f.delegateUserId === user.id ? { ...f, delegateUserId: null } : f)) : d.families,
                        users: d.users.map((u) => (u.id === user.id ? { ...u, ...data, fullname: `${data.name} ${data.lastName}`.trim() } : u)),
                    }),
                    () => updateUser(user.id, data),
                    { ok: "Invitado guardado", error: "No se pudo guardar (¿ese correo o alias ya está en uso?)" },
                );
                onDone();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
            <label className="block">
                <span className={label}>Nombre</span>
                <input required name="name" defaultValue={user.name} className={inputCls} />
            </label>
            <label className="block">
                <span className={label}>Apellidos</span>
                <input required name="lastName" defaultValue={user.lastName} className={inputCls} />
            </label>
            <div className="sm:col-span-2">
                <label htmlFor="user-alias" className={label}>Alias <span className="font-normal">(único; sirve para encontrar a la persona)</span></label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none" aria-hidden>@</span>
                    <input
                        id="user-alias"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        maxLength={ALIAS_MAX}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-invalid={aliasProblem ? true : undefined}
                        aria-describedby="user-alias-msg"
                        className={`${inputCls} pl-8`}
                    />
                </div>
                <p id="user-alias-msg" role={aliasProblem ? "alert" : undefined} className={`mt-1.5 text-xs ${aliasProblem ? "text-error" : "text-on-surface-variant"}`}>
                    {aliasProblem ?? "Minúsculas, números y guiones, por ejemplo «tio-pepe»."}
                </p>
            </div>
            <div className="sm:col-span-2">
                <span className={label}>Edad</span>
                <AgePicker value={ageCategory} onChange={setAgeCategory} />
            </div>
            <label className="block sm:col-span-2">
                <span className={label}>Correo {isMinor && <span className="font-normal">(los menores no inician sesión)</span>}</span>
                <input type="email" name="email" defaultValue={user.email ?? ""} required={!isMinor} disabled={isMinor} className={inputCls} />
            </label>
            <label className="block">
                <span className={label}>Familia</span>
                <select name="familyId" defaultValue={user.familyId?.toString() ?? ""} className={selectCls}>
                    {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </label>
            <label className="block">
                <span className={label}>Rol</span>
                <select name="role" defaultValue={user.role === "ADMIN" ? "ADMIN" : "GUEST"} disabled={isMinor} className={selectCls}>
                    <option value="GUEST">Invitado</option>
                    <option value="ADMIN">Administrador</option>
                </select>
            </label>
            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
                <button type="submit" disabled={!!aliasProblem} className={btnPrimary}>
                    Guardar cambios
                </button>
            </div>
        </form>
    );
}
