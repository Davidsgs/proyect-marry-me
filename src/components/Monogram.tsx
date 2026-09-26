// Monograma tipográfico «D R» provisional, hasta tener el monograma vectorial
// oficial (ver PRODUCT.md): D y R entrelazadas en Cormorant cursiva.
export function Monogram({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
    const scale = { sm: "text-3xl", md: "text-5xl", lg: "text-7xl sm:text-8xl" }[size];
    return (
        <span
            role="img"
            aria-label="David y Rocío"
            className={`inline-flex items-baseline font-serif italic leading-none select-none ${scale} ${className}`}
        >
            <span aria-hidden>D</span>
            <span aria-hidden className="-ml-[0.18em] mt-[0.22em] opacity-80">R</span>
        </span>
    );
}

// Rama de hojas dibujada en una sola línea; decorativa.
export function Sprig({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 24" fill="none" aria-hidden className={className}>
            <path d="M2 12h116" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".5" />
            <path
                d="M60 12c-6-7-14-8-20-6 4 5 12 7 20 6Zm0 0c6-7 14-8 20-6-4 5-12 7-20 6Zm-22 0c-4-4-9-5-13-4 2 3 7 5 13 4Zm44 0c4-4 9-5 13-4-2 3-7 5-13 4Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
            />
        </svg>
    );
}
