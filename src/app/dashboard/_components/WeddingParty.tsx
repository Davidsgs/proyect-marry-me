import { cachedWeddingParty } from "@/lib/data";
import { BotanicalShadow } from "@/components/BotanicalShadow";
import { Crown, Flower2, Gem, Heart, PenLine, Sparkles, type LucideIcon } from "lucide-react";

// Ícono según el papel (texto libre): se busca por palabra clave.
const ROLE_ICONS: [RegExp, LucideIcon][] = [
    [/testig/i, PenLine],
    [/anillo|alianza/i, Gem],
    [/flor/i, Flower2],
    [/dama|caballero/i, Sparkles],
    [/padrin|madrin/i, Crown],
];
const roleIcon = (role: string) => ROLE_ICONS.find(([re]) => re.test(role))?.[1] ?? Heart;

// «Nuestro cortejo»: agradecimiento a padrinos, testigos y damas de honor,
// cargado en Ajustes. Banda oliva con fichas de papel crema; si no hay nadie,
// la sección no aparece. Solo se ve con sesión (vive en /dashboard).
export default async function WeddingParty() {
    const members = await cachedWeddingParty();
    if (members.length === 0) return null;

    return (
        <section aria-labelledby="cortejo" className="relative overflow-hidden bg-oliva-profundo text-crema text-center">
            <BotanicalShadow variant="rama" sway className="absolute -left-24 -top-16 w-[26rem] max-w-[80vw] text-tinta/30" />
            <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-20 lg:py-8">
                <h2 id="cortejo" className="mg-mask font-serif text-5xl sm:text-6xl short:text-5xl leading-display">Nuestro cortejo</h2>
                <p className="mg-rise mg-d-2 mt-4 short:mt-2 mx-auto max-w-xl font-text text-lg leading-relaxed text-pretty">
                    Gracias a quienes nos acompañan en cada paso de este camino. Este día también es suyo.
                </p>

                <ul className="mt-10 short:mt-6 flex flex-wrap justify-center gap-4">
                    {members.map((m, i) => {
                        const Icon = roleIcon(m.role);
                        return (
                        <li key={m.id} style={{ "--d": 3 + i } as React.CSSProperties} className="mg-rise w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)] rounded-3xl bg-crema text-tinta p-6 lg:p-5 shadow-sm transition-[transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-md motion-reduce:hover:translate-y-0">
                            <p className="flex items-center justify-center gap-2 text-sm font-medium text-rosa-profundo">
                                <span aria-hidden className="w-8 h-8 rounded-full bg-rubor flex items-center justify-center">
                                    <Icon className="w-4 h-4" />
                                </span>
                                {m.role}
                            </p>
                            <p className="mt-1 font-serif text-3xl lg:text-2xl leading-tight text-balance break-words">{m.name}</p>
                            {m.message && <p className="mt-3 lg:mt-2 font-text text-base lg:text-sm leading-relaxed text-pretty whitespace-pre-line">{m.message}</p>}
                        </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
