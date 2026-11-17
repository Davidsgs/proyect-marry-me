"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, AlertTriangle } from "lucide-react";

// Aviso breve tras guardar o fallar. Uso:
//   const notify = useNotify();  notify("Mesa guardada");  notify("No se pudo guardar", "error");
//
// El contenedor es un popover="manual" en la capa superior: se vuelve a abrir
// con cada aviso, así queda por encima de cualquier <dialog> abierto (p. ej. un
// error al guardar desde la ficha de una familia). Decisión de la pareja: mostrar
// el aviso encima de la ventana en vez de esperar a que se cierre.
// Anuncio: ariaNotify() donde existe (un modal deja inerte lo de fuera); si no,
// la región aria-live de siempre.
type Tone = "ok" | "error";
const NoticeContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

const hasAriaNotify = () => typeof document !== "undefined" && "ariaNotify" in document;
const noopSubscribe = () => () => {};

export function useNotify() {
    const ctx = useContext(NoticeContext);
    if (!ctx) throw new Error("useNotify debe usarse dentro de <NoticeProvider>");
    return ctx;
}

export function NoticeProvider({ children }: { children: React.ReactNode }) {
    const [notice, setNotice] = useState<{ id: number; message: string; tone: Tone } | null>(null);
    // Con ariaNotify, la región deja de ser aria-live (evita doble anuncio). En el
    // servidor y al hidratar se asume que no existe.
    const supportsAriaNotify = useSyncExternalStore(noopSubscribe, hasAriaNotify, () => false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const layer = useRef<HTMLDivElement>(null);
    const seq = useRef(0);

    const notify = useCallback((message: string, tone: Tone = "ok") => {
        if (timer.current) clearTimeout(timer.current);
        setNotice({ id: ++seq.current, message, tone });
        timer.current = setTimeout(() => setNotice(null), tone === "error" ? 6000 : 3000);
        if (hasAriaNotify()) {
            (document as Document & { ariaNotify: (m: string, o?: { priority?: string }) => void })
                .ariaNotify(message, { priority: tone === "error" ? "high" : "normal" });
        }
    }, []);

    // Reabrir en cada aviso lo sube al final de la capa superior (encima de un diálogo abierto después).
    useEffect(() => {
        const el = layer.current;
        if (!el || !("showPopover" in el)) return;
        if (el.matches(":popover-open")) el.hidePopover();
        if (notice) el.showPopover();
    }, [notice]);

    return (
        <NoticeContext.Provider value={notify}>
            {children}
            <div
                ref={layer}
                popover="manual"
                role="status"
                aria-live={supportsAriaNotify ? undefined : "polite"}
                className="pointer-events-none fixed inset-x-0 top-auto bottom-[calc(6.5rem+env(safe-area-inset-bottom))] m-0 w-auto border-0 bg-transparent p-0 px-4 overflow-visible open:flex justify-center lg:bottom-8"
            >
                {notice && (
                    <p
                        key={notice.id}
                        className={`pointer-events-auto inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 ${
                            notice.tone === "error" ? "bg-error text-on-error" : "bg-tinta text-crema"
                        }`}
                    >
                        {notice.tone === "error" ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                        {notice.message}
                    </p>
                )}
            </div>
        </NoticeContext.Provider>
    );
}
