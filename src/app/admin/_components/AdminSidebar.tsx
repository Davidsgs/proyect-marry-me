"use client";

import Link from "next/link";
import { WEDDING_DATE_LABEL } from "@/lib/wedding";
import { Monogram } from "@/components/Monogram";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
  ListTodo,
  Mail,
  Armchair,
  CalendarClock,
  Wallet,
  UtensilsCrossed,
} from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminSidebar({ permissions }: { permissions?: string[] }) {
  const pathname = usePathname();

  const navItems: { href: string; icon: typeof LayoutDashboard; label: string }[] = [
    { href: "/admin", icon: LayoutDashboard, label: "Resumen" },
  ];

  const canReadGuests = !!permissions?.includes("families.read") && !!permissions?.includes("users.read");
  if (canReadGuests) {
    navItems.push({ href: "/admin/guests", icon: Users, label: "Invitados" });
  }

  if (permissions?.includes("tasks.read")) {
    navItems.push({ href: "/admin/tasks", icon: ListTodo, label: "Tareas" });
  }
  if (permissions?.includes("tables.read")) {
    navItems.push({ href: "/admin/tables", icon: Armchair, label: "Mesas" });
  }
  if (permissions?.includes("calendar.read")) {
    navItems.push({ href: "/admin/cronograma", icon: CalendarClock, label: "Cronograma" });
  }
  if (permissions?.includes("menu.read")) {
    navItems.push({ href: "/admin/menu", icon: UtensilsCrossed, label: "Menú" });
  }
  if (permissions?.includes("finance.read")) {
    navItems.push({ href: "/admin/finance", icon: Wallet, label: "Economía" });
  }
  if (permissions?.includes("settings.write")) {
    navItems.push({ href: "/admin/settings", icon: Settings, label: "Ajustes" });
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col py-8 bg-surface-container-low w-72 justify-between">
      <div>
        <div className="px-8 mb-10">
          <Monogram size="md" className="mb-3" />
          <h2 className="font-serif text-3xl text-primary mb-1">David & Rocío</h2>
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-on-surface-variant font-medium">
            {WEDDING_DATE_LABEL}
          </p>
        </div>

        <nav className="px-4 space-y-1 font-sans">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium border-none ${isActive
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                  }`}
              >
                <item.icon className="w-5 h-5 opacity-80" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-8 flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary transition-colors py-2 font-sans text-sm font-medium border-none"
        >
          <Mail className="w-4 h-4" />
          <span>Ver mi invitación</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary transition-colors py-2 font-sans text-sm font-medium border-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
