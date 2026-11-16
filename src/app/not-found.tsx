import Link from "next/link";
import { Monogram } from "@/components/Monogram";
import { BotanicalShadow } from "@/components/BotanicalShadow";
import { Arch } from "@/components/Brand";

// Enlace roto o mal copiado: misma estética del login, con salida a la invitación.
export default function NotFound() {
    return (
        <main className="relative min-h-dvh overflow-hidden bg-rubor text-tinta grid place-items-center px-4 py-12">
            <BotanicalShadow variant="rama" className="absolute -top-16 -left-24 w-[30rem] max-w-[90vw] text-rosa-profundo/20" />
            <Arch className="relative w-full max-w-md animate-rise" innerClassName="text-center">
                <Monogram size="md" className="mx-auto" />
                <h1 className="mt-5 font-serif text-5xl leading-none text-oliva-profundo text-balance">No encontramos esta página</h1>
                <p className="mt-4 font-text text-base leading-relaxed text-pretty">
                    Puede que el enlace esté incompleto o haya cambiado. Tu invitación sigue en su sitio.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-8 inline-flex items-center justify-center min-h-12 px-8 rounded-full bg-primary text-on-primary font-sans font-medium hover:bg-[#4a5745] active:scale-[0.98] transition-[background-color,transform] duration-150"
                >
                    Ir a mi invitación
                </Link>
            </Arch>
        </main>
    );
}
