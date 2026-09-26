"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { families as familiesTable, users as usersTable } from "@/db/schema";
import { createManyUsers, deleteFamily, updateFamily, updateUser } from "@/app/actions/admin";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { btnGhost, btnPrimary, btnSecondary } from "@/app/admin/_components/ui";
import { Baby, Loader2, Plus, Smile, Trash2, UserMinus, X } from "lucide-react";

type Family = typeof familiesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
type AgeCategory = "BABY" | "CHILD" | "ADULT";

const AGE_LABEL: Record<AgeCategory, string> = { ADULT: "Adulto", CHILD: "Niño", BABY: "Bebé" };

const inputCls =
    "w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 outline-none text-on-surface text-sm placeholder-on-surface-variant/60";
const labelCls = "block text-sm font-medium text-on-surface-variant mb-1.5";

// Ficha de una familia: datos (nombre, descripción, estado, delegado) e integrantes.
// Los datos se guardan con «Guardar cambios»; añadir o quitar integrantes se aplica al momento.
export default function FamilyDialog({
    family,
    users,
    canWriteFamilies,
    canWriteUsers,
    onClose,
}: {
    family: Family;
    users: User[];
    canWriteFamilies: boolean;
    canWriteUsers: boolean;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const confirm = useConfirm();
    const [saving, startSave] = useTransition();
    const [membersBusy, startMembers] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const members = users.filter((u) => u.familyId === family.id);
    const adults = members.filter((u) => u.ageCategory === "ADULT");
    const withoutFamily = users.filter((u) => u.familyId == null);

    const [name, setName] = useState(family.name);
    const [alias, setAlias] = useState(family.alias ?? "");
    const [status, setStatus] = useState<RsvpStatus>(family.globalRsvpStatus as RsvpStatus);
    const [delegateId, setDelegateId] = useState<number | null>(family.delegateUserId);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const dirty =
        name.trim() !== family.name ||
        alias.trim() !== (family.alias ?? "") ||
        status !== family.globalRsvpStatus ||
        delegateId !== family.delegateUserId;

    async function handleClose() {
        if (dirty && canWriteFamilies) {
            const ok = await confirm({
                title: "¿Descartar los cambios?",
                description: "Hay cambios en los datos de la familia sin guardar.",
                confirmLabel: "Descartar",
            });
            if (!ok) return;
        }
        dialogRef.current?.close();
        onClose();
    }

    function handleSave() {
        if (!name.trim()) {
            setError("La familia necesita un nombre.");
            return;
        }
        setError(null);
        startSave(async () => {
            try {
                await updateFamily(family.id, {
                    name: name.trim(),
                    alias: alias.trim(),
                    ...(status !== family.globalRsvpStatus ? { globalRsvpStatus: status } : {}),
                    ...(delegateId !== family.delegateUserId ? { delegateUserId: delegateId } : {}),
                });
                dialogRef.current?.close();
                onClose();
            } catch {
                setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
            }
        });
    }

    async function handleRemove(member: User) {
        const ok = await confirm({
            title: `¿Quitar a ${member.name} ${member.lastName} de la familia?`,
            description:
                (family.delegateUserId === member.id ? "Es el delegado: la familia se quedará sin delegado. " : "") +
                "La persona no se borra: queda en Invitados sin familia y puedes añadirla a otra.",
            confirmLabel: "Quitar",
        });
        if (!ok) return;
        if (delegateId === member.id) setDelegateId(null);
        startMembers(() => updateUser(member.id, { familyId: null }));
    }

    async function handleDeleteFamily() {
        const ok = await confirm({
            title: `¿Eliminar la familia «${family.name}»?`,
            description: members.length > 0
                ? `También se borrarán sus ${members.length} ${members.length === 1 ? "miembro" : "miembros"} y sus confirmaciones.`
                : "La familia no tiene miembros.",
            confirmLabel: "Eliminar familia",
        });
        if (!ok) return;
        startSave(async () => {
            await deleteFamily(family.id);
            dialogRef.current?.close();
            onClose();
        });
    }

    return (
        <dialog
            ref={dialogRef}
            onCancel={(e) => { e.preventDefault(); handleClose(); }}
            aria-labelledby="family-dialog-title"
            className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-on-surface/30 open:animate-in open:fade-in open:zoom-in-95 open:duration-150"
        >
            <div className="flex flex-col max-h-[calc(100dvh-2rem)]">
                <header className="flex items-start justify-between gap-4 p-6 pb-4">
                    <div className="min-w-0">
                        <h2 id="family-dialog-title" className="font-serif italic text-3xl text-primary truncate">{family.name}</h2>
                        <p className="text-sm text-on-surface-variant">
                            {members.length} {members.length === 1 ? "integrante" : "integrantes"}
                        </p>
                    </div>
                    <button type="button" onClick={handleClose} className={`${btnGhost} px-3`} aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="overflow-y-auto px-6 pb-6 space-y-8">
                    {/* Datos de la familia */}
                    <section aria-labelledby="fd-datos" className="space-y-4">
                        <h3 id="fd-datos" className="text-sm font-semibold text-on-surface">Datos</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fd-name" className={labelCls}>Nombre</label>
                                <input id="fd-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canWriteFamilies} className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="fd-alias" className={labelCls}>Descripción <span className="font-normal">(opcional)</span></label>
                                <input id="fd-alias" value={alias} onChange={(e) => setAlias(e.target.value)} disabled={!canWriteFamilies} placeholder="Tíos paternos, amigos de la facu…" className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="fd-status" className={labelCls}>Estado de la respuesta</label>
                                <select id="fd-status" value={status} onChange={(e) => setStatus(e.target.value as RsvpStatus)} disabled={!canWriteFamilies} className={`${inputCls} cursor-pointer`}>
                                    <option value="PENDING">Pendiente</option>
                                    <option value="CONFIRMED">Confirmada</option>
                                    <option value="DECLINED">No asiste</option>
                                </select>
                                {status !== family.globalRsvpStatus && (
                                    <p className="text-xs text-on-surface-variant mt-1.5">
                                        Normalmente responde el delegado desde la invitación; esto sobrescribe su respuesta.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="fd-delegate" className={labelCls}>Delegado</label>
                                {adults.length > 0 ? (
                                    <select
                                        id="fd-delegate"
                                        value={delegateId ?? ""}
                                        onChange={(e) => setDelegateId(e.target.value === "" ? null : Number(e.target.value))}
                                        disabled={!canWriteFamilies}
                                        className={`${inputCls} cursor-pointer`}
                                    >
                                        <option value="">Sin delegado</option>
                                        {adults.map((u) => (
                                            <option key={u.id} value={u.id}>{u.name} {u.lastName}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-on-surface-variant py-3">Añade un adulto para elegir delegado.</p>
                                )}
                            </div>
                        </div>
                        {error && <p role="alert" className="text-sm text-error">{error}</p>}
                    </section>

                    {/* Integrantes */}
                    <section aria-labelledby="fd-miembros" className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h3 id="fd-miembros" className="text-sm font-semibold text-on-surface">Integrantes</h3>
                            {membersBusy && <Loader2 className="w-4 h-4 animate-spin text-primary" aria-label="Guardando" />}
                        </div>
                        {members.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">Esta familia aún no tiene integrantes.</p>
                        ) : (
                            <ul className="space-y-2">
                                {members.map((m) => (
                                    <li key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low">
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-on-surface truncate">
                                                {m.name} {m.lastName}
                                                {delegateId === m.id && <span className="ml-2 text-xs font-medium text-primary">Delegado</span>}
                                            </span>
                                            <span className="block text-xs text-on-surface-variant truncate">
                                                {m.ageCategory !== "ADULT" ? AGE_LABEL[m.ageCategory as AgeCategory] : (m.email ?? "Sin correo")}
                                                {m.isConfirmed && " · Asiste"}
                                            </span>
                                        </span>
                                        {m.ageCategory === "BABY" && <Baby className="w-4 h-4 text-on-surface-variant" aria-hidden />}
                                        {m.ageCategory === "CHILD" && <Smile className="w-4 h-4 text-on-surface-variant" aria-hidden />}
                                        {canWriteUsers && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(m)}
                                                disabled={membersBusy}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                                                aria-label={`Quitar a ${m.name} ${m.lastName} de la familia`}
                                            >
                                                <UserMinus className="w-4 h-4" />
                                                <span className="hidden sm:inline">Quitar</span>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {canWriteUsers && (
                            <AddMember
                                familyId={family.id}
                                familyLastName={members[0]?.lastName ?? ""}
                                withoutFamily={withoutFamily}
                                busy={membersBusy}
                                run={startMembers}
                            />
                        )}
                    </section>
                </div>

                <footer className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 p-6 pt-4 bg-surface-container-low/60 rounded-b-3xl">
                    {canWriteFamilies && (
                        <button type="button" onClick={handleDeleteFamily} disabled={saving} className={`${btnGhost} text-error hover:text-error hover:bg-error/10 sm:mr-auto`}>
                            <Trash2 className="w-4 h-4" />
                            Eliminar familia
                        </button>
                    )}
                    <button type="button" onClick={handleClose} className={btnGhost}>
                        {canWriteFamilies ? "Cancelar" : "Cerrar"}
                    </button>
                    {canWriteFamilies && (
                        <button type="button" onClick={handleSave} disabled={saving || !dirty} className={btnPrimary}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Guardar cambios
                        </button>
                    )}
                </footer>
            </div>
        </dialog>
    );
}

// Añadir integrante: una persona nueva o alguien que ya está en Invitados sin familia.
function AddMember({
    familyId,
    familyLastName,
    withoutFamily,
    busy,
    run,
}: {
    familyId: number;
    familyLastName: string;
    withoutFamily: User[];
    busy: boolean;
    run: (fn: () => Promise<void>) => void;
}) {
    const [mode, setMode] = useState<"closed" | "new" | "existing">("closed");
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState(familyLastName);
    const [email, setEmail] = useState("");
    const [age, setAge] = useState<AgeCategory>("ADULT");
    const [existingId, setExistingId] = useState("");
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setMode("closed");
        setName("");
        setLastName(familyLastName);
        setEmail("");
        setAge("ADULT");
        setExistingId("");
        setError(null);
    }

    function addNew() {
        if (!name.trim()) return setError("Escribe el nombre.");
        if (age === "ADULT" && !email.trim()) return setError("Los adultos necesitan correo para entrar a la invitación.");
        setError(null);
        run(async () => {
            try {
                await createManyUsers(familyId, [{
                    name: name.trim(),
                    lastName: lastName.trim(),
                    email: age === "ADULT" ? email.trim() : null,
                    role: "GUEST",
                    ageCategory: age,
                }]);
                reset();
            } catch {
                setError("No se pudo añadir. ¿Ese correo ya está registrado?");
            }
        });
    }

    function addExisting() {
        if (!existingId) return;
        run(async () => {
            await updateUser(Number(existingId), { familyId });
            reset();
        });
    }

    if (mode === "closed") {
        return (
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setMode("new")} className={btnSecondary}>
                    <Plus className="w-4 h-4" /> Añadir persona nueva
                </button>
                {withoutFamily.length > 0 && (
                    <button type="button" onClick={() => setMode("existing")} className={btnGhost}>
                        Añadir invitado sin familia ({withoutFamily.length})
                    </button>
                )}
            </div>
        );
    }

    if (mode === "existing") {
        return (
            <div className="rounded-2xl bg-surface-container-low p-4 space-y-3">
                <label htmlFor="fd-existing" className={labelCls}>Invitado sin familia</label>
                <select id="fd-existing" value={existingId} onChange={(e) => setExistingId(e.target.value)} className={`${inputCls} bg-surface-container-lowest cursor-pointer`}>
                    <option value="">Selecciona…</option>
                    {withoutFamily.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} {u.lastName}{u.email ? ` · ${u.email}` : ""}</option>
                    ))}
                </select>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={reset} className={btnGhost}>Cancelar</button>
                    <button type="button" onClick={addExisting} disabled={!existingId || busy} className={btnPrimary}>Añadir a la familia</button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-surface-container-low p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="fd-new-name" className={labelCls}>Nombre</label>
                    <input id="fd-new-name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} bg-surface-container-lowest`} autoFocus />
                </div>
                <div>
                    <label htmlFor="fd-new-last" className={labelCls}>Apellido</label>
                    <input id="fd-new-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${inputCls} bg-surface-container-lowest`} />
                </div>
                <div role="radiogroup" aria-label="Edad" className="grid grid-cols-3 gap-1 self-end">
                    {(["ADULT", "CHILD", "BABY"] as AgeCategory[]).map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            role="radio"
                            aria-checked={age === cat}
                            onClick={() => setAge(cat)}
                            className={`py-3 rounded-lg text-sm font-medium transition-colors ${age === cat ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-primary/10"}`}
                        >
                            {AGE_LABEL[cat]}
                        </button>
                    ))}
                </div>
                <div>
                    <label htmlFor="fd-new-email" className={labelCls}>Correo {age !== "ADULT" && <span className="font-normal">(no hace falta)</span>}</label>
                    <input
                        id="fd-new-email"
                        type="email"
                        value={age === "ADULT" ? email : ""}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={age !== "ADULT"}
                        placeholder={age === "ADULT" ? "correo@gmail.com" : "Los menores no inician sesión"}
                        className={`${inputCls} bg-surface-container-lowest disabled:opacity-60`}
                    />
                </div>
            </div>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={reset} className={btnGhost}>Cancelar</button>
                <button type="button" onClick={addNew} disabled={busy} className={btnPrimary}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Añadir
                </button>
            </div>
        </div>
    );
}

