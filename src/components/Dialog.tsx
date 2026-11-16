"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// <dialog> nativo: foco atrapado, Escape y clic fuera cierran. En móvil se
// presenta como hoja inferior; desde sm, centrado.
export function Dialog({
    open,
    onClose,
    title,
    description,
    children,
    size = "md",
    labelledBy,
}: {
    open: boolean;
    onClose: () => void;
    /** Título visible. Si no se pasa, usar labelledBy con el id de un título propio. */
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    labelledBy?: string;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
    }, [open]);

    const width = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];

    return (
        <dialog
            ref={ref}
            aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            onClick={(e) => {
                if (e.target === ref.current) onClose();
            }}
            className={`m-0 mt-auto w-full max-w-none max-h-[92dvh] rounded-t-3xl bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-tinta/35 open:animate-in open:slide-in-from-bottom-6 open:fade-in open:duration-200 sm:m-auto sm:rounded-3xl sm:open:slide-in-from-bottom-0 sm:open:zoom-in-95 ${width}`}
        >
            {open && (
                <div className="flex max-h-[92dvh] flex-col">
                    {title && (
                        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
                            <div className="min-w-0">
                                <h2 id={titleId} className="font-serif text-3xl leading-tight text-primary text-balance">{title}</h2>
                                {description && <p className="mt-1 text-sm text-on-surface-variant text-pretty">{description}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    <div className="overflow-y-auto overscroll-contain px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
                </div>
            )}
        </dialog>
    );
}
