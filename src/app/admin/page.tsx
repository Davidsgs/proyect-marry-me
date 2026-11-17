import { getFamilies, getUsers } from "@/app/actions/admin";
import { WEDDING_DATE_LABEL, daysUntilWedding } from "@/lib/wedding";
import { formatSqlTimestamp, parseLocalDate, todayLocalISO } from "@/lib/dates";
import type { RsvpEvent } from "@/lib/rsvpAudit";
import { getTasks } from "@/app/actions/tasks";
import { getTables } from "@/app/actions/tables";
import { getSchedule } from "@/app/actions/schedule";
import { getFinanceSummary } from "@/app/actions/finance";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { cachedRsvpEvents, getRsvpDeadline } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { declined } from "@/lib/attendance";
import { EmptyState, btnPrimary } from "@/app/admin/_components/ui";
import {
    CheckCircle2,
    ChevronRight,
    ListTodo,
    Armchair,
    Wallet,
    UserX,
    MailQuestion,
    AlertTriangle,
    Baby,
    Plus,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDueDate(iso: string | null): string {
    if (!iso) return "Sin fecha";
    const d = parseLocalDate(iso);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

type Pending = { key: string; icon: LucideIcon; title: string; detail?: string; href: string; tone?: "warn" };

export default async function AdminPage() {
    const session = await auth();
    const perms = session?.user?.permissions;
    const canReadTasks = hasPermission(perms, "tasks.read");
    const canReadTables = hasPermission(perms, "tables.read");
    const canReadSchedule = hasPermission(perms, "calendar.read");
    const canReadFinance = hasPermission(perms, "finance.read");
    // Invitados necesita ambos permisos: la sección lee familias y personas.
    const canReadGuests = hasPermission(perms, "families.read") && hasPermission(perms, "users.read");
    const canWriteUsers = hasPermission(perms, "users.write");

    const [families, users, rsvpEvents, allTasks, tables, schedule, finance, deadline] = await Promise.all([
        canReadGuests ? getFamilies() : [],
        canReadGuests ? getUsers() : [],
        canReadGuests ? cachedRsvpEvents() : [],
        canReadTasks ? getTasks() : [],
        canReadTables ? getTables() : [],
        canReadSchedule ? getSchedule() : [],
        canReadFinance ? getFinanceSummary() : null,
        getRsvpDeadline(),
    ]);
    const today = todayLocalISO();

    // Familias
    const totalFamilies = families.length;
    const confirmedFamilies = families.filter((f) => f.globalRsvpStatus === "CONFIRMED").length;
    const declinedFamilies = families.filter((f) => f.globalRsvpStatus === "DECLINED").length;
    const pendingFamilyList = families.filter((f) => f.globalRsvpStatus === "PENDING");
    const respondedFamilies = confirmedFamilies + declinedFamilies;
    const responseRate = totalFamilies > 0 ? Math.round((respondedFamilies / totalFamilies) * 100) : 0;

    // Personas: cualquier usuario asignado a una familia.
    const guestUsers = users.filter((u) => u.familyId != null);
    const totalGuests = guestUsers.length;
    const confirmedGuests = guestUsers.filter((u) => u.isConfirmed).length;
    const adultGuests = guestUsers.filter((u) => u.ageCategory === "ADULT").length;
    const minorGuests = totalGuests - adultGuests;

    // Mesas
    const seatedGuests = guestUsers.filter((u) => u.tableId != null).length;
    const confirmedUnseated = guestUsers.filter((u) => u.isConfirmed && u.tableId == null).length;
    const overCapacityTables = tables.filter(
        (t) => guestUsers.filter((u) => u.tableId === t.id).length > t.capacity,
    );

    // Cronograma
    const completedActivities = schedule.filter((a) => a.isCompleted).length;
    const nextActivity = schedule.find((a) => !a.isCompleted) ?? null;

    // Tareas
    const pendingTasks = allTasks.filter((t) => !t.isCompleted);
    const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < today);
    const upcomingTasks = pendingTasks
        .toSorted((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 4);

    // Confirmaciones recientes: por la fecha de su última respuesta auditada (sin
    // historial, por la última edición de la familia) y con quién respondió.
    const lastEvent = new Map<number, RsvpEvent>();
    for (const e of rsvpEvents) if (!lastEvent.has(e.familyId)) lastEvent.set(e.familyId, e);
    const answeredAt = (f: { id: number; updatedAt: string }) => lastEvent.get(f.id)?.createdAt ?? f.updatedAt ?? "";
    const recentConfirmedFamilies = families
        .filter((f) => f.globalRsvpStatus === "CONFIRMED")
        .toSorted((a, b) => answeredAt(b).localeCompare(answeredAt(a)))
        .slice(0, 5);

    // «Por resolver»: lo que la pareja tiene que perseguir, de más a menos urgente.
    const familiesWithoutDelegate = families.filter((f) => f.delegateUserId == null && f.globalRsvpStatus === "PENDING");
    const pending: Pending[] = [];
    if (familiesWithoutDelegate.length > 0) {
        pending.push({
            key: "no-delegate",
            icon: UserX,
            tone: "warn",
            title: `${familiesWithoutDelegate.length} ${familiesWithoutDelegate.length === 1 ? "familia sin delegado" : "familias sin delegado"}`,
            detail: "Nadie puede confirmar por ellas. " + namesPreview(familiesWithoutDelegate.map((f) => f.name)),
            href: "/admin/guests?filtro=sin-delegado",
        });
    }
    if (pendingFamilyList.length > 0) {
        pending.push({
            key: "no-answer",
            icon: MailQuestion,
            title: `${pendingFamilyList.length} ${pendingFamilyList.length === 1 ? "familia no ha respondido" : "familias no han respondido"}`,
            detail: namesPreview(pendingFamilyList.map((f) => f.name)),
            href: "/admin/guests?filtro=sin-responder",
        });
    }
    // Familias con menores sin marcar como «familia directa»: ven la nota de
    // celebración sin niños aunque sus niños estén invitados.
    const familiesWithMinors = new Set(guestUsers.filter((u) => u.ageCategory !== "ADULT").map((u) => u.familyId));
    const minorsNotDirect = families.filter((f) => !f.isDirectFamily && familiesWithMinors.has(f.id));
    if (minorsNotDirect.length > 0) {
        pending.push({
            key: "minors-not-direct",
            icon: Baby,
            tone: "warn",
            title: `${minorsNotDirect.length} ${minorsNotDirect.length === 1 ? "familia con niños ve" : "familias con niños ven"} la nota «sin niños»`,
            detail: "Márcalas como familia directa si sus niños están invitados. " + namesPreview(minorsNotDirect.map((f) => f.name)),
            href: "/admin/guests?filtro=con-ninos",
        });
    }
    if (overdueTasks.length > 0) {
        pending.push({
            key: "overdue-tasks",
            icon: ListTodo,
            tone: "warn",
            title: `${overdueTasks.length} ${overdueTasks.length === 1 ? "tarea vencida" : "tareas vencidas"}`,
            detail: namesPreview(overdueTasks.map((t) => t.title)),
            href: "/admin/tasks",
        });
    }
    if (canReadTables && overCapacityTables.length > 0) {
        pending.push({
            key: "over-capacity",
            icon: AlertTriangle,
            tone: "warn",
            title: `${overCapacityTables.length} ${overCapacityTables.length === 1 ? "mesa supera" : "mesas superan"} su capacidad`,
            detail: overCapacityTables.map((t) => `Mesa ${t.number}`).join(", "),
            href: "/admin/tables",
        });
    }
    if (canReadTables && confirmedUnseated > 0) {
        pending.push({
            key: "unseated",
            icon: Armchair,
            title: `${confirmedUnseated} ${confirmedUnseated === 1 ? "confirmado sin mesa" : "confirmados sin mesa"}`,
            detail: "Asígnales mesa antes de imprimir el plano.",
            href: "/admin/tables",
        });
    }
    const seatedNotComing = canReadTables
        ? guestUsers.filter((u) => u.tableId != null && declined(u, families.find((f) => f.id === u.familyId)))
        : [];
    if (seatedNotComing.length > 0) {
        pending.push({
            key: "seated-not-coming",
            icon: UserX,
            title: `${seatedNotComing.length} ${seatedNotComing.length === 1 ? "persona que no viene ocupa" : "personas que no vienen ocupan"} una silla`,
            detail: "Libera sus sillas para que no cuenten en el plano. " + namesPreview(seatedNotComing.map((u) => `${u.name} ${u.lastName}`)),
            href: "/admin/tables",
        });
    }
    if (finance && finance.overdueCount > 0) {
        pending.push({
            key: "overdue-installments",
            icon: Wallet,
            tone: "warn",
            title: `${finance.overdueCount} ${finance.overdueCount === 1 ? "cuota vencida" : "cuotas vencidas"}`,
            href: "/admin/finance",
        });
    }

    const firstName = session?.user?.name?.split(" ")[0] ?? "";
    const daysLeft = daysUntilWedding();
    const deadlineLabel = deadline
        ? deadline.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
        : null;

    // Estado general: una fila por sección, cada una enlazada.
    const status: StatusRow[] = [];
    if (canReadGuests) {
        status.push({
            href: "/admin/guests",
            label: "Familias que respondieron",
            value: <>{respondedFamilies}<Of n={totalFamilies} /></>,
            hint: <ProgressBar percent={responseRate} label={`${responseRate}% respondió`} />,
        });
        status.push({
            href: "/admin/guests?tab=invitados",
            label: "Invitados que asisten",
            value: <>{confirmedGuests}<Of n={totalGuests} /></>,
            hint: `${adultGuests} ${adultGuests === 1 ? "adulto" : "adultos"} · ${minorGuests} ${minorGuests === 1 ? "menor" : "menores"}`,
            tone: "good",
        });
    }
    if (canReadTables) {
        status.push({
            href: "/admin/tables",
            label: "Invitados con mesa",
            value: <>{seatedGuests}<Of n={totalGuests} /></>,
            hint: `${tables.length} ${tables.length === 1 ? "mesa" : "mesas"} · ${tables.reduce((s, t) => s + t.capacity, 0)} asientos`,
            tone: overCapacityTables.length > 0 ? "warn" : undefined,
        });
    }
    if (canReadTasks) {
        status.push({
            href: "/admin/tasks",
            label: "Tareas pendientes",
            value: pendingTasks.length,
            hint: overdueTasks.length > 0
                ? `${overdueTasks.length} ${overdueTasks.length === 1 ? "vencida" : "vencidas"} · ${allTasks.length - pendingTasks.length} hechas`
                : `${allTasks.length - pendingTasks.length} hechas`,
            tone: overdueTasks.length > 0 ? "warn" : undefined,
        });
    }
    if (canReadSchedule) {
        status.push({
            href: "/admin/cronograma",
            label: "Cronograma",
            value: <>{completedActivities}<Of n={schedule.length} /></>,
            hint: schedule.length === 0
                ? "Sin actividades aún"
                : nextActivity
                    ? `Sigue: ${nextActivity.title}${nextActivity.time ? ` · ${nextActivity.time}` : ""}`
                    : "Todo el día completado",
        });
    }
    if (canReadFinance && finance) {
        status.push({
            href: "/admin/finance",
            label: "Balance",
            value: formatMoney(finance.balanceCents),
            hint: finance.pendingCount > 0 ? `${formatMoney(finance.toPayCents)} en cuotas por pagar` : "Sin cuotas pendientes",
            tone: finance.balanceCents < 0 || finance.overdueCount > 0 ? "warn" : undefined,
        });
    }

    const addGuests = canWriteUsers && (
        <Link href="/admin/guests?tab=invitados" className={btnPrimary}>
            <Plus className="w-4 h-4" aria-hidden /> Agregar invitados
        </Link>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 lg:space-y-14">
            <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="font-serif text-5xl leading-display text-primary">Resumen</h1>
                    {firstName && <p className="mt-2 text-sm text-on-surface-variant">Hola, {firstName}.</p>}
                </div>
                <div className="flex flex-wrap items-end gap-6">
                    {daysLeft > 0 && (
                        <p className="flex items-baseline gap-3">
                            <span className="font-sans font-light text-6xl sm:text-7xl leading-none tabular-nums text-primary">{daysLeft}</span>
                            <span className="text-sm text-on-surface-variant leading-snug">
                                {daysLeft === 1 ? "día" : "días"} para el<br />{WEDDING_DATE_LABEL}
                            </span>
                        </p>
                    )}
                    {addGuests}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-12 items-start">
                {/* Por resolver: lo primero que hay que mirar */}
                <section className="space-y-4" aria-labelledby="pendientes">
                    <h2 id="pendientes" className="font-serif text-3xl leading-display text-primary">Por resolver</h2>
                    {pending.length === 0 ? (
                        <div className="bg-secondary-container/60 p-6 rounded-2xl flex items-center gap-3 text-sm text-on-secondary-container">
                            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden />
                            Todo al día. No hay nada pendiente que perseguir.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {pending.map((item) => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest hover:bg-[#fffdf8] transition-colors"
                                    >
                                        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.tone === "warn" ? "bg-error/10 text-error" : "bg-surface-container-low text-primary"}`}>
                                            <item.icon className="w-5 h-5" aria-hidden />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-item font-medium text-on-surface">{item.title}</span>
                                            {item.detail && <span className="block text-sm text-on-surface-variant mt-0.5 line-clamp-2">{item.detail}</span>}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    {canReadGuests && deadlineLabel && (
                        <p className="text-sm text-on-surface-variant">
                            Las familias pueden responder hasta el <span className="font-medium text-on-surface">{deadlineLabel}</span>.
                        </p>
                    )}
                </section>

                {/* Estado: una línea por sección */}
                {status.length > 0 && (
                    <section className="space-y-4" aria-labelledby="estado">
                        <h2 id="estado" className="font-serif text-3xl leading-display text-primary">Estado</h2>
                        <ul className="rounded-2xl bg-surface-container-lowest p-1.5">
                            {status.map((row) => (
                                <li key={row.href + row.label}>
                                    <Link href={row.href} className="group flex items-center gap-4 rounded-xl px-4 py-3.5 hover:bg-surface-container-low transition-colors">
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm text-on-surface-variant">{row.label}</span>
                                            {row.hint && <span className="mt-1 block text-xs text-on-surface-variant">{row.hint}</span>}
                                        </span>
                                        <span className={`text-xl font-medium tabular-nums whitespace-nowrap ${row.tone === "warn" ? "text-error" : row.tone === "good" ? "text-on-secondary-container" : "text-on-surface"}`}>
                                            {row.value}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {canReadTasks && (
                    <section className="space-y-4" aria-labelledby="proximas">
                        <div className="flex items-baseline justify-between gap-2">
                            <h2 id="proximas" className="font-serif text-3xl leading-display text-primary">Próximas tareas</h2>
                            <Link href="/admin/tasks" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Ver todas</Link>
                        </div>
                        {upcomingTasks.length === 0 ? (
                            <EmptyState message="No hay tareas pendientes." />
                        ) : (
                            <ul className="space-y-1.5">
                                {upcomingTasks.map((task) => {
                                    const overdue = task.dueDate != null && task.dueDate < today;
                                    return (
                                        <li key={task.id} className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-3">
                                            <span className="text-sm text-on-surface flex-1 min-w-0 truncate">{task.title}</span>
                                            <span className={`text-xs font-medium tabular-nums shrink-0 ${overdue ? "text-error" : "text-on-surface-variant"}`}>
                                                {overdue ? "Vencida · " : ""}{formatDueDate(task.dueDate)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                )}

                {canReadGuests && (
                    <section className="space-y-4" aria-labelledby="recientes">
                        <div className="flex items-baseline justify-between gap-2">
                            <h2 id="recientes" className="font-serif text-3xl leading-display text-primary">Últimas confirmaciones</h2>
                            <Link href="/admin/guests" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Ver invitados</Link>
                        </div>
                        {recentConfirmedFamilies.length === 0 ? (
                            <EmptyState message="Aún no ha confirmado ninguna familia." />
                        ) : (
                            <ul className="space-y-1.5">
                                {recentConfirmedFamilies.map((f) => {
                                    const familyUsers = users.filter((u) => u.familyId === f.id);
                                    const attending = familyUsers.filter((u) => u.isConfirmed).length;
                                    const event = lastEvent.get(f.id);
                                    return (
                                        <li key={f.id} className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-3">
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm text-on-surface truncate">{f.name}</span>
                                                {event && (
                                                    <span className="block text-xs text-on-surface-variant truncate">
                                                        {event.actorKind === "DELEGATE" ? "Delegado" : "Administrador"}
                                                        {event.actorName && `: ${event.actorName}`} · {formatSqlTimestamp(event.createdAt)}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-xs text-on-secondary-container font-medium tabular-nums shrink-0">
                                                {attending} de {familyUsers.length} asisten
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

type StatusRow = { href: string; label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "warn" | "good" };

function Of({ n }: { n: number }) {
    return <span className="text-sm font-normal text-on-surface-variant"> / {n}</span>;
}

function namesPreview(names: string[], max = 3): string {
    const shown = names.slice(0, max).join(", ");
    return names.length > max ? `${shown} y ${names.length - max} más` : shown;
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
    return (
        <span className="flex flex-col gap-1.5">
            <span className="block w-full max-w-48 h-1.5 bg-surface-container rounded-full overflow-hidden" aria-hidden>
                <span className="block h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
            </span>
            {label}
        </span>
    );
}
