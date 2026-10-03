import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Mail, LogOut, ChevronRight } from "lucide-react";
import { Monogram } from "@/components/Monogram";

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
        <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl space-y-8">
                <div className="text-center space-y-3">
                    <Monogram size="md" className="mx-auto" />
                    <h1 className="font-serif italic text-4xl text-primary">
                        {firstName ? `Hola, ${firstName}` : "Hola"}
                    </h1>
                    <p className="text-on-surface-variant">¿A dónde quieres ir?</p>
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
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
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
            className="group flex items-center gap-4 p-5 rounded-2xl bg-surface-container-lowest shadow-[0_4px_24px_rgba(81,68,67,0.06)] hover:shadow-[0_8px_28px_rgba(81,68,67,0.09)] transition-shadow"
        >
            <span className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" strokeWidth={1.5} />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block font-serif text-2xl text-on-surface">{title}</span>
                <span className="block text-sm text-on-surface-variant">{text}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-on-surface-variant/80 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
    );
}
