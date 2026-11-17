"use client";

import { useImperativeHandle, useLayoutEffect, useRef } from "react";
import { isImeEnter } from "@/lib/keys";

// Campo de texto que crece hacia abajo cuando el contenido no cabe, para poder
// leerlo entero. Por defecto es de una línea: Enter envía el formulario y los
// saltos de línea pegados se convierten en espacios. Con `multiline` admite
// párrafos (notas, descripciones). Usa field-sizing:content y, si el navegador
// no lo soporta, ajusta la altura a mano.
type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & {
    multiline?: boolean;
    ref?: React.Ref<HTMLTextAreaElement>;
};

const supportsFieldSizing = () => typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");

function fit(el: HTMLTextAreaElement | null) {
    if (!el || supportsFieldSizing()) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
}

export function GrowText({ multiline = false, className = "", onKeyDown, onChange, onInput, ref, enterKeyHint, ...rest }: Props) {
    const inner = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => inner.current!, []);
    // Valor controlado cambiado desde fuera (p. ej. al vaciar el formulario).
    useLayoutEffect(() => fit(inner.current), [rest.value]);

    return (
        <textarea
            {...rest}
            ref={inner}
            rows={1}
            enterKeyHint={enterKeyHint ?? (multiline ? undefined : "done")}
            onInput={(e) => {
                fit(e.currentTarget);
                onInput?.(e);
            }}
            onChange={(e) => {
                if (!multiline && /[\r\n]/.test(e.currentTarget.value)) {
                    e.currentTarget.value = e.currentTarget.value.replace(/\s*[\r\n]+\s*/g, " ");
                }
                onChange?.(e);
            }}
            onKeyDown={(e) => {
                onKeyDown?.(e);
                if (e.defaultPrevented || multiline || e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                if (isImeEnter(e)) return;
                e.currentTarget.form?.requestSubmit();
            }}
            className={`field-sizing-content resize-none ${multiline ? "max-h-[60vh] overflow-y-auto" : "overflow-hidden leading-6"} ${className}`}
        />
    );
}
