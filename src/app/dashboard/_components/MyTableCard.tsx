import { getMyTable } from "@/app/actions/tables";
import { Armchair } from "lucide-react";

export default async function MyTableCard({ currentUserId }: { currentUserId: number }) {
    const result = await getMyTable();

    if (!result) {
        return (
            <div className="bg-white/[0.04] border border-wedding-sage/15 p-6 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-2 text-wedding-sage/70 mb-2">
                    <Armchair className="w-4 h-4" />
                    <span className="text-[11px] font-light tracking-[0.3em] uppercase">Tu mesa</span>
                </div>
                <p className="text-wedding-cream/50 font-light text-sm">
                    Aún estamos organizando las mesas. Pronto verás aquí tu sitio.
                </p>
            </div>
        );
    }

    const { table, members } = result;
    const others = members.filter((m) => m.id !== currentUserId);

    return (
        <div className="bg-white/[0.06] backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-wedding-sage/20 relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-wedding-sage/10 blur-3xl pointer-events-none"></div>

            <div className="relative space-y-5">
                <div className="flex items-center justify-center gap-3">
                    <span className="h-px w-8 bg-wedding-sage/40"></span>
                    <span className="text-wedding-sage text-[11px] font-light tracking-[0.35em] uppercase">Tu mesa</span>
                    <span className="h-px w-8 bg-wedding-sage/40"></span>
                </div>

                <div className="text-center">
                    <p className="text-4xl md:text-5xl font-serif italic text-wedding-cream leading-tight">
                        Mesa {table.number}
                    </p>
                    {table.name && (
                        <p className="text-wedding-blush/80 font-light text-sm mt-1 italic">{table.name}</p>
                    )}
                </div>

                {others.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-center text-wedding-cream/50 font-light text-xs tracking-[0.2em] uppercase">
                            Compartes mesa con
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {others.map((m) => (
                                <span
                                    key={m.id}
                                    className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-wedding-sage/15 text-wedding-cream/90 font-light text-sm"
                                >
                                    {m.name} {m.lastName}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-wedding-cream/50 font-light text-sm">
                        Por ahora tienes esta mesa para ti. Pronto añadiremos a más invitados.
                    </p>
                )}
            </div>
        </div>
    );
}
