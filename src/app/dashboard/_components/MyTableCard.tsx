import { getMyTable } from "@/app/actions/tables";
import { Armchair } from "lucide-react";

export default async function MyTableCard({ currentUserId }: { currentUserId: number }) {
    const result = await getMyTable();

    return (
        <section aria-labelledby="tu-mesa" className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(81,68,67,0.06)]">
            <div className="flex items-center gap-2 mb-4">
                <Armchair className="w-5 h-5 text-primary" />
                <h2 id="tu-mesa" className="font-serif italic text-3xl text-primary">Tu mesa</h2>
            </div>

            {!result ? (
                <p className="text-base text-on-surface-variant">
                    Todavía estamos organizando las mesas. Cuando esté lista, verás aquí la tuya.
                </p>
            ) : (
                <TableInfo result={result} currentUserId={currentUserId} />
            )}
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
        <div className="space-y-4">
            <p className="font-serif text-5xl text-on-surface leading-none">
                Mesa {table.number}
                {table.name && <span className="block mt-2 text-lg italic text-on-surface-variant">{table.name}</span>}
            </p>
            {others.length > 0 ? (
                <div>
                    <h3 className="text-sm font-medium text-on-surface-variant mb-2">Compartes mesa con</h3>
                    <ul className="flex flex-wrap gap-2">
                        {others.map((m) => (
                            <li key={m.id} className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface text-sm">
                                {m.name} {m.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-base text-on-surface-variant">Pronto sabrás con quién compartes mesa.</p>
            )}
        </div>
    );
}
