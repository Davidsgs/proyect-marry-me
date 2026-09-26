"use client" // Los error boundaries deben ser Client Components

import Link from "next/link"
import { RotateCcw, Mail } from "lucide-react"
import { Monogram } from "@/components/Monogram"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const detail = error.digest ? `Código: ${error.digest}` : `${error.name}: ${error.message}`
    const mailToUrl =
        "mailto:soporte@davidyrocio.wedding" +
        `?subject=${encodeURIComponent("Problema en la invitación")}` +
        `&body=${encodeURIComponent(`Hola, la página me mostró un error.\n\n${detail}`)}`

    return (
        <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center space-y-6">
                <Monogram size="md" className="text-primary" />
                <h1 className="font-serif italic text-4xl text-primary">Algo no salió bien</h1>
                <p className="text-base text-on-surface-variant leading-relaxed">
                    Puede ser un problema de conexión. Vuelve a intentarlo; si sigue pasando, escríbenos y lo resolvemos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-medium shadow-sm hover:shadow-md transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Volver a intentar
                    </button>
                    <a
                        href={mailToUrl}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low text-on-surface font-medium hover:bg-surface-container transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        Escribirnos
                    </a>
                </div>
                <Link href="/" className="inline-block text-sm text-on-surface-variant hover:text-primary underline underline-offset-4">
                    Ir a la portada
                </Link>
            </div>
        </main>
    )
}
