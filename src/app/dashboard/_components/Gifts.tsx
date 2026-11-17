import { cachedConfig } from "@/lib/data";
import CopyButton from "./CopyButton";
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
    const rows = [
        holder && { icon: UserRound, term: "Titular", value: holder },
        alias && { icon: AtSign, term: "Alias", value: alias, copy: true },
        cbu && { icon: Landmark, term: "CBU", value: cbu, copy: true, mono: true },
    ].filter(Boolean) as RowProps[];

    return (
        <section aria-labelledby="regalos" className="bg-surface text-center">
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 lg:py-10 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className="flex flex-col items-center">
                    <span aria-hidden className="mg-pop mb-5 w-14 h-14 rounded-full bg-rubor text-rosa-profundo flex items-center justify-center">
                        <Gift className="w-6 h-6" />
                    </span>
                    <h2 id="regalos" className="mg-mask mg-d-1 font-serif text-5xl sm:text-6xl leading-display text-oliva-profundo">Regalos</h2>
                    <p className="mg-rise mg-d-3 mt-4 max-w-md font-text text-lg leading-relaxed text-pretty">
                        {note || "Su presencia es nuestro mejor regalo. Si además desean hacernos un obsequio, pueden hacerlo por transferencia."}
                    </p>
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
