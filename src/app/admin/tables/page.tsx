import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getTables } from "@/app/actions/tables";
import { getFloorPlan } from "@/app/actions/floor";
import { PageHeader } from "@/app/admin/_components/ui";
import { getFamilies, getUsers } from "@/app/actions/admin";
import { byInvitation } from "@/lib/virtual";
import TablesManager from "./_components/TablesManager";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
    const session = await auth();
    const perms = session?.user?.permissions;
    // tables.read implica families.read + users.read (ver IMPLIED_PERMS).
    if (!hasPermission(perms, "tables.read")) {
        redirect("/admin");
    }

    const [tables, allFamilies, allUsers, floor] = await Promise.all([getTables(), getFamilies(), getUsers(), getFloorPlan()]);
    // Las familias virtuales no ocupan mesa.
    const { families, users } = byInvitation(allFamilies, allUsers, false);

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <PageHeader title="Mesas" description="Toca a cada invitado para elegir su mesa (o arrástralo con el ratón). En «Plano» dibujas cada área con sus mesas, la pista, el DJ o la mesa dulce, y pruebas distintas distribuciones." />

            <TablesManager initialTables={tables} families={families} users={users} floor={floor} canWrite={hasPermission(perms, "tables.write")} />
        </div>
    );
}
