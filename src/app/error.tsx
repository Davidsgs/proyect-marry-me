"use client" // Los error boundaries deben ser Client Components

import Link from "next/link"
import { RotateCcw, Mail } from "lucide-react"
import { Monogram } from "@/components/Monogram"
import { Arch } from "@/components/Brand"

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
        <main className="min-h-dvh bg-rubor text-tinta flex items-center justify-center px-4 py-12">
            <Arch className="w-full max-w-md" innerClassName="text-center space-y-6">
                <Monogram size="md" className="mx-auto" />
                <h1 className="font-serif text-5xl leading-none text-oliva-profundo">Algo no salió bien</h1>
                <p className="font-text text-base leading-relaxed">
                    Puede ser un problema de conexión. Vuelve a intentarlo; si sigue pasando, escríbenos y lo resolvemos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-primary text-on-primary font-medium shadow-sm hover:bg-[#4a5745] transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Volver a intentar
                    </button>
                    <a
                        href={mailToUrl}
                        className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-surface-container-low text-on-surface font-medium hover:bg-surface-container transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        Escribirnos
                    </a>
                </div>
                <Link href="/" className="inline-block text-sm text-on-surface-variant hover:text-primary underline">
                    Ir a la portada
                </Link>
            </Arch>
        </main>
    )
}
