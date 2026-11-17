import Countdown from "@/components/Countdown";
import { Monogram } from "@/components/Monogram";
import { VENUE, WEDDING_DATE_LABEL, WEDDING_WEEKDAY } from "@/lib/wedding";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";

// Portada (solo con sesión): única pantalla oscura, sobre la foto, con el
// monograma dorado. Decisión de la pareja; el resto del sitio va en claro.
export default async function Home() {
  const session = await auth();
  const isAdmin = session?.user?.permissions?.includes("admin.dashboard");

  return (
    <main className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-noche text-crema">
      {/* Foto de fondo como <img> (no background-image): es el LCP de la portada y
          así el navegador la descubre en el HTML y la pide con prioridad alta. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/background-placeholder.webp"
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-noche/75" aria-hidden />

      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-3xl min-h-dvh justify-center gap-10 md:gap-14 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))]">
        <div className="space-y-6 animate-rise">
          <Monogram size="lg" tone="gold" className="mx-auto" />
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl leading-[0.95] text-rubor text-balance">
            David y Rocío
          </h1>
          <p className="font-text text-lg md:text-xl text-crema/90 text-balance">
            Te invitamos a celebrar nuestra boda
          </p>
        </div>

        <div className="w-full animate-rise [animation-delay:120ms]">
          <Countdown />
        </div>

        <div className="flex flex-col items-center gap-5 animate-rise [animation-delay:200ms]">
          <p className="font-serif text-3xl md:text-4xl text-crema">
            {WEDDING_WEEKDAY} {WEDDING_DATE_LABEL}
          </p>
          <a
            href={VENUE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-crema/10 hover:bg-crema/15 transition-colors"
          >
            <MapPin className="w-5 h-5 text-rubor shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="text-left font-text">
              <span className="block text-base md:text-lg text-crema">{VENUE.address}</span>
              <span className="block text-sm text-crema/85">
                {VENUE.area} · <span className="underline group-hover:no-underline">Ver en el mapa</span>
              </span>
            </span>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-rise [animation-delay:280ms]">
          <Link
            href={session ? "/dashboard" : "/login"}
            className="inline-flex items-center justify-center min-h-14 px-10 rounded-full bg-rubor text-tinta font-medium text-base hover:bg-crema active:scale-[0.98] transition-[background-color,transform] duration-150"
          >
            Ver mi invitación
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center min-h-14 px-8 rounded-full text-crema font-medium text-base hover:bg-crema/10 transition-colors"
            >
              Panel de organización
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
