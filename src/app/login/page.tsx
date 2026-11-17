import Link from 'next/link';
import { signIn } from '@/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { Monogram } from '@/components/Monogram';
import { BotanicalShadow } from '@/components/BotanicalShadow';
import { Arch, Band } from '@/components/Brand';
import { WEDDING_DATE_LABEL } from '@/lib/wedding';
import { Armchair, CalendarCheck, MapPin } from 'lucide-react';

// Qué encuentra el invitado al entrar (sin datos privados: la página es pública).
const INSIDE = [
    { icon: CalendarCheck, text: 'Confirmar asistencia' },
    { icon: Armchair, text: 'Ver tu mesa' },
    { icon: MapPin, text: 'Cómo llegar' },
];

const SUPPORT_MAIL =
    "mailto:soporte@davidyrocio.wedding?subject=Problema%20con%20la%20invitación&body=Hola,%20no%20puedo%20entrar%20a%20la%20invitación.%20Mi%20correo%20es:%20";

// Primer contacto del invitado (público): sin fotos, historia ni datos privados.
export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const error = resolvedParams?.error;
    // Tras entrar: la portada, que ofrece «Ver mi invitación» y, a los admins, el panel.
    const callbackUrl = typeof resolvedParams?.callbackUrl === "string" && resolvedParams.callbackUrl.startsWith("/") && !resolvedParams.callbackUrl.startsWith("//")
        ? resolvedParams.callbackUrl
        : "/";

    return (
        <main className="relative min-h-dvh overflow-hidden bg-rosa text-tinta flex flex-col">
            <BotanicalShadow variant="rama" sway className="absolute -top-16 -left-24 w-[34rem] max-w-[95vw] text-rosa-profundo/30" />
            <BotanicalShadow variant="orquidea" sway className="absolute -bottom-24 -right-28 w-[36rem] max-w-[100vw] text-rosa-profundo/25 [animation-delay:-6s]" />

            <div className="relative flex-1 grid place-items-center px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10">
                <Arch className="w-full max-w-md animate-rise" innerClassName="text-center">
                    <Monogram size="lg" className="mx-auto" />
                    <h1 className="mt-5 font-serif text-5xl sm:text-7xl leading-[0.95] text-oliva-profundo text-balance">Tu invitación</h1>
                    <p className="mt-3 font-text text-lg text-balance"><span className="whitespace-nowrap">Boda de David y Rocío ·</span> <span className="whitespace-nowrap">{WEDDING_DATE_LABEL}</span></p>

                    <p className="mt-8 font-text text-base leading-relaxed text-pretty">
                        Entra con la cuenta de Google del correo al que te enviamos la invitación. No necesitas contraseña.
                    </p>

                    <ul aria-label="En tu invitación" className="mt-6 grid grid-cols-3 gap-2">
                        {INSIDE.map(({ icon: Icon, text }, i) => (
                            <li key={text} className="animate-rise flex flex-col items-center gap-2 text-center text-label font-medium leading-tight" style={{ animationDelay: `${200 + i * 90}ms` }}>
                                <span aria-hidden className="w-11 h-11 rounded-full bg-rubor text-rosa-profundo flex items-center justify-center">
                                    <Icon className="w-5 h-5" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>

                    {error === "AccessDenied" && (
                        <div role="alert" className="mt-6 rounded-xl bg-error/10 p-4 text-left text-sm text-error space-y-1">
                            <p className="font-medium">No encontramos ese correo en la lista de invitados.</p>
                            <p>
                                Prueba con otra cuenta de Google o{" "}
                                <a href={SUPPORT_MAIL} className="underline font-medium">escríbenos</a>{" "}
                                y lo revisamos.
                            </p>
                        </div>
                    )}

                    <form
                        className="mt-6"
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: callbackUrl })
                        }}
                    >
                        <SubmitButton />
                    </form>
                </Arch>
            </div>

            <Band className="relative">
                <p>www.davidyrocio.wedding</p>
                <p className="mt-1 text-label">
                    Al entrar aceptas los{" "}
                    <Link href="/terminos" className="underline hover:no-underline">términos y condiciones</Link>{" "}
                    y la{" "}
                    <Link href="/privacidad" className="underline hover:no-underline">política de privacidad</Link>.
                </p>
            </Band>
        </main>
    );
}
