import { getPublicMenu } from "@/app/actions/menu";
import MenuBook from "./MenuBook";

// «Menú»: lo que se sirve en la celebración, solo los ítems que los novios
// marcaron visibles en el panel, presentado como un libro (índice de menús y
// carta). Si no hay nada publicado, la sección no aparece.
export default async function WeddingMenu() {
    const groups = await getPublicMenu();
    if (groups.length === 0) return null;

    return (
        <section aria-labelledby="menu" className="bg-rubor">
            <div className="mx-auto max-w-6xl px-4 sm:px-8 py-14 sm:py-20 lg:py-8 short:py-5">
                <h2 id="menu" className="mg-mask font-serif text-5xl sm:text-6xl short:text-5xl leading-display text-oliva-profundo text-center">Menú</h2>
                <p className="mg-rise mg-d-2 mt-3 short:mt-1 font-text text-lg leading-relaxed text-center text-pretty">Lo que compartiremos esa noche.</p>
                <div className="mt-8 lg:mt-6 short:mt-4">
                    <MenuBook groups={groups} />
                </div>
            </div>
        </section>
    );
}
