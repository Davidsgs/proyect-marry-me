"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isImeEnter } from "@/lib/keys";
import { GrowText } from "@/components/GrowText";
import { isTemp, pendingRowCls, tempId } from "@/app/admin/_components/optimistic";
import { draftUser, useGuestsMutate, type Family, type User } from "./guestsStore";
import { createManyUsers, deleteFamily, updateFamily, updateUser } from "@/app/actions/admin";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { Checkbox, Chip, RsvpChip, btnGhost, btnPrimary, btnSecondary, iconBtn, inputCls, inputSmCls, rsvpSelectCls, selectCls } from "@/app/admin/_components/ui";
import { dietaryText } from "@/lib/diet";
import { formatSqlTimestamp } from "@/lib/dates";
import type { RsvpEvent } from "@/lib/rsvpAudit";
import { Check, Copy, History, MessageCircle, Pencil, Plus, Send, Trash2, UserMinus, X } from "lucide-react";
import { useNotify } from "@/app/admin/_components/Notice";
import { WEDDING_DATE_LABEL } from "@/lib/wedding";

type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
type AgeCategory = "BABY" | "CHILD" | "ADULT";

const AGE_LABEL: Record<AgeCategory, string> = { ADULT: "Adulto", CHILD: "Niño", BABY: "Bebé" };
const labelCls = "block text-label font-medium text-on-surface-variant mb-1.5";

// Ficha de una familia: datos (nombre, descripción, estado, delegado, nota sin
// niños) e integrantes. Se muestra en el panel lateral (escritorio) o en una
// hoja (móvil). Los datos se guardan con «Guardar cambios»; añadir o quitar
// integrantes se aplica al momento.
export default function FamilyDetail({
    family,
    users,
    canWriteFamilies,
    canWriteUsers,
    deadlineLabel = null,
    history = [],
    onClose,
    registerClose,
}: {
    family: Family;
    users: User[];
    canWriteFamilies: boolean;
    canWriteUsers: boolean;
    deadlineLabel?: string | null;
    /** Historial de respuestas de esta familia, el más reciente primero. */
    history?: RsvpEvent[];
    onClose: () => void;
    /** Permite al contenedor (hoja móvil) pedir el cierre con la comprobación de cambios. */
    registerClose?: (fn: () => void) => void;
}) {
    const confirm = useConfirm();
    const mutate = useGuestsMutate();
    const [error, setError] = useState<string | null>(null);

    const members = users.filter((u) => u.familyId === family.id);
    const adults = members.filter((u) => u.ageCategory === "ADULT");
    const withoutFamily = users.filter((u) => u.familyId == null);

    const [name, setName] = useState(family.name);
    const [alias, setAlias] = useState(family.alias ?? "");
    const [status, setStatus] = useState<RsvpStatus>(family.globalRsvpStatus as RsvpStatus);
    const [delegateId, setDelegateId] = useState<number | null>(family.delegateUserId);
    const [showNote, setShowNote] = useState(Boolean(family.showAdultsNote));
    // Invitación virtual: sin respuesta, delegado ni mesa (ver updateFamily).
    const [isVirtual, setIsVirtual] = useState(Boolean(family.isVirtual));
    const virtual = Boolean(family.isVirtual);

    const dirty =
        name.trim() !== family.name ||
        alias.trim() !== (family.alias ?? "") ||
        status !== family.globalRsvpStatus ||
        delegateId !== family.delegateUserId ||
        showNote !== Boolean(family.showAdultsNote) ||
        isVirtual !== virtual;

    async function handleClose() {
        if (dirty && canWriteFamilies) {
            const ok = await confirm({
                title: "¿Descartar los cambios?",
                description: "Hay cambios en los datos de la familia sin guardar.",
                confirmLabel: "Descartar",
            });
            if (!ok) return;
        }
        onClose();
    }

    useEffect(() => {
        registerClose?.(handleClose);
    });

    async function handleSave() {
        if (!name.trim()) {
            setError("La familia necesita un nombre.");
            return;
        }
        setError(null);
        const moving = isVirtual !== virtual;
        if (moving) {
            const ok = await confirm({
                title: isVirtual ? `¿Pasar «${family.name}» a invitación virtual?` : `¿Pasar «${family.name}» a invitación presencial?`,
                description: isVirtual
                    ? "Verán la transmisión en vivo en lugar de la invitación. Su respuesta vuelve a Pendiente, nadie figura como que viene y se liberan sus lugares en las mesas. La familia pasa a la sección Virtuales."
                    : "Verán la invitación completa y el delegado podrá confirmar. La familia pasa a la sección Invitados, con la respuesta Pendiente.",
                confirmLabel: isVirtual ? "Pasar a virtual" : "Pasar a presencial",
            });
            if (!ok) return;
        }
        const data = {
            name: name.trim(),
            alias: alias.trim(),
            showAdultsNote: showNote,
            ...(moving ? { isVirtual } : {}),
            ...(!moving && status !== family.globalRsvpStatus ? { globalRsvpStatus: status } : {}),
            ...(delegateId !== family.delegateUserId ? { delegateUserId: delegateId } : {}),
        };
        mutate(
            (d) => ({
                // Al cambiar de tipo la familia se va de esta sección (el servidor la reinicia).
                families: moving
                    ? d.families.filter((f) => f.id !== family.id)
                    : d.families.map((f) => (f.id === family.id ? { ...f, ...data } : f)),
                // Al cambiar el estado, los integrantes lo siguen (igual que en el servidor).
                users: moving
                    ? d.users.filter((u) => u.familyId !== family.id)
                    : data.globalRsvpStatus
                        ? d.users.map((u) => (u.familyId === family.id ? { ...u, isConfirmed: data.globalRsvpStatus === "CONFIRMED" } : u))
                        : d.users,
            }),
            () => updateFamily(family.id, data),
            {
                ok: moving ? (isVirtual ? "Familia pasada a Virtuales" : "Familia pasada a Invitados") : "Familia guardada",
                error: "No se pudieron guardar los cambios de la familia",
            },
        );
        onClose();
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
        mutate(
            (d) => ({
                families: d.families.map((f) => (f.delegateUserId === member.id ? { ...f, delegateUserId: null } : f)),
                users: d.users.map((u) => (u.id === member.id ? { ...u, familyId: null } : u)),
            }),
            () => updateUser(member.id, { familyId: null }),
            { ok: `${member.name} quedó sin familia`, error: `No se pudo quitar a ${member.name} de la familia` },
        );
    }

    async function handleDeleteFamily() {
        const ok = await confirm({
            title: `¿Eliminar la familia «${family.name}»?`,
            description: members.length > 0
                ? `También se borrarán sus ${members.length} ${members.length === 1 ? "integrante" : "integrantes"} y sus confirmaciones.`
                : "La familia no tiene integrantes.",
            confirmLabel: "Eliminar familia",
        });
        if (!ok) return;
        onClose();
        // Al borrar la familia se borran también sus integrantes (cascada en la base).
        mutate(
            (d) => ({ families: d.families.filter((f) => f.id !== family.id), users: d.users.filter((u) => u.familyId !== family.id) }),
            () => deleteFamily(family.id),
            { ok: "Familia eliminada", error: "No se pudo eliminar la familia" },
        );
    }

    return (
        <div className="flex flex-col">
            <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="min-w-0">
                    <h2 id="family-detail-title" className="font-serif text-4xl leading-tight text-primary text-balance">{family.name}</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        {members.length} {members.length === 1 ? "integrante" : "integrantes"}
                    </p>
                </div>
                <button type="button" onClick={handleClose} className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" aria-label="Cerrar">
                    <X className="w-5 h-5" />
                </button>
            </header>

            <div className="px-6 pb-6 space-y-8">
                {/* Datos de la familia */}
                <section aria-labelledby="fd-datos" className="space-y-4">
                    <h3 id="fd-datos" className="text-sm font-semibold text-on-surface">Datos</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fd-name" className={labelCls}>Nombre</label>
                            <GrowText id="fd-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canWriteFamilies} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="fd-alias" className={labelCls}>Descripción <span className="font-normal">(opcional)</span></label>
                            <GrowText id="fd-alias" value={alias} onChange={(e) => setAlias(e.target.value)} disabled={!canWriteFamilies} placeholder="Tíos paternos, amigos de la facu…" className={inputCls} />
                        </div>
                        {!virtual && (<>
                        <div>
                            <label htmlFor="fd-status" className={labelCls}>Estado de la respuesta</label>
                            <select id="fd-status" value={status} onChange={(e) => setStatus(e.target.value as RsvpStatus)} disabled={!canWriteFamilies} className={rsvpSelectCls}>
                                <option value="PENDING">Pendiente</option>
                                <option value="CONFIRMED">Confirmado</option>
                                <option value="DECLINED">No asiste</option>
                            </select>
                            {status !== family.globalRsvpStatus && (
                                <p className="text-xs text-on-surface-variant mt-1.5">
                                    Normalmente responde el delegado desde la invitación; esto sobrescribe su respuesta
                                    {status === "CONFIRMED" ? " y marca que vienen todos los integrantes." : status === "DECLINED" ? " y marca que no viene ningún integrante." : " y deja a los integrantes sin respuesta."}
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
                                    className={selectCls}
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
                        </>)}
                    </div>
                    {!virtual && (
                    <div className="rounded-xl bg-surface-container-low px-4 py-2">
                        {canWriteFamilies ? (
                            <Checkbox checked={showNote} onChange={setShowNote} label="Mostrar la nota de celebración sin niños" />
                        ) : (
                            <p className="py-2 text-sm text-on-surface">{showNote ? "Ve la nota de celebración sin niños" : "No ve la nota sobre niños"}</p>
                        )}
                        <p className="pb-2 text-xs text-on-surface-variant">
                            Si está marcada, la familia verá en su invitación una nota amable de que la celebración es para adultos.
                        </p>
                    </div>
                    )}
                    <div className="rounded-xl bg-surface-container-low px-4 py-2">
                        {canWriteFamilies ? (
                            <Checkbox checked={isVirtual} onChange={setIsVirtual} label="Invitación virtual (sigue la boda en vivo)" />
                        ) : (
                            <p className="py-2 text-sm text-on-surface">{isVirtual ? "Invitación virtual (sigue la boda en vivo)" : "Invitación presencial"}</p>
                        )}
                        <p className="pb-2 text-xs text-on-surface-variant">
                            Para familiares en el exterior: ven la cuenta atrás y el enlace de la transmisión, no confirman ni ocupan mesa, y no cuentan entre los invitados presenciales.
                        </p>
                    </div>
                    {error && <p role="alert" className="text-sm text-error">{error}</p>}
                </section>

                {!virtual && family.globalRsvpStatus === "PENDING" && (
                    <Reminder family={family} delegate={members.find((m) => m.id === family.delegateUserId) ?? null} deadlineLabel={deadlineLabel} />
                )}

                {/* Integrantes */}
                <section aria-labelledby="fd-miembros" className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h3 id="fd-miembros" className="text-sm font-semibold text-on-surface">Integrantes</h3>
                    </div>
                    {members.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">Esta familia aún no tiene integrantes.</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {members.map((m) => {
                                const diet = dietaryText(m.dietary, m.dietaryNote);
                                return (
                                    <li key={m.id} aria-busy={isTemp(m.id) || undefined} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low ${isTemp(m.id) ? pendingRowCls : ""}`}>
                                        <span className="flex-1 min-w-0">
                                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-on-surface">
                                                <span className="truncate">{m.name} {m.lastName}</span>
                                                {delegateId === m.id && <Chip tone="brand">Delegado</Chip>}
                                                {m.isConfirmed && <Chip tone="yes">Confirmado</Chip>}
                                            </span>
                                            {m.ageCategory === "ADULT" ? (
                                                <MemberEmail member={m} diet={diet} canEdit={canWriteUsers} />
                                            ) : (
                                                <span className="block text-xs text-on-surface-variant truncate mt-0.5">
                                                    {AGE_LABEL[m.ageCategory as AgeCategory]}
                                                    {diet && ` · ${diet}`}
                                                </span>
                                            )}
                                        </span>
                                        {canWriteUsers && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(m)}
                                                className="inline-flex items-center gap-1.5 min-h-11 pointer-fine:min-h-9 px-3 rounded-lg text-sm text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                                                aria-label={`Quitar a ${m.name} ${m.lastName} de la familia`}
                                            >
                                                <UserMinus className="w-4 h-4" aria-hidden />
                                                <span className="hidden sm:inline">Quitar</span>
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {canWriteUsers && (
                        <AddMember
                            familyId={family.id}
                            familyLastName={members[0]?.lastName ?? ""}
                            withoutFamily={withoutFamily}
                        />
                    )}
                </section>

                {!virtual && <RsvpHistory family={family} history={history} />}
            </div>

            {canWriteFamilies && (
                <footer className="sticky bottom-0 flex flex-col-reverse sm:flex-row sm:items-center gap-2 px-6 py-4 bg-surface-container-low rounded-b-3xl">
                    <button type="button" onClick={handleDeleteFamily} className={`${btnGhost} text-error hover:text-error hover:bg-error/10 sm:mr-auto`}>
                        <Trash2 className="w-4 h-4" aria-hidden />
                        Eliminar familia
                    </button>
                    <button type="button" onClick={handleClose} className={btnGhost}>Cancelar</button>
                    <button type="button" onClick={handleSave} disabled={!dirty} className={btnPrimary}>
                        Guardar cambios
                    </button>
                </footer>
            )}
        </div>
    );
}

const ACTOR_LABEL = { DELEGATE: "Delegado", ADMIN: "Administrador" } as const;

// Historial de respuestas (auditoría): quién respondió —el delegado desde la
// invitación o un administrador desde el panel—, cuándo, y quién viene y quién no.
function RsvpHistory({ family, history }: { family: Family; history: RsvpEvent[] }) {
    return (
        <section aria-labelledby="fd-historial" className="space-y-3">
            <h3 id="fd-historial" className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <History className="w-4 h-4" aria-hidden /> Historial de respuestas
            </h3>
            {history.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                    {family.globalRsvpStatus === "PENDING"
                        ? "Aún no hay respuestas."
                        : "Respondió antes de que se guardara el historial: no se sabe quién lo hizo."}
                </p>
            ) : (
                <ol className="space-y-1.5">
                    {history.map((e) => {
                        const coming = e.attendees.filter((a) => a.attending).map((a) => a.name);
                        const notComing = e.attendees.filter((a) => !a.attending).map((a) => a.name);
                        return (
                            <li key={e.id} className="rounded-xl bg-surface-container-low px-4 py-3 space-y-1">
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface">
                                    <RsvpChip status={e.status} />
                                    <span className="font-medium">{e.actorName || "Alguien ya borrado"}</span>
                                    <Chip tone={e.actorKind === "DELEGATE" ? "brand" : "neutral"}>{ACTOR_LABEL[e.actorKind]}</Chip>
                                    <time dateTime={e.createdAt.replace(" ", "T") + "Z"} className="ml-auto text-xs text-on-surface-variant tabular-nums">
                                        {formatSqlTimestamp(e.createdAt)}
                                    </time>
                                </p>
                                {e.attendees.length === 0 ? (
                                    <p className="text-xs text-on-surface-variant">Cambió el estado de la familia desde el panel.</p>
                                ) : (
                                    <p className="text-xs text-on-surface-variant">
                                        {coming.length > 0 && <>Vienen: <span className="text-on-surface">{coming.join(", ")}</span></>}
                                        {coming.length > 0 && notComing.length > 0 && " · "}
                                        {notComing.length > 0 && <>No vienen: <span className="text-on-surface">{notComing.join(", ")}</span></>}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}

// Añadir integrante: una persona nueva o alguien que ya está en Invitados sin familia.
const noopSubscribe = () => () => {};

// Recordatorio para una familia que aún no respondió: texto listo para copiar o
// abrir en WhatsApp, dirigido al delegado (quien confirma por todos).
function Reminder({ family, delegate, deadlineLabel }: { family: Family; delegate: User | null; deadlineLabel: string | null }) {
    const notify = useNotify();
    // Dirección de la invitación (este mismo sitio); vacía en el servidor.
    const url = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
    const h3 = "text-sm font-semibold text-on-surface flex items-center gap-2";

    if (!delegate?.email) {
        return (
            <section aria-labelledby="fd-recordatorio" className="space-y-2">
                <h3 id="fd-recordatorio" className={h3}><Send className="w-4 h-4" aria-hidden /> Recordatorio</h3>
                <p className="text-sm text-on-surface-variant">
                    {delegate ? `${delegate.name} no tiene correo: añádeselo para poder enviarle el recordatorio.` : "Elige un delegado con correo para poder enviarle el recordatorio."}
                </p>
            </section>
        );
    }

    const message =
        `¡Hola, ${delegate.name}! Te escribimos por nuestra boda (${WEDDING_DATE_LABEL}). ` +
        `¿Nos confirmas quiénes de tu familia vienen? Entra en ${url} con tu cuenta de Google (${delegate.email})` +
        (deadlineLabel ? ` antes del ${deadlineLabel}` : "") +
        ". ¡Gracias! David y Rocío";

    async function copy() {
        try {
            await navigator.clipboard.writeText(message);
            notify("Recordatorio copiado");
        } catch {
            notify("No se pudo copiar el recordatorio. Selecciona el texto y cópialo a mano.", "error");
        }
    }

    return (
        <section aria-labelledby="fd-recordatorio" className="space-y-3">
            <h3 id="fd-recordatorio" className={h3}><Send className="w-4 h-4" aria-hidden /> Recordatorio para {delegate.name}</h3>
            <p className="rounded-xl bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface select-all">{message}</p>
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copy} className={btnSecondary}>
                    <Copy className="w-4 h-4" aria-hidden /> Copiar
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                    <MessageCircle className="w-4 h-4" aria-hidden /> Enviar por WhatsApp
                </a>
            </div>
            <p className="text-xs text-on-surface-variant">{family.name} aún no respondió. WhatsApp te deja elegir el chat.</p>
        </section>
    );
}

function AddMember({
    familyId,
    familyLastName,
    withoutFamily,
}: {
    familyId: number;
    familyLastName: string;
    withoutFamily: User[];
}) {
    const mutate = useGuestsMutate();
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
        const person = {
            name: name.trim(),
            lastName: lastName.trim(),
            email: age === "ADULT" ? email.trim() : null,
            role: "GUEST" as const,
            ageCategory: age,
        };
        mutate(
            (d) => ({ ...d, users: [...d.users, draftUser(tempId(), { ...person, familyId, isConfirmed: d.families.find((f) => f.id === familyId)?.globalRsvpStatus === "CONFIRMED" })] }),
            () => createManyUsers(familyId, [person]),
            { ok: `${person.name} añadido a la familia`, error: `No se pudo añadir a ${person.name} (¿ese correo ya está registrado?)` },
        );
        reset();
    }

    function addExisting() {
        if (!existingId) return;
        const id = Number(existingId);
        mutate(
            (d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, familyId } : u)) }),
            () => updateUser(id, { familyId }),
            { ok: "Invitado añadido a la familia", error: "No se pudo añadir el invitado a la familia" },
        );
        reset();
    }

    if (mode === "closed") {
        return (
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setMode("new")} className={btnSecondary}>
                    <Plus className="w-4 h-4" aria-hidden /> Añadir persona nueva
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
                <select id="fd-existing" value={existingId} onChange={(e) => setExistingId(e.target.value)} className={`${selectCls} bg-surface-container-lowest`}>
                    <option value="">Selecciona…</option>
                    {withoutFamily.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} {u.lastName}{u.email ? ` · ${u.email}` : ""}</option>
                    ))}
                </select>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={reset} className={btnGhost}>Cancelar</button>
                    <button type="button" onClick={addExisting} disabled={!existingId} className={btnPrimary}>Añadir a la familia</button>
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
                <AgePicker value={age} onChange={setAge} className="self-end" />
                <div>
                    <label htmlFor="fd-new-email" className={labelCls}>Correo {age !== "ADULT" && <span className="font-normal">(no hace falta)</span>}</label>
                    <input
                        id="fd-new-email"
                        type="email"
                        value={age === "ADULT" ? email : ""}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={age !== "ADULT"}
                        placeholder={age === "ADULT" ? "correo@gmail.com" : "Los menores no inician sesión"}
                        className={`${inputCls} bg-surface-container-lowest`}
                    />
                </div>
            </div>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={reset} className={btnGhost}>Cancelar</button>
                <button type="button" onClick={addNew} className={btnPrimary}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Añadir
                </button>
            </div>
        </div>
    );
}

// Selector de edad: control segmentado accesible (radios).
export function AgePicker({ value, onChange, className = "" }: { value: AgeCategory; onChange: (v: AgeCategory) => void; className?: string }) {
    return (
        <div role="radiogroup" aria-label="Edad" className={`grid grid-cols-3 gap-1 rounded-xl bg-surface-container p-1 ${className}`}>
            {(["ADULT", "CHILD", "BABY"] as AgeCategory[]).map((cat) => (
                <button
                    key={cat}
                    type="button"
                    role="radio"
                    aria-checked={value === cat}
                    onClick={() => onChange(cat)}
                    className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${value === cat ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                    {AGE_LABEL[cat]}
                </button>
            ))}
        </div>
    );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Correo de un adulto con edición en línea: el lápiz junto al correo lo vuelve
// un campo; Enter guarda y Escape cancela. Es el correo con el que entra con Google.
function MemberEmail({ member, diet, canEdit }: { member: User; diet: string | null; canEdit: boolean }) {
    const mutate = useGuestsMutate();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(member.email ?? "");
    const [error, setError] = useState<string | null>(null);
    const fullName = `${member.name} ${member.lastName}`;

    function cancel() {
        setValue(member.email ?? "");
        setError(null);
        setEditing(false);
    }

    function save() {
        const email = value.trim();
        if (email === (member.email ?? "")) return cancel();
        if (!email) return setError("Los adultos necesitan correo para entrar a la invitación.");
        if (!EMAIL_RE.test(email)) return setError("Revisa el correo: falta la @ o el dominio.");
        setError(null);
        setEditing(false);
        mutate(
            (d) => ({ ...d, users: d.users.map((u) => (u.id === member.id ? { ...u, email } : u)) }),
            () => updateUser(member.id, { email }),
            { ok: `Correo de ${member.name} actualizado`, error: `No se pudo guardar el correo de ${member.name} (¿otro invitado ya lo usa?)` },
        ).then((ok) => { if (!ok) setValue(member.email ?? ""); });
    }

    if (editing) {
        return (
            <span className="block mt-1.5">
                <span className="flex items-center gap-1">
                    <input
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        autoFocus
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); if (!isImeEnter(e)) save(); }
                            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
                        }}
                        aria-label={`Correo de ${fullName}`}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `email-err-${member.id}` : undefined}
                        placeholder="correo@gmail.com"
                        className={`${inputSmCls} flex-1 min-w-0 min-h-11 pointer-fine:min-h-9 bg-surface-container-lowest font-normal`}
                    />
                    <button type="button" onClick={save} className={`${iconBtn} text-primary`} aria-label="Guardar correo">
                        <Check className="w-4 h-4" aria-hidden />
                    </button>
                    <button type="button" onClick={cancel} className={iconBtn} aria-label="Cancelar">
                        <X className="w-4 h-4" aria-hidden />
                    </button>
                </span>
                {error && <span id={`email-err-${member.id}`} role="alert" className="block mt-1 text-xs text-error">{error}</span>}
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1 min-w-0 mt-0.5 text-xs text-on-surface-variant">
            <span className="truncate">
                {member.email ?? "Sin correo"}
                {diet && ` · ${diet}`}
            </span>
            {canEdit && (
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    title="Editar correo"
                    aria-label={member.email ? `Editar el correo de ${fullName}` : `Añadir correo a ${fullName}`}
                    className="shrink-0 -my-2 inline-flex items-center justify-center w-10 h-10 pointer-fine:w-7 pointer-fine:h-7 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" aria-hidden />
                </button>
            )}
        </span>
    );
}
