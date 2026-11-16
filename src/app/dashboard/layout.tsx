import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Monogram } from "@/components/Monogram";
import { Band } from "@/components/Brand";
import { SUPPORT_EMAIL, WEDDING_DATE_LABEL } from "@/lib/wedding";

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
  const control = "inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl font-sans text-sm font-medium text-tinta hover:bg-crema/60 transition-colors";

  return (
    <div className="min-h-dvh flex flex-col bg-rubor text-tinta font-text">
      <header className="bg-rubor pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="Volver a la portada">
            <Monogram size="sm" />
            <span className="hidden sm:block font-serif text-2xl leading-none">David y Rocío</span>
          </Link>
          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link href="/admin" className={control}>
                <LayoutDashboard className="w-4 h-4" aria-hidden />
                <span>Panel</span>
              </Link>
            ) : (
              firstName && <span className="px-3 text-sm">Hola, {firstName}</span>
            )}
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}>
              <button className={control}>
                <LogOut className="w-4 h-4" aria-hidden />
                <span>Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      <Band>
        <p>David y Rocío · {WEDDING_DATE_LABEL}</p>
        <p className="mt-1 text-[13px]">
          ¿Dudas o algo no funciona? Escríbenos a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:no-underline">{SUPPORT_EMAIL}</a>
        </p>
      </Band>
    </div>
  );
}
