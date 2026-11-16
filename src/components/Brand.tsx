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
