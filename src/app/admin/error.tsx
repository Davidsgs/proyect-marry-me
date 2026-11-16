"use client"; // Los error boundaries deben ser Client Components

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { btnPrimary, btnSecondary } from "./_components/ui";

// Error del panel admin: se queda dentro del layout (barra lateral y navegación
// visibles) y ofrece reintentar, en lugar de la pantalla de invitados.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="max-w-md mx-auto py-16 text-center space-y-6">
            <h1 className="font-serif text-4xl leading-tight text-primary text-balance">No se pudo completar la acción</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
                Puede ser un problema de conexión o que no tengas permiso para este cambio.
                Si te modificaron los permisos hace poco, cierra sesión y vuelve a entrar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button type="button" onClick={reset} className={btnPrimary}>
                    <RotateCcw className="w-4 h-4" aria-hidden />
                    Reintentar
                </button>
                <Link href="/admin" className={btnSecondary}>
                    Volver al resumen
                </Link>
            </div>
        </div>
    );
}
