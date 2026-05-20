import { getFamilies, getUsers } from "@/app/actions/admin";
import FamilyForm from "../_components/FamilyForm";
import UserForm from "../_components/UserForm";
import FamilyList from "../_components/FamilyList";
import UserList from "../_components/UserList";

export const dynamic = 'force-dynamic';

export default async function GuestsPage() {
    const families = await getFamilies();
    const users = await getUsers();

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center pb-8 mb-4">
                <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Gestión de Invitados</h1>
                <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
                    A continuación se encuentran las herramientas para agregar y organizar a tus invitados y familias.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-16">
                {/* Families Management */}
                <div id="families" className="scroll-mt-32 space-y-6 bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)]">
                    <div className="pb-4 mb-6">
                        <h3 className="text-2xl font-serif text-primary">1. Familias</h3>
                        <p className="text-sm text-on-surface-variant font-sans mt-1">
                            Agrupa invitados obligatoriamente. El titular de la familia podrá confirmar por los demás.
                        </p>
                    </div>
                    <FamilyForm />
                    <div className="mt-8 pt-6">
                        <FamilyList families={families} users={users} />
                    </div>
                </div>

                {/* Users Management */}
                <div id="users" className="scroll-mt-32 space-y-6 bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)]">
                    <div className="pb-4 mb-6">
                        <h3 className="text-2xl font-serif text-primary">2. Invitados</h3>
                        <p className="text-sm text-on-surface-variant font-sans mt-1">
                            Añade invitados vinculándolos al correo que usarán y asígnales una familia.
                        </p>
                    </div>
                    <UserForm families={families} />
                    <div className="mt-8 pt-6">
                        <UserList users={users} families={families} />
                    </div>
                </div>
            </div>
            
            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">Ethereal Union • Handcrafted Elegance</p>
            </div>
        </div>
    );
}
