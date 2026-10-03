import Link from "next/link";
import { Monogram } from "@/components/Monogram";

export const SUPPORT_EMAIL = "soporte@davidyrocio.wedding";
export const LEGAL_UPDATED = "2 de octubre de 2026";

// Plantilla de lectura para las páginas legales (públicas, sin sesión).
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-surface px-4 py-12">
            <article className="max-w-2xl mx-auto">
                <header className="text-center space-y-4 mb-10">
                    <Link href="/" aria-label="Ir a la portada" className="inline-block">
                        <Monogram size="md" className="mx-auto" />
                    </Link>
                    <h1 className="font-serif italic text-4xl text-primary text-balance">{title}</h1>
                    <p className="text-sm text-on-surface-variant">Última actualización: {LEGAL_UPDATED}</p>
                </header>

                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-10 shadow-[0_4px_24px_rgba(81,68,67,0.06)] space-y-8 text-base text-on-surface leading-relaxed [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-primary [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_p+p]:mt-3 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
                    {children}
                </div>

                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-on-surface-variant">
                    <Link href="/privacidad" className="hover:text-primary underline underline-offset-4">Política de privacidad</Link>
                    <Link href="/terminos" className="hover:text-primary underline underline-offset-4">Términos y condiciones</Link>
                    <Link href="/login" className="hover:text-primary underline underline-offset-4">Entrar a la invitación</Link>
                </nav>
            </article>
        </main>
    );
}
