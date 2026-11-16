"use client";

import Link from "next/link";
import { Mail, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const btn = "w-11 h-11 flex items-center justify-center rounded-xl text-crema hover:bg-crema/10 transition-colors cursor-pointer";

export default function AdminMobileHeaderActions() {
  return (
    <div className="flex items-center">
      <Link href="/dashboard" aria-label="Ver mi invitación" className={btn}>
        <Mail className="w-5 h-5" aria-hidden />
      </Link>
      <button type="button" onClick={() => signOut({ callbackUrl: "/" })} aria-label="Cerrar sesión" className={btn}>
        <LogOut className="w-5 h-5" aria-hidden />
      </button>
    </div>
  );
}
