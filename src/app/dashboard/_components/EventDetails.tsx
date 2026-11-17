import { Ban, CalendarPlus, Clock, DoorClosed, Hourglass, MapPin, Navigation, Shirt } from "lucide-react";
import { ARRIVAL_TOLERANCE_MIN, CALENDAR_URL, DRESS_CODE, VENUE, WEDDING_DATE_LABEL, WEDDING_TIME_LABEL, WEDDING_WEEKDAY, daysUntilWedding, type AvoidColor } from "@/lib/wedding";
import { BotanicalShadow } from "@/components/BotanicalShadow";

// Lo que todo invitado necesita saber del día, en dos pasos del carrusel:
// «El gran día» (cuándo) y «Lugar y vestimenta». Campo oliva de lado a lado;
// todo el texto en crema (5.5:1). En escritorio, dos columnas para que cada
// paso entre en la pantalla sin scroll.
const field = "relative overflow-hidden bg-oliva-profundo text-crema text-center";
const label = "flex items-center justify-center gap-2 text-sm font-medium";
const creamBtn = "inline-flex items-center gap-2 min-h-12 px-5 rounded-xl bg-crema font-sans text-sm font-medium text-tinta hover:bg-surface-container-lowest active:scale-[0.98] transition-[background-color,transform] duration-150";

export function EventWhen() {
    const [day, ...rest] = WEDDING_DATE_LABEL.split(" de ");
    const daysLeft = daysUntilWedding();
    return (
        <section aria-labelledby="el-dia" className={field}>
            <BotanicalShadow variant="espiga" sway className="absolute -right-24 -bottom-16 w-[28rem] max-w-[80vw] text-tinta/30" />
            <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 lg:py-10 short:py-6">
                <h2 id="el-dia" className="mg-mask font-serif text-5xl sm:text-6xl short:text-5xl leading-display">El gran día</h2>

                <div className="mt-8 short:mt-5 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                    {/* Cuándo: fecha enorme, lo primero que se busca */}
                    <div className="flex flex-col items-center">
                        <p className="font-serif leading-[0.9]">
                            <span className="mg-rise mg-d-1 block text-sm font-sans font-medium mb-3">{WEDDING_WEEKDAY}</span>
                            <span className="mg-pop mg-d-2 block text-9xl sm:text-[10rem] short:text-[8rem] tabular-nums">{day}</span>
                            <span className="mg-mask mg-d-4 block mt-2 text-4xl sm:text-5xl short:text-4xl leading-display">de {rest.join(" de ")}</span>
                        </p>
                        <span aria-hidden className="mg-grow mg-d-5 mt-6 h-0.5 w-16 rounded-full bg-crema/50" />
                        <p className="mg-rise mg-d-6 mt-5 inline-flex items-center gap-2 font-serif text-3xl sm:text-4xl">
                            <Clock className="w-6 h-6" aria-hidden />
                            <span className="tabular-nums">{WEDDING_TIME_LABEL}</span>
                        </p>
                        <p className="mg-rise mg-d-7 mt-1 font-text text-base">Hora de Argentina</p>
                    </div>

                    <div className="flex flex-col items-center">
                        {daysLeft > 0 && (
                            <p className="mg-pop mg-d-6 inline-flex items-center gap-1.5 rounded-full bg-crema/15 px-4 py-1.5 text-sm font-medium">
                                <Hourglass className="w-4 h-4" aria-hidden />
                                {daysLeft === 1 ? "¡Es mañana!" : <>Faltan <span className="tabular-nums">{daysLeft}</span> días</>}
                            </p>
                        )}

                        {/* Puntualidad: la puerta se cierra al empezar la ceremonia. */}
                        <div className="mg-rise mg-d-8 mt-6 flex flex-col items-center gap-2 rounded-2xl bg-crema/15 px-5 py-4 max-w-md">
                            <DoorClosed className="w-6 h-6" aria-hidden />
                            <p className="font-text text-base font-medium">Llega con tiempo</p>
                            <p className="font-text text-base leading-loose">
                                La ceremonia empieza a las <mark className="hl mg-mark mg-d-9 tabular-nums">{WEDDING_TIME_LABEL}</mark> y solo habrá{" "}
                                <mark className="hl mg-mark mg-d-11">{ARRIVAL_TOLERANCE_MIN} minutos de tolerancia</mark>. Una vez empezada,{" "}
                                <mark className="hl mg-mark mg-d-13">la puerta se cierra</mark> y vuelve a abrirse recién para la fiesta.
                            </p>
                        </div>

                        <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer" className={`mg-rise mg-d-9 mt-6 ${creamBtn}`}>
                            <CalendarPlus className="w-4 h-4" aria-hidden />
                            Añadir a mi calendario
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function EventPlace() {
    return (
        <section aria-labelledby="el-lugar" className={field}>
            <BotanicalShadow variant="rama" sway className="absolute -left-24 -top-16 w-[26rem] max-w-[80vw] text-tinta/30" />
            <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 lg:py-10 short:py-6">
                <h2 id="el-lugar" className="sr-only">Lugar y vestimenta</h2>
                <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
                    <div className="flex flex-col items-center">
                        <h3 className={`mg-rise ${label}`}><MapPin className="w-4 h-4" aria-hidden /> Dónde</h3>
                        <p className="mg-mask mg-d-1 mt-2 font-serif text-4xl sm:text-5xl leading-display text-balance">{VENUE.address}</p>
                        <p className="mg-rise mg-d-3 mt-2 font-text text-base">{VENUE.area}</p>
                        <a href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer" className={`mg-rise mg-d-4 mt-5 ${creamBtn}`}>
                            <Navigation className="w-4 h-4" aria-hidden />
                            Cómo llegar
                        </a>
                    </div>

                    <div className="flex flex-col items-center">
                        <h3 className={`mg-rise mg-d-3 ${label}`}><Shirt className="w-4 h-4" aria-hidden /> Vestimenta</h3>
                        <p className="mg-mask mg-d-4 mt-2 font-serif text-4xl sm:text-5xl leading-display">{DRESS_CODE.style}</p>

                        {/* Colores prohibidos: tachados y con «No usar» escrito, para que no se lean como paleta sugerida. */}
                        <div className="mg-rise mg-d-5 mt-6 short:mt-4 w-full max-w-md lg:max-w-lg rounded-3xl bg-crema text-tinta px-5 py-6 sm:px-8 short:py-5 shadow-sm">
                            <Ban className="mg-pop mg-d-7 mx-auto w-7 h-7 text-rosa-profundo" aria-hidden />
                            <p className="mt-2 font-serif text-2xl sm:text-3xl leading-display text-rosa-profundo text-balance">
                                Colores que no deben usarse
                            </p>
                            <p className="mt-2 font-text text-base text-pretty">
                                Están reservados para la decoración y los novios. Por favor, no vengas vestido de estos colores.
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-5">
                                <SwatchRow who="Mujeres" colors={DRESS_CODE.women} from={8} />
                                <SwatchRow who="Varones" colors={DRESS_CODE.men} from={8 + DRESS_CODE.women.length} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Retraso escalonado de cada muestra (clase literal para que Tailwind la genere).
const DELAY = ["mg-d-8", "mg-d-9", "mg-d-10", "mg-d-11", "mg-d-12", "mg-d-13"];

function SwatchRow({ who, colors, from }: { who: string; colors: AvoidColor[]; from: number }) {
    return (
        <div>
            <p className="text-sm font-medium">{who}: no usar</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-4">
                {colors.map((c, i) => {
                    const d = DELAY[Math.min(from - 8 + i, DELAY.length - 1)];
                    return (
                        <li key={c.hex} className="w-20 flex flex-col items-center">
                            {/* Muestra tachada con una diagonal, como una señal de prohibido: la línea se dibuja al entrar. */}
                            <span
                                className={`mg-pop ${d} relative block w-16 h-16 rounded-full ring-1 ring-inset ring-outline-variant overflow-hidden`}
                                style={{ backgroundColor: c.hex }}
                                aria-hidden
                            >
                                <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full">
                                    <line className={`mg-draw ${d}`} x1="10" y1="54" x2="54" y2="10" stroke="var(--color-crema)" strokeWidth="9" strokeLinecap="round" style={{ "--len": 64 } as React.CSSProperties} />
                                    <line className={`mg-draw ${d}`} x1="10" y1="54" x2="54" y2="10" stroke="var(--color-rosa-profundo)" strokeWidth="4.5" strokeLinecap="round" style={{ "--len": 64 } as React.CSSProperties} />
                                </svg>
                            </span>
                            <span className="mt-2 text-sm font-medium">{c.name}</span>
                            <span className="text-xs font-medium text-rosa-profundo">No usar</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
