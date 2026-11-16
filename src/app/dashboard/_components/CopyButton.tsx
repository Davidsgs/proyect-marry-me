"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ value, label }: { value: string; label: string }) {
    const [state, setState] = useState<"idle" | "ok" | "error">("idle");

    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            setState("ok");
        } catch {
            setState("error");
        }
        setTimeout(() => setState("idle"), 2500);
    }

    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 min-h-11 px-4 rounded-xl bg-surface-container-low font-sans text-sm font-medium text-on-surface hover:bg-surface-container active:scale-[0.98] transition-[background-color,transform] duration-150"
        >
            {state === "ok" ? <Check className="w-4 h-4 text-on-secondary-container" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
            <span aria-live="polite">
                {state === "ok" ? "Copiado" : state === "error" ? "No se pudo copiar" : `Copiar ${label.toLowerCase()}`}
            </span>
        </button>
    );
}
