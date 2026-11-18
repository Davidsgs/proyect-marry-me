import { auth } from "@/auth";
import { PageHeader } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { cachedConfig, cachedUsers, cachedWeddingParty } from "@/lib/data";
import { getAdminsWithPermissions, getEditablePermissions } from "@/app/actions/permissions";
import SettingsForm from "./_components/SettingsForm";
import GiftsForm from "./_components/GiftsForm";
import AdultsNoteForm from "./_components/AdultsNoteForm";
import WeddingPartyForm from "./_components/WeddingPartyForm";
import StoryForm from "./_components/StoryForm";
import AdminPermissionsManager from "./_components/AdminPermissionsManager";

export const dynamic = 'force-dynamic';

function Block({ id, title, description, children }: { id: string; title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="bg-surface-container-lowest p-5 sm:p-8 rounded-3xl space-y-6">
      <div>
        <h2 id={id} className="font-serif text-3xl leading-display text-primary">{title}</h2>
        <p className="text-sm text-on-surface-variant mt-2 text-pretty">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    redirect("/admin");
  }

  const [rsvpDeadline, holder, alias, cbu, note, adultsNote, story, party, allUsers, admins, editablePermissions] = await Promise.all([
    cachedConfig("rsvp_deadline"),
    cachedConfig("gift_holder"),
    cachedConfig("gift_alias"),
    cachedConfig("gift_cbu"),
    cachedConfig("gift_note"),
    cachedConfig("adults_note"),
    cachedConfig("story"),
    cachedWeddingParty(),
    cachedUsers(),
    getAdminsWithPermissions(),
    getEditablePermissions(),
  ]);

  // Para vincular a alguien del cortejo: solo nombre y alias, sin correos.
  const people = allUsers
    .map((u) => ({ id: u.id, name: u.fullname || `${u.name} ${u.lastName}`.trim(), alias: u.alias }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader title="Ajustes" description="Plazo para confirmar, regalos, nota sobre niños, nuestra historia, padrinos y cortejo, y permisos de cada administrador." />

      <Block id="plazo" title="Plazo para confirmar" description="Hasta esta fecha y hora los delegados pueden responder o cambiar su respuesta. Después, la confirmación queda bloqueada.">
        <SettingsForm initialDeadline={rsvpDeadline} />
      </Block>

      <Block id="regalos" title="Regalos" description="Se muestran en la invitación, en la sección «Regalos». Si dejas vacíos el alias y el CBU, la sección no aparece.">
        <GiftsForm initial={{ holder: holder ?? "", alias: alias ?? "", cbu: cbu ?? "", note: note ?? "" }} />
      </Block>

      <Block id="ninos" title="Nota sobre niños" description="La ven en su invitación solo las familias que tienen marcada «Mostrar la nota de celebración sin niños» en Invitados. Es solo informativa.">
        <AdultsNoteForm initial={adultsNote ?? ""} />
      </Block>

      <Block id="historia" title="Nuestra historia" description="Se muestra en la invitación, solo a quienes iniciaron sesión. Si lo dejas vacío, la sección no aparece.">
        <StoryForm initial={story ?? ""} />
      </Block>

      <Block id="cortejo" title="Padrinos y cortejo" description="Aparecen en la invitación, en «Nuestro cortejo», como agradecimiento por su ayuda. Solo los ven los invitados con sesión iniciada.">
        <WeddingPartyForm initial={party} people={people} />
      </Block>

      <Block
        id="permisos"
        title="Permisos de administradores"
        description={<>Elige qué puede ver y editar cada administrador (familiares, proveedores…). Ver Mesas incluye ver Invitados y Familias. <strong className="font-medium text-on-surface">Los cambios se aplican cuando esa persona cierra sesión y vuelve a entrar.</strong></>}
      >
        <AdminPermissionsManager
          admins={admins}
          permissions={editablePermissions}
          currentUserId={session!.user!.id as number}
        />
      </Block>
    </div>
  );
}
