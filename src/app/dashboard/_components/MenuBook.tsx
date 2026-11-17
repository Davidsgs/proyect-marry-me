"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MENU_COURSES } from "@/lib/menuTypes";
import type { PublicMenuGroup, PublicMenuItem } from "@/app/actions/menu";

// «Menú» de la invitación como un libro abierto: a la izquierda el índice de
// menús (I. Recepción ···· 18:45 h) y a la derecha la carta del elegido, con los
// platos agrupados por curso. En el celular primero se ve el índice y al tocar un
// menú se abre su carta, con «Todos los menús» para volver. Con un solo menú no
// hay índice: se ve la carta directamente.
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export default function MenuBook({ groups }: { groups: PublicMenuGroup[] }) {
    const [active, setActive] = useState(0);
    const [reading, setReading] = useState(false); // celular: carta abierta
    const top = useRef<HTMLDivElement>(null);
    const multi = groups.length > 1;
    const menu = groups[Math.min(active, groups.length - 1)];
    const courses = MENU_COURSES
        .map((c) => ({ label: c.plural, dishes: menu.items.filter((i) => i.type === c.value) }))
        .filter((c) => c.dishes.length > 0);

    function open(i: number) {
        setActive(i);
        setReading(true);
        // En el celular la carta reemplaza al índice: se vuelve al principio del libro.
        if (!window.matchMedia("(min-width: 64rem)").matches) {
            requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" }));
        }
    }

    // Celular: se ve el índice o la carta. Escritorio (lg): siempre los dos.
    const showIndex = multi && !reading ? "flex" : "hidden lg:flex";
    const showCarta = multi && !reading ? "hidden lg:flex" : "flex";

    return (
        <div ref={top} className="mg-rise mg-d-3 mx-auto w-full max-w-5xl scroll-mt-4 lg:flex lg:rounded-[1.75rem] lg:shadow-xl">
            {multi && (
                <nav
                    aria-label="Índice de menús"
                    className={`${showIndex} flex-col gap-1.5 rounded-[1.75rem] bg-crema px-4 py-5 shadow-md lg:flex-[0.8] lg:rounded-r-none lg:px-9 lg:py-9 lg:shadow-[inset_-18px_0_24px_-22px_rgba(54,64,51,0.45)]`}
                >
                    <p className="ml-2 lg:ml-0 text-xs font-semibold uppercase tracking-[0.16em] text-rosa-profundo">Índice</p>
                    <h3 className="hidden lg:block mb-3 font-serif text-3xl leading-display text-oliva-profundo">Los menús de la noche</h3>
                    <ul className="flex flex-col gap-1.5">
                        {groups.map((g, i) => {
                            const current = i === active;
                            const meta = g.time ? `${g.time} h` : `${g.items.length} ${g.items.length === 1 ? "plato" : "platos"}`;
                            return (
                                <li key={g.id ?? "otros"}>
                                    <button
                                        type="button"
                                        onClick={() => open(i)}
                                        aria-current={current ? "true" : undefined}
                                        className={`group w-full flex items-center lg:items-baseline gap-3 min-h-16 lg:min-h-14 px-3 lg:px-4 py-2.5 rounded-2xl text-left transition-colors ${
                                            current ? "bg-surface-container-lowest lg:shadow-sm" : "max-lg:bg-surface-container-lowest lg:hover:bg-surface-container-lowest/60"
                                        }`}
                                    >
                                        <span className="min-w-7 font-serif text-lg text-rosa-profundo">{ROMAN[i] ?? i + 1}</span>
                                        <span className={`font-serif text-2xl leading-tight ${current ? "lg:text-oliva-profundo" : ""}`}>{g.title}</span>
                                        <span aria-hidden className="hidden lg:block flex-1 -translate-y-1.5 border-b-2 border-dotted border-oliva/35" />
                                        <span className={`ml-auto lg:ml-0 text-sm tabular-nums whitespace-nowrap ${current ? "font-semibold text-rosa-profundo" : "text-on-surface-variant"}`}>{meta}</span>
                                        <ChevronRight className="lg:hidden w-5 h-5 shrink-0 text-oliva-profundo" aria-hidden />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="hidden lg:block mt-auto pt-6 text-sm text-on-surface-variant">Elige un menú para ver su carta.</p>
                </nav>
            )}

            <div className={`${showCarta} flex-col gap-3 lg:flex-[1.2]`}>
                {multi && (
                    <button
                        type="button"
                        onClick={() => setReading(false)}
                        className="lg:hidden self-start inline-flex items-center gap-1.5 min-h-11 pl-2 pr-4 rounded-xl bg-crema text-sm font-semibold text-tinta"
                    >
                        <ChevronLeft className="w-4 h-4" aria-hidden />
                        Todos los menús
                    </button>
                )}
                <article
                    aria-label={`Carta: ${menu.title}`}
                    className={`flex flex-col items-center gap-5 short:gap-3 rounded-[1.75rem] bg-surface-container-lowest px-5 py-7 shadow-md lg:shadow-none lg:px-12 lg:py-9 short:py-6 ${multi ? "lg:flex-1 lg:rounded-l-none" : "lg:flex-1"}`}
                >
                    <header className="text-center">
                        {multi && <p className="font-serif text-lg text-rosa-profundo">{ROMAN[active] ?? active + 1}</p>}
                        <h3 className="font-serif text-4xl lg:text-[2.6rem] short:text-4xl leading-display text-oliva-profundo">{menu.title}</h3>
                        {menu.time && <p className="mt-1 text-sm font-semibold tabular-nums text-rosa-profundo">{menu.time} h</p>}
                    </header>
                    {/* En escritorio, los cursos en dos columnas equilibradas para que la carta entre en la pantalla. */}
                    <div className="w-full flex flex-col gap-5 lg:block lg:columns-2 lg:gap-x-10">
                        {courses.map((c) => (
                            <section key={c.label} className="flex flex-col gap-2 short:gap-1 lg:break-inside-avoid lg:mb-5 short:mb-3">
                                <h4 className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-rosa-profundo">{c.label}</h4>
                                <ul className="flex flex-col gap-2 short:gap-1">
                                    {c.dishes.map((d) => <Dish key={d.id} item={d} />)}
                                </ul>
                            </section>
                        ))}
                    </div>
                </article>
            </div>
        </div>
    );
}

function Dish({ item }: { item: PublicMenuItem }) {
    const tags = [
        item.isVegan ? "Vegano" : item.isVegetarian ? "Vegetariano" : null,
        item.isGlutenFree ? "Sin gluten" : null,
        item.isLactoseFree ? "Sin lactosa" : null,
    ].filter(Boolean).join(" · ");
    return (
        <li className="flex flex-col">
            {/* Nombre, línea de puntos y opciones dietarias, como en una carta impresa.
                En el celular no hay ancho para la línea: las opciones van debajo. */}
            <span className="flex items-baseline gap-2.5">
                <span className="font-serif text-xl short:text-lg leading-snug text-tinta">{item.name}</span>
                <span aria-hidden className="hidden sm:block flex-1 min-w-4 -translate-y-1.5 border-b-2 border-dotted border-oliva/25" />
                {tags && <span className="hidden sm:inline text-xs font-semibold text-on-secondary-container text-right">{tags}</span>}
            </span>
            {tags && <span className="sm:hidden text-xs font-semibold text-on-secondary-container">{tags}</span>}
            {item.description && <span className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">{item.description}</span>}
            {item.allergens && <span className="text-sm text-rosa-profundo">Contiene: {item.allergens}</span>}
        </li>
    );
}
