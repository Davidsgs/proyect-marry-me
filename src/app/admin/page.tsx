import { getFamilies, getUsers } from "@/app/actions/admin";
import { CheckCircle2, ChevronRight, CheckSquare } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const families = await getFamilies();
    const users = await getUsers();

    // Stats calculations
    const totalUsers = users.length;
    const confirmedUsers = users.filter((u) => u.isConfirmed).length;
    const pendingUsers = totalUsers - confirmedUsers;

    const declinedFamilies = families.filter((f) => f.globalRsvpStatus === "DECLINED").length;

    // Progress calculation
    const confirmationProgress = totalUsers > 0 ? Math.round((confirmedUsers / totalUsers) * 100) : 0;

    // Recent confirmations mock (we can slice the real users that are confirmed)
    const recentConfirmed = users.filter((u) => u.isConfirmed).slice(0, 4);

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif italic text-primary drop-shadow-sm">
                        Estadísticas de tu Boda
                    </h1>
                    <p className="text-on-surface-variant font-sans text-sm tracking-wide mt-2">
                        Bienvenida de nuevo, Sarah. Aquí tienes un resumen del progreso de tu gran día.
                    </p>
                </div>
                <div>
                    <Link href="/admin/guests#users" className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md font-sans text-sm font-medium">
                        Agregar Invitado
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Guests Card */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                    <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium mb-4">Total Guests</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-serif text-primary">{totalUsers}</span>
                    </div>
                    {/* Fake progress bar to match image */}
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden mt-auto">
                        <div className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `100%` }}></div>
                    </div>
                </div>

                {/* RSVP Progress Card */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                    <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium mb-4">Rsvp Progress</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-serif text-primary">{confirmationProgress}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-auto text-sm text-on-surface-variant font-medium">
                        <CheckCircle2 className="w-4 h-4 text-on-secondary-container" />
                        <span>{confirmedUsers} confirmed of {totalUsers}</span>
                    </div>
                </div>

                {/* Budget Overview Card */}
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col justify-between">
                    <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium mb-4">Budget Overview</p>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-serif text-primary">$12,500</span>
                    </div>
                    <div className="mt-auto text-sm text-on-surface-variant font-medium">
                        <span>42% of total target budget</span>
                    </div>
                </div>
            </div>

            {/* Pills Row */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-secondary-container"></span>
                    Confirmed ({confirmedUsers})
                </div>
                <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
                    Pending ({pendingUsers})
                </div>
                <div className="bg-outline-variant/20 text-on-surface-variant px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                    Declined ({declinedFamilies})
                </div>
            </div>

            {/* Main Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Confirmaciones Recientes */}
                <div className="space-y-4">
                    <h2 className="font-serif italic text-2xl text-primary mb-6">Confirmaciones Recientes</h2>

                    <div className="space-y-3">
                        {recentConfirmed.length === 0 ? (
                            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm text-on-surface-variant text-sm">
                                No hay confirmaciones aún.
                            </div>
                        ) : (
                            recentConfirmed.map((u) => (
                                <div key={u.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_4px_20px_rgba(81,68,67,0.03)] flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-container-low text-primary flex items-center justify-center font-serif text-lg">
                                            {u.name.charAt(0)}{u.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-on-surface">{u.name} {u.lastName}</p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">{u.role}</p>
                                        </div>
                                    </div>
                                    <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-medium">
                                        CONFIRMED
                                    </div>
                                </div>
                            ))
                        )}
                        {recentConfirmed.length > 0 && (
                            <Link href="/admin/guests" className="w-full py-4 text-xs tracking-widest font-medium text-primary uppercase hover:text-primary/70 transition-colors flex items-center justify-center gap-1 mt-2">
                                Ver todos los invitados <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                    <h2 className="font-serif italic text-2xl text-primary mb-6">Próximos Pasos</h2>

                    <div className="space-y-3">
                        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_4px_20px_rgba(81,68,67,0.03)] flex gap-4 hover:shadow-md transition-shadow border-none">
                            <div className="w-12 h-12 rounded-2xl bg-surface flex-shrink-0 flex items-center justify-center border-none shadow-sm">
                                <CheckSquare className="w-5 h-5 text-primary opacity-60" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-on-surface mb-1">Prueba de selección de Menú</h4>
                                <p className="text-sm text-on-surface-variant mb-3">Terminar de definir los menús.</p>
                                <span className="inline-block bg-surface px-3 py-1 rounded-full text-xs font-medium text-primary border-none shadow-sm">
                                    MAY 15
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_4px_20px_rgba(81,68,67,0.03)] flex gap-4 hover:shadow-md transition-shadow border-none">
                            <div className="w-12 h-12 rounded-2xl bg-surface flex-shrink-0 flex items-center justify-center border-none shadow-sm">
                                <CheckSquare className="w-5 h-5 text-primary opacity-60" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-on-surface mb-1">Confirmar Invitaciones</h4>
                                <p className="text-sm text-on-surface-variant mb-3">Confirmar las invitaciones a los invitados. </p>
                                <span className="inline-block bg-surface px-3 py-1 rounded-full text-xs font-medium text-primary border-none shadow-sm">
                                    JUNE 02
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_4px_20px_rgba(81,68,67,0.03)] flex gap-4 hover:shadow-md transition-shadow border-none">
                            <div className="w-12 h-12 rounded-2xl bg-surface flex-shrink-0 flex items-center justify-center border-none shadow-sm">
                                <CheckSquare className="w-5 h-5 text-primary opacity-60" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-on-surface mb-1">Pago total del lugar</h4>
                                <p className="text-sm text-on-surface-variant mb-3">Enviar el pago final al lugar.</p>
                                <span className="inline-block bg-surface px-3 py-1 rounded-full text-xs font-medium text-primary border-none shadow-sm">
                                    JULY 10
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer mark */}
            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">David y Rocio • Nuestra Boda</p>
            </div>
        </div>
    );
}
