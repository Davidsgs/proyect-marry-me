"use client";

import Link from "next/link";
import { Mail, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminMobileHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/dashboard"
        aria-label="Ver mi invitación"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors border-none"
      >
        <Mail className="w-5 h-5" />
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Cerrar sesión"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors border-none"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
