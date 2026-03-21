import { db } from "@/db";
import { families, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
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

    const isMainGuest = session.user?.role === "MAIN_GUEST" || session.user?.role === "ADMIN";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-center space-y-4 mb-10">
                <span className="text-wedding-blush text-sm font-semibold tracking-widest uppercase">Tu Invitación</span>
                <h2 className="text-4xl md:text-5xl font-serif text-wedding-olive drop-shadow-sm">
                    {family.name}
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto font-light text-lg">
                    Estamos muy felices de compartir este día tan especial con ustedes.
                    {isMainGuest 
                        ? " Por favor, confirma la asistencia de cada miembro a continuación." 
                        : " Otra persona de tu familia es responsable de confirmar tu asistencia."}
                </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg shadow-wedding-sage/5 border border-wedding-sage/10 relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-wedding-olive">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 13.5l2.5 2.5 5-5-1.5-1.5-3.5 3.5-1-1-1.5 1.5z"/>
                    </svg>
                </div>

                {isMainGuest ? (
                    <RsvpForm family={family} members={familyMembers} />
                ) : (
                    <ReadOnlyRsvp family={family} members={familyMembers} />
                )}
            </div>
        </div>
    );
}
