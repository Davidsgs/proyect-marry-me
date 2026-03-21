import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admins manage in /admin, but if they enter here, show them anyway, or redirect.
  // The middleware redirects ADMINs to /admin. So basically only MAIN_GUEST and GUEST map here.
  
  return (
    <div className="min-h-screen bg-wedding-cream text-wedding-sage-darkest flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-wedding-sage/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-serif text-wedding-olive tracking-wide">David & Rocio</h1>
          <div className="flex items-center gap-4 text-sm">
             <span className="hidden sm:inline-block text-gray-600">Hola, {session.user.name}</span>
             <form action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
             }}>
                <button className="flex items-center gap-1 text-wedding-blush hover:text-wedding-olive transition-colors font-medium">
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
             </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
