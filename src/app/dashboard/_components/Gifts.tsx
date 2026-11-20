import { cachedConfig } from "@/lib/data";
import CopyButton from "./CopyButton";
import { HeartSprig } from "@/components/Brand";
import { AtSign, Gift, Landmark, UserRound, type LucideIcon } from "lucide-react";

// «Regalos»: datos cargados en Ajustes. Si no hay alias ni CBU, la sección no aparece.
export default async function Gifts() {
    const [holder, alias, cbu, note] = await Promise.all([
        cachedConfig("gift_holder"),
        cachedConfig("gift_alias"),
        cachedConfig("gift_cbu"),
        cachedConfig("gift_note"),
    ]);
    if (!alias && !cbu) return null;
    // La nota se lee como una dedicatoria: el cuerpo, una ramita con corazón y el
    // cierre (el pedido en sí) destacado en la tipografía de títulos. Si viene en
    // versos (una línea por verso), se respetan y se agrupan de a dos (pareados);
    // si es un párrafo, el cierre es su última frase.
    const text = (note || "Su presencia es nuestro mejor regalo. Si además desean hacernos un obsequio, pueden hacerlo por transferencia.").trim();
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let stanzas: string[][];
    let closing: string[] | null = null;
    if (lines.length >= 4) {
        stanzas = Array.from({ length: Math.ceil(lines.length / 2) }, (_, i) => lines.slice(i * 2, i * 2 + 2));
        closing = stanzas.pop() ?? null;
    } else {
        const sentences = text.split(/(?<=[.!?…])\s+/).filter(Boolean);
        if (sentences.length > 1) closing = [sentences.pop()!];
        stanzas = [[sentences.join(" ")]];
    }
    const rows = [
        holder && { icon: UserRound, term: "Titular", value: holder },
        alias && { icon: AtSign, term: "Alias", value: alias, copy: true },
        cbu && { icon: Landmark, term: "CBU", value: cbu, copy: true, mono: true },
    ].filter(Boolean) as RowProps[];

    return (
        <section aria-labelledby="regalos" className="bg-surface text-center">
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 lg:py-10 short:py-4 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className="flex flex-col items-center">
                    <span aria-hidden className="mg-pop mb-5 short:mb-2 w-14 h-14 short:w-10 short:h-10 rounded-full bg-rubor text-rosa-profundo flex items-center justify-center">
                        <Gift className="w-6 h-6" />
                    </span>
                    <h2 id="regalos" className="mg-mask mg-d-1 font-serif text-5xl sm:text-6xl short:text-5xl leading-display text-oliva-profundo">Regalos</h2>
                    <blockquote className="mt-3 max-w-md">
                        <span aria-hidden className="mg-pop mg-d-2 block font-serif text-6xl leading-[0.6] h-7 text-rosa-profundo/45">“</span>
                        <div className="space-y-3 short:space-y-2 font-text text-base sm:text-lg short:text-base leading-relaxed text-pretty text-tinta">
                            {stanzas.map((st, i) => (
                                <p key={i} className="mg-rise" style={{ "--d": 3 + i } as React.CSSProperties}>
                                    {st.map((l, k) => <span key={k} className="block">{l}</span>)}
                                </p>
                            ))}
                        </div>
                        {closing && (
                            <>
                                <HeartSprig className="mx-auto mt-5 short:mt-3 text-rosa-profundo" />
                                <p className="mg-rise mt-3 short:mt-2 font-serif text-2xl sm:text-3xl short:text-2xl leading-snug text-oliva-profundo text-balance" style={{ "--d": 4 + stanzas.length } as React.CSSProperties}>
                                    {closing.map((l, k) => <span key={k} className="block">{l}</span>)}
                                </p>
                            </>
                        )}
                    </blockquote>
                </div>
                <dl className="mg-rise mg-d-4 mx-auto w-full max-w-md rounded-3xl bg-surface-container-lowest p-6 sm:p-8 space-y-6 shadow-sm">
                    {rows.map((r, i) => <Row key={r.term} {...r} delay={5 + i * 2} />)}
                </dl>
            </div>
        </section>
    );
}

type RowProps = { icon: LucideIcon; term: string; value: string; copy?: boolean; mono?: boolean };

function Row({ icon: Icon, term, value, copy, mono, delay }: RowProps & { delay: number }) {
    return (
        <div className="mg-rise flex flex-col items-center gap-3" style={{ "--d": delay } as React.CSSProperties}>
            <div className="min-w-0">
                <dt className="flex items-center justify-center gap-1.5 text-sm font-medium text-on-surface-variant"><Icon className="w-4 h-4" aria-hidden /> {term}</dt>
                <dd className={`mt-1 text-lg text-on-surface break-all ${mono ? "tabular-nums tracking-wide" : ""}`}>{value}</dd>
            </div>
            {copy && <CopyButton value={value} label={term} />}
        </div>
    );
}
