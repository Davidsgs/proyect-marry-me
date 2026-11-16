import { cachedConfig } from "@/lib/data";
import CopyButton from "./CopyButton";

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
                <div>
                    <h2 id="regalos" className="font-serif text-5xl sm:text-6xl leading-none text-oliva-profundo">Regalos</h2>
                    <p className="mt-4 font-text text-lg leading-relaxed text-pretty">
                        {note || "Su presencia es nuestro mejor regalo. Si además desean hacernos un obsequio, pueden hacerlo por transferencia."}
                    </p>
                </div>
                <dl className="rounded-3xl bg-surface-container-lowest p-6 sm:p-8 space-y-5">
                    {holder && <Row term="Titular" value={holder} />}
                    {alias && <Row term="Alias" value={alias} copy />}
                    {cbu && <Row term="CBU" value={cbu} copy mono />}
                </dl>
            </div>
        </section>
    );
}

function Row({ term, value, copy, mono }: { term: string; value: string; copy?: boolean; mono?: boolean }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
                <dt className="text-sm font-medium text-on-surface-variant">{term}</dt>
                <dd className={`mt-1 text-lg text-on-surface break-all ${mono ? "tabular-nums tracking-wide" : ""}`}>{value}</dd>
            </div>
            {copy && <CopyButton value={value} label={term} />}
        </div>
    );
}
