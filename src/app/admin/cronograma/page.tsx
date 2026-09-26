import { auth } from "@/auth";
import { PageHeader } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getSchedule, getScheduleLocked } from "@/app/actions/schedule";
import CronogramaManager from "./_components/CronogramaManager";

export const dynamic = "force-dynamic";

export default async function CronogramaPage() {
    const session = await auth();
    const perms = session?.user?.permissions;

    if (!hasPermission(perms, "calendar.read")) {
        redirect("/admin");
    }

    const activities = await getSchedule();
    const locked = await getScheduleLocked();
    const canWrite = hasPermission(perms, "calendar.write");

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <PageHeader title="Cronograma" description="La cronología del gran día: cada momento con su hora, sus tareas y las notas que no hay que olvidar." />

            <CronogramaManager initialActivities={activities} initialLocked={locked} canWrite={canWrite} />
        </div>
    );
}
