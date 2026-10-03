import { auth } from "@/auth";
import { cachedFamilies, cachedUsers, getRsvpDeadline } from "@/lib/data";
import RsvpForm from "./_components/RsvpForm";
import ReadOnlyRsvp from "./_components/ReadOnlyRsvp";
import MyTableCard from "./_components/MyTableCard";
import EventDetails from "./_components/EventDetails";
import { Sprig } from "@/components/Monogram";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    const familyId = session?.user?.familyId;

    if (!familyId) {
        return (
            <div className="bg-surface-container-lowest p-8 rounded-3xl text-center space-y-3 shadow-[0_4px_24px_rgba(81,68,67,0.06)]">
                <h1 className="text-3xl font-serif italic text-primary">Aún no estás en ninguna invitación</h1>
                <p className="text-on-surface-variant">Escríbeles a David o Rocío para que vinculen tu correo a tu familia.</p>
            </div>
        )
    }

    // Todo desde caché y en paralelo: antes eran 4 consultas seguidas (~160 ms cada una).
    const [allFamilies, allUsers, deadline] = await Promise.all([cachedFamilies(), cachedUsers(), getRsvpDeadline()]);
    const family = allFamilies.find((f) => f.id === familyId);
    const familyMembers = allUsers.filter((u) => u.familyId === familyId);

    if (!family) {
        return <p className="text-on-surface-variant">No encontramos tu invitación. Escríbeles a David o Rocío.</p>;
    }

    const now = new Date();
    const isPastDeadline = deadline ? now > deadline : false;
    const hasResponded = family.globalRsvpStatus !== 'PENDING';
    const isLocked = hasResponded;
    const isLockedHard = hasResponded && isPastDeadline;

    let delegate: { name: string; lastName: string; email: string | null } | null = null;
    if (family.delegateUserId) {
        const delegateUser = allUsers.find((u) => u.id === family.delegateUserId);
        if (delegateUser) {
            delegate = {
                name: delegateUser.name,
                lastName: delegateUser.lastName,
                email: delegateUser.email
            };
        }
    }

    const isDelegate = session?.user?.id === family.delegateUserId || session?.user?.permissions?.includes('admin.dashboard');

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <Sprig className="w-28 mx-auto text-wedding-olive" />
                <h1 className="text-5xl md:text-6xl font-serif italic text-primary leading-tight text-balance">
                    {family.name}
                </h1>
                <p className="text-on-surface-variant max-w-lg mx-auto text-base leading-relaxed text-pretty">
                    Nos hace muy felices compartir este día con ustedes.
                    {isDelegate
                        ? " Cuéntanos quiénes vendrán."
                        : ""}
                </p>
            </div>

            <section aria-label="Confirmación de asistencia" className="bg-surface-container-lowest p-6 md:p-10 rounded-3xl shadow-[0_4px_24px_rgba(81,68,67,0.06)]">
                {isDelegate ? (
                    <RsvpForm
                        family={family}
                        members={familyMembers}
                        isLocked={isLocked}
                        isLockedHard={isLockedHard}
                        deadline={deadline}
                    />
                ) : (
                    <ReadOnlyRsvp family={family} members={familyMembers} delegate={delegate} />
                )}
            </section>

            <EventDetails />

            {session?.user?.id && <MyTableCard currentUserId={session.user.id} />}
        </div>
    );
}
