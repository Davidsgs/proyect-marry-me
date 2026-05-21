import { db } from "@/db";
import { families, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getRsvpDeadline } from "@/app/actions/config";
import RsvpForm from "./_components/RsvpForm";
import ReadOnlyRsvp from "./_components/ReadOnlyRsvp";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    const familyId = session?.user?.familyId;

    if (!familyId) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center space-y-4">
                <h2 className="text-2xl font-serif text-wedding-sage-darkest">Aún no estás asignado a una familia</h2>
                <p className="text-gray-600 font-light">Por favor contacta con David o Rocio para que vinculen tu usuario a una invitación.</p>
            </div>
        )
    }

    // Fetch Family and relative users
    const family = await db.select().from(families).where(eq(families.id, familyId)).get();
    const familyMembers = await db.select().from(users).where(eq(users.familyId, familyId)).all();

    if (!family) {
        return <p>Familia no encontrada.</p>;
    }

    const deadline = await getRsvpDeadline();
    const now = new Date();
    const isPastDeadline = deadline ? now > deadline : false;
    const hasResponded = family.globalRsvpStatus !== 'PENDING';
    const isLocked = hasResponded;
    const isLockedHard = hasResponded && isPastDeadline;

    let delegate: { name: string; lastName: string; email: string | null } | null = null;
    if (family.delegateUserId) {
        const delegateUser = await db.select().from(users).where(eq(users.id, family.delegateUserId)).get();
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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-center space-y-5 mb-4">
                <div className="flex items-center justify-center gap-3">
                    <span className="h-px w-10 bg-wedding-sage/60"></span>
                    <span className="text-wedding-olive/80 text-[11px] font-light tracking-[0.35em] uppercase">Tu invitación</span>
                    <span className="h-px w-10 bg-wedding-sage/60"></span>
                </div>
                <h2 className="text-5xl md:text-6xl font-serif italic text-wedding-olive leading-tight">
                    {family.name}
                </h2>
                <p className="text-wedding-olive/70 max-w-xl mx-auto font-light text-base leading-relaxed">
                    Estamos muy felices de compartir este día tan especial con ustedes.
                    {isDelegate
                        ? " Por favor, confirma la asistencia de cada miembro a continuación."
                        : " Otra persona de tu familia es responsable de confirmar tu asistencia."}
                </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-6 md:p-10 rounded-3xl shadow-[0_8px_40px_rgba(111,127,106,0.08)] border border-wedding-sage/20 relative overflow-hidden">
                {/* Botanical decorative accent */}
                <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-wedding-sage/10 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-wedding-blush/15 blur-3xl pointer-events-none"></div>

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
            </div>
        </div>
    );
}
