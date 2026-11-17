import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Mail, LogOut, ChevronRight } from "lucide-react";
import { Monogram } from "@/components/Monogram";
import { BotanicalShadow } from "@/components/BotanicalShadow";

export const dynamic = "force-dynamic";

// Solo para administradores: elegir entre el panel y su propia invitación.
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
        <main className="relative min-h-dvh overflow-hidden bg-rubor text-tinta flex items-center justify-center px-4 py-12">
            <BotanicalShadow variant="rama" className="absolute -top-20 -right-24 w-[30rem] max-w-[90vw] -scale-x-100 text-rosa-profundo/20" />
            <div className="relative w-full max-w-xl space-y-8 animate-rise">
                <div className="text-center space-y-3">
                    <Monogram size="md" className="mx-auto" />
                    <h1 className="font-serif text-5xl leading-display text-oliva-profundo">
                        {firstName ? `Hola, ${firstName}` : "Hola"}
                    </h1>
                    <p className="font-text text-base">¿A dónde quieres ir?</p>
                </div>

                <div className="grid gap-3">
                    <Choice
                        href="/admin"
                        icon={LayoutDashboard}
                        title="Panel de organización"
                        text="Invitados, mesas, cronograma, menú y más."
                    />
                    <Choice
                        href="/dashboard"
                        icon={Mail}
                        title="Mi invitación"
                        text="Lo que ven los invitados: confirmación, datos del día y mesa."
                    />
                </div>

                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                    }}
                    className="text-center"
                >
                    <button className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-sm font-medium text-tinta hover:bg-crema/60 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </form>
            </div>
        </main>
    );
}

function Choice({ href, icon: Icon, title, text }: { href: string; icon: typeof Mail; title: string; text: string }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-crema shadow-sm hover:shadow-md active:scale-[0.99] transition-[box-shadow,transform] duration-150"
        >
            <span className="w-12 h-12 rounded-xl bg-surface-container-low text-oliva-profundo flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" strokeWidth={1.5} />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block font-serif text-3xl leading-tight text-tinta">{title}</span>
                <span className="block text-sm text-on-surface-variant">{text}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
        </Link>
    );
}
