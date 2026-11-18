import { auth } from "@/auth";
import { cachedConfig, cachedFamilies, cachedUsers, cachedWeddingParty, getRsvpDeadline } from "@/lib/data";
import { getPublicMenu } from "@/app/actions/menu";
import RsvpForm from "./_components/RsvpForm";
import ReadOnlyRsvp from "./_components/ReadOnlyRsvp";
import MyTableCard from "./_components/MyTableCard";
import { EventPlace, EventWhen } from "./_components/EventDetails";
import InvitationSteps, { type Step } from "./_components/InvitationSteps";
import OurStory from "./_components/OurStory";
import Gifts from "./_components/Gifts";
import WeddingMenu from "./_components/WeddingMenu";
import WeddingParty from "./_components/WeddingParty";
import { Arch, Sprig } from "@/components/Brand";
import { BotanicalShadow } from "@/components/BotanicalShadow";
import { DRESS_CODE, SUPPORT_EMAIL, VENUE, WEDDING_DATE_LABEL, WEDDING_TIME_LABEL, WEDDING_WEEKDAY, daysUntilWedding } from "@/lib/wedding";
import { CalendarClock, CalendarHeart, Hourglass, MapPin, Shirt } from "lucide-react";
import { redirect } from "next/navigation";

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
    // Invitación virtual (familiares en el exterior): su invitación es la transmisión en vivo.
    if (family.isVirtual) redirect("/dashboard/en-vivo");

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
    // Lo esencial de un vistazo, bajo el saludo; cada dato lleva a su paso del carrusel.
    // Delegado sin responder y con plazo: el primer dato es el plazo y lleva a la confirmación.
    const answerBy = isDelegate && !hasResponded && deadline && !isPastDeadline
        ? [{ icon: CalendarClock, text: `Responde antes del ${deadline.toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}`, href: "#confirmar" }]
        : [];
    const facts: { icon: typeof CalendarHeart; text: string; href: string }[] = [
        ...answerBy,
        { icon: CalendarHeart, text: `${WEDDING_WEEKDAY} ${WEDDING_DATE_LABEL.replace(/ de \d{4}$/, "")} · ${WEDDING_TIME_LABEL}`, href: "#dia" },
        ...(daysLeft > 0 ? [{ icon: Hourglass, text: daysLeft === 1 ? "¡Es mañana!" : `Faltan ${daysLeft} días`, href: "#dia" }] : []),
        { icon: MapPin, text: VENUE.address.split(" · ").pop() ?? VENUE.address, href: "#lugar" },
        { icon: Shirt, text: DRESS_CODE.style, href: "#lugar" },
    ];

    // Las secciones opcionales (sin datos cargados en Ajustes) no son un paso.
    // Mismas lecturas en caché que usan los componentes: no suman consultas.
    const [giftAlias, giftCbu, story, party, menu] = await Promise.all([
        cachedConfig("gift_alias"), cachedConfig("gift_cbu"), cachedConfig("story"), cachedWeddingParty(), getPublicMenu(),
    ]);
    const userId = session?.user?.id;

    const steps: Step[] = [
        {
            id: "inicio",
            label: "Bienvenida",
            content: (
                <section className="relative overflow-hidden">
                    <BotanicalShadow variant="rama" sway className="absolute -top-10 -left-28 w-[30rem] max-w-[90vw] text-rosa-profundo/20" />
                    <BotanicalShadow variant="orquidea" className="absolute top-40 -right-36 w-[30rem] max-w-[90vw] text-rosa-profundo/15" />
                    <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14 short:py-6 text-center">
                        <h1 className="mg-mask mg-d-1 font-serif text-6xl sm:text-7xl leading-[0.95] text-oliva-profundo text-balance">
                            {family.name}
                        </h1>
                        <Sprig className="mg-grow mg-d-4 mx-auto mt-6 text-rosa-profundo" />
                        <p className="mg-rise mg-d-5 mt-5 max-w-md mx-auto text-lg leading-relaxed text-pretty">
                            Nos hace muy felices compartir este día con ustedes.
                            {isDelegate ? " Cuéntanos quiénes vendrán." : ""}
                        </p>
                        <ul aria-label="Lo esencial" className="mt-7 flex flex-wrap justify-center gap-2">
                            {facts.map(({ icon: Icon, text, href }, i) => (
                                <li key={text} className="mg-pop" style={{ "--d": 7 + i } as React.CSSProperties}>
                                    <a href={href} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-crema/70 font-sans text-sm font-medium text-tinta hover:bg-crema transition-colors">
                                        <Icon className="w-4 h-4 text-rosa-profundo shrink-0" aria-hidden />
                                        {text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            ),
        },
        {
            id: "confirmar",
            label: "Tu respuesta",
            content: (
                <section aria-label="Confirmación de asistencia">
                    <div className="mx-auto max-w-2xl lg:max-w-5xl px-4 sm:px-6 py-6 lg:py-4 short:py-2">
                        <div className="mg-rise rounded-[2rem] bg-crema p-6 sm:p-10 lg:p-8 short:p-6 shadow-md">
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
                        </div>
                    </div>
                </section>
            ),
        },
        { id: "dia", label: "El gran día", content: <EventWhen /> },
        { id: "lugar", label: "Lugar y vestimenta", content: <EventPlace /> },
        ...(userId ? [{ id: "mesa", label: "Tu mesa", content: <MyTableCard currentUserId={userId} /> }] : []),
        ...(menu.length > 0 ? [{ id: "menu", label: "Menú", content: <WeddingMenu /> }] : []),
        ...(giftAlias || giftCbu ? [{ id: "regalos", label: "Regalos", content: <Gifts /> }] : []),
        ...(story?.trim() ? [{ id: "historia", label: "Nuestra historia", content: <OurStory /> }] : []),
        ...(party.length > 0 ? [{ id: "cortejo", label: "Nuestro cortejo", content: <WeddingParty /> }] : []),
    ];

    return <InvitationSteps steps={steps} />;
}
