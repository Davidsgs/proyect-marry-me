import { getFamilies, getUsers } from "@/app/actions/admin";
import { WEDDING_DATE_LABEL, daysUntilWedding } from "@/lib/wedding";
import { parseLocalDate, todayLocalISO } from "@/lib/dates";
import { getTasks } from "@/app/actions/tasks";
import { getTables } from "@/app/actions/tables";
import { getSchedule } from "@/app/actions/schedule";
import { getFinanceSummary } from "@/app/actions/finance";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { getRsvpDeadline } from "@/app/actions/config";
import { formatMoney } from "@/lib/money";
import { PageHeader, StatCard, btnPrimary } from "@/app/admin/_components/ui";
import {
    CheckCircle2,
    ChevronRight,
    ListTodo,
    Users as UsersIcon,
    Home,
    CalendarClock,
    Armchair,
    Wallet,
    UserX,
    MailQuestion,
    AlertTriangle,
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

    const [families, users, allTasks, tables, schedule, finance, deadline] = await Promise.all([
        canReadGuests ? getFamilies() : [],
        canReadGuests ? getUsers() : [],
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
    const upcomingTasks = [...pendingTasks]
        .sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 4);

    // Confirmaciones recientes
    const recentConfirmedFamilies = families
        .filter((f) => f.globalRsvpStatus === "CONFIRMED")
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
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
    const greeting = [
        firstName ? `Hola, ${firstName}.` : null,
        daysLeft > 0 ? `Faltan ${daysLeft} días para el ${WEDDING_DATE_LABEL}.` : null,
    ].filter(Boolean).join(" ");

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <PageHeader
                title="Resumen"
                description={greeting || undefined}
                actions={canWriteUsers && (
                    <Link href="/admin/guests?tab=invitados" className={btnPrimary}>
                        <Plus className="w-4 h-4" /> Agregar invitados
                    </Link>
                )}
            />

            {/* Estado general: cada tarjeta lleva a su sección */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {canReadGuests && (
                    <>
                        <StatCard
                            href="/admin/guests"
                            label="Familias que respondieron"
                            value={<>{respondedFamilies}<span className="text-lg text-on-surface-variant"> / {totalFamilies}</span></>}
                            icon={Home}
                            hint={<ProgressBar percent={responseRate} label={`${responseRate}% respondió`} />}
                        />
                        <StatCard
                            href="/admin/guests?tab=invitados"
                            label="Invitados que asisten"
                            value={<>{confirmedGuests}<span className="text-lg text-on-surface-variant"> / {totalGuests}</span></>}
                            icon={UsersIcon}
                            hint={`${adultGuests} ${adultGuests === 1 ? "adulto" : "adultos"} · ${minorGuests} ${minorGuests === 1 ? "menor" : "menores"}`}
                        />
                    </>
                )}
                {canReadTables && (
                    <StatCard
                        href="/admin/tables"
                        label="Invitados con mesa"
                        value={<>{seatedGuests}<span className="text-lg text-on-surface-variant"> / {totalGuests}</span></>}
                        icon={Armchair}
                        tone={overCapacityTables.length > 0 ? "warn" : "default"}
                        hint={`${tables.length} ${tables.length === 1 ? "mesa" : "mesas"} · ${tables.reduce((s, t) => s + t.capacity, 0)} asientos`}
                    />
                )}
                {canReadTasks && (
                    <StatCard
                        href="/admin/tasks"
                        label="Tareas pendientes"
                        value={pendingTasks.length}
                        icon={ListTodo}
                        tone={overdueTasks.length > 0 ? "warn" : "default"}
                        hint={overdueTasks.length > 0
                            ? `${overdueTasks.length} ${overdueTasks.length === 1 ? "vencida" : "vencidas"} · ${allTasks.length - pendingTasks.length} hechas`
                            : `${allTasks.length - pendingTasks.length} hechas`}
                    />
                )}
                {canReadSchedule && (
                    <StatCard
                        href="/admin/cronograma"
                        label="Cronograma"
                        value={<>{completedActivities}<span className="text-lg text-on-surface-variant"> / {schedule.length}</span></>}
                        icon={CalendarClock}
                        hint={schedule.length === 0
                            ? "Sin actividades aún"
                            : nextActivity
                                ? `Sigue: ${nextActivity.title}${nextActivity.time ? ` · ${nextActivity.time}` : ""}`
                                : "Todo el día completado"}
                    />
                )}
                {canReadFinance && finance && (
                    <StatCard
                        href="/admin/finance"
                        label="Balance"
                        value={formatMoney(finance.balanceCents)}
                        icon={Wallet}
                        tone={finance.balanceCents < 0 || finance.overdueCount > 0 ? "warn" : "default"}
                        hint={finance.pendingCount > 0
                            ? `${formatMoney(finance.toPayCents)} en cuotas por pagar`
                            : "Sin cuotas pendientes"}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
                {/* Por resolver */}
                <section className="space-y-4" aria-labelledby="pendientes">
                    <h2 id="pendientes" className="font-serif italic text-2xl text-primary">Por resolver</h2>
                    {pending.length === 0 ? (
                        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_20px_rgba(81,68,67,0.04)] flex items-center gap-3 text-sm text-on-surface-variant">
                            <CheckCircle2 className="w-5 h-5 text-on-secondary-container shrink-0" />
                            Todo al día. No hay nada pendiente que perseguir.
                        </div>
                    ) : (
                        <ul className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(81,68,67,0.04)] p-1.5 space-y-1">
                            {pending.map((item) => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        className="group flex items-center gap-4 p-3 sm:px-4 rounded-xl hover:bg-surface-container-low transition-colors"
                                    >
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.tone === "warn" ? "bg-error/10 text-error" : "bg-surface-container-low text-primary"}`}>
                                            <item.icon className="w-5 h-5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-on-surface">{item.title}</span>
                                            {item.detail && <span className="block text-xs text-on-surface-variant mt-0.5 truncate">{item.detail}</span>}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-on-surface-variant/60 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    {canReadGuests && deadlineLabel && (
                        <p className="text-xs text-on-surface-variant">
                            Las familias pueden responder hasta el <span className="font-medium text-on-surface">{deadlineLabel}</span>.
                        </p>
                    )}
                </section>

                <div className="space-y-10">
                    {/* Tareas próximas */}
                    {canReadTasks && (
                        <section className="space-y-4" aria-labelledby="proximas">
                            <div className="flex items-baseline justify-between gap-2">
                                <h2 id="proximas" className="font-serif italic text-2xl text-primary">Próximas tareas</h2>
                                <Link href="/admin/tasks" className="text-sm font-medium text-primary hover:underline underline-offset-4">Ver todas</Link>
                            </div>
                            {upcomingTasks.length === 0 ? (
                                <p className="text-sm text-on-surface-variant">No hay tareas pendientes.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {upcomingTasks.map((task) => {
                                        const overdue = task.dueDate != null && task.dueDate < today;
                                        return (
                                            <li key={task.id} className="bg-surface-container-lowest px-4 py-3 rounded-xl shadow-[0_2px_12px_rgba(81,68,67,0.04)] flex items-center gap-3">
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

                    {/* Confirmaciones recientes */}
                    {canReadGuests && (
                        <section className="space-y-4" aria-labelledby="recientes">
                            <div className="flex items-baseline justify-between gap-2">
                                <h2 id="recientes" className="font-serif italic text-2xl text-primary">Últimas confirmaciones</h2>
                                <Link href="/admin/guests" className="text-sm font-medium text-primary hover:underline underline-offset-4">Ver invitados</Link>
                            </div>
                            {recentConfirmedFamilies.length === 0 ? (
                                <p className="text-sm text-on-surface-variant">Aún no ha confirmado ninguna familia.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {recentConfirmedFamilies.map((f) => {
                                        const familyUsers = users.filter((u) => u.familyId === f.id);
                                        const attending = familyUsers.filter((u) => u.isConfirmed).length;
                                        return (
                                            <li key={f.id} className="bg-surface-container-lowest px-4 py-3 rounded-xl shadow-[0_2px_12px_rgba(81,68,67,0.04)] flex items-center gap-3">
                                                <span className="text-sm text-on-surface flex-1 min-w-0 truncate">{f.name}</span>
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
        </div>
    );
}

function namesPreview(names: string[], max = 3): string {
    const shown = names.slice(0, max).join(", ");
    return names.length > max ? `${shown} y ${names.length - max} más` : shown;
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
    return (
        <span className="flex flex-col gap-1.5">
            <span className="block w-full h-1.5 bg-surface-container rounded-full overflow-hidden" aria-hidden>
                <span className="block h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
            </span>
            {label}
        </span>
    );
}
