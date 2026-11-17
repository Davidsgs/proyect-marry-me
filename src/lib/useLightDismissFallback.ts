"use client";

import { useEffect, type RefObject } from "react";

// Cierre al pulsar fuera de un <dialog closedby="any"> en navegadores sin
// `closedby` (Safari). Mira la posición del puntero, no event.target: así no se
// cierra al pulsar el relleno del diálogo, y exige que la pulsación empiece y
// termine fuera, para que seleccionar texto y soltar en el fondo no lo cierre.
export function useLightDismissFallback(ref: RefObject<HTMLDialogElement | null>, onDismiss: () => void) {
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
        const outside = (e: PointerEvent) => {
            const r = dialog.getBoundingClientRect();
            return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        const down = (e: PointerEvent) => { pressedOutside = outside(e); };
        const up = (e: PointerEvent) => { if (pressedOutside && outside(e)) onDismiss(); };
        dialog.addEventListener("pointerdown", down);
        dialog.addEventListener("pointerup", up);
        return () => {
            dialog.removeEventListener("pointerdown", down);
            dialog.removeEventListener("pointerup", up);
        };
    }, [ref, onDismiss]);
}
