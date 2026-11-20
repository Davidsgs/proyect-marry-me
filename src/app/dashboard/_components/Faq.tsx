import { Plus } from "lucide-react";
import { cachedFaq } from "@/lib/data";
import { Sprig } from "@/components/Brand";
import { BotanicalShadow } from "@/components/BotanicalShadow";

// «Preguntas y respuestas»: se cargan en Ajustes. Acordeón nativo (<details>): con
// `name`, abrir una cierra la anterior, así el paso no crece de más. En escritorio,
// dos columnas para que entre en la pantalla. Sin preguntas, la sección no aparece.
export default async function Faq() {
    const items = await cachedFaq();
    if (items.length === 0) return null;
    const half = Math.ceil(items.length / 2);

    return (
        <section aria-labelledby="preguntas" className="relative overflow-hidden bg-rubor">
            <BotanicalShadow variant="rama" className="absolute -bottom-16 -left-24 w-[26rem] max-w-[80vw] text-rosa-profundo/15" />
            <div className="relative mx-auto max-w-5xl px-4 sm:px-8 py-14 sm:py-20 lg:py-8 short:py-4">
                <h2 id="preguntas" className="mg-mask font-serif text-5xl sm:text-6xl short:text-5xl leading-display text-oliva-profundo text-center text-balance">
                    Preguntas y respuestas
                </h2>
                <Sprig className="mg-grow mg-d-2 mx-auto mt-4 short:mt-2 text-rosa-profundo" />
                <p className="mg-rise mg-d-3 mt-3 short:mt-1 font-text text-lg short:text-base leading-relaxed text-center text-pretty">
                    Lo que suelen preguntarnos. Toca una pregunta para ver la respuesta.
                </p>
                {/* Dos columnas fijas (no CSS columns): al abrir una pregunta, ninguna cambia de columna. */}
                <div className="mt-8 lg:mt-6 short:mt-3 grid gap-2 lg:grid-cols-2 lg:gap-4 short:gap-x-4 short:gap-y-1.5 lg:items-start">
                    {[items.slice(0, half), items.slice(half)].map((col, c) => (
                        <div key={c} className="flex flex-col gap-2 short:gap-1.5">
                            {col.map((q, i) => (
                                <details
                                    key={q.id}
                                    name="preguntas"
                                    className="group mg-rise rounded-2xl bg-crema shadow-sm"
                                    style={{ "--d": 4 + Math.min(c * half + i, 8) } as React.CSSProperties}
                                >
                                    <summary className="flex items-center gap-3 min-h-14 short:min-h-11 px-5 py-3 short:py-1.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-2xl">
                                        <span className="flex-1 font-serif text-xl short:text-base leading-snug text-tinta text-pretty">{q.question}</span>
                                        <span aria-hidden className="w-8 h-8 shrink-0 rounded-full bg-rubor text-rosa-profundo flex items-center justify-center transition-transform duration-300 group-open:rotate-45">
                                            <Plus className="w-4 h-4" />
                                        </span>
                                    </summary>
                                    <p className="faq-answer px-5 pb-4 short:pb-3 -mt-1 font-text text-base short:text-sm leading-relaxed text-pretty whitespace-pre-line">{q.answer}</p>
                                </details>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
