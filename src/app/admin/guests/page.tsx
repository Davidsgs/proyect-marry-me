import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getFamilies, getUsers } from "@/app/actions/admin";
import { PageHeader } from "@/app/admin/_components/ui";
import GuestsManager, { type FamilyFilter } from "./_components/GuestsManager";

export const dynamic = "force-dynamic";

// Filtros desde la URL (enlaces del Resumen): ?tab=invitados, ?filtro=sin-responder|sin-delegado
const FILTERS: Record<string, FamilyFilter> = { "sin-responder": "pending", "sin-delegado": "no-delegate" };

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ tab?: string; filtro?: string }> }) {
    const { tab, filtro } = await searchParams;
    const session = await auth();
    const perms = session?.user?.permissions;
    // La sección lee familias y personas: sin ambos permisos, las acciones fallarían.
    if (!hasPermission(perms, "families.read") || !hasPermission(perms, "users.read")) {
        redirect("/admin");
    }

    const [families, users] = await Promise.all([getFamilies(), getUsers()]);

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <PageHeader title="Invitados" description="Organiza familias e invitados, asigna delegados y controla las confirmaciones." />

            <GuestsManager
                families={families}
                users={users}
                canWriteFamilies={hasPermission(perms, "families.write")}
                canWriteUsers={hasPermission(perms, "users.write")}
                initialTab={tab === "invitados" ? "users" : "families"}
                initialFamilyFilter={FILTERS[filtro ?? ""] ?? "all"}
            />
        </div>
    );
}
