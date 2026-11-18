import { auth } from "@/auth";
import { cachedConfig, cachedFamilies } from "@/lib/data";
import { LIVE_STREAM_KEY } from "@/lib/virtual";
import { Sprig } from "@/components/Brand";
import { BotanicalShadow } from "@/components/BotanicalShadow";
import { WEDDING_DATE_LABEL, WEDDING_TIME_LABEL, WEDDING_WEEKDAY } from "@/lib/wedding";
import { ChevronLeft, ExternalLink, Video } from "lucide-react";
import Link from "next/link";
import LocalTime from "../_components/LocalTime";

export const dynamic = "force-dynamic";

// Invitación virtual: familiares en el exterior que siguen la ceremonia en vivo.
// Llegan desde «Ver mi invitación» en la portada (o /dashboard los trae aquí).
// También la ven las familias que avisaron que no pueden venir (desde su respuesta).
// El enlace se publica en el panel (Virtuales); mientras no exista, se avisa que
// aparecerá aquí. Solo con sesión (src/proxy.ts), como el resto de la invitación.
export default async function LivePage() {
    const session = await auth();
    const [families, streamUrl] = await Promise.all([cachedFamilies(), cachedConfig(LIVE_STREAM_KEY)]);
    const family = families.find((f) => f.id === session?.user?.familyId);

    return (
        <section aria-labelledby="en-vivo" className="relative overflow-hidden flex-1">
            <BotanicalShadow variant="rama" sway className="absolute -top-10 -left-28 w-[30rem] max-w-[90vw] text-rosa-profundo/20" />
            <BotanicalShadow variant="orquidea" className="absolute top-40 -right-36 w-[30rem] max-w-[90vw] text-rosa-profundo/15" />
            <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14 text-center">
                {family && (
                    <p className="mg-rise font-serif text-2xl sm:text-3xl text-rosa-profundo text-balance">{family.name}</p>
                )}
                <h1 id="en-vivo" className="mg-mask mg-d-1 mt-2 font-serif text-6xl sm:text-7xl leading-[0.95] text-oliva-profundo text-balance">
                    Nuestra boda en vivo
                </h1>
                <Sprig className="mg-grow mg-d-4 mx-auto mt-6 text-rosa-profundo" />
                <p className="mg-rise mg-d-5 mt-5 max-w-md mx-auto text-lg leading-relaxed text-pretty">
                    Aunque no puedan estar con nosotros, queremos que nos acompañen. Desde aquí van a poder ver la ceremonia en el momento en que sucede.
                </p>

                <div className="mg-rise mg-d-7 mt-10 rounded-[2rem] bg-crema p-6 sm:p-10 shadow-md flex flex-col items-center gap-5">
                    <div>
                        <p className="font-serif text-3xl sm:text-4xl text-oliva-profundo">{WEDDING_WEEKDAY} {WEDDING_DATE_LABEL}</p>
                        <p className="mt-2 text-base">
                            La ceremonia empieza a las <span className="font-semibold">{WEDDING_TIME_LABEL}</span> (hora de Argentina).
                        </p>
                        <LocalTime className="mt-1 text-base text-on-surface-variant" />
                    </div>

                    {streamUrl ? (
                        <a
                            href={streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2.5 min-h-14 px-8 rounded-full bg-primary text-on-primary font-sans font-medium text-base shadow-sm hover:bg-[#4a5745] active:scale-[0.98] transition-[background-color,transform] duration-150"
                        >
                            <Video className="w-5 h-5" aria-hidden />
                            Ver la ceremonia en vivo
                            <ExternalLink className="w-4 h-4 opacity-80" aria-hidden />
                            <span className="sr-only">(se abre en otra pestaña)</span>
                        </a>
                    ) : (
                        <p className="max-w-sm rounded-2xl bg-rubor/60 px-5 py-4 text-base leading-relaxed text-pretty">
                            El enlace para ver la ceremonia se publicará aquí antes del gran día. Vuelvan a entrar ese día para verla en vivo.
                        </p>
                    )}
                </div>

                {/* Las familias presenciales llegan desde su invitación: pueden volver a ella. */}
                {family && !family.isVirtual && (
                    <Link href="/dashboard#confirmar" className="mg-rise mg-d-8 mt-6 inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl font-sans text-sm font-medium text-tinta hover:bg-crema/60 transition-colors">
                        <ChevronLeft className="w-4 h-4" aria-hidden />
                        Volver a mi invitación
                    </Link>
                )}
            </div>
        </section>
    );
}
