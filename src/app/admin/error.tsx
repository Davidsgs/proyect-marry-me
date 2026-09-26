"use client"; // Los error boundaries deben ser Client Components

import Link from "next/link";
import { RotateCcw } from "lucide-react";

// Error del panel admin: se queda dentro del layout (sidebar y nav visibles) y
// ofrece reintentar, en lugar de la pantalla de invitados que pide escribir a soporte.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="max-w-md mx-auto py-16 text-center space-y-6">
            <h1 className="font-serif italic text-3xl text-primary">No se pudo completar la acción</h1>
            <p className="text-sm font-sans text-on-surface-variant leading-relaxed">
                Puede ser un problema de conexión o que no tengas permiso para este cambio.
                Si te modificaron los permisos hace poco, cierra sesión y vuelve a entrar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={reset}
                    className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-sm font-medium"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reintentar
                </button>
                <Link
                    href="/admin"
                    className="flex items-center justify-center px-6 py-3 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors font-sans text-sm font-medium"
                >
                    Volver al resumen
                </Link>
            </div>
        </div>
    );
}
