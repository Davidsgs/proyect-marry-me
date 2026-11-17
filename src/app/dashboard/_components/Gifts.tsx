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

    return (
        <section aria-labelledby="regalos" className="bg-surface">
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-16 sm:py-24 grid gap-8 md:grid-cols-2 md:gap-16">
                <div className="reveal">
                    <span aria-hidden className="mb-5 w-14 h-14 rounded-full bg-rubor text-rosa-profundo flex items-center justify-center">
                        <Gift className="w-6 h-6" />
                    </span>
                    <h2 id="regalos" className="font-serif text-5xl sm:text-6xl leading-display text-oliva-profundo">Regalos</h2>
                    <p className="mt-4 font-text text-lg leading-relaxed text-pretty">
                        {note || "Su presencia es nuestro mejor regalo. Si además desean hacernos un obsequio, pueden hacerlo por transferencia."}
                    </p>
                </div>
                <dl className="reveal rounded-3xl bg-surface-container-lowest p-6 sm:p-8 space-y-5 shadow-sm">
                    {holder && <Row icon={UserRound} term="Titular" value={holder} />}
                    {alias && <Row icon={AtSign} term="Alias" value={alias} copy />}
                    {cbu && <Row icon={Landmark} term="CBU" value={cbu} copy mono />}
                </dl>
            </div>
        </section>
    );
}

function Row({ icon: Icon, term, value, copy, mono }: { icon: LucideIcon; term: string; value: string; copy?: boolean; mono?: boolean }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant"><Icon className="w-4 h-4" aria-hidden /> {term}</dt>
                <dd className={`mt-1 text-lg text-on-surface break-all ${mono ? "tabular-nums tracking-wide" : ""}`}>{value}</dd>
            </div>
            {copy && <CopyButton value={value} label={term} />}
        </div>
    );
}
