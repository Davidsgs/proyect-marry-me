"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Save, Trash2, UserCheck, X } from "lucide-react";
import { isTemp, pendingRowCls, tempId, useOptimisticState } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { btnGhostSm, btnPrimarySm, btnSecondary, iconBtn, iconBtnDanger, inputCls, EmptyState } from "@/app/admin/_components/ui";
import type { Person } from "@/app/admin/_components/PersonPicker";
import { GrowText } from "@/components/GrowText";
import { PARTY_MESSAGE_MAX, PARTY_NAME_MAX, PARTY_ROLE_MAX, PARTY_ROLE_SUGGESTIONS } from "@/lib/wedding";
import {
    createPartyMember,
    deletePartyMember,
    reorderPartyMembers,
    updatePartyMember,
    type WeddingPartyMember,
} from "@/app/actions/weddingParty";

type Data = { role: string; name: string; userId: number | null; message: string };
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Padrinos y cortejo: alta, edición, orden y borrado, todo optimista.
export default function WeddingPartyForm({ initial, people }: { initial: WeddingPartyMember[]; people: Person[] }) {
    const confirm = useConfirm();
    const [members, mutate] = useOptimisticState(initial);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);
    const roleListId = useId();

    function save(id: number | null, data: Data) {
        if (id == null) {
            mutate(
                (list) => [...list, { id: tempId(), ...data, sortOrder: list.length, createdAt: nowSql() }],
                () => createPartyMember(data),
                { ok: `${data.name} añadido al cortejo`, error: "No se pudo añadir" },
            );
            setAdding(false);
        } else {
            mutate((list) => list.map((m) => (m.id === id ? { ...m, ...data } : m)), () => updatePartyMember(id, data), { ok: "Guardado", error: "No se pudo guardar" });
            setEditingId(null);
        }
    }

    function move(index: number, dir: -1 | 1) {
        const next = [...members];
        const [it] = next.splice(index, 1);
        next.splice(index + dir, 0, it);
        const ordered = next.map((m, i) => ({ ...m, sortOrder: i }));
        mutate(() => ordered, () => reorderPartyMembers(ordered.map((m) => m.id)), { error: "No se pudo reordenar" });
    }

    async function remove(m: WeddingPartyMember) {
        const ok = await confirm({ title: `¿Quitar a ${m.name} del cortejo?`, description: "Deja de aparecer en la invitación.", confirmLabel: "Quitar" });
        if (ok) mutate((list) => list.filter((x) => x.id !== m.id), () => deletePartyMember(m.id), { ok: `${m.name} ya no aparece en el cortejo`, error: "No se pudo quitar" });
    }

    return (
        <div className="space-y-4">
            <datalist id={roleListId}>
                {PARTY_ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
            </datalist>

            {members.length === 0 && !adding && <EmptyState message="Aún no hay nadie en el cortejo. Añade a los padrinos, testigos o damas de honor." />}

            <ol className="space-y-2">
                {members.map((m, i) => {
                    const alias = m.userId ? people.find((p) => p.id === m.userId)?.alias : null;
                    return (
                        <li key={m.id} aria-busy={isTemp(m.id) || undefined} className={`rounded-2xl bg-surface-container-low ${isTemp(m.id) ? pendingRowCls : ""}`}>
                            {editingId === m.id ? (
                                <MemberForm initial={m} people={people} roleListId={roleListId} onSave={(d) => save(m.id, d)} onCancel={() => setEditingId(null)} />
                            ) : (
                                <div className="flex items-start gap-1 pl-4 pr-1 py-2">
                                    <div className="flex-1 min-w-0 py-1">
                                        <p className="text-xs font-medium text-rosa-profundo">{m.role}</p>
                                        <p className="flex items-baseline gap-2 min-w-0">
                                            <span className="font-serif text-xl leading-tight text-on-surface break-words">{m.name}</span>
                                            {alias && <span className="text-xs text-on-surface-variant truncate">@{alias}</span>}
                                        </p>
                                        {m.message && <p className="mt-1 text-sm text-on-surface-variant text-pretty whitespace-pre-line">{m.message}</p>}
                                    </div>
                                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn} aria-label={`Subir a ${m.name}`}><ChevronUp className="w-4 h-4" /></button>
                                    <button type="button" disabled={i === members.length - 1} onClick={() => move(i, 1)} className={iconBtn} aria-label={`Bajar a ${m.name}`}><ChevronDown className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setEditingId(m.id)} className={iconBtn} aria-label={`Editar a ${m.name}`}><Pencil className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => remove(m)} className={iconBtnDanger} aria-label={`Quitar a ${m.name}`}><Trash2 className="w-4 h-4" /></button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>

            {adding ? (
                <div className="rounded-2xl bg-surface-container-low">
                    <MemberForm people={people} roleListId={roleListId} onSave={(d) => save(null, d)} onCancel={() => setAdding(false)} />
                </div>
            ) : (
                <button type="button" onClick={() => setAdding(true)} className={`${btnSecondary} w-full`}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Añadir persona
                </button>
            )}
        </div>
    );
}

// Nombre libre o vinculado: al escribir se sugieren invitados; elegir uno lo
// vincula (y toma su nombre). Editar el nombre después quita el vínculo.
function MemberForm({
    initial,
    people,
    roleListId,
    onSave,
    onCancel,
}: {
    initial?: WeddingPartyMember;
    people: Person[];
    roleListId: string;
    onSave: (data: Data) => void;
    onCancel: () => void;
}) {
    const [role, setRole] = useState(initial?.role ?? "");
    const [name, setName] = useState(initial?.name ?? "");
    const [userId, setUserId] = useState<number | null>(initial?.userId ?? null);
    const [message, setMessage] = useState(initial?.message ?? "");
    const ids = useId();
    const linked = userId ? people.find((p) => p.id === userId) : undefined;
    const q = norm(name.trim().replace(/^@/, ""));
    const matches = !userId && q.length >= 2
        ? people.filter((p) => norm(p.name).includes(q) || (p.alias ?? "").includes(q)).slice(0, 5)
        : [];
    const label = "block text-[13px] font-medium text-on-surface-variant mb-1.5";
    const canSave = role.trim() && name.trim();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (canSave) onSave({ role: role.trim(), name: name.trim(), userId, message: message.trim() });
            }}
            className="p-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
        >
            <label className="block">
                <span className={label}>Papel</span>
                <input
                    autoFocus
                    required
                    list={roleListId}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    maxLength={PARTY_ROLE_MAX}
                    placeholder="Madrina, testigo…"
                    className={`${inputCls} bg-surface-container-lowest`}
                />
            </label>
            <div>
                <label htmlFor={`${ids}-name`} className={label}>Nombre</label>
                <GrowText
                    id={`${ids}-name`}
                    required
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (userId) setUserId(null);
                    }}
                    maxLength={PARTY_NAME_MAX}
                    placeholder="Escribe un nombre o busca un invitado"
                    autoComplete="off"
                    className={`${inputCls} bg-surface-container-lowest`}
                />
                {linked ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <UserCheck className="w-3.5 h-3.5 text-primary" aria-hidden />
                        Vinculado a un invitado{linked.alias && <> (@{linked.alias})</>}.
                        <button type="button" onClick={() => setUserId(null)} className="inline-flex items-center gap-0.5 underline hover:no-underline">
                            <X className="w-3 h-3" aria-hidden /> Desvincular
                        </button>
                    </p>
                ) : matches.length > 0 ? (
                    <ul aria-label="Invitados que coinciden" className="mt-1.5 rounded-xl bg-surface-container-lowest p-1 space-y-0.5">
                        {matches.map((p) => (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    onClick={() => { setName(p.name); setUserId(p.id); }}
                                    className="w-full flex items-center gap-2 min-h-11 pointer-fine:min-h-9 px-3 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container-low focus-visible:bg-surface-container-low outline-none cursor-pointer"
                                >
                                    <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                                    <span className="truncate">{p.name}</span>
                                    {p.alias && <span className="ml-auto text-xs text-on-surface-variant truncate">@{p.alias}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-1.5 text-xs text-on-surface-variant">Puede ser alguien de la lista de invitados o un nombre libre.</p>
                )}
            </div>
            <label className="block sm:col-span-2">
                <span className={label}>Frase de agradecimiento <span className="font-normal">(opcional)</span></span>
                <GrowText
                    multiline
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={PARTY_MESSAGE_MAX}
                    placeholder="Gracias por acompañarnos desde el primer día…"
                    className={`${inputCls} bg-surface-container-lowest min-h-18`}
                />
                <span className="mt-1 block text-xs text-on-surface-variant tabular-nums">{message.length} de {PARTY_MESSAGE_MAX}</span>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={onCancel} className={btnGhostSm}>Cancelar</button>
                <button type="submit" disabled={!canSave} className={btnPrimarySm}>
                    {initial ? <Save className="w-3.5 h-3.5" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
                    {initial ? "Guardar" : "Añadir"}
                </button>
            </div>
        </form>
    );
}
