import { CalendarHeart, CalendarPlus, Clock, Hourglass, MapPin, Navigation, Shirt } from "lucide-react";
import { CALENDAR_URL, DRESS_CODE, VENUE, WEDDING_DATE_LABEL, WEDDING_WEEKDAY, daysUntilWedding, type AvoidColor } from "@/lib/wedding";
import { BotanicalShadow } from "@/components/BotanicalShadow";

// Lo que todo invitado necesita saber del día: cuándo, dónde y cómo vestirse.
// Campo oliva de lado a lado; todo el texto en crema (5.5:1).
export default function EventDetails() {
    const [day, ...rest] = WEDDING_DATE_LABEL.split(" de ");
    const daysLeft = daysUntilWedding();
    const label = "flex items-center gap-2 text-sm font-medium";
    return (
        <section aria-labelledby="el-dia" className="relative overflow-hidden bg-oliva-profundo text-crema">
            <BotanicalShadow variant="espiga" sway className="absolute -right-24 -bottom-16 w-[28rem] max-w-[80vw] text-tinta/30" />
            <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-16 sm:py-24">
                <h2 id="el-dia" className="reveal font-serif text-5xl sm:text-6xl leading-none scroll-mt-6">El gran día</h2>

                <div className="reveal mt-10 grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
                    {/* Cuándo: la fecha es lo primero que se busca */}
                    <div>
                        <h3 className={label}><CalendarHeart className="w-4 h-4" aria-hidden /> Cuándo</h3>
                        <p className="mt-2 font-serif leading-[0.9]">
                            <span className="block text-8xl sm:text-9xl">{day}</span>
                            <span className="block text-4xl sm:text-5xl">de {rest.join(" de ")}</span>
                        </p>
                        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-text text-base">
                            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" aria-hidden /> {WEDDING_WEEKDAY}. Horario por confirmar.</span>
                            {daysLeft > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-crema/15 px-3 py-1 text-sm font-medium">
                                    <Hourglass className="w-4 h-4" aria-hidden />
                                    {daysLeft === 1 ? "¡Es mañana!" : <>Faltan <span className="tabular-nums">{daysLeft}</span> días</>}
                                </span>
                            )}
                        </p>
                        <a
                            href={CALENDAR_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 inline-flex items-center gap-2 min-h-12 px-5 rounded-xl bg-crema font-sans text-sm font-medium text-tinta hover:bg-surface-container-lowest active:scale-[0.98] transition-[background-color,transform] duration-150"
                        >
                            <CalendarPlus className="w-4 h-4" aria-hidden />
                            Añadir a mi calendario
                        </a>
                    </div>

                    <div className="space-y-10">
                        <div>
                            <h3 className={label}><MapPin className="w-4 h-4" aria-hidden /> Dónde</h3>
                            <p className="mt-2 font-serif text-3xl leading-tight">{VENUE.address}</p>
                            <p className="mt-1 font-text text-base">{VENUE.area}</p>
                            <a
                                href={VENUE.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 min-h-11 font-sans text-sm font-medium underline hover:no-underline"
                            >
                                <Navigation className="w-4 h-4" aria-hidden />
                                Cómo llegar
                            </a>
                        </div>

                        <div>
                            <h3 className={label}><Shirt className="w-4 h-4" aria-hidden /> Vestimenta</h3>
                            <p className="mt-2 font-serif text-3xl leading-tight">{DRESS_CODE.style}</p>
                            <p className="mt-1 font-text text-base text-pretty">
                                Te pedimos evitar estos colores, reservados para la decoración y los novios.
                            </p>
                            <div className="mt-5 grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-4">
                                <SwatchRow who="Mujeres" colors={DRESS_CODE.women} />
                                <SwatchRow who="Varones" colors={DRESS_CODE.men} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SwatchRow({ who, colors }: { who: string; colors: AvoidColor[] }) {
    return (
        <>
            <p className="pt-2 text-sm font-medium">{who}</p>
            <ul className="flex flex-wrap gap-3">
                {colors.map((c) => (
                    // Muestra tipo polaroid (página «Logotipo» del manual) con el nombre en el pie.
                    <li key={c.hex} className="w-[4.5rem] bg-crema p-1.5 pb-0 shadow-sm">
                        <span className="block aspect-square ring-1 ring-inset ring-outline-variant" style={{ backgroundColor: c.hex }} aria-hidden />
                        <span className="block py-1 text-center text-xs font-medium text-tinta">
                            {c.name}
                            <span className="sr-only"> (no usar)</span>
                        </span>
                    </li>
                ))}
            </ul>
        </>
    );
}
