import { auth } from "@/auth";
import { PageHeader } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getConfig } from "@/app/actions/config";
import { getAdminsWithPermissions, getEditablePermissions } from "@/app/actions/permissions";
import SettingsForm from "./_components/SettingsForm";
import AdminPermissionsManager from "./_components/AdminPermissionsManager";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    redirect("/admin");
  }

  const rsvpDeadline = await getConfig("rsvp_deadline");
  const [admins, editablePermissions] = await Promise.all([
    getAdminsWithPermissions(),
    getEditablePermissions(),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <PageHeader title="Ajustes" description="Fecha límite para confirmar asistencia y permisos de cada administrador." />

      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] space-y-6">
        <div>
          <h2 className="text-2xl font-serif text-primary">Plazo para confirmar</h2>
          <p className="text-sm text-on-surface-variant font-sans mt-1">
            Define la fecha y hora límite para que los invitados confirmen su asistencia. Después de esta fecha, el formulario de RSVP quedará bloqueado.
          </p>
        </div>

        <SettingsForm initialDeadline={rsvpDeadline} />
      </div>

      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] space-y-6">
        <div>
          <h2 className="text-2xl font-serif text-primary">Permisos de administradores</h2>
          <p className="text-sm text-on-surface-variant font-sans mt-1">
            Elige qué puede ver y editar cada administrador (familiares, proveedores…). Ver Mesas incluye ver Invitados y Familias. Los cambios se aplican cuando esa persona cierre sesión y vuelva a entrar.
          </p>
        </div>

        <AdminPermissionsManager
          admins={admins}
          permissions={editablePermissions}
          currentUserId={session!.user!.id as number}
        />
      </div>
    </div>
  );
}
