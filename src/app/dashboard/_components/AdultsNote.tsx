import { ADULTS_NOTE_DEFAULT } from "@/lib/wedding";

// Nota para familias que no son directas: la celebración es para adultos.
// Solo informativa. El texto se edita en Ajustes; vacío, se usa el de por defecto.
export default function AdultsNote({ text }: { text?: string | null }) {
    return (
        <p className="rounded-2xl bg-primary-container/60 px-5 py-4 font-text text-base leading-relaxed text-tinta text-pretty whitespace-pre-line">
            {text?.trim() || ADULTS_NOTE_DEFAULT}
        </p>
    );
}
