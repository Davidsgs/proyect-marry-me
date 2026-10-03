import Countdown from "@/components/Countdown";
import { Monogram } from "@/components/Monogram";
import { VENUE, WEDDING_DATE_LABEL } from "@/lib/wedding";
import { MapPin } from "lucide-react";
import { Pinyon_Script } from "next/font/google";
import Link from "next/link";
import { auth } from "@/auth";

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
});

// Portada: se mantiene oscura sobre la foto (decisión de marca); el resto de
// pantallas de invitados van en claro.
export default async function Home() {
  const session = await auth();
  const isAdmin = session?.user?.permissions?.includes("admin.dashboard");

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-sage-darkest text-wedding-cream">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background-placeholder.webp')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-wedding-sage-darkest/75" aria-hidden />

      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-3xl py-16 min-h-screen justify-center gap-10 md:gap-14">
        <div className="space-y-6">
          <Monogram size="lg" tone="gold" className="mx-auto drop-shadow-[0_2px_10px_rgba(216,180,94,0.25)]" />
          <h1 className={`${pinyonScript.className} text-6xl sm:text-7xl md:text-8xl text-wedding-blush-light leading-tight`}>
            David &amp; Rocío
          </h1>
          <p className="text-lg md:text-xl text-wedding-cream/90 text-balance">
            Te invitamos a celebrar nuestra boda
          </p>
        </div>

        <div className="w-full">
          <Countdown />
        </div>

        <div className="flex flex-col items-center gap-5">
          <p className="text-2xl md:text-3xl font-serif text-wedding-cream">
            Sábado {WEDDING_DATE_LABEL}
          </p>
          <a
            href={VENUE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-wedding-cream/10 hover:bg-wedding-cream/15 transition-colors"
          >
            <MapPin className="w-5 h-5 text-wedding-blush-light shrink-0" strokeWidth={1.5} />
            <span className="text-left">
              <span className="block text-base md:text-lg text-wedding-cream">{VENUE.address}</span>
              <span className="block text-sm text-wedding-cream/80">
                {VENUE.area} · <span className="underline underline-offset-4 group-hover:no-underline">Ver en el mapa</span>
              </span>
            </span>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={session ? "/dashboard" : "/login"}
            className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-wedding-blush-light text-wedding-sage-darkest font-medium text-base shadow-[0_8px_24px_rgba(30,36,25,0.35)] hover:bg-wedding-blush transition-colors"
          >
            Ver mi invitación
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-wedding-cream font-medium text-base hover:bg-wedding-cream/10 transition-colors"
            >
              Panel de organización
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
