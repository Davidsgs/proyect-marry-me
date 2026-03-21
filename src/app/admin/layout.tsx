import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

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
    <div className="min-h-screen bg-wedding-cream text-wedding-sage-darkest flex flex-col">
      <header className="bg-wedding-sage text-wedding-cream shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-serif tracking-wider">Dashboard Administrador</h1>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}>
            <button className="flex items-center gap-2 hover:text-wedding-blush focus:outline-none px-3 py-2 rounded-md transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
