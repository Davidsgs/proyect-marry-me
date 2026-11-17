import { ADULTS_NOTE_DEFAULT } from "@/lib/wedding";
import { Wine } from "lucide-react";

// Nota para familias que no son directas: la celebración es para adultos.
// Solo informativa. El texto se edita en Ajustes; vacío, se usa el de por defecto.
export default function AdultsNote({ text }: { text?: string | null }) {
    return (
        <p className="flex flex-col items-center gap-2 rounded-2xl bg-primary-container/60 px-5 py-4 text-center font-text text-base leading-relaxed text-tinta text-pretty whitespace-pre-line">
            <Wine className="w-5 h-5 shrink-0 text-rosa-profundo" aria-hidden />
            <span>{text?.trim() || ADULTS_NOTE_DEFAULT}</span>
        </p>
    );
}
