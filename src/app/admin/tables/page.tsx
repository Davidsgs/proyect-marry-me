import { getTables } from "@/app/actions/tables";
import { getFamilies, getUsers } from "@/app/actions/admin";
import TablesManager from "./_components/TablesManager";

export default async function TablesPage() {
    const [tables, families, users] = await Promise.all([getTables(), getFamilies(), getUsers()]);

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center pb-4">
                <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Distribución de Mesas</h1>
                <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
                    Arrastra a cada invitado a su mesa. Cada cambio se guarda al instante y lo verá el invitado en su panel.
                </p>
            </div>

            <TablesManager initialTables={tables} families={families} users={users} />

            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">David &amp; Rocio · 03 de Abril, 2026</p>
            </div>
        </div>
    );
}
