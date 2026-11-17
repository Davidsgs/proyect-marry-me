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
