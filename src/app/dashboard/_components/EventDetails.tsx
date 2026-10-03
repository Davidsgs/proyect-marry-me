import { CalendarPlus, CalendarDays, MapPin, Shirt } from "lucide-react";
import { CALENDAR_URL, DRESS_CODE, VENUE, WEDDING_DATE_LABEL } from "@/lib/wedding";
import DressCodeColors from "./DressCodeColors";

// Lo que todo invitado necesita saber del día: cuándo, dónde y cómo vestirse.
export default function EventDetails() {
    return (
        <section aria-labelledby="el-dia" className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(81,68,67,0.06)] space-y-8 text-center">
            <h2 id="el-dia" className="font-serif italic text-3xl text-primary">El gran día</h2>

            <dl className="grid gap-8 sm:grid-cols-3 sm:gap-6">
                <Detail icon={CalendarDays} term="Cuándo">
                    Sábado {WEDDING_DATE_LABEL}
                    <span className="block text-sm text-on-surface-variant">Horario por confirmar</span>
                </Detail>
                <Detail icon={MapPin} term="Dónde">
                    {VENUE.address}
                    <span className="block text-sm text-on-surface-variant">{VENUE.area}</span>
                    <a
                        href={VENUE.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
                    >
                        Ver en el mapa
                    </a>
                </Detail>
                <Detail icon={Shirt} term="Vestimenta">
                    {DRESS_CODE.style}
                    <DressCodeColors />
                </Detail>
            </dl>

            <div className="flex justify-center">
            <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors text-sm font-medium"
            >
                <CalendarPlus className="w-4 h-4 text-primary" />
                Añadir a mi calendario
            </a>
            </div>
        </section>
    );
}

function Detail({ icon: Icon, term, children }: { icon: typeof MapPin; term: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="w-11 h-11 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
            </span>
            <dt className="text-sm font-medium text-on-surface-variant">{term}</dt>
            <dd className="text-base text-on-surface flex flex-col items-center">{children}</dd>
        </div>
    );
}
