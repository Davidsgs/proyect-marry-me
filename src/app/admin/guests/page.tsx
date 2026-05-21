import { getFamilies, getUsers } from "@/app/actions/admin";
import GuestsManager from "./_components/GuestsManager";

export default async function GuestsPage() {
    const [families, users] = await Promise.all([getFamilies(), getUsers()]);

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center pb-4">
                <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Gestión de Invitados</h1>
                <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
                    Organiza familias e invitados, asigna delegados y controla las confirmaciones.
                </p>
            </div>

            <GuestsManager families={families} users={users} />

            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">David &amp; Rocio · 03 de Abril, 2026</p>
            </div>
        </div>
    );
}
