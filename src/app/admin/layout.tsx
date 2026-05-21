import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import AdminMobileNav from "./_components/AdminMobileNav";
import { hasPermission } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!hasPermission(session?.user?.permissions, "admin.dashboard")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary selection:text-white flex flex-col lg:flex-row pb-24 lg:pb-0">

      {/* Mobile Top Header (only visible on small screens) */}
      <header className="lg:hidden bg-surface-container-low/90 backdrop-blur-md px-6 py-4 w-full sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="font-serif text-xl tracking-wide text-primary leading-tight">
            David &amp; Rocio
          </span>
          <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-medium">
            03 de Abril, 2026
          </span>
        </div>
      </header>

      {/* Navigation Drawer (Desktop) */}
      <AdminSidebar permissions={session?.user?.permissions} />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 py-8 lg:py-12 lg:ml-72 transition-all duration-300">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <AdminMobileNav permissions={session?.user?.permissions} />
    </div>
  );
}
