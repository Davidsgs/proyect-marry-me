import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Monogram } from "@/components/Monogram";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const firstName = session.user.name?.split(" ")[0] ?? "";
  const isAdmin = session.user.permissions?.includes("admin.dashboard");

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
      <header className="bg-surface-container-low">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 text-primary rounded-lg" aria-label="Volver a la portada">
            <Monogram size="sm" />
            <span className="hidden sm:block font-serif text-lg text-on-surface">David &amp; Rocío</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {isAdmin ? (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-primary hover:bg-surface-container transition-colors font-medium">
                <LayoutDashboard className="w-4 h-4" />
                <span>Panel</span>
              </Link>
            ) : (
              firstName && <span className="text-on-surface-variant">Hola, {firstName}</span>
            )}
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
        {children}
      </main>
    </div>
  );
}
