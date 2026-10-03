import Link from 'next/link';
import { signIn } from '@/auth';
import { SubmitButton } from '@/components/SubmitButton';
import { Monogram, Sprig } from '@/components/Monogram';
import { WEDDING_DATE_LABEL } from '@/lib/wedding';

const SUPPORT_MAIL =
    "mailto:soporte@davidyrocio.wedding?subject=Problema%20con%20la%20invitación&body=Hola,%20no%20puedo%20entrar%20a%20la%20invitación.%20Mi%20correo%20es:%20";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const error = resolvedParams?.error;
    // Tras entrar: /welcome deja elegir a los admins y manda a los invitados a su panel.
    const callbackUrl = typeof resolvedParams?.callbackUrl === "string" && resolvedParams.callbackUrl.startsWith("/") && !resolvedParams.callbackUrl.startsWith("//")
        ? resolvedParams.callbackUrl
        : "/welcome";

    return (
        <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center space-y-8">
                <div className="space-y-4">
                    <Monogram size="lg" className="mx-auto" />
                    <Sprig className="w-28 mx-auto text-wedding-olive" />
                    <h1 className="font-serif italic text-4xl text-primary">Tu invitación</h1>
                    <p className="text-on-surface-variant text-sm">David &amp; Rocío · {WEDDING_DATE_LABEL}</p>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(81,68,67,0.06)] space-y-5 text-left">
                    <p className="text-base text-on-surface leading-relaxed">
                        Entra con la <strong className="font-medium">cuenta de Google del correo al que te enviamos la invitación</strong>.
                        Así sabremos quién eres sin necesidad de contraseñas.
                    </p>

                    {error === "AccessDenied" && (
                        <div role="alert" className="rounded-xl bg-error/10 p-4 text-sm text-error space-y-1">
                            <p className="font-medium">No encontramos ese correo en la lista de invitados.</p>
                            <p>
                                Prueba con otra cuenta de Google o{" "}
                                <a href={SUPPORT_MAIL} className="underline underline-offset-4 font-medium">escríbenos</a>{" "}
                                y lo revisamos.
                            </p>
                        </div>
                    )}

                    <form
                        action={async () => {
                            "use server"
                            await signIn("google", { redirectTo: callbackUrl })
                        }}
                    >
                        <SubmitButton />
                    </form>
                </div>

                <Link href="/" className="inline-block text-sm text-on-surface-variant hover:text-primary underline underline-offset-4">
                    Volver a la portada
                </Link>
            </div>
        </main>
    );
}
