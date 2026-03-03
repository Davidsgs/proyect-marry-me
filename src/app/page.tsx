import Countdown from "@/components/Countdown";
import { MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-sage-darkest">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{ backgroundImage: "url('/background-placeholder.jpg')" }}
      ></div>

      {/* Dark sage overlay to ensure the bright image background doesn't consume the text */}
      <div className="absolute inset-0 z-0 bg-wedding-sage-darkest/75 backdrop-blur-md"></div>

      {/* Subtle colorful glows to match the floral theme */}
      <div className="absolute inset-0 z-0 mix-blend-soft-light opacity-40"
        style={{
          background: "radial-gradient(circle at 20% 30%, var(--color-wedding-blush-light), transparent 60%), radial-gradient(circle at 80% 70%, var(--color-wedding-sage-light), transparent 60%)",
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-5xl">
        <p className="text-lg md:text-2xl font-light tracking-[0.2em] uppercase text-wedding-cream/90 mb-12 text-center text-balance drop-shadow-md">
          Estás invitado a algo especial
        </p>

        <div className="mb-16 md:mb-24 w-full">
          <Countdown />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <MapPin className="w-8 h-8 text-wedding-blush-light" strokeWidth={1} />
          <p className="text-lg md:text-xl font-light tracking-wide text-wedding-cream drop-shadow-sm">
            Lugar por confirmar, Buenos Aires, Argentina.
          </p>
        </div>
      </div>
    </main>
  );
}
