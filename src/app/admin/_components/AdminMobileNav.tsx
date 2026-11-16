"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, Mail, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Dialog } from "@/components/Dialog";
import { buildNav, isActive } from "./nav";

// Máximo de huecos en la barra inferior. Si hay más secciones, el último hueco
// pasa a «Más» y el resto va a una hoja: añadir secciones nunca rompe la barra.
const MAX_SLOTS = 5;

export default function AdminMobileNav({ permissions }: { permissions?: string[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = buildNav(permissions);
  const overflow = items.length > MAX_SLOTS;
  const barItems = overflow ? items.slice(0, MAX_SLOTS - 1) : items;
  const moreItems = overflow ? items.slice(MAX_SLOTS - 1) : [];
  const moreActive = moreItems.some((i) => isActive(pathname, i.href));

  const slot = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-1 min-h-14 rounded-xl text-[12px] font-medium transition-colors duration-150 ${
      active ? "text-oliva-profundo" : "text-on-surface-variant"
    }`;
  const pill = (active: boolean) =>
    `flex items-center justify-center w-14 h-8 rounded-full transition-colors duration-150 ${active ? "bg-secondary-container" : ""}`;

  return (
    <>
      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Más secciones" size="sm">
        <div className="grid grid-cols-3 gap-2">
          {moreItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl text-sm font-medium transition-colors ${
                  active ? "bg-secondary-container text-oliva-profundo" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                <item.icon className="w-6 h-6" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-5 grid gap-1">
          <Link
            href="/dashboard"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 min-h-12 px-4 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors text-sm font-medium"
          >
            <Mail className="w-5 h-5" aria-hidden /> Ver mi invitación
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 min-h-12 px-4 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors text-sm font-medium w-full text-left"
          >
            <LogOut className="w-5 h-5" aria-hidden /> Cerrar sesión
          </button>
        </div>
      </Dialog>

      <nav
        aria-label="Secciones"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex">
          {barItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={slot(active)}>
                <span className={pill(active)}>
                  <item.icon className="w-5 h-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            );
          })}

          {overflow && (
            <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" className={`${slot(moreActive)} cursor-pointer`}>
              <span className={pill(moreActive)}>
                <MoreHorizontal className="w-5 h-5" aria-hidden />
              </span>
              Más
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
