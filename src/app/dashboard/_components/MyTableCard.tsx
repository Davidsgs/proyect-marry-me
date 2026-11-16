import { getMyTable } from "@/app/actions/tables";

// «Tu mesa»: número grande y con quién se comparte. Sin mesa, una frase de espera.
export default async function MyTableCard({ currentUserId }: { currentUserId: number }) {
    const result = await getMyTable();

    return (
        <section aria-labelledby="tu-mesa" className="bg-surface">
            <div className="mx-auto max-w-5xl px-5 sm:px-8 py-16 sm:py-24 grid gap-8 md:grid-cols-[auto_1fr] md:items-end md:gap-16">
                <div>
                    <h2 id="tu-mesa" className="font-serif text-5xl sm:text-6xl leading-none text-oliva-profundo">Tu mesa</h2>
                    {result && (
                        <p className="mt-4 font-serif leading-none text-tinta">
                            <span className="sr-only">Mesa </span>
                            <span aria-hidden className="block text-sm font-sans font-medium text-on-surface-variant mb-2">Mesa</span>
                            <span className="text-9xl">{result.table.number}</span>
                        </p>
                    )}
                </div>

                {!result ? (
                    <p className="font-text text-lg leading-relaxed text-pretty max-w-md">
                        Todavía estamos organizando las mesas. Cuando esté lista, verás aquí la tuya.
                    </p>
                ) : (
                    <TableInfo result={result} currentUserId={currentUserId} />
                )}
            </div>
        </section>
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
    return (
        <div className="space-y-4 pb-2">
            {table.name && <p className="font-serif text-3xl leading-tight text-tinta">{table.name}</p>}
            {others.length > 0 ? (
                <div>
                    <h3 className="text-sm font-medium text-on-surface-variant mb-3">Compartes mesa con</h3>
                    <ul className="flex flex-wrap gap-2">
                        {others.map((m) => (
                            <li key={m.id} className="px-3.5 py-2 rounded-full bg-surface-container-lowest text-on-surface text-base">
                                {m.name} {m.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="font-text text-base">Pronto sabrás con quién compartes mesa.</p>
            )}
        </div>
    );
}
