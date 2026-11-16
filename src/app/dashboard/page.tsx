import { auth } from "@/auth";
import { cachedConfig, cachedFamilies, cachedUsers, getRsvpDeadline } from "@/lib/data";
import RsvpForm from "./_components/RsvpForm";
import ReadOnlyRsvp from "./_components/ReadOnlyRsvp";
import MyTableCard from "./_components/MyTableCard";
import EventDetails from "./_components/EventDetails";
import OurStory from "./_components/OurStory";
import Gifts from "./_components/Gifts";
import WeddingMenu from "./_components/WeddingMenu";
import WeddingParty from "./_components/WeddingParty";
import { Arch } from "@/components/Brand";
import { BotanicalShadow } from "@/components/BotanicalShadow";
import { DRESS_CODE, SUPPORT_EMAIL, VENUE, WEDDING_DATE_LABEL, WEDDING_WEEKDAY, daysUntilWedding } from "@/lib/wedding";
import { CalendarClock, CalendarHeart, Hourglass, MapPin, Shirt } from "lucide-react";

export const dynamic = 'force-dynamic';

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="px-4 py-16">
            <Arch className="mx-auto max-w-md" innerClassName="text-center space-y-4">
                <h1 className="font-serif text-4xl leading-tight text-oliva-profundo text-balance">{title}</h1>
                <p className="text-base leading-relaxed">{children}</p>
            </Arch>
        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth();
    const familyId = session?.user?.familyId;
    const help = <>Escríbenos a <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> y lo resolvemos.</>;

    if (!familyId) {
        return <Notice title="Aún no estás en ninguna invitación">Tu correo todavía no está vinculado a tu familia. {help}</Notice>;
    }

    // Todo desde caché y en paralelo: antes eran 4 consultas seguidas (~160 ms cada una).
    const [allFamilies, allUsers, deadline, adultsNote] = await Promise.all([cachedFamilies(), cachedUsers(), getRsvpDeadline(), cachedConfig("adults_note")]);
    const family = allFamilies.find((f) => f.id === familyId);
    const familyMembers = allUsers.filter((u) => u.familyId === familyId);

    if (!family) {
        return <Notice title="No encontramos tu invitación">{help}</Notice>;
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
    const daysLeft = daysUntilWedding();
    // Lo esencial de un vistazo, bajo el saludo; cada dato lleva a «El gran día».
    // Delegado sin responder y con plazo: el primer dato es el plazo y lleva a la confirmación.
    const answerBy = isDelegate && !hasResponded && deadline && !isPastDeadline
        ? [{ icon: CalendarClock, text: `Responde antes del ${deadline.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`, href: "#confirmar" }]
        : [];
    const facts: { icon: typeof CalendarHeart; text: string; href?: string }[] = [
        ...answerBy,
        { icon: CalendarHeart, text: `${WEDDING_WEEKDAY} ${WEDDING_DATE_LABEL.replace(/ de \d{4}$/, "")}` },
        ...(daysLeft > 0 ? [{ icon: Hourglass, text: daysLeft === 1 ? "¡Es mañana!" : `Faltan ${daysLeft} días` }] : []),
        { icon: MapPin, text: VENUE.address.split(" · ").pop() ?? VENUE.address },
        { icon: Shirt, text: DRESS_CODE.style },
    ];

    return (
        <>
            {/* Saludo + confirmación: el foco de la página, sobre el campo rubor */}
            <section className="relative overflow-hidden pb-16 sm:pb-24">
                <BotanicalShadow variant="rama" sway className="absolute -top-10 -left-28 w-[30rem] max-w-[90vw] text-rosa-profundo/20" />
                <BotanicalShadow variant="orquidea" className="absolute top-40 -right-36 w-[30rem] max-w-[90vw] text-rosa-profundo/15" />

                <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
                    <div className="pt-10 sm:pt-14 text-center animate-rise">
                        <h1 className="font-serif text-6xl sm:text-7xl leading-[0.95] text-oliva-profundo text-balance">
                            {family.name}
                        </h1>
                        <p className="mt-5 max-w-md mx-auto text-lg leading-relaxed text-pretty">
                            Nos hace muy felices compartir este día con ustedes.
                            {isDelegate ? " Cuéntanos quiénes vendrán." : ""}
                        </p>
                        <ul aria-label="Lo esencial" className="mt-7 flex flex-wrap justify-center gap-2 animate-rise [animation-delay:80ms]">
                            {facts.map(({ icon: Icon, text, href }) => (
                                <li key={text}>
                                    <a href={href ?? "#el-dia"} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-crema/70 font-sans text-sm font-medium text-tinta hover:bg-crema transition-colors">
                                        <Icon className="w-4 h-4 text-rosa-profundo shrink-0" aria-hidden />
                                        {text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <section
                        id="confirmar"
                        aria-label="Confirmación de asistencia"
                        className="mt-10 sm:mt-14 rounded-[2rem] bg-crema p-6 sm:p-10 shadow-md animate-rise [animation-delay:120ms]"
                    >
                        {isDelegate ? (
                            <RsvpForm
                                family={family}
                                members={familyMembers}
                                isLocked={isLocked}
                                isLockedHard={isLockedHard}
                                deadline={deadline}
                                adultsNote={adultsNote}
                            />
                        ) : (
                            <ReadOnlyRsvp family={family} members={familyMembers} delegate={delegate} adultsNote={adultsNote} />
                        )}
                    </section>
                </div>
            </section>

            <EventDetails />

            {session?.user?.id && <MyTableCard currentUserId={session.user.id} />}

            <WeddingMenu />

            <OurStory />

            <WeddingParty />

            <Gifts />
        </>
    );
}
