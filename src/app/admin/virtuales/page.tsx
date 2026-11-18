import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { getFamilies, getUsers } from "@/app/actions/admin";
import { PageHeader, btnGhostSm } from "@/app/admin/_components/ui";
import Link from "next/link";
import { Eye } from "lucide-react";
import { cachedConfig } from "@/lib/data";
import { LIVE_STREAM_KEY, byInvitation } from "@/lib/virtual";
import GuestsManager from "../guests/_components/GuestsManager";
import LiveStreamForm from "./_components/LiveStreamForm";

export const dynamic = "force-dynamic";

// Invitación virtual: familiares en el exterior que siguen la boda en vivo. Mismo
// manejo que Invitados (familias e integrantes), sin respuesta ni mesas, y el
// enlace de la transmisión que ven en su invitación (/dashboard/en-vivo).
export default async function VirtualGuestsPage() {
    const session = await auth();
    const perms = session?.user?.permissions;
    if (!hasPermission(perms, "families.read") || !hasPermission(perms, "users.read")) {
        redirect("/admin");
    }

    const [allFamilies, allUsers, streamUrl] = await Promise.all([getFamilies(), getUsers(), cachedConfig(LIVE_STREAM_KEY)]);
    const { families, users } = byInvitation(allFamilies, allUsers, true);
    const canWriteFamilies = hasPermission(perms, "families.write");

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <PageHeader title="Virtuales" description="Familiares en el exterior que siguen la ceremonia en vivo. No confirman asistencia, no ocupan mesa y no cuentan entre los invitados presenciales." />

            <section aria-labelledby="live-title" className="bg-surface-container-lowest p-5 sm:p-8 rounded-3xl space-y-5">
                <div>
                    <h2 id="live-title" className="font-serif text-3xl leading-display text-primary">Transmisión en vivo</h2>
                    <p className="text-sm text-on-surface-variant mt-2 text-pretty">
                        El enlace que verán las familias virtuales al abrir su invitación. Mientras esté vacío, verán que se publicará ahí antes de la ceremonia.
                    </p>
                </div>
                <LiveStreamForm initial={streamUrl ?? ""} canWrite={canWriteFamilies} />
                <Link href="/dashboard/en-vivo" className={btnGhostSm}>
                    <Eye className="w-4 h-4" aria-hidden />
                    Ver lo que ven las familias virtuales
                </Link>
            </section>

            <GuestsManager
                families={families}
                users={users}
                canWriteFamilies={canWriteFamilies}
                canWriteUsers={hasPermission(perms, "users.write")}
                virtual
            />
        </div>
    );
}
