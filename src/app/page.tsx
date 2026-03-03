import Countdown from "@/components/Countdown";
import { MapPin } from "lucide-react";
import { Pinyon_Script } from "next/font/google";

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-sage-darkest">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{ backgroundImage: "url('/background-placeholder.webp')" }}
      ></div>

      {/* Dark sage overlay to ensure the bright image background doesn't consume the text */}
      <div className="absolute inset-0 z-0 bg-wedding-sage-darkest/75"></div>

      {/* Subtle colorful glows to match the floral theme */}
      <div className="absolute inset-0 z-0 mix-blend-soft-light opacity-40"
        style={{
          background: "radial-gradient(circle at 20% 30%, var(--color-wedding-blush-light), transparent 60%), radial-gradient(circle at 80% 70%, var(--color-wedding-sage-light), transparent 60%)",
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-5xl py-12 min-h-screen justify-center">
        <h1 className={`${pinyonScript.className} text-6xl md:text-8xl text-wedding-blush-light drop-shadow-xl mb-6 text-center`}>
          David & Rocio
        </h1>

        <p className="text-sm md:text-xl font-light tracking-[0.2em] md:tracking-[0.3em] uppercase text-wedding-cream/90 mb-12 text-center text-balance drop-shadow-md">
          Te invitamos a nuestro momento especial
        </p>

        <div className="mb-12 md:mb-16 w-full">
          <Countdown />
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-2xl md:text-3xl font-serif text-wedding-cream drop-shadow-md tracking-wider">
            03 de Abril, 2027
          </p>

          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 md:w-8 md:h-8 text-wedding-blush-light" strokeWidth={1.5} />
            <p className="text-lg md:text-xl font-light tracking-wide text-wedding-cream drop-shadow-sm">
              Lugar por confirmar, Buenos Aires, Argentina.
            </p>
          </div>
        </div>

        <div className="mt-16 md:mt-24 text-center">
          <p className="text-sm md:text-base font-light text-wedding-cream/70 max-w-md mx-auto text-balance tracking-wide">
            Pronto vas a poder confirmar tu asistencia, y tener más novedades.
          </p>
        </div>
      </div>
    </main>
  );
}
