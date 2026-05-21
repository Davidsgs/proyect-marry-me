import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Mail, LogOut } from "lucide-react";
import { Pinyon_Script } from "next/font/google";

const pinyonScript = Pinyon_Script({
    weight: "400",
    subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const hasAdminDashboard = session.user.permissions?.includes("admin.dashboard");
    if (!hasAdminDashboard) {
        redirect("/dashboard");
    }

    const firstName = session.user.name?.split(" ")[0] ?? "";

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-sage-darkest">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
                style={{ backgroundImage: "url('/background-placeholder.webp')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-wedding-sage-darkest/75"></div>

            <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-3xl py-12">
                <h1 className={`${pinyonScript.className} text-5xl md:text-7xl text-wedding-blush-light drop-shadow-xl mb-4 text-center`}>
                    {firstName ? `Hola, ${firstName}` : "Bienvenido"}
                </h1>
                <p className="text-sm md:text-base font-light tracking-[0.2em] uppercase text-wedding-cream/90 mb-12 text-center drop-shadow-md">
                    ¿Cómo quieres continuar?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <Link
                        href="/admin"
                        className="group bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-4 border border-wedding-sage/10"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-wedding-sage-darkest/10 flex items-center justify-center group-hover:bg-wedding-sage-darkest/20 transition-colors">
                            <LayoutDashboard className="w-7 h-7 text-wedding-sage-darkest" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-serif text-wedding-sage-darkest">Panel de administración</h2>
                        <p className="text-sm text-gray-600 font-light">
                            Gestiona invitados, tareas y ajustes de la boda.
                        </p>
                    </Link>

                    <Link
                        href="/dashboard"
                        className="group bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-4 border border-wedding-sage/10"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-wedding-blush-light/30 flex items-center justify-center group-hover:bg-wedding-blush-light/50 transition-colors">
                            <Mail className="w-7 h-7 text-wedding-sage-darkest" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-serif text-wedding-sage-darkest">Ver mi invitación</h2>
                        <p className="text-sm text-gray-600 font-light">
                            Revisa el estado de tu invitación como un invitado más.
                        </p>
                    </Link>
                </div>

                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                    }}
                    className="mt-10"
                >
                    <button className="flex items-center gap-2 text-wedding-cream/80 hover:text-wedding-cream transition-colors text-xs tracking-widest uppercase font-medium">
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                    </button>
                </form>
            </div>
        </main>
    );
}
