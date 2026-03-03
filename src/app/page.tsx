import Countdown from "@/components/Countdown";
import { MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 z-0 bg-neutral-900 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background-placeholder.jpg')" }}
      >
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 md:px-8 w-full max-w-5xl">
        <p className="text-lg md:text-2xl font-light tracking-[0.2em] uppercase text-white/80 mb-12 text-center">
          Estás invitado a algo especial
        </p>

        <div className="mb-16 md:mb-24 w-full">
          <Countdown />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <MapPin className="w-8 h-8 text-white/80" strokeWidth={1} />
          <p className="text-lg md:text-xl font-light tracking-wide text-white/90">
            Lugar por confirmar, Buenos Aires, Argentina.
          </p>
        </div>
      </div>
    </main>
  );
}
