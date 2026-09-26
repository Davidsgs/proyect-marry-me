import { CalendarPlus, CalendarDays, MapPin, Shirt } from "lucide-react";
import { CALENDAR_URL, DRESS_CODE, VENUE, WEDDING_DATE_LABEL } from "@/lib/wedding";

// Lo que todo invitado necesita saber del día: cuándo, dónde y cómo vestirse.
export default function EventDetails() {
    return (
        <section aria-labelledby="el-dia" className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(81,68,67,0.06)] space-y-6">
            <h2 id="el-dia" className="font-serif italic text-3xl text-primary">El gran día</h2>

            <dl className="grid gap-5 sm:grid-cols-3">
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
                    <span className="block text-sm text-on-surface-variant">Mujeres: {DRESS_CODE.women.toLowerCase()}.</span>
                    <span className="block text-sm text-on-surface-variant">Hombres: {DRESS_CODE.men.toLowerCase()}.</span>
                </Detail>
            </dl>

            <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors text-sm font-medium"
            >
                <CalendarPlus className="w-4 h-4 text-primary" />
                Añadir a mi calendario
            </a>
        </section>
    );
}

function Detail({ icon: Icon, term, children }: { icon: typeof MapPin; term: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3">
            <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
                <dt className="text-sm font-medium text-on-surface-variant">{term}</dt>
                <dd className="text-base text-on-surface mt-0.5">{children}</dd>
            </div>
        </div>
    );
}
