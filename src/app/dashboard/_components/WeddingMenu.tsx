import { getPublicMenu, type PublicMenuItem } from "@/app/actions/menu";
import { Sprig } from "@/components/Brand";
import { Clock, Leaf, MilkOff, TriangleAlert, WheatOff, type LucideIcon } from "lucide-react";

// «Menú»: lo que se sirve en la celebración, solo los ítems que los novios
// marcaron visibles en el panel. Se compone como la carta impresa de la mesa:
// papel crema, momentos como encabezados y cada plato con su descripción.
// Si no hay nada publicado, la sección no aparece.
export default async function WeddingMenu() {
    const groups = await getPublicMenu();
    if (groups.length === 0) return null;

    return (
        <section aria-labelledby="menu" className="bg-surface-container-low">
            <div className="mx-auto max-w-3xl px-4 sm:px-8 py-16 sm:py-24">
                <h2 id="menu" className="reveal font-serif text-5xl sm:text-6xl leading-display text-oliva-profundo text-center">Menú</h2>
                <p className="reveal mt-4 font-text text-lg leading-relaxed text-center text-pretty">Lo que compartiremos esa noche.</p>

                <div className="reveal mt-10 rounded-[2rem] bg-crema shadow-md px-6 py-10 sm:px-14 sm:py-14 space-y-10 text-center">
                    {groups.map((g, gi) => (
                        <div key={g.id ?? "otros"}>
                            {gi > 0 && <Sprig className="mx-auto mb-10 text-oliva" />}
                            <h3 className="font-serif text-3xl sm:text-4xl leading-tight text-oliva-profundo">{g.title}</h3>
                            {g.time && (
                                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-rosa-profundo">
                                    <Clock className="w-3.5 h-3.5" aria-hidden /> {g.time} h
                                </p>
                            )}
                            <ul className="mt-6 space-y-6">
                                {g.items.map((item) => <Dish key={item.id} item={item} />)}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Dish({ item }: { item: PublicMenuItem }) {
    const tags = [
        item.isVegan ? { icon: Leaf, text: "Vegano" } : item.isVegetarian ? { icon: Leaf, text: "Vegetariano" } : null,
        item.isGlutenFree ? { icon: WheatOff, text: "Sin gluten" } : null,
        item.isLactoseFree ? { icon: MilkOff, text: "Sin lactosa" } : null,
    ].filter((t): t is { icon: LucideIcon; text: string } => t !== null);

    return (
        <li>
            <p className="font-serif text-2xl leading-snug text-tinta text-balance">{item.name}</p>
            {item.description && (
                <p className="mt-1 mx-auto max-w-md font-text text-base leading-relaxed text-tinta text-pretty whitespace-pre-line">{item.description}</p>
            )}
            {tags.length > 0 && (
                <p className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {tags.map(({ icon: Icon, text }) => (
                        <span key={text} className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                            <Icon className="w-3.5 h-3.5" aria-hidden /> {text}
                        </span>
                    ))}
                </p>
            )}
            {item.allergens && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-rosa-profundo">
                    <TriangleAlert className="w-3.5 h-3.5 shrink-0" aria-hidden /> Contiene: {item.allergens}
                </p>
            )}
        </li>
    );
}
