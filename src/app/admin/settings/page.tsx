import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getConfig } from "@/app/actions/config";
import SettingsForm from "./_components/SettingsForm";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    redirect("/admin");
  }

  const rsvpDeadline = await getConfig("rsvp_deadline");

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="text-center pb-8 mb-4">
        <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Ajustes del Evento</h1>
        <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
          Configura los parámetros globales de la boda.
        </p>
      </div>

      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] space-y-6">
        <div className="pb-4 mb-6 border-b border-surface-container/50">
          <h3 className="text-2xl font-serif text-primary">Plazo de Confirmación</h3>
          <p className="text-sm text-on-surface-variant font-sans mt-1">
            Define la fecha y hora límite para que los invitados confirmen su asistencia. Después de esta fecha, el formulario de RSVP quedará bloqueado.
          </p>
        </div>

        <SettingsForm initialDeadline={rsvpDeadline} />
      </div>

      <div className="pb-16 text-center">
        <p className="font-serif italic text-primary/60 text-lg">Ethereal Union • Handcrafted Elegance</p>
      </div>
    </div>
  );
}
