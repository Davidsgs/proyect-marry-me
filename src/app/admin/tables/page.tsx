import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getTables } from "@/app/actions/tables";
import { PageHeader } from "@/app/admin/_components/ui";
import { getFamilies, getUsers } from "@/app/actions/admin";
import TablesManager from "./_components/TablesManager";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
    const session = await auth();
    const perms = session?.user?.permissions;
    // tables.read implica families.read + users.read (ver IMPLIED_PERMS).
    if (!hasPermission(perms, "tables.read")) {
        redirect("/admin");
    }

    const [tables, families, users] = await Promise.all([getTables(), getFamilies(), getUsers()]);

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <PageHeader title="Mesas" description="Arrastra a cada invitado a su mesa o elige la mesa junto a su nombre. Los cambios se guardan solos y el invitado los ve en su panel." />

            <TablesManager initialTables={tables} families={families} users={users} canWrite={hasPermission(perms, "tables.write")} />
        </div>
    );
}
