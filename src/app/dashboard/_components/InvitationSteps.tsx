"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

// tone "dark": la sección es un campo oscuro (oliva); la barra de progreso y los
// botones pasan a crema para seguir viéndose sobre ella.
export type Step = { id: string; label: string; content: React.ReactNode; tone?: "dark" };

// La invitación como carrusel: una sección por vez, con «Atrás» y «Siguiente».
// Todas las secciones quedan montadas (las ocultas con `hidden`) para que el
// formulario de confirmación no pierda lo elegido al ir y volver. El paso
// actual vive en el hash (#dia, #mesa…): sobrevive a recargar y los enlaces
// del saludo llevan directo a su paso. La barra de progreso y los botones van
// encima de la sección, sin fondo propio: el color y las sombras botánicas de
// cada paso llegan hasta los bordes.
export default function InvitationSteps({ steps }: { steps: Step[] }) {
    const [index, setIndex] = useState(0);
    const [dir, setDir] = useState<"next" | "prev" | null>(null);
    const panels = useRef<(HTMLDivElement | null)[]>([]);
    const touch = useRef<{ x: number; y: number } | null>(null);
    const last = steps.length - 1;
    const dark = steps[index].tone === "dark";

    function go(to: number, focus = true) {
        if (to < 0 || to > last || to === index) return;
        setDir(to > index ? "next" : "prev");
        setIndex(to);
        history.replaceState(null, "", to === 0 ? location.pathname : `#${steps[to].id}`);
        window.scrollTo({ top: 0 });
        if (focus) requestAnimationFrame(() => panels.current[to]?.focus({ preventScroll: true }));
    }

    // Hash al cargar y al tocar un enlace interno (#confirmar, #dia…).
    useEffect(() => {
        function fromHash() {
            const i = steps.findIndex((s) => `#${s.id}` === location.hash);
            if (i >= 0) {
                setDir(null);
                setIndex(i);
                window.scrollTo({ top: 0 });
            }
        }
        fromHash();
        window.addEventListener("hashchange", fromHash);
        return () => window.removeEventListener("hashchange", fromHash);
    }, [steps]);

    // Deslizar con el dedo: solo gestos claramente horizontales y fuera de campos.
    function onTouchStart(e: React.TouchEvent) {
        const t = e.target as HTMLElement;
        touch.current = t.closest("input, select, textarea") ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    function onTouchEnd(e: React.TouchEvent) {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
        go(dx < 0 ? index + 1 : index - 1);
    }

    const secondary = "inline-flex items-center justify-center gap-2 min-h-14 px-6 rounded-xl font-sans text-base font-medium text-tinta bg-crema/70 hover:bg-crema active:scale-[0.98] transition-[background-color,transform] duration-150";
    // Sobre un campo oliva, el botón oliva desaparecería: pasa a crema.
    const primary = `inline-flex items-center justify-center gap-2 min-h-14 px-8 rounded-xl font-sans text-base font-medium shadow-sm active:scale-[0.98] transition-[background-color,color,transform] duration-150 ${
        dark ? "bg-crema text-tinta hover:bg-rubor" : "bg-primary text-on-primary hover:bg-[#4a5745]"
    }`;

    // Progreso: barra decorativa y el texto que dice en qué paso estás.
    const progress = (
        <>
            <div aria-hidden className="flex gap-1.5">
                {steps.map((s, i) => (
                    <span key={s.id} className={`h-1.5 flex-1 rounded-full overflow-hidden transition-colors duration-500 ${dark ? "bg-crema/25" : "bg-tinta/15"}`}>
                        <span className={`block h-full rounded-full origin-left transition-[transform,background-color] duration-500 ease-out-soft ${dark ? "bg-crema" : "bg-oliva-profundo"} ${i <= index ? "scale-x-100" : "scale-x-0"}`} />
                    </span>
                ))}
            </div>
            <p aria-hidden className={`mt-2 text-center text-sm font-medium transition-colors duration-500 ${dark ? "text-crema" : "text-tinta"}`}>
                <span className="tabular-nums">{index + 1} de {steps.length}</span> · {steps[index].label}
            </p>
        </>
    );

    // Alto de pantalla menos el encabezado (68 px): en escritorio, paso y botones entran sin scroll.
    // Rejilla de tres filas: la sección ocupa las tres y la barra (arriba, en el
    // celular) y los botones (abajo) se apoyan encima. La sección deja ese lugar
    // libre con su propio relleno (pt/pb), así su fondo sigue por debajo.
    return (
        <div className="grid grid-rows-[auto_1fr_auto] min-h-[calc(100svh-4.25rem)]">
            <p className="sr-only" aria-live="polite">Paso {index + 1} de {steps.length}: {steps[index].label}</p>
            <div className="lg:hidden relative z-10 row-start-1 col-start-1 mx-auto w-full max-w-2xl px-4 sm:px-6 pt-4">{progress}</div>

            <div
                className="row-start-1 row-span-3 col-start-1 flex flex-col overflow-x-clip [&>div>section]:pt-14 [&>div>section]:pb-28 lg:[&>div>section]:pt-0 lg:[&>div>section]:pb-22 short:[&>div>section]:pb-20"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {steps.map((s, i) => (
                    <div
                        key={s.id}
                        ref={(el) => { panels.current[i] = el; }}
                        hidden={i !== index}
                        tabIndex={-1}
                        role="group"
                        aria-roledescription="paso"
                        aria-label={`${s.label} (${i + 1} de ${steps.length})`}
                        // Cada sección llena el alto disponible con su contenido centrado.
                        className={`flex-1 flex-col outline-none [&>section]:flex-1 [&>section]:flex [&>section]:flex-col [&>section]:justify-center [&>section>div]:w-full ${
                            i === index ? "flex" : ""
                        } ${i === index && dir === "next" ? "animate-step-next" : ""} ${i === index && dir === "prev" ? "animate-step-prev" : ""}`}
                    >
                        {s.content}
                    </div>
                ))}
            </div>

            <nav aria-label="Pasos de la invitación" className="relative z-10 row-start-3 col-start-1 self-end mx-auto w-full max-w-2xl lg:max-w-5xl px-4 sm:px-6 py-6 lg:py-4 short:py-3">
                {index === 0 ? (
                    <button type="button" onClick={() => go(1)} className={`${primary} w-full lg:max-w-md lg:mx-auto lg:flex min-h-16 text-lg`}>
                        Continuar
                        <ArrowRight className="w-5 h-5" aria-hidden />
                    </button>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-[12rem_1fr_12rem] lg:items-center gap-3 lg:gap-8">
                        <button type="button" onClick={() => go(index - 1)} className={secondary}>
                            <ArrowLeft className="w-5 h-5" aria-hidden />
                            Atrás
                        </button>
                        <div className="hidden lg:block lg:order-none">{progress}</div>
                        {index < last ? (
                            <button type="button" onClick={() => go(index + 1)} className={primary}>
                                Siguiente
                                <ArrowRight className="w-5 h-5" aria-hidden />
                            </button>
                        ) : (
                            <button type="button" onClick={() => go(0)} className={secondary}>
                                <RotateCcw className="w-5 h-5" aria-hidden />
                                Al inicio
                            </button>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
}
