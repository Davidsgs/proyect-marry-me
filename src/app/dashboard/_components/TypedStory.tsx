"use client";

import { useEffect, useRef, useState } from "react";
import { FastForward } from "lucide-react";

// «Nuestra historia» escrita como una carta: las letras aparecen una a una, a
// ritmo de persona (con variación, pausas entre palabras y más largas en comas y
// puntos), cuando el paso se ve por primera vez. El texto entero está siempre en
// la página (lo que falta, transparente): no hay saltos de maquetación y los
// lectores de pantalla lo leen completo. Tocar o hacer clic sobre el texto lo
// acelera mucho y otro toque lo vuelve al ritmo normal; un botón visible (también con teclado) lo muestra entero de
// una vez. Con «menos movimiento» el CSS lo muestra entero y no se escribe.
const LETTER_MS = 60;
const FAST = 12; // cuántas veces más rápido tras un toque o clic (el siguiente lo revierte)

function delayAfter(ch: string) {
    const jitter = 0.6 + Math.random() * 0.8; // 0.6–1.4: nadie escribe a ritmo fijo
    if (/[.!?…]/.test(ch)) return LETTER_MS * 10 * jitter;
    if (/[,;:]/.test(ch)) return LETTER_MS * 5 * jitter;
    if (ch === "\n") return LETTER_MS * 14 * jitter;
    if (ch === " ") return LETTER_MS * 1.6 * jitter;
    return LETTER_MS * jitter;
}

export default function TypedStory({ paragraphs, className = "" }: { paragraphs: string[]; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const full = paragraphs.join("\n");
    const total = full.length;
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    // Velocidad en una ref: la cadena de temporizadores en curso la lee en cada letra.
    const speed = useRef(1);

    // Empieza cuando el texto entra en pantalla (el paso oculto no cuenta).
    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setStarted(true);
                io.disconnect();
            }
        }, { threshold: 0.2 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let i = 0;
        let timer: ReturnType<typeof setTimeout>;
        const tick = () => {
            i += 1;
            setCount((c) => Math.max(c, i)); // un toque pudo haberlo completado
            if (i >= total) return;
            timer = setTimeout(tick, delayAfter(full[i - 1]) / speed.current);
        };
        // Deja terminar la entrada del paso antes de empezar a escribir.
        timer = setTimeout(tick, 900);
        return () => clearTimeout(timer);
    }, [started, full, total]);

    const typing = started && count < total;
    // Dónde empieza cada párrafo dentro del texto completo (+1: el salto entre párrafos).
    const starts = paragraphs.map((_, i) => paragraphs.slice(0, i).reduce((n, q) => n + q.length + 1, 0));
    return (
        <div ref={ref} onClick={() => { speed.current = speed.current === 1 ? FAST : 1; }} className={typing ? "cursor-pointer" : ""}>
            <div className={className}>
            {paragraphs.map((p, idx) => {
                const start = starts[idx];
                const shown = Math.max(0, Math.min(count - start, p.length));
                const caretHere = typing && count >= start && count <= start + p.length;
                return (
                    <p key={idx} className="whitespace-pre-line">
                        {p.slice(0, shown)}
                        {caretHere && (
                            <span aria-hidden className="inline-block w-0.5 h-[1.1em] -mr-0.5 align-[-0.2em] bg-rosa-profundo animate-pulse" />
                        )}
                        <span className="opacity-0 motion-reduce:opacity-100">{p.slice(shown)}</span>
                    </p>
                );
            })}
            </div>
            {/* Siempre en el flujo (invisible cuando no escribe) para que nada salte al terminar. */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCount(total); }}
                className={`mx-auto mt-3 short:mt-1 flex items-center gap-1.5 min-h-11 px-4 rounded-xl font-sans text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors motion-reduce:hidden ${typing ? "" : "invisible"}`}
            >
                <FastForward className="w-4 h-4" aria-hidden />
                Mostrar la carta completa
            </button>
        </div>
    );
}
