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
        <section aria-labelledby="cortejo" className="relative overflow-hidden bg-oliva-profundo text-crema">
            <BotanicalShadow variant="rama" sway className="absolute -left-24 -top-16 w-[26rem] max-w-[80vw] text-tinta/30" />
            <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-16 sm:py-24">
                <h2 id="cortejo" className="reveal font-serif text-5xl sm:text-6xl leading-none">Nuestro cortejo</h2>
                <p className="reveal mt-4 max-w-xl font-text text-lg leading-relaxed text-pretty">
                    Gracias a quienes nos acompañan en cada paso de este camino. Este día también es suyo.
                </p>

                <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((m) => {
                        const Icon = roleIcon(m.role);
                        return (
                        <li key={m.id} className="reveal rounded-3xl bg-crema text-tinta p-6 sm:p-7 shadow-sm transition-[transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-md motion-reduce:hover:translate-y-0">
                            <p className="flex items-center gap-2 text-sm font-medium text-rosa-profundo">
                                <span aria-hidden className="w-8 h-8 rounded-full bg-rubor flex items-center justify-center">
                                    <Icon className="w-4 h-4" />
                                </span>
                                {m.role}
                            </p>
                            <p className="mt-1 font-serif text-3xl leading-tight text-balance break-words">{m.name}</p>
                            {m.message && <p className="mt-3 font-text text-base leading-relaxed text-pretty whitespace-pre-line">{m.message}</p>}
                        </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
