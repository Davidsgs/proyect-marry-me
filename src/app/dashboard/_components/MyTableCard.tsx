import { getMyTable } from "@/app/actions/tables";
import { Armchair } from "lucide-react";

// «Tu mesa»: número grande, la mesa dibujada desde arriba (tu silla destacada)
// y con quién se comparte. Sin mesa, la misma mesa en espera con un «?».
export default async function MyTableCard({ currentUserId }: { currentUserId: number }) {
    const result = await getMyTable();

    return (
        <section aria-labelledby="tu-mesa" className="bg-surface">
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-16 sm:py-24 grid gap-10 md:grid-cols-[auto_1fr] md:items-center md:gap-16">
                <div className="reveal flex items-end gap-6 sm:gap-8">
                    <div>
                        <h2 id="tu-mesa" className="font-serif text-5xl sm:text-6xl leading-display text-oliva-profundo">Tu mesa</h2>
                        {result && (
                            <p className="mt-4 font-serif leading-none text-tinta">
                                <span className="sr-only">Mesa </span>
                                <span aria-hidden className="block text-sm font-sans font-medium text-on-surface-variant mb-2">Mesa</span>
                                <span className="text-9xl">{result.table.number}</span>
                            </p>
                        )}
                    </div>
                    <TableSeats
                        capacity={result?.table.capacity ?? 8}
                        taken={result?.members.length ?? 0}
                        label={result ? String(result.table.number) : "?"}
                        waiting={!result}
                    />
                </div>

                {!result ? (
                    <p className="reveal font-text text-lg leading-relaxed text-pretty max-w-md flex items-start gap-3">
                        <Armchair className="w-6 h-6 mt-0.5 shrink-0 text-oliva-profundo" aria-hidden />
                        Todavía estamos organizando las mesas. Cuando esté lista, verás aquí la tuya y con quién la compartes.
                    </p>
                ) : (
                    <TableInfo result={result} currentUserId={currentUserId} />
                )}
            </div>
        </section>
    );
}

// Mesa redonda vista desde arriba: tu silla (rosa, arriba), las ocupadas (oliva)
// y las libres (contorno). Decorativa: la información está en el texto.
function TableSeats({ capacity, taken, label, waiting }: { capacity: number; taken: number; label: string; waiting: boolean }) {
    const seats = Math.max(1, Math.min(capacity, 16));
    const size = 132;
    const c = size / 2;
    const ring = 52;
    return (
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden className={`w-28 sm:w-32 shrink-0 ${waiting ? "opacity-60" : ""}`}>
            <circle cx={c} cy={c} r={34} className="fill-surface-container-low" />
            <text x={c} y={c} textAnchor="middle" dominantBaseline="central" className="fill-oliva-profundo font-serif" fontSize="26">
                {label}
            </text>
            {Array.from({ length: seats }, (_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / seats;
                const x = c + ring * Math.cos(angle);
                const y = c + ring * Math.sin(angle);
                const you = !waiting && i === 0;
                const occupied = !waiting && i < taken;
                return (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={you ? 8 : 6.5}
                        className={you ? "fill-mono-r" : occupied ? "fill-oliva" : "fill-none stroke-oliva/50"}
                        strokeWidth={occupied ? 0 : 1.5}
                    />
                );
            })}
        </svg>
    );
}

function TableInfo({
    result,
    currentUserId,
}: {
    result: NonNullable<Awaited<ReturnType<typeof getMyTable>>>;
    currentUserId: number;
}) {
    const { table, members } = result;
    const others = members.filter((m) => m.id !== currentUserId);
    const free = Math.max(0, table.capacity - members.length);
    return (
        <div className="reveal space-y-4 pb-2">
            {table.name && <p className="font-serif text-3xl leading-tight text-tinta">{table.name}</p>}
            {others.length > 0 ? (
                <div>
                    <h3 className="text-sm font-medium text-on-surface-variant mb-3">Compartes mesa con</h3>
                    <ul className="flex flex-wrap gap-2">
                        {others.map((m) => (
                            <li key={m.id} className="inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-surface-container-lowest text-on-surface text-base shadow-sm">
                                <span aria-hidden className="w-7 h-7 rounded-full bg-rubor text-tinta font-serif text-sm flex items-center justify-center">
                                    {(m.name[0] ?? "").toUpperCase()}
                                </span>
                                {m.name} {m.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="font-text text-base">Pronto sabrás con quién compartes mesa.</p>
            )}
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-3 h-3 rounded-full bg-mono-r" /> Tú</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-3 h-3 rounded-full bg-oliva" /> {members.length} {members.length === 1 ? "persona" : "personas"}</span>
                {free > 0 && <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-3 h-3 rounded-full ring-[1.5px] ring-inset ring-oliva/50" /> {free} {free === 1 ? "silla libre" : "sillas libres"}</span>}
            </p>
        </div>
    );
}
