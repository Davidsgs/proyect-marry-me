import { auth } from "@/auth";
import { WEDDING_DATE_LABEL } from "@/lib/wedding";
import { Monogram } from "@/components/Monogram";
import { redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import AdminMobileNav from "./_components/AdminMobileNav";
import AdminMobileHeaderActions from "./_components/AdminMobileHeaderActions";
import { hasPermission } from "@/lib/permissions";
import { ConfirmProvider } from "./_components/ConfirmDialog";
import { NoticeProvider } from "./_components/Notice";

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
    <div className="min-h-dvh bg-surface text-on-surface flex flex-col lg:flex-row pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Cabecera móvil */}
      <header className="lg:hidden sticky top-0 z-30 bg-oliva-profundo text-crema pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <Monogram size="sm" tone="crema" />
            <div className="min-w-0">
              <p className="font-serif text-2xl leading-none truncate">David y Rocío</p>
              <p className="text-xs mt-0.5">{WEDDING_DATE_LABEL}</p>
            </div>
          </div>
          <AdminMobileHeaderActions />
        </div>
      </header>

      <AdminSidebar permissions={session?.user?.permissions} />

      <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 lg:py-12 lg:ml-72">
        <NoticeProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </NoticeProvider>
      </main>

      <AdminMobileNav permissions={session?.user?.permissions} />
    </div>
  );
}
