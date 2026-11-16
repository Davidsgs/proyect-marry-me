import { auth } from "@/auth";
import { PageHeader } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getSchedule, getScheduleLocked, getScheduleSections } from "@/app/actions/schedule";
import { cachedUsers } from "@/lib/data";
import CronogramaManager from "./_components/CronogramaManager";

export const dynamic = "force-dynamic";

export default async function CronogramaPage() {
    const session = await auth();
    const perms = session?.user?.permissions;

    if (!hasPermission(perms, "calendar.read")) {
        redirect("/admin");
    }

    const [activities, sections, locked, allUsers] = await Promise.all([getSchedule(), getScheduleSections(), getScheduleLocked(), cachedUsers()]);
    const canWrite = hasPermission(perms, "calendar.write");
    // Solo lo necesario para elegir responsables: nombre y alias, sin correos.
    const people = allUsers
        .map((u) => ({ id: u.id, name: u.fullname || `${u.name} ${u.lastName}`.trim(), alias: u.alias }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <PageHeader title="Cronograma" description="La cronología de la boda por secciones: cada momento con su hora, sus pasos, responsables y las notas que no hay que olvidar." />

            <CronogramaManager initialActivities={activities} initialSections={sections} people={people} initialLocked={locked} canWrite={canWrite} />
        </div>
    );
}
