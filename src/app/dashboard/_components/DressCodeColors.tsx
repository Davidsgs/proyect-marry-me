"use client";

import { useRef } from "react";
import { X, Ban } from "lucide-react";
import { DRESS_CODE, type AvoidColor } from "@/lib/wedding";

// Colores que no se deben usar: muestras pequeñas (cuadro blanco con el color) y,
// al tocarlas, una ventana con todos los colores en grande.
export default function DressCodeColors() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const groups = [
        { who: "Mujeres", colors: DRESS_CODE.women },
        { who: "Hombres", colors: DRESS_CODE.men },
    ];

    return (
        <>
            <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
                className="mt-2 flex flex-col items-center gap-2 rounded-xl px-3 py-2 hover:bg-surface-container-low transition-colors"
                aria-haspopup="dialog"
            >
                <span className="block text-sm text-on-surface-variant">Colores a evitar</span>
                {groups.map((g) => (
                    <span key={g.who} className="flex flex-col items-center gap-1">
                        <span className="text-xs text-on-surface-variant">{g.who}</span>
                        <span className="flex justify-center gap-1.5">
                            {g.colors.map((c) => <Swatch key={c.hex} color={c} size="sm" />)}
                        </span>
                    </span>
                ))}
                <span className="block text-xs font-medium text-primary underline underline-offset-4">Ver colores</span>
            </button>

            <dialog
                ref={dialogRef}
                onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}
                aria-labelledby="dress-title"
                className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-on-surface/30 open:animate-in open:fade-in open:zoom-in-95 open:duration-150"
            >
                <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 id="dress-title" className="font-serif italic text-3xl text-primary">Vestimenta</h2>
                            <p className="text-sm text-on-surface-variant mt-1">
                                {DRESS_CODE.style}. Te pedimos evitar estos colores, reservados para la decoración y los novios.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => dialogRef.current?.close()}
                            aria-label="Cerrar"
                            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {groups.map((g) => (
                        <section key={g.who} className="space-y-3">
                            <h3 className="text-base font-medium text-on-surface text-center">{g.who}</h3>
                            <ul className="flex flex-wrap justify-center gap-4">
                                {g.colors.map((c) => (
                                    <li key={c.hex} className="flex flex-col items-center gap-2 text-center">
                                        <Swatch color={c} size="lg" />
                                        <span className="text-sm text-on-surface">{c.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </dialog>
        </>
    );
}

// Cuadro blanco con el color dentro. El borde interior hace visible el blanco/crema.
function Swatch({ color, size }: { color: AvoidColor; size: "sm" | "lg" }) {
    const box = size === "sm" ? "w-8 h-8 p-1 rounded-lg" : "w-20 h-20 p-2 rounded-2xl";
    const inner = size === "sm" ? "rounded-md" : "rounded-xl";
    return (
        <span
            className={`relative block bg-white shadow-[0_1px_4px_rgba(81,68,67,0.18)] ${box}`}
            role="img"
            aria-label={`${color.name} (no usar)`}
            title={color.name}
        >
            <span
                className={`block w-full h-full shadow-[inset_0_0_0_1px_rgba(81,68,67,0.12)] ${inner}`}
                style={{ backgroundColor: color.hex }}
            />
            {size === "lg" && (
                <Ban className="absolute -top-1.5 -right-1.5 w-6 h-6 p-1 rounded-full bg-surface-container-lowest text-error shadow-sm" aria-hidden />
            )}
        </span>
    );
}
