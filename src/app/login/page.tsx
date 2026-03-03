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
                    {error && (
                        <p className="text-red-300 text-sm md:text-base text-center mt-2 drop-shadow-md bg-red-900/40 p-2 rounded backdrop-blur-sm tracking-wide">
                            Acceso denegado. Verifica que tu correo esté autorizado.
                        </p>
                    )}
                    <SubmitButton />
                </form>
            </div>
        </main>
    );
}
