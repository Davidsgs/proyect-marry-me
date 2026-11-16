// Sombras botánicas del manual de marca: siluetas de ramas proyectadas sobre el
// campo de color. Decorativas (aria-hidden). La geometría se calcula una vez al
// cargar el módulo y es siempre la misma.

type Pt = [number, number];

// Hoja lanceolada de largo 100 apuntando al eje +x.
const LEAF = "M0 0C18-16 62-20 100 0C62 20 18 16 0 0Z";
// Pétalo redondeado de largo 100.
const PETAL = "M0 0C10-30 70-42 100 0C70 42 10 30 0 0Z";

function bezier(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

function angleAt(p0: Pt, p1: Pt, p2: Pt, t: number): number {
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
}

type Shape = { d: string; transform: string };
type Drawing = { viewBox: string; stems: string[]; shapes: Shape[] };

function branch(
    p0: Pt, p1: Pt, p2: Pt,
    count: number,
    { spread, scale, start = 0.12, petal = false }: { spread: number; scale: (t: number) => number; start?: number; petal?: boolean },
): Shape[] {
    const out: Shape[] = [];
    for (let i = 0; i < count; i++) {
        const t = start + ((1 - start) * i) / Math.max(1, count - 1);
        const [x, y] = bezier(p0, p1, p2, t);
        const side = i % 2 === 0 ? 1 : -1;
        const a = angleAt(p0, p1, p2, t) + side * spread;
        const s = scale(t);
        out.push({ d: petal ? PETAL : LEAF, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${s.toFixed(2)} ${(s * 0.9).toFixed(2)})` });
    }
    return out;
}

function flower(x: number, y: number, r: number, turn: number): Shape[] {
    return Array.from({ length: 5 }, (_, i) => ({
        d: PETAL,
        transform: `translate(${x} ${y}) rotate(${turn + i * 72}) scale(${(r / 100).toFixed(2)})`,
    }));
}

function quad(p0: Pt, p1: Pt, p2: Pt): string {
    return `M${p0.join(" ")}Q${p1.join(" ")} ${p2.join(" ")}`;
}

// Rama de hojas anchas (portada del manual, esquina izquierda).
const RAMA: Drawing = (() => {
    const main: [Pt, Pt, Pt] = [[20, 20], [260, 160], [360, 560]];
    const side: [Pt, Pt, Pt] = [[180, 150], [330, 140], [470, 260]];
    return {
        viewBox: "0 0 600 640",
        stems: [quad(...main), quad(...side)],
        shapes: [
            ...branch(...main, 11, { spread: 52, scale: (t) => 1.3 + Math.sin(t * Math.PI) * 0.9 }),
            ...branch(...side, 6, { spread: 48, scale: (t) => 1.6 - t * 0.6, start: 0.2 }),
        ],
    };
})();

// Rama de orquídea (portada y página de historia, lado derecho).
const ORQUIDEA: Drawing = (() => {
    const stem: [Pt, Pt, Pt] = [[560, 20], [300, 120], [240, 600]];
    const flowers: Shape[] = [];
    for (let i = 0; i < 6; i++) {
        const t = 0.15 + i * 0.14;
        const [x, y] = bezier(...stem, t);
        const off = i % 2 === 0 ? 48 : -44;
        flowers.push(...flower(Math.round(x + off), Math.round(y), 46 - i * 3, i * 23));
    }
    return {
        viewBox: "0 0 600 640",
        stems: [quad(...stem)],
        shapes: [...flowers, ...branch(...stem, 4, { spread: 70, scale: () => 0.5, start: 0.82, petal: true })],
    };
})();

// Espiga fina con hojitas (página de contacto del manual, abajo a la derecha).
const ESPIGA: Drawing = (() => {
    const a: [Pt, Pt, Pt] = [[300, 640], [290, 360], [200, 40]];
    const b: [Pt, Pt, Pt] = [[300, 640], [360, 400], [470, 140]];
    return {
        viewBox: "0 0 600 640",
        stems: [quad(...a), quad(...b)],
        shapes: [
            ...branch(...a, 10, { spread: 28, scale: (t) => 0.5 + t * 0.4, start: 0.4 }),
            ...branch(...b, 8, { spread: 30, scale: (t) => 0.45 + t * 0.35, start: 0.45 }),
        ],
    };
})();

const DRAWINGS = { rama: RAMA, orquidea: ORQUIDEA, espiga: ESPIGA } as const;

export function BotanicalShadow({
    variant = "rama",
    className = "",
    sway = false,
}: {
    variant?: keyof typeof DRAWINGS;
    /** Posición, tamaño y color (usa text-…; el dibujo pinta con currentColor). */
    className?: string;
    /** Vaivén lento. Se desactiva solo con movimiento reducido. */
    sway?: boolean;
}) {
    const art = DRAWINGS[variant];
    return (
        <svg
            viewBox={art.viewBox}
            aria-hidden
            focusable="false"
            className={`pointer-events-none select-none blur-[5px] ${sway ? "animate-sway" : ""} ${className}`}
        >
            <g fill="currentColor" stroke="currentColor" strokeLinecap="round">
                {art.stems.map((d) => (
                    <path key={d} d={d} fill="none" strokeWidth="9" />
                ))}
                {art.shapes.map((s, i) => (
                    <path key={i} d={s.d} transform={s.transform} stroke="none" />
                ))}
            </g>
        </svg>
    );
}
