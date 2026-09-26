import { auth } from "@/auth";
import { WEDDING_DATE_LABEL } from "@/lib/wedding";
import { redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import AdminMobileNav from "./_components/AdminMobileNav";
import AdminMobileHeaderActions from "./_components/AdminMobileHeaderActions";
import { hasPermission } from "@/lib/permissions";
import { ConfirmProvider } from "./_components/ConfirmDialog";

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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col lg:flex-row pb-24 lg:pb-0">

      {/* Mobile Top Header (only visible on small screens) */}
      <header className="lg:hidden bg-surface-container-low/90 backdrop-blur-md px-6 py-4 w-full sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <span className="font-serif text-xl tracking-wide text-primary leading-tight">
            David &amp; Rocío
          </span>
          <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-medium">
            {WEDDING_DATE_LABEL}
          </span>
        </div>
        <AdminMobileHeaderActions />
      </header>

      {/* Navigation Drawer (Desktop) */}
      <AdminSidebar permissions={session?.user?.permissions} />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 py-8 lg:py-12 lg:ml-72 transition-all duration-300">
        <ConfirmProvider>{children}</ConfirmProvider>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <AdminMobileNav permissions={session?.user?.permissions} />
    </div>
  );
}
