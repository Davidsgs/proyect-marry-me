import { Pinyon_Script } from 'next/font/google';
import { signIn } from '@/auth';
import { SubmitButton } from '@/components/SubmitButton';

const pinyonScript = Pinyon_Script({
    weight: "400",
    subsets: ["latin"],
});

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const error = resolvedParams?.error;

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-sage-darkest">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
                style={{ backgroundImage: "url('/background-placeholder.webp')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-wedding-sage-darkest/75 text-center"></div>

            <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-md py-12 justify-center">
                <h1 className={`${pinyonScript.className} text-6xl md:text-7xl text-wedding-blush-light drop-shadow-xl mb-8 text-center`}>
                    Acceso Privado
                </h1>

                <form
                    action={async () => {
                        "use server"
                        await signIn("google")
                    }}
                    className="w-full flex flex-col gap-4"
                >
                    {error === "AccessDenied" && (
                        <div className="text-red-300 text-sm md:text-base text-center mt-2 drop-shadow-md bg-red-900/40 p-3 rounded-md backdrop-blur-sm tracking-wide flex flex-col gap-2">
                            <p>No pudimos reconocer tu correo.</p>
                            <p>
                                Si crees que esto es un error, por favor, ponte en contacto con nuestro{" "}
                                <a
                                    href="mailto:soporte@davidyrocio.wedding?subject=Problema%20con%20la%20invitación&body=Hola,%20estoy%20teniendo%20un%20problema%20con%20la%20invitación.%20¿Me%20darían%20una%20mano%20para%20acceder?%20Gracias."
                                    className="underline font-medium hover:text-red-100 transition-colors"
                                >
                                    equipo de soporte
                                </a>.
                            </p>
                        </div>
                    )}
                    <SubmitButton />
                </form>
            </div>
        </main>
    );
}
