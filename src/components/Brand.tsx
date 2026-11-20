// Piezas del manual de marca compartidas por invitado y panel.

// Arco crema con la parte superior en semicírculo (página «Historia» del manual).
// El radio superior es medio ancho del propio arco (50cqw sobre el contenedor
// exterior): un radio «infinito» haría que el navegador anulase el inferior.
export function Arch({
    children,
    className = "",
    innerClassName = "",
    as: Tag = "div",
    ...rest
}: {
    children: React.ReactNode;
    className?: string;
    /** Clases del papel interior (espaciado entre hijos, alineación). */
    innerClassName?: string;
    as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) {
    return (
        <Tag className={`@container ${className}`} {...rest}>
            <div className={`bg-crema rounded-t-[50cqw] rounded-b-[2rem] px-6 pb-10 pt-[min(30cqw,8.5rem)] sm:px-12 ${innerClassName}`}>
                {children}
            </div>
        </Tag>
    );
}

// Foto en marco con pie ancho, inclinada (manual: índice, historia, contacto).
// Se usa con <img> plano: las fotos privadas no pasan por /_next/image.
export function Polaroid({
    src,
    alt,
    rotate = -6,
    tone = "oliva",
    caption,
    className = "",
    width = 600,
    height = 600,
}: {
    src: string;
    alt: string;
    rotate?: number;
    tone?: "oliva" | "crema";
    caption?: string;
    className?: string;
    width?: number;
    height?: number;
}) {
    return (
        <figure
            className={`p-3 pb-12 shadow-md sm:p-4 sm:pb-16 ${tone === "oliva" ? "bg-oliva text-crema" : "bg-crema text-tinta"} ${className}`}
            style={{ transform: `rotate(${rotate}deg)` }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
            {caption && <figcaption className="mt-3 text-center font-text text-sm">{caption}</figcaption>}
        </figure>
    );
}

// Franja oliva de lado a lado con una sola línea (pie de las láminas del manual).
export function Band({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-oliva-profundo text-crema px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm ${className}`}>
            {children}
        </div>
    );
}

// Ramita ornamental (hojas del manual) para separar bloques dentro de una misma
// pieza, como en una carta impresa. Decorativa: currentColor y aria-hidden.
export function Sprig({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 96 20" fill="none" aria-hidden className={`w-24 h-5 ${className}`}>
            <path d="M8 10h30M58 10h30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <path d="M48 10C44 4 38 3 34 5c3 4 9 6 14 5Z" fill="currentColor" opacity="0.75" />
            <path d="M48 10c4-6 10-7 14-5-3 4-9 6-14 5Z" fill="currentColor" opacity="0.75" />
            <circle cx="48" cy="10" r="2" fill="currentColor" />
        </svg>
    );
}

// Corazón de trazo fino (mismo dibujo en los adornos de «Nuestra historia»).
// pathLength normaliza el largo para que mg-draw lo dibuje completo.
export const HEART_PATH = "M12 20.5S3.5 15.2 3.5 9.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.2c0 6-8.5 11.3-8.5 11.3Z";

// Ramita del manual con un corazón al centro que se dibuja solo al entrar.
export function HeartSprig({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 24" fill="none" aria-hidden className={`w-30 h-6 ${className}`}>
            <path className="mg-grow mg-d-4 origin-center" d="M6 12h30M84 12h30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <path d="M44 12c-4-5-9-6-12-4 3 4 8 5 12 4Z" fill="currentColor" opacity="0.7" className="mg-pop mg-d-5" />
            <path d="M76 12c4-5 9-6 12-4-3 4-8 5-12 4Z" fill="currentColor" opacity="0.7" className="mg-pop mg-d-5" />
            <g transform="translate(48 0)">
                <path d={HEART_PATH} pathLength={64} className="mg-draw mg-d-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" style={{ "--len": 64 } as React.CSSProperties} />
            </g>
        </svg>
    );
}

// Corazones y destellos de línea que suben despacio por el fondo de una sección
// (el padre debe ser `relative overflow-hidden`). Posiciones fijas, cada uno con
// su ritmo: se ve vivo sin distraer de la lectura.
const FLOATERS: { left: string; bottom: string; size: number; t: number; delay: number; dx: string; r: string; o: number; kind: "heart" | "spark" }[] = [
    { left: "6%", bottom: "8%", size: 22, t: 11, delay: 0.4, dx: "1rem", r: "-12deg", o: 0.5, kind: "heart" },
    { left: "14%", bottom: "38%", size: 12, t: 8, delay: 3.1, dx: "-0.5rem", r: "8deg", o: 0.45, kind: "spark" },
    { left: "10%", bottom: "62%", size: 16, t: 10, delay: 5.6, dx: "0.75rem", r: "10deg", o: 0.4, kind: "heart" },
    { left: "88%", bottom: "12%", size: 18, t: 12, delay: 1.8, dx: "-1rem", r: "14deg", o: 0.5, kind: "heart" },
    { left: "92%", bottom: "46%", size: 12, t: 9, delay: 4.4, dx: "0.5rem", r: "-6deg", o: 0.45, kind: "spark" },
    { left: "84%", bottom: "70%", size: 14, t: 10.5, delay: 7.2, dx: "-0.75rem", r: "-10deg", o: 0.4, kind: "heart" },
    { left: "50%", bottom: "2%", size: 14, t: 13, delay: 6.3, dx: "0.5rem", r: "6deg", o: 0.35, kind: "heart" },
];

export function FloatingHearts({ className = "" }: { className?: string }) {
    return (
        <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
            {FLOATERS.map((f, i) => (
                <svg
                    key={i}
                    viewBox="0 0 24 24"
                    fill="none"
                    className="animate-heart-float absolute"
                    style={{ left: f.left, bottom: f.bottom, width: f.size, height: f.size, "--t": `${f.t}s`, "--delay": `${f.delay}s`, "--dx": f.dx, "--r": f.r, "--o": f.o } as React.CSSProperties}
                >
                    {f.kind === "heart"
                        ? <path d={HEART_PATH} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        : <path d="M12 3v18M3 12h18M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />}
                </svg>
            ))}
        </div>
    );
}

// Pétalos que salen de un punto (al confirmar asistencia). Solo CSS, una vez;
// con «menos movimiento» no se dibujan. El padre debe ser `relative`.
const PETALS = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
export function PetalBurst() {
    return (
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
            {PETALS.map((angle, i) => (
                <span
                    key={angle}
                    className={`animate-petal absolute -ml-1 -mt-2 w-2 h-4 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] ${i % 3 === 0 ? "bg-salvia" : i % 3 === 1 ? "bg-rosa" : "bg-mono-r"}`}
                    style={{ "--angle": `${angle}deg`, animationDelay: `${(i % 4) * 40}ms` } as React.CSSProperties}
                />
            ))}
        </span>
    );
}
