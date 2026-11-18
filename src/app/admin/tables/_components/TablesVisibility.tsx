"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { setTablesVisible } from "@/app/actions/tables";
import { useNotify } from "@/app/admin/_components/Notice";

// Interruptor global: si los invitados ven su mesa en la invitación. Oculta, ven
// «Estamos organizando las mesas». Optimista: si falla, vuelve al estado anterior.
export default function TablesVisibility({ initial, canWrite }: { initial: boolean; canWrite: boolean }) {
    const notify = useNotify();
    const [visible, setVisible] = useState(initial);
    const [, startTransition] = useTransition();
    const Icon = visible ? Eye : EyeOff;

    function toggle() {
        const next = !visible;
        setVisible(next);
        startTransition(async () => {
            try {
                await setTablesVisible(next);
                notify(next ? "Los invitados ya ven su mesa" : "Mesas ocultas para los invitados");
            } catch {
                setVisible(!next);
                notify("No se pudo cambiar la visibilidad de las mesas. Se deshizo el cambio.", "error");
            }
        });
    }

    return (
        <div className="flex items-center gap-4 rounded-3xl bg-surface-container-lowest px-5 py-4">
            <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${visible ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-low text-on-surface-variant"}`}>
                <Icon className="w-5 h-5" aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
                <p id="tables-visible-label" className="font-medium text-on-surface">
                    {visible ? "Los invitados ven su mesa" : "Mesas ocultas para los invitados"}
                </p>
                <p id="tables-visible-hint" className="text-sm text-on-surface-variant text-pretty">
                    {visible
                        ? "En «Tu mesa» ven su número y con quién la comparten. Los cambios se ven al momento."
                        : "En «Tu mesa» leen que estamos organizando las mesas. Actívalo cuando estén listas."}
                </p>
            </div>
            {canWrite && (
                <button
                    type="button"
                    role="switch"
                    aria-checked={visible}
                    aria-labelledby="tables-visible-label"
                    aria-describedby="tables-visible-hint"
                    onClick={toggle}
                    className={`relative shrink-0 w-14 h-8 rounded-full transition-colors duration-200 before:absolute before:-inset-2 ${visible ? "bg-primary" : "bg-[#8a8b80]"}`}
                >
                    <span
                        aria-hidden
                        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-surface-container-lowest shadow-sm transition-transform duration-200 ease-out ${visible ? "translate-x-6" : ""}`}
                    />
                </button>
            )}
        </div>
    );
}
