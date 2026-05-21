import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-wedding-sage-darkest text-wedding-cream flex flex-col font-sans relative overflow-hidden">
      {/* Botanical backdrop glows */}
      <div className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background: "radial-gradient(circle at 12% 0%, rgba(175,195,177,0.20), transparent 45%), radial-gradient(circle at 90% 100%, rgba(231,198,193,0.18), transparent 50%)",
        }}
      ></div>

      <header className="bg-wedding-sage-darkest/80 backdrop-blur-sm border-b border-wedding-sage/15 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-wedding-cream/40 hover:text-wedding-cream/80 transition-colors text-xs uppercase tracking-[0.2em] font-light">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
            <h1 className="text-2xl font-serif italic text-wedding-blush tracking-wide">David & Rocio</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline-block text-wedding-cream/60 font-light">Hola, {session.user.name}</span>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}>
              <button className="flex items-center gap-1.5 text-wedding-terracotta hover:text-wedding-blush transition-colors font-light text-xs uppercase tracking-[0.2em]">
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 w-full relative z-10">
        {children}
      </main>
    </div>
  );
}
