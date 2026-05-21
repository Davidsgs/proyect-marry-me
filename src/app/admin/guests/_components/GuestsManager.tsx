"use client";

import { useMemo, useState, useTransition } from "react";
import type { families as familiesTable, users as usersTable } from "@/db/schema";
import { createFamily, deleteFamily, updateFamily, createUser, deleteUser, updateUser } from "@/app/actions/admin";
import {
    Plus,
    Search,
    Trash2,
    UserCheck,
    UserCircle,
    Crown,
    ShieldAlert,
    CheckCircle2,
    Pencil,
    X,
    Users as UsersIcon,
    Home,
    Loader2,
    Baby,
    Smile,
} from "lucide-react";

type Family = typeof familiesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
type Role = "ADMIN" | "MAIN_GUEST" | "GUEST";
type AgeCategory = "BABY" | "CHILD" | "ADULT";

const AGE_LABEL: Record<AgeCategory, string> = {
    ADULT: "Adulto",
    CHILD: "Niño",
    BABY: "Bebé",
};

interface Props {
    families: Family[];
    users: User[];
}

export default function GuestsManager({ families, users }: Props) {
    const [tab, setTab] = useState<"families" | "users">("families");
    const [query, setQuery] = useState("");
    const [showFamilyForm, setShowFamilyForm] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [familyFilter, setFamilyFilter] = useState<number | "all">("all");
    const [, startTransition] = useTransition();

    const totalFamilies = families.length;
    const familiesWithDelegate = families.filter((f) => f.delegateUserId != null).length;
    const guestUsers = users.filter((u) => u.familyId != null);
    const totalGuests = guestUsers.length;
    const confirmedGuests = guestUsers.filter((u) => u.isConfirmed).length;
    const adultGuests = guestUsers.filter((u) => u.ageCategory === "ADULT").length;
    const minorGuests = totalGuests - adultGuests;

    const filteredFamilies = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return families;
        return families.filter(
            (f) => f.name.toLowerCase().includes(q) || (f.alias ?? "").toLowerCase().includes(q)
        );
    }, [families, query]);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) => {
            if (familyFilter !== "all" && u.familyId !== familyFilter) return false;
            if (!q) return true;
            const family = families.find((f) => f.id === u.familyId);
            return (
                u.fullname.toLowerCase().includes(q) ||
                (u.email ?? "").toLowerCase().includes(q) ||
                (family?.name ?? "").toLowerCase().includes(q)
            );
        });
    }, [users, families, query, familyFilter]);

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Familias" value={totalFamilies} icon={<Home className="w-4 h-4" />} />
                <StatCard
                    label="Con delegado"
                    value={`${familiesWithDelegate}/${totalFamilies}`}
                    icon={<UserCheck className="w-4 h-4" />}
                />
                <StatCard label="Invitados" value={totalGuests} icon={<UsersIcon className="w-4 h-4" />} />
                <StatCard
                    label="Adultos / Menores"
                    value={`${adultGuests} / ${minorGuests}`}
                    icon={<Baby className="w-4 h-4" />}
                />
                <StatCard
                    label="Asistirán"
                    value={`${confirmedGuests}/${totalGuests}`}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-outline-variant/30">
                <TabButton active={tab === "families"} onClick={() => { setTab("families"); setQuery(""); }}>
                    Familias <span className="text-on-surface-variant/70">({totalFamilies})</span>
                </TabButton>
                <TabButton active={tab === "users"} onClick={() => { setTab("users"); setQuery(""); }}>
                    Invitados <span className="text-on-surface-variant/70">({totalGuests})</span>
                </TabButton>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tab === "families" ? "Buscar familia..." : "Buscar invitado, correo o familia..."}
                        className="w-full pl-11 pr-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm text-sm"
                    />
                </div>
                {tab === "users" && (
                    <div className="relative sm:w-56">
                        <select
                            value={familyFilter === "all" ? "all" : familyFilter.toString()}
                            onChange={(e) => setFamilyFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                            className="w-full px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface appearance-none shadow-sm text-sm cursor-pointer"
                        >
                            <option value="all">Todas las familias</option>
                            {families.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => {
                        if (tab === "families") setShowFamilyForm((v) => !v);
                        else setShowUserForm((v) => !v);
                    }}
                    className="flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium"
                >
                    {(tab === "families" ? showFamilyForm : showUserForm) ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {tab === "families"
                        ? showFamilyForm ? "Cerrar" : "Nueva familia"
                        : showUserForm ? "Cerrar" : "Nuevo invitado"}
                </button>
            </div>

            {/* Inline forms */}
            {tab === "families" && showFamilyForm && (
                <FamilyFormInline onDone={() => setShowFamilyForm(false)} />
            )}
            {tab === "users" && showUserForm && (
                <UserFormInline families={families} onDone={() => setShowUserForm(false)} />
            )}

            {/* Content */}
            {tab === "families" ? (
                <FamiliesGrid
                    families={filteredFamilies}
                    users={users}
                    isEmpty={families.length === 0}
                    onDelegateChange={(id, delegateId) => startTransition(() => updateFamily(id, { delegateUserId: delegateId }))}
                    onStatusChange={(id, status) => startTransition(() => updateFamily(id, { globalRsvpStatus: status }))}
                    onDelete={(family) => {
                        const familyUsers = users.filter((u) => u.familyId === family.id);
                        const msg = familyUsers.length > 0
                            ? `Eliminar "${family.name}" también borrará a sus ${familyUsers.length} invitado(s). ¿Continuar?`
                            : `¿Eliminar la familia "${family.name}"?`;
                        if (confirm(msg)) startTransition(() => deleteFamily(family.id));
                    }}
                />
            ) : (
                <UsersGrid
                    users={filteredUsers}
                    families={families}
                    isEmpty={users.length === 0}
                    editingId={editingUserId}
                    onEdit={(id) => setEditingUserId(id)}
                    onCancelEdit={() => setEditingUserId(null)}
                    onSave={(id, data) => startTransition(async () => {
                        await updateUser(id, data);
                        setEditingUserId(null);
                    })}
                    onDelete={(user) => {
                        if (confirm(`¿Eliminar a ${user.fullname || user.email}?`)) {
                            startTransition(() => deleteUser(user.id));
                        }
                    }}
                />
            )}
        </div>
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

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-3 text-sm font-sans tracking-wide font-medium transition-colors relative -mb-px ${active
                ? "text-primary border-b-2 border-primary"
                : "text-on-surface-variant hover:text-on-surface border-b-2 border-transparent"
                }`}
        >
            {children}
        </button>
    );
}

function FamilyFormInline({ onDone }: { onDone: () => void }) {
    const [pending, startTransition] = useTransition();
    return (
        <form
            action={(formData) => {
                startTransition(async () => {
                    await createFamily({
                        name: formData.get("name") as string,
                        alias: (formData.get("alias") as string) || "",
                        globalRsvpStatus: formData.get("globalRsvpStatus") as RsvpStatus,
                    });
                    onDone();
                });
            }}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
            <div className="md:col-span-4">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Nombre</label>
                <input required name="name" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" placeholder="Familia García López" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Alias</label>
                <input name="alias" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" placeholder="Tíos paternos" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Estado</label>
                <select name="globalRsvpStatus" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface appearance-none shadow-sm cursor-pointer">
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="DECLINED">Rechazada</option>
                </select>
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

function UserFormInline({ families, onDone }: { families: Family[]; onDone: () => void }) {
    const [pending, startTransition] = useTransition();
    const [ageCategory, setAgeCategory] = useState<AgeCategory>("ADULT");
    const isMinor = ageCategory !== "ADULT";

    return (
        <form
            action={(formData) => {
                startTransition(async () => {
                    await createUser({
                        email: (formData.get("email") as string) || null,
                        name: formData.get("name") as string,
                        lastName: formData.get("lastName") as string,
                        familyId: Number(formData.get("familyId")),
                        role: ((formData.get("role") as Role) || "GUEST"),
                        ageCategory,
                    });
                    onDone();
                });
            }}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4"
        >
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Nombre(s)</label>
                <input required name="name" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" placeholder="David" />
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Apellidos</label>
                <input required name="lastName" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm" placeholder="García" />
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">
                    Correo <span className="text-on-surface-variant/60 normal-case tracking-normal">{isMinor ? "(opcional para menores)" : ""}</span>
                </label>
                <input
                    type="email"
                    name="email"
                    required={!isMinor}
                    disabled={isMinor}
                    className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={isMinor ? "Los menores no inician sesión" : "correo@gmail.com"}
                />
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Categoría de edad</label>
                <div className="grid grid-cols-3 gap-2">
                    {(["ADULT", "CHILD", "BABY"] as AgeCategory[]).map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setAgeCategory(cat)}
                            className={`py-3 rounded-xl text-xs font-sans tracking-widest uppercase font-medium transition-all border-none ${ageCategory === cat
                                ? "bg-primary text-on-primary shadow-sm"
                                : "bg-surface text-on-surface-variant hover:bg-primary/10"
                                }`}
                        >
                            {AGE_LABEL[cat]}
                        </button>
                    ))}
                </div>
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Familia</label>
                <select required name="familyId" defaultValue="" className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface appearance-none shadow-sm cursor-pointer">
                    <option value="" disabled>Selecciona...</option>
                    {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">Rol</label>
                <select name="role" defaultValue="GUEST" disabled={isMinor} className="w-full px-4 py-3 border-none rounded-xl bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface appearance-none shadow-sm cursor-pointer disabled:opacity-50">
                    <option value="GUEST">Invitado</option>
                    <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-[10px] text-on-surface-variant/70 italic mt-1.5">El titular se asigna desde la tarjeta de la familia.</p>
            </div>
            <div className="md:col-span-12 flex justify-end mt-2">
                <button disabled={pending} type="submit" className="bg-primary text-on-primary px-6 py-3 rounded-xl shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center gap-2 disabled:opacity-60">
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Registrar invitado
                </button>
            </div>
        </form>
    );
}

function FamiliesGrid({
    families,
    users,
    isEmpty,
    onDelegateChange,
    onStatusChange,
    onDelete,
}: {
    families: Family[];
    users: User[];
    isEmpty: boolean;
    onDelegateChange: (id: number, delegateId: number | null) => void;
    onStatusChange: (id: number, status: RsvpStatus) => void;
    onDelete: (family: Family) => void;
}) {
    if (isEmpty) {
        return <EmptyState message="No hay familias registradas aún." />;
    }
    if (families.length === 0) {
        return <EmptyState message="Ningún resultado coincide con tu búsqueda." />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map((family) => {
                const familyUsers = users.filter((u) => u.familyId === family.id);
                const eligibleDelegates = familyUsers.filter((u) => u.ageCategory === "ADULT");
                const hasDelegate = family.delegateUserId != null;
                const statusBadge =
                    family.globalRsvpStatus === "CONFIRMED"
                        ? "bg-primary/10 text-primary"
                        : family.globalRsvpStatus === "DECLINED"
                            ? "bg-error/10 text-error"
                            : "bg-surface-container text-on-surface-variant";

                return (
                    <div
                        key={family.id}
                        className="flex flex-col gap-3 bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/30 to-transparent rounded-l-2xl pointer-events-none"></div>

                        <div className="pr-8">
                            <h3 className="font-serif text-lg text-on-surface truncate">{family.name}</h3>
                            {family.alias && (
                                <p className="text-xs text-on-surface-variant italic mt-0.5 truncate">{family.alias}</p>
                            )}
                            <div className="flex gap-2 flex-wrap mt-2">
                                <span className={`text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full ${statusBadge}`}>
                                    {family.globalRsvpStatus === "CONFIRMED" ? "Confirmada" : family.globalRsvpStatus === "DECLINED" ? "Rechazada" : "Pendiente"}
                                </span>
                                <span className="text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                                    {familyUsers.length} {familyUsers.length === 1 ? "miembro" : "miembros"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 mt-1">
                            <label className="flex items-center gap-1.5 text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant">
                                <UserCheck className={`w-3 h-3 ${hasDelegate ? "text-primary" : ""}`} /> Delegado
                            </label>
                            {eligibleDelegates.length > 0 ? (
                                <select
                                    value={family.delegateUserId?.toString() ?? ""}
                                    onChange={(e) => onDelegateChange(family.id, e.target.value === "" ? null : Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs border-none rounded-lg bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface appearance-none cursor-pointer"
                                >
                                    <option value="">Sin delegado</option>
                                    {eligibleDelegates.map((u) => (
                                        <option key={u.id} value={u.id.toString()}>
                                            {u.name} {u.lastName}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-[10px] text-on-surface-variant/60 italic">
                                    {familyUsers.length === 0 ? "Sin invitados asignados" : "Sin adultos asignados"}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-sans tracking-widest uppercase font-medium text-on-surface-variant block">Estado RSVP</label>
                            <select
                                value={family.globalRsvpStatus}
                                onChange={(e) => onStatusChange(family.id, e.target.value as RsvpStatus)}
                                className="w-full px-3 py-2 text-xs border-none rounded-lg bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface appearance-none cursor-pointer"
                            >
                                <option value="PENDING">Pendiente</option>
                                <option value="CONFIRMED">Confirmada</option>
                                <option value="DECLINED">Rechazada</option>
                            </select>
                        </div>

                        <button
                            onClick={() => onDelete(family)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Eliminar familia"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function UsersGrid({
    users,
    families,
    isEmpty,
    editingId,
    onEdit,
    onCancelEdit,
    onSave,
    onDelete,
}: {
    users: User[];
    families: Family[];
    isEmpty: boolean;
    editingId: number | null;
    onEdit: (id: number) => void;
    onCancelEdit: () => void;
    onSave: (id: number, data: { name: string; lastName: string; email: string | null; familyId: number; role: Role; ageCategory: AgeCategory }) => void;
    onDelete: (user: User) => void;
}) {
    if (isEmpty) return <EmptyState message="No hay invitados registrados." />;
    if (users.length === 0) return <EmptyState message="Ningún resultado coincide con tu búsqueda." />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {users.map((user) => {
                const family = families.find((f) => f.id === user.familyId);
                const isEditing = editingId === user.id;

                if (isEditing) {
                    return (
                        <UserEditCard
                            key={user.id}
                            user={user}
                            families={families}
                            onCancel={onCancelEdit}
                            onSave={(data) => onSave(user.id, data)}
                        />
                    );
                }

                const ageCategory = user.ageCategory as AgeCategory;
                const isMinor = ageCategory !== "ADULT";
                const isDelegate = family?.delegateUserId === user.id;
                const isAdmin = user.role === "ADMIN";

                let RoleIcon = UserCircle;
                let roleColor = "text-on-surface-variant";
                if (isAdmin) { RoleIcon = ShieldAlert; roleColor = "text-error"; }
                else if (user.role === "MAIN_GUEST") { RoleIcon = Crown; roleColor = "text-primary"; }
                if (ageCategory === "BABY") { RoleIcon = Baby; roleColor = "text-on-surface-variant"; }
                else if (ageCategory === "CHILD") { RoleIcon = Smile; roleColor = "text-on-surface-variant"; }

                return (
                    <div key={user.id} className="relative flex bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                        <div className={`bg-surface-container p-2 rounded-xl ${roleColor} flex-shrink-0 self-start mt-1`}>
                            <RoleIcon className="w-5 h-5" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0 pr-16">
                            <h4 className="font-serif text-lg text-on-surface leading-tight truncate">
                                {user.fullname || `${user.name} ${user.lastName}`}
                            </h4>
                            <p className="text-xs text-on-surface-variant truncate italic">
                                {user.email ?? "Sin correo"}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant truncate max-w-[140px]">
                                    {family?.name ?? "Sin familia"}
                                </span>
                                {isMinor ? (
                                    <span className="text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {AGE_LABEL[ageCategory]}
                                    </span>
                                ) : (
                                    <>
                                        {isAdmin && (
                                            <span className="text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-error/10 text-error">
                                                Admin
                                            </span>
                                        )}
                                        {isDelegate && (
                                            <span className="text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                Titular
                                            </span>
                                        )}
                                        {!isAdmin && !isDelegate && (
                                            <span className="text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                                                Acompañante
                                            </span>
                                        )}
                                    </>
                                )}
                                {user.isConfirmed && (
                                    <span className="flex items-center gap-1 text-[10px] font-sans tracking-widest uppercase font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        <CheckCircle2 className="w-3 h-3" /> Asistirá
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit(user.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                                aria-label="Editar invitado"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(user)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-colors"
                                aria-label="Eliminar invitado"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function UserEditCard({
    user,
    families,
    onCancel,
    onSave,
}: {
    user: User;
    families: Family[];
    onCancel: () => void;
    onSave: (data: { name: string; lastName: string; email: string | null; familyId: number; role: Role; ageCategory: AgeCategory }) => void;
}) {
    const [pending, startTransition] = useTransition();
    const [ageCategory, setAgeCategory] = useState<AgeCategory>(user.ageCategory as AgeCategory);
    const isMinor = ageCategory !== "ADULT";

    return (
        <form
            action={(formData) => {
                startTransition(() => {
                    onSave({
                        name: formData.get("name") as string,
                        lastName: formData.get("lastName") as string,
                        email: (formData.get("email") as string) || null,
                        familyId: Number(formData.get("familyId")),
                        role: ((formData.get("role") as Role) || "GUEST"),
                        ageCategory,
                    });
                });
            }}
            className="bg-surface-container-lowest p-5 rounded-2xl shadow-md ring-2 ring-primary/30 grid grid-cols-2 gap-3"
        >
            <div className="col-span-2 flex items-center justify-between">
                <p className="text-[10px] font-sans tracking-widest uppercase font-medium text-primary">Editando invitado</p>
                <button type="button" onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <input required name="name" defaultValue={user.name} placeholder="Nombre" className="px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface shadow-sm" />
            <input required name="lastName" defaultValue={user.lastName} placeholder="Apellidos" className="px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface shadow-sm" />
            <input
                type="email"
                name="email"
                defaultValue={user.email ?? ""}
                required={!isMinor}
                disabled={isMinor}
                placeholder={isMinor ? "Sin correo (menor)" : "Correo"}
                className="col-span-2 px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="col-span-2 grid grid-cols-3 gap-2">
                {(["ADULT", "CHILD", "BABY"] as AgeCategory[]).map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setAgeCategory(cat)}
                        className={`py-2 rounded-lg text-[10px] font-sans tracking-widest uppercase font-medium transition-all border-none ${ageCategory === cat
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface text-on-surface-variant hover:bg-primary/10"
                            }`}
                    >
                        {AGE_LABEL[cat]}
                    </button>
                ))}
            </div>
            <select name="familyId" defaultValue={user.familyId?.toString() ?? ""} className="px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface appearance-none shadow-sm cursor-pointer">
                {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select name="role" defaultValue={user.role === "ADMIN" ? "ADMIN" : "GUEST"} disabled={isMinor} className="px-3 py-2 border-none rounded-lg bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-sm text-on-surface appearance-none shadow-sm cursor-pointer disabled:opacity-50">
                <option value="GUEST">Invitado</option>
                <option value="ADMIN">Administrador</option>
            </select>
            <button disabled={pending} type="submit" className="col-span-2 bg-primary text-on-primary py-2 rounded-lg shadow-sm font-sans tracking-widest uppercase text-xs font-medium flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
                {pending && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar cambios
            </button>
        </form>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
            <p className="text-on-surface-variant font-sans text-sm">{message}</p>
        </div>
    );
}
