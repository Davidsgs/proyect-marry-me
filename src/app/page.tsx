import Countdown from "@/components/Countdown";
import { MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-wedding-cream">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/background-placeholder.jpg')" }}
      ></div>

      {/* Soft color overlays inspired by the specific palette */}
      <div className="absolute inset-0 z-0 mix-blend-multiply opacity-60"
        style={{
          background: "radial-gradient(circle at 10% 20%, var(--color-wedding-blush-light), transparent 50%), radial-gradient(circle at 90% 80%, var(--color-wedding-sage-light), transparent 50%)",
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-wedding-cream/60 backdrop-blur-[6px]"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-5xl">
        <p className="text-lg md:text-2xl font-light tracking-[0.2em] uppercase text-wedding-sage-dark/80 mb-12 text-center text-balance">
          Estás invitado a algo especial
        </p>

        <div className="mb-16 md:mb-24 w-full">
          <Countdown />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <MapPin className="w-8 h-8 text-wedding-sage-dark/70" strokeWidth={1} />
          <p className="text-lg md:text-xl font-light tracking-wide text-wedding-sage-dark">
            Lugar por confirmar, Buenos Aires, Argentina.
          </p>
        </div>
      </div>
    </main>
  );
}
