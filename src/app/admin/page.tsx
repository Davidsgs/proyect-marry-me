import { getFamilies, getUsers } from "@/app/actions/admin";
import FamilyForm from "./_components/FamilyForm";
import UserForm from "./_components/UserForm";
import FamilyList from "./_components/FamilyList";
import UserList from "./_components/UserList";
import { Users, CheckCircle2, Clock, XCircle, HeartHandshake, CheckSquare } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const families = await getFamilies();
    const users = await getUsers();

    // Stats calculations
    const totalUsers = users.length;
    const confirmedUsers = users.filter((u) => u.isConfirmed).length;
    
    const totalFamilies = families.length;
    const confirmedFamilies = families.filter((f) => f.globalRsvpStatus === "CONFIRMED").length;
    const pendingFamilies = families.filter((f) => f.globalRsvpStatus === "PENDING").length;
    const declinedFamilies = families.filter((f) => f.globalRsvpStatus === "DECLINED").length;
    
    // Progress calculation
    const confirmationProgress = totalUsers > 0 ? Math.round((confirmedUsers / totalUsers) * 100) : 0;
    const familyProgress = totalFamilies > 0 ? Math.round(((confirmedFamilies + declinedFamilies) / totalFamilies) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-wedding-sage-darkest drop-shadow-sm">
                        Dashboard
                    </h1>
                    <p className="text-wedding-sage-dark font-sans text-sm tracking-wide mt-1">
                        Resumen de la planificación y estadísticas de tu boda
                    </p>
                </div>
                {/* Add actions */}
                <div className="flex gap-3">
                    <a href="#families" className="flex items-center gap-2 bg-wedding-olive hover:bg-wedding-sage-darkest text-wedding-cream px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg font-sans text-sm tracking-widest uppercase font-medium">
                        Agregar Familia
                    </a>
                </div>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Main Status / Confirmed Users Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-wedding-olive/10 flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-wedding-sage-dark font-sans text-sm tracking-widest uppercase font-medium">Estado General</p>
                            <h3 className="text-3xl font-serif text-wedding-sage-darkest mt-1">Confirmaciones individuales</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-wedding-olive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-wedding-olive" />
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-serif text-wedding-sage-darkest">{confirmedUsers}</span>
                                <span className="text-wedding-sage-dark font-sans">/ {totalUsers} invitados</span>
                            </div>
                            <span className="text-wedding-olive font-medium font-sans text-lg">{confirmationProgress}%</span>
                        </div>
                        <div className="w-full bg-wedding-cream rounded-full h-3 overflow-hidden border border-wedding-olive/5">
                            <div className="bg-wedding-olive h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${confirmationProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Families Confirmed Card */}
                <div className="bg-wedding-olive text-wedding-cream p-6 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-5 h-5 text-wedding-cream" />
                        </div>
                        <h3 className="text-4xl font-serif mb-1">{confirmedFamilies}</h3>
                        <p className="text-white/80 font-sans text-sm tracking-wide">Familias Confirmadas</p>
                    </div>
                </div>

                {/* Families Pending Card */}
                <div className="bg-wedding-sage-light/20 p-6 rounded-[2rem] border border-wedding-sage-light/30 shadow-sm flex flex-col justify-between group hover:bg-wedding-sage-light/30 transition-colors">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-wedding-sage/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5 text-wedding-sage-darkest" />
                        </div>
                        <h3 className="text-4xl font-serif text-wedding-sage-darkest mb-1">{pendingFamilies}</h3>
                        <p className="text-wedding-sage-dark font-sans text-sm tracking-wide">Familias Pendientes</p>
                    </div>
                </div>

                {/* Families Declined Card */}
                 <div className="bg-wedding-blush-light/30 p-6 rounded-[2rem] border border-wedding-blush/20 shadow-sm flex flex-col justify-between group hover:bg-wedding-blush-light/50 transition-colors">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-wedding-blush/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <XCircle className="w-5 h-5 text-wedding-blush-dark" />
                        </div>
                        <h3 className="text-4xl font-serif text-wedding-sage-darkest mb-1">{declinedFamilies}</h3>
                        <p className="text-wedding-sage-dark font-sans text-sm tracking-wide">Familias Canceladas</p>
                    </div>
                </div>

                {/* Total Families Progress Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-wedding-olive/10 flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-wedding-sage-dark font-sans text-sm tracking-widest uppercase font-medium">Progreso Respuestas</p>
                            <h3 className="text-2xl font-serif text-wedding-sage-darkest mt-1">Familias / Grupos</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-wedding-olive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <HeartHandshake className="w-6 h-6 text-wedding-olive" />
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-serif text-wedding-sage-darkest">{totalFamilies}</span>
                                <span className="text-wedding-sage-dark font-sans">grupos familiares</span>
                            </div>
                            <span className="text-wedding-olive font-medium font-sans text-lg">{familyProgress}%</span>
                        </div>
                        <div className="w-full bg-wedding-cream rounded-full h-3 overflow-hidden border border-wedding-olive/5">
                            <div className="bg-wedding-sage-light h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${familyProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Decorative End Card */}
                <div className="bg-wedding-cream p-6 rounded-[2rem] border border-wedding-sage/10 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden group">
                    <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                        <CheckSquare className="w-8 h-8 text-wedding-sage-light" />
                    </div>
                    <h3 className="text-xl font-serif text-wedding-sage-darkest">Gestión Centralizada</h3>
                    <p className="text-wedding-sage-dark text-sm font-sans mt-2 max-w-[12rem] mx-auto">Continúa abajo para agregar y editar la lista</p>
                </div>
            </div>

            {/* Content Lists Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-6 border-t border-wedding-olive/10">
                {/* Families Management */}
                <div id="families" className="scroll-mt-32 space-y-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-wedding-olive/10 shadow-sm">
                    <div className="border-b border-wedding-olive/10 pb-4 mb-6">
                        <h3 className="text-2xl font-serif text-wedding-sage-darkest">1. Familias</h3>
                        <p className="text-sm text-wedding-sage-dark font-sans mt-1">
                            Agrupa invitados obligatoriamente. El titular de la familia (MAIN_GUEST) podrá confirmar por los demás miembros.
                        </p>
                    </div>
                    <FamilyForm />
                    <div className="mt-8 pt-6 border-t border-wedding-cream">
                        <FamilyList families={families} />
                    </div>
                </div>

                {/* Users Management */}
                <div id="users" className="scroll-mt-32 space-y-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-wedding-olive/10 shadow-sm">
                    <div className="border-b border-wedding-olive/10 pb-4 mb-6">
                        <h3 className="text-2xl font-serif text-wedding-sage-darkest">2. Usuarios / Invitados</h3>
                        <p className="text-sm text-wedding-sage-dark font-sans mt-1">
                            Añade a los invitados vinculándolos al correo que usarán para conectar con Google y asígnales una familia.
                        </p>
                    </div>
                    <UserForm families={families} />
                    <div className="mt-8 pt-6 border-t border-wedding-cream">
                        <UserList users={users} families={families} />
                    </div>
                </div>
            </div>
        </div>
    );
}
