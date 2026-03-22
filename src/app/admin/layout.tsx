import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  Heart,
  Calendar,
  UserCircle
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-wedding-cream text-wedding-sage-darkest selection:bg-wedding-blush selection:text-white pb-32 lg:pb-0">
      {/* Top App Bar */}
      <header className="bg-wedding-cream/90 backdrop-blur-md px-6 py-4 w-full fixed top-0 z-50 border-b border-wedding-olive/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 -ml-2 text-wedding-olive hover:bg-wedding-olive/10 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wedding-blush-light rounded-2xl flex items-center justify-center rotate-3 shadow-sm border border-wedding-blush">
              <span className="font-serif text-xl text-wedding-sage-darkest italic -rotate-3">
                DR
              </span>
            </div>
            <span className="font-serif text-2xl tracking-wide hidden sm:block text-wedding-olive">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 font-sans text-sm tracking-widest uppercase font-medium">
            <Link href="/admin" className="text-wedding-olive border-b-2 border-wedding-olive pb-1">
              Resumen
            </Link>
            <Link href="#families" className="text-wedding-sage-dark hover:text-wedding-olive transition-colors pb-1">
              Familias
            </Link>
            <Link href="#users" className="text-wedding-sage-dark hover:text-wedding-olive transition-colors pb-1">
              Invitados
            </Link>
          </nav>
          
          <div className="h-8 w-[1px] bg-wedding-olive/20 hidden md:block"></div>
          
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}>
            <button className="flex items-center gap-2 text-wedding-sage-dark hover:text-wedding-blush transition-colors p-2 rounded-xl group relative overflow-hidden">
              <span className="absolute inset-0 bg-wedding-blush/10 rounded-xl scale-0 group-hover:scale-100 transition-transform origin-center"></span>
              <LogOut className="w-5 h-5 relative z-10" />
              <span className="hidden sm:block text-sm font-medium tracking-wider uppercase relative z-10">
                Salir
              </span>
            </button>
          </form>
        </div>
      </header>

      {/* Navigation Drawer (Desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col py-8 bg-white/50 backdrop-blur-sm w-72 border-r border-wedding-olive/10 pt-24 mt-0 shadow-xl shadow-wedding-olive/5">
        <div className="px-8 mb-8 text-center border-b border-wedding-sage/10 pb-8">
          <div className="w-24 h-24 bg-wedding-sage-light mx-auto rounded-full mb-4 shadow-inner flex items-center justify-center border-4 border-wedding-cream">
            <Heart className="w-12 h-12 text-wedding-cream" />
          </div>
          <h2 className="font-serif text-2xl text-wedding-olive mb-1 drop-shadow-sm">David & Rocío</h2>
          <p className="font-sans text-sm tracking-widest uppercase text-wedding-sage font-medium">Panel de Bodas</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 font-sans">
          <Link href="/admin" className="flex items-center gap-4 px-4 py-3 bg-wedding-olive/10 text-wedding-olive rounded-xl transition-all font-medium border border-wedding-olive/20 shadow-sm">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="#families" className="flex items-center gap-4 px-4 py-3 text-wedding-sage-dark hover:bg-wedding-olive/5 hover:text-wedding-olive rounded-xl transition-all font-medium">
            <Users className="w-5 h-5" />
            <span>Familias</span>
          </Link>
          <Link href="#users" className="flex items-center gap-4 px-4 py-3 text-wedding-sage-dark hover:bg-wedding-olive/5 hover:text-wedding-olive rounded-xl transition-all font-medium">
            <UserCircle className="w-5 h-5" />
            <span>Invitados</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:ml-72 transition-all duration-300">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-wedding-cream/95 backdrop-blur-xl border-t border-wedding-olive/10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[1.5rem]">
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-wedding-olive group">
          <div className="bg-wedding-olive/10 p-2 rounded-xl group-hover:bg-wedding-olive group-hover:text-wedding-cream transition-colors">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-sans tracking-widest uppercase font-medium">Inicio</span>
        </Link>
        <Link href="#families" className="flex flex-col items-center gap-1.5 text-wedding-sage-dark hover:text-wedding-olive group transition-colors">
          <div className="p-2 rounded-xl group-hover:bg-wedding-olive/10 transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-sans tracking-widest uppercase font-medium">Familias</span>
        </Link>
        <Link href="#users" className="flex flex-col items-center gap-1.5 text-wedding-sage-dark hover:text-wedding-olive group transition-colors">
          <div className="p-2 rounded-xl group-hover:bg-wedding-olive/10 transition-colors">
            <UserCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-sans tracking-widest uppercase font-medium">Invitados</span>
        </Link>
      </nav>
    </div>
  );
}
