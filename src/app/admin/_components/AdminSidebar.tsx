"use client";

import Link from "next/link";
import { WEDDING_DATE_LABEL } from "@/lib/wedding";
import { Monogram } from "@/components/Monogram";
import { usePathname } from "next/navigation";
import { LogOut, Mail } from "lucide-react";
import { signOut } from "next-auth/react";
import { buildNav, isActive } from "./nav";

// Barra lateral de escritorio: el panel oliva de la página «Contacto» del manual.
export default function AdminSidebar({ permissions }: { permissions?: string[] }) {
  const pathname = usePathname();
  const navItems = buildNav(permissions);
  const footerLink = "w-full flex items-center gap-3 min-h-10 px-4 rounded-xl text-crema hover:bg-crema/10 transition-colors text-sm font-medium";

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full z-40 w-72 flex-col justify-between bg-oliva-profundo text-crema py-8">
      <div>
        <div className="px-8 mb-10">
          <Monogram size="md" tone="crema" className="mb-4" />
          <p className="font-serif text-4xl leading-none">David y Rocío</p>
          <p className="mt-2 text-sm">{WEDDING_DATE_LABEL}</p>
        </div>

        <nav aria-label="Secciones" className="px-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3.5 min-h-11 px-4 rounded-xl text-item font-medium transition-colors duration-150 ${
                  active ? "bg-crema text-oliva-profundo shadow-sm" : "text-crema hover:bg-crema/10"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 space-y-1">
        <Link href="/dashboard" className={footerLink}>
          <Mail className="w-4 h-4" aria-hidden />
          <span>Ver mi invitación</span>
        </Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className={`${footerLink} cursor-pointer`}>
          <LogOut className="w-4 h-4" aria-hidden />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
