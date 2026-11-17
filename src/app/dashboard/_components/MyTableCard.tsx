import { getMyTable } from "@/app/actions/tables";
import { Armchair } from "lucide-react";

// «Tu mesa»: número grande, la mesa dibujada desde arriba (tu silla destacada)
// y con quién se comparte. Sin mesa, la misma mesa en espera con un «?».
export default async function MyTableCard({ currentUserId }: { currentUserId: number }) {
    const result = await getMyTable();

    return (
        <section aria-labelledby="tu-mesa" className="bg-surface text-center">
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-14 sm:py-20 lg:py-10">
                <h2 id="tu-mesa" className="mg-mask font-serif text-5xl sm:text-6xl leading-display text-oliva-profundo">Tu mesa</h2>
                <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className="flex items-center justify-center gap-8">
                    {result && (
                        <p className="font-serif leading-none text-tinta">
                            <span className="sr-only">Mesa </span>
                            <span aria-hidden className="mg-rise mg-d-1 block text-sm font-sans font-medium text-on-surface-variant mb-2">Mesa</span>
                            <span className="mg-pop mg-d-2 block text-9xl tabular-nums">{result.table.number}</span>
                        </p>
                    )}
                    <TableSeats
                        capacity={result?.table.capacity ?? 8}
                        taken={result?.members.length ?? 0}
                        label={result ? String(result.table.number) : "?"}
                        waiting={!result}
                    />
                </div>

                {!result ? (
                    <p className="mg-rise mg-d-4 mx-auto font-text text-lg leading-relaxed text-pretty max-w-md flex flex-col items-center gap-3">
                        <Armchair className="w-6 h-6 shrink-0 text-oliva-profundo" aria-hidden />
                        Todavía estamos organizando las mesas. Cuando esté lista, verás aquí la tuya y con quién la compartes.
                    </p>
                ) : (
                    <TableInfo result={result} currentUserId={currentUserId} />
                )}
                </div>
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
            <circle cx={c} cy={c} r={34} className="mg-pop mg-d-2 fill-surface-container-low" />
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
                        // Las sillas aparecen una a una alrededor de la mesa.
                        className={`mg-pop ${you ? "fill-mono-r" : occupied ? "fill-oliva" : "fill-none stroke-oliva/50"}`}
                        style={{ "--d": 3 + i } as React.CSSProperties}
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
        <div className="space-y-4 pb-2">
            {table.name && <p className="mg-mask mg-d-4 font-serif text-3xl leading-tight text-tinta">{table.name}</p>}
            {others.length > 0 ? (
                <div>
                    <h3 className="mg-rise mg-d-5 text-sm font-medium text-on-surface-variant mb-3">Compartes mesa con</h3>
                    <ul className="flex flex-wrap justify-center gap-2">
                        {others.map((m, i) => (
                            <li key={m.id} style={{ "--d": 6 + i } as React.CSSProperties} className="mg-rise inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-surface-container-lowest text-on-surface text-base shadow-sm">
                                <span aria-hidden className="w-7 h-7 rounded-full bg-rubor text-tinta font-serif text-sm flex items-center justify-center">
                                    {(m.name[0] ?? "").toUpperCase()}
                                </span>
                                {m.name} {m.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="mg-rise mg-d-5 font-text text-base">Pronto sabrás con quién compartes mesa.</p>
            )}
            <p className="mg-rise mg-d-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-3 h-3 rounded-full bg-mono-r" /> Tú</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-3 h-3 rounded-full bg-oliva" /> {members.length} {members.length === 1 ? "persona" : "personas"}</span>
                {free > 0 && <span className="inline-flex items-center gap-1.5"><span aria-hidden className="w-3 h-3 rounded-full ring-[1.5px] ring-inset ring-oliva/50" /> {free} {free === 1 ? "silla libre" : "sillas libres"}</span>}
            </p>
        </div>
    );
}
