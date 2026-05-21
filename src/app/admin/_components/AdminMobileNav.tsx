"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, ListTodo, Armchair } from "lucide-react";

export default function AdminMobileNav({ permissions }: { permissions?: string[] }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Inicio" },
    { href: "/admin/guests", icon: Users, label: "Invitados" },
  ];

  const dynamicItems = [...navItems];
  if (permissions?.includes("tasks.read")) {
    dynamicItems.push({ href: "/admin/tasks", icon: ListTodo, label: "Tareas" });
  }
  if (permissions?.includes("tables.read")) {
    dynamicItems.push({ href: "/admin/tables", icon: Armchair, label: "Mesas" });
  }
  if (permissions?.includes("settings.write")) {
    dynamicItems.push({ href: "/admin/settings", icon: Settings, label: "Ajustes" });
  }
  const visibleNavItems = dynamicItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-surface-container-low/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[1.5rem] border-none">
      {visibleNavItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 group transition-colors ${
              isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <div
              className={`p-2 rounded-xl transition-colors ${
                isActive ? "bg-surface-container-lowest shadow-sm" : "group-hover:bg-primary/10"
              }`}
            >
              <item.icon className="w-6 h-6 opacity-80" />
            </div>
            <span className="text-[10px] font-sans tracking-widest uppercase font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
