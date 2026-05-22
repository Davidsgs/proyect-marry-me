import { getFamilies, getUsers } from "@/app/actions/admin";
import { getTasks } from "@/app/actions/tasks";
import { getTables } from "@/app/actions/tables";
import { getSchedule } from "@/app/actions/schedule";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { getRsvpDeadline } from "@/app/actions/config";
import { CheckCircle2, ChevronRight, ListTodo, Users as UsersIcon, Home, CalendarClock, Armchair, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

function formatDueDate(iso: string | null): string {
    if (!iso) return "Sin fecha";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function AdminPage() {
    const session = await auth();
    const perms = session?.user?.permissions;
    const canReadTasks = hasPermission(perms, "tasks.read");
    const canReadTables = hasPermission(perms, "tables.read");
    const canReadSchedule = hasPermission(perms, "calendar.read");

    const families = await getFamilies();
    const users = await getUsers();
    const allTasks = canReadTasks ? await getTasks() : [];
    const tables = canReadTables ? await getTables() : [];
    const schedule = canReadSchedule ? await getSchedule() : [];
    const deadline = await getRsvpDeadline();

    // Family-level metrics
    const totalFamilies = families.length;
    const confirmedFamilies = families.filter((f) => f.globalRsvpStatus === "CONFIRMED").length;
    const declinedFamilies = families.filter((f) => f.globalRsvpStatus === "DECLINED").length;
    const pendingFamilies = families.filter((f) => f.globalRsvpStatus === "PENDING").length;
    const respondedFamilies = confirmedFamilies + declinedFamilies;
    const responseRate = totalFamilies > 0 ? Math.round((respondedFamilies / totalFamilies) * 100) : 0;

    // People-level metrics — count any user assigned to a family (admin included if in family).
    const guestUsers = users.filter((u) => u.familyId != null);
    const totalGuests = guestUsers.length;
    const confirmedGuests = guestUsers.filter((u) => u.isConfirmed).length;
    const adultGuests = guestUsers.filter((u) => u.ageCategory === "ADULT").length;
    const minorGuests = totalGuests - adultGuests;

    // Table metrics
    const totalTables = tables.length;
    const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
    const seatedGuests = guestUsers.filter((u) => u.tableId != null).length;
    const toSeat = totalGuests - seatedGuests;
    const overCapacityTables = tables.filter(
        (t) => guestUsers.filter((u) => u.tableId === t.id).length > t.capacity,
    ).length;

    // Schedule metrics
    const totalActivities = schedule.length;
    const completedActivities = schedule.filter((a) => a.isCompleted).length;
    const nextActivity = schedule.find((a) => !a.isCompleted) ?? null;

    // Task metrics
    const pendingTasks = allTasks.filter((t) => !t.isCompleted);
    const upcomingTasks = [...pendingTasks]
        .sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        })
        .slice(0, 3);

    // Recent confirmations (families, ordered by updatedAt desc)
    const recentConfirmedFamilies = [...families]
        .filter((f) => f.globalRsvpStatus === "CONFIRMED")
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
        .slice(0, 5);

    const firstName = session?.user?.name?.split(" ")[0] ?? "";
    const deadlineLabel = deadline
        ? deadline.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
        : null;

    // 3 stats base (familias, invitados, tareas) + las opcionales. Con 5 tarjetas
    // pasamos a 3 columnas (3+2) para que ninguna quede huérfana en su fila.
    const statCount = 3 + (canReadTables ? 1 : 0) + (canReadSchedule ? 1 : 0);
    const statCols = statCount >= 5 ? "lg:grid-cols-3" : statCount === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif italic text-primary drop-shadow-sm">
                        Resumen general
                    </h1>
                    <p className="text-on-surface-variant font-sans text-sm tracking-wide mt-2">
                        {firstName ? `Hola, ${firstName}. ` : ""}Aquí tienes el estado actual de tu boda.
                    </p>
                </div>
                <Link
                    href="/admin/guests#users"
                    className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md font-sans text-sm font-medium"
                >
                    Agregar invitado
                </Link>
            </div>

            {/* Stats híbridas */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${statCols} gap-6`}>
                {/* Familias: respondieron / total */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Familias</p>
                        <Home className="w-4 h-4 text-on-surface-variant opacity-60" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-serif text-primary">{respondedFamilies}</span>
                        <span className="text-lg text-on-surface-variant font-light">/ {totalFamilies}</span>
                    </div>
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden mt-auto">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${responseRate}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 font-medium">
                        {responseRate}% respondió
                    </p>
                </div>

                {/* Personas: confirmadas / total + desglose adultos/menores */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Invitados</p>
                        <UsersIcon className="w-4 h-4 text-on-surface-variant opacity-60" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-serif text-primary">{confirmedGuests}</span>
                        <span className="text-lg text-on-surface-variant font-light">/ {totalGuests}</span>
                    </div>
                    <div className="mt-auto flex flex-col gap-1 text-xs text-on-surface-variant font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-on-secondary-container" />
                            <span>confirmaron asistencia</span>
                        </div>
                        <div className="text-on-surface-variant/80">
                            {adultGuests} {adultGuests === 1 ? "adulto" : "adultos"} · {minorGuests} {minorGuests === 1 ? "menor" : "menores"}
                        </div>
                    </div>
                </div>

                {/* Tareas pendientes */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Tareas</p>
                        <ListTodo className="w-4 h-4 text-on-surface-variant opacity-60" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-serif text-primary">{pendingTasks.length}</span>
                        <span className="text-lg text-on-surface-variant font-light">pendientes</span>
                    </div>
                    <div className="flex items-center gap-2 mt-auto text-sm text-on-surface-variant font-medium">
                        <CalendarClock className="w-4 h-4 text-on-surface-variant opacity-60" />
                        <span>{allTasks.length - pendingTasks.length} completadas</span>
                    </div>
                </div>

                {/* Mesas: sentados / total + condición */}
                {canReadTables && (
                    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Mesas</p>
                            <Armchair className="w-4 h-4 text-on-surface-variant opacity-60" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-serif text-primary">{seatedGuests}</span>
                            <span className="text-lg text-on-surface-variant font-light">/ {totalGuests} sentados</span>
                        </div>
                        <div className="mt-auto flex flex-col gap-1 text-xs font-medium">
                            {toSeat > 0 ? (
                                <div className="flex items-center gap-2 text-on-surface-variant">
                                    <AlertTriangle className="w-3.5 h-3.5 text-on-surface-variant opacity-70" />
                                    <span>Faltan {toSeat} por sentar</span>
                                </div>
                            ) : totalTables > 0 ? (
                                <div className="flex items-center gap-2 text-on-secondary-container">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Todos sentados</span>
                                </div>
                            ) : (
                                <span className="text-on-surface-variant/80">Sin mesas creadas</span>
                            )}
                            {overCapacityTables > 0 ? (
                                <div className="flex items-center gap-2 text-error">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{overCapacityTables} sobre capacidad</span>
                                </div>
                            ) : (
                                <span className="text-on-surface-variant/80">{totalTables} mesas · {totalSeats} asientos</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Cronograma: completadas / total + próxima actividad */}
                {canReadSchedule && (
                    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Cronograma</p>
                            <CalendarClock className="w-4 h-4 text-on-surface-variant opacity-60" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-serif text-primary">{completedActivities}</span>
                            <span className="text-lg text-on-surface-variant font-light">/ {totalActivities} hechas</span>
                        </div>
                        <div className="mt-auto flex flex-col gap-1 text-xs font-medium">
                            {totalActivities === 0 ? (
                                <span className="text-on-surface-variant/80">Sin actividades aún</span>
                            ) : nextActivity ? (
                                <div className="flex items-center gap-2 text-on-surface-variant">
                                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                    <span className="truncate">
                                        Sigue: {nextActivity.title}
                                        {nextActivity.time ? ` · ${nextActivity.time}` : ""}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-on-secondary-container">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Todo el día completado</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pills RSVP (todas a nivel familia) */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-secondary-container"></span>
                    Confirmadas ({confirmedFamilies})
                </div>
                <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
                    Pendientes ({pendingFamilies})
                </div>
                <div className="bg-outline-variant/20 text-on-surface-variant px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                    Rechazadas ({declinedFamilies})
                </div>
                {deadlineLabel && (
                    <div className="ml-auto text-xs text-on-surface-variant font-sans tracking-wide">
                        Cierre RSVP: <span className="font-medium text-on-surface">{deadlineLabel}</span>
                    </div>
                )}
            </div>

            {/* Dos columnas: confirmaciones recientes + tareas próximas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Confirmaciones recientes (familias) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif italic text-2xl text-primary">Confirmaciones recientes</h2>
                    </div>

                    <div className="space-y-3">
                        {recentConfirmedFamilies.length === 0 ? (
                            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm text-on-surface-variant text-sm">
                                Aún no hay confirmaciones.
                            </div>
                        ) : (
                            recentConfirmedFamilies.map((f) => {
                                const familyUsers = users.filter((u) => u.familyId === f.id);
                                const confirmedCount = familyUsers.filter((u) => u.isConfirmed).length;
                                return (
                                    <div
                                        key={f.id}
                                        className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_4px_20px_rgba(81,68,67,0.03)] flex items-center justify-between hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-surface-container-low text-primary flex items-center justify-center font-serif text-lg flex-shrink-0">
                                                {f.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-on-surface truncate">{f.name}</p>
                                                <p className="text-xs text-on-surface-variant mt-0.5">
                                                    {confirmedCount} de {familyUsers.length} asisten
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-medium flex-shrink-0">
                                            Confirmada
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <Link
                            href="/admin/guests"
                            className="w-full py-4 text-xs tracking-widest font-medium text-primary uppercase hover:text-primary/70 transition-colors flex items-center justify-center gap-1 mt-2"
                        >
                            Ver todos los invitados <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Tareas próximas (sistema real) */}
                {canReadTasks && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-serif italic text-2xl text-primary">Tareas próximas</h2>
                        </div>

                        <div className="space-y-3">
                            {upcomingTasks.length === 0 ? (
                                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm text-on-surface-variant text-sm">
                                    No hay tareas pendientes. ¡Todo al día!
                                </div>
                            ) : (
                                upcomingTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_4px_20px_rgba(81,68,67,0.03)] flex gap-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-surface flex-shrink-0 flex items-center justify-center shadow-sm">
                                            <ListTodo className="w-5 h-5 text-primary opacity-60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-on-surface mb-1 truncate">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <span className="inline-block bg-surface px-3 py-1 rounded-full text-xs font-medium text-primary shadow-sm">
                                                {formatDueDate(task.dueDate)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            <Link
                                href="/admin/tasks"
                                className="w-full py-4 text-xs tracking-widest font-medium text-primary uppercase hover:text-primary/70 transition-colors flex items-center justify-center gap-1 mt-2"
                            >
                                Ver todas las tareas <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">David & Rocio · 03 de Abril, 2026</p>
            </div>
        </div>
    );
}
