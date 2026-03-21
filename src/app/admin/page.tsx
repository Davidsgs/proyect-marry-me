import { getFamilies, getUsers } from "@/app/actions/admin";
import FamilyForm from "./_components/FamilyForm";
import UserForm from "./_components/UserForm";
import FamilyList from "./_components/FamilyList";
import UserList from "./_components/UserList";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const families = await getFamilies();
    const users = await getUsers();

    return (
        <div className="space-y-12">
            <h2 className="text-4xl font-serif text-wedding-olive drop-shadow-sm border-b border-wedding-olive/20 pb-4">
                Gestión de Invitados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Families Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-sage/20 space-y-6">
                    <h3 className="text-2xl font-semibold font-serif text-wedding-sage-darkest">1. Familias</h3>
                    <p className="text-sm text-gray-500 font-sans font-light">
                        Agrega familias primero. Al agrupar invitados en familias, permites que un miembro principal (MAIN_GUEST) confirme por el resto.
                    </p>
                    <FamilyForm />
                    <FamilyList families={families} />
                </div>

                {/* Users Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-sage/20 space-y-6">
                    <h3 className="text-2xl font-semibold font-serif text-wedding-sage-darkest">2. Usuarios / Invitados</h3>
                    <p className="text-sm text-gray-500 font-sans font-light">
                        Agrega usuarios vinculándolos al correo electrónico con el que se conectan en Google, asignales un rol y una familia.
                    </p>
                    <UserForm families={families} />
                    <UserList users={users} families={families} />
                </div>
            </div>
        </div>
    );
}
