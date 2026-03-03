import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Pinyon_Script } from 'next/font/google';

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

    async function login(formData: FormData) {
        'use server';
        const password = formData.get('password');
        if (password === 'nuestraboda') {
            const cookieStore = await cookies();
            cookieStore.set('site_auth', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });
            redirect('/');
        } else {
            redirect('/login?error=true');
        }
    }

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

                <form action={login} className="w-full flex flex-col gap-4">
                    <input
                        type="password"
                        name="password"
                        placeholder="Ingresa la contraseña"
                        className="px-4 py-3 rounded-md bg-white/10 border border-wedding-cream/20 text-wedding-cream placeholder-wedding-cream/50 focus:outline-none focus:border-wedding-blush-light focus:bg-white/20 text-center tracking-widest text-lg md:text-xl backdrop-blur-sm transition-all"
                        required
                        autoFocus
                    />
                    {error && (
                        <p className="text-red-300 text-sm md:text-base text-center mt-2 drop-shadow-md bg-red-900/40 p-2 rounded backdrop-blur-sm tracking-wide">
                            Contraseña incorrecta, intenta de nuevo.
                        </p>
                    )}
                    <button
                        type="submit"
                        className="w-full mt-2 px-4 py-3 bg-wedding-sage-light hover:brightness-110 text-wedding-sage-darkest font-medium rounded-md transition-all uppercase tracking-widest text-sm md:text-base shadow-lg"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </main>
    );
}
