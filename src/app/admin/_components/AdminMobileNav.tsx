"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  ListTodo,
  Armchair,
  CalendarClock,
  MoreHorizontal,
  Mail,
  LogOut,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

type NavItem = { href: string; icon: typeof LayoutDashboard; label: string };

// Max slots in the bottom bar. When the section count exceeds this, the last
// slot becomes "Más" and the overflow items move into a sheet — so adding new
// admin sections never breaks the layout.
const MAX_SLOTS = 5;

export default function AdminMobileNav({ permissions }: { permissions?: string[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const items: NavItem[] = [
    { href: "/admin", icon: LayoutDashboard, label: "Inicio" },
    { href: "/admin/guests", icon: Users, label: "Invitados" },
  ];
  if (permissions?.includes("tasks.read")) {
    items.push({ href: "/admin/tasks", icon: ListTodo, label: "Tareas" });
  }
  if (permissions?.includes("tables.read")) {
    items.push({ href: "/admin/tables", icon: Armchair, label: "Mesas" });
  }
  if (permissions?.includes("calendar.read")) {
    items.push({ href: "/admin/cronograma", icon: CalendarClock, label: "Cronograma" });
  }
  if (permissions?.includes("settings.write")) {
    items.push({ href: "/admin/settings", icon: Settings, label: "Ajustes" });
  }

  const overflow = items.length > MAX_SLOTS;
  const barItems = overflow ? items.slice(0, MAX_SLOTS - 1) : items;
  const moreItems = overflow ? items.slice(MAX_SLOTS - 1) : [];
  const moreActive = moreItems.some((i) => i.href === pathname);

  return (
    <>
      {/* Overflow + account sheet */}
      {moreOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-low rounded-t-[1.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-6 pb-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant">Menú</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Cerrar" className="text-on-surface-variant hover:text-on-surface border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors ${isActive ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:bg-primary/10"}`}
                  >
                    <item.icon className="w-6 h-6 opacity-80" />
                    <span className="text-[10px] font-sans tracking-widest uppercase font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="h-px bg-outline-variant/30 my-5" />

            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors font-sans text-sm font-medium border-none"
              >
                <Mail className="w-5 h-5" /> Ver mi invitación
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors font-sans text-sm font-medium border-none w-full text-left"
              >
                <LogOut className="w-5 h-5" /> Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 pb-8 pt-4 bg-surface-container-low/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[1.5rem] border-none">
        {barItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 group transition-colors ${isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive ? "bg-surface-container-lowest shadow-sm" : "group-hover:bg-primary/10"}`}>
                <item.icon className="w-6 h-6 opacity-80" />
              </div>
              <span className="text-[10px] font-sans tracking-widest uppercase font-medium">{item.label}</span>
            </Link>
          );
        })}

        {overflow && (
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1.5 group transition-colors ${moreActive ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${moreActive ? "bg-surface-container-lowest shadow-sm" : "group-hover:bg-primary/10"}`}>
              <MoreHorizontal className="w-6 h-6 opacity-80" />
            </div>
            <span className="text-[10px] font-sans tracking-widest uppercase font-medium">Más</span>
          </button>
        )}
      </nav>
    </>
  );
}
