import { auth } from "@/auth";
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
            <div className="text-center pb-2">
                <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Cronograma</h1>
                <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
                    La cronología del gran día: cada momento con su hora, sus tareas y las notas que no hay que olvidar.
                </p>
            </div>

            <CronogramaManager initialActivities={activities} initialLocked={locked} canWrite={canWrite} />

            <div className="pb-16 text-center">
                <p className="font-serif italic text-primary/60 text-lg">David &amp; Rocio · 03 de Abril, 2026</p>
            </div>
        </div>
    );
}
