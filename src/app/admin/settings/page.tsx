import { auth } from "@/auth";
import { PageHeader } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { cachedConfig, cachedFaq, cachedUsers, cachedWeddingParty } from "@/lib/data";
import { getAdminsWithPermissions, getEditablePermissions } from "@/app/actions/permissions";
import SettingsForm from "./_components/SettingsForm";
import GiftsForm from "./_components/GiftsForm";
import AdultsNoteForm from "./_components/AdultsNoteForm";
import WeddingPartyForm from "./_components/WeddingPartyForm";
import FaqForm from "./_components/FaqForm";
import StoryForm from "./_components/StoryForm";
import AdminPermissionsManager from "./_components/AdminPermissionsManager";
import { ADULTS_NOTE_DEFAULT } from "@/lib/wedding";
import { BookHeart, CalendarClock, ChevronDown, Gift, HeartHandshake, MessageCircleQuestion, ShieldCheck, Baby, type LucideIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

// Cada ajuste es una fila plegable: título y un resumen de su estado («Hasta el 3
// de marzo», «5 personas»…); al tocarla se abre su formulario. Con `name`, abrir
// una cierra la que estaba abierta (acordeón nativo, sin JavaScript).
function Block({ id, icon: Icon, title, summary, description, children }: {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details id={id} name="ajustes" className="group rounded-3xl bg-surface-container-lowest">
      <summary className="flex items-center gap-4 min-h-16 px-4 sm:px-6 py-4 rounded-3xl cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-[#fffdf8] group-open:hover:bg-transparent transition-colors">
        <span className="w-10 h-10 shrink-0 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-2xl leading-tight text-primary">{title}</span>
          <span className="block text-sm text-on-surface-variant truncate group-open:hidden">{summary}</span>
        </span>
        <ChevronDown className="w-5 h-5 shrink-0 text-on-surface-variant transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-6">
        <p className="text-sm text-on-surface-variant text-pretty sm:pl-14">{description}</p>
        {children}
      </div>
    </details>
  );
}

const fmtDeadline = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" });
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function SettingsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "settings.write")) {
    redirect("/admin");
  }

  const [rsvpDeadline, holder, alias, cbu, note, adultsNote, story, party, faq, allUsers, admins, editablePermissions] = await Promise.all([
    cachedConfig("rsvp_deadline"),
    cachedConfig("gift_holder"),
    cachedConfig("gift_alias"),
    cachedConfig("gift_cbu"),
    cachedConfig("gift_note"),
    cachedConfig("adults_note"),
    cachedConfig("story"),
    cachedWeddingParty(),
    cachedFaq(),
    cachedUsers(),
    getAdminsWithPermissions(),
    getEditablePermissions(),
  ]);

  // Para vincular a alguien del cortejo: solo nombre y alias, sin correos.
  const people = allUsers
    .map((u) => ({ id: u.id, name: u.fullname || `${u.name} ${u.lastName}`.trim(), alias: u.alias }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  // Resumen de cada ajuste, visible con la fila cerrada.
  const deadlineDate = rsvpDeadline ? new Date(rsvpDeadline) : null;
  const storyWords = story?.trim() ? story.trim().split(/\s+/).length : 0;
  const summaries = {
    plazo: deadlineDate && !isNaN(deadlineDate.getTime()) ? `Hasta el ${fmtDeadline.format(deadlineDate)} h` : "Sin plazo: pueden responder siempre",
    regalos: alias || cbu ? [alias && `Alias ${alias}`, cbu && "CBU cargado"].filter(Boolean).join(" · ") : "Sin datos: la sección no aparece",
    ninos: adultsNote?.trim() && adultsNote.trim() !== ADULTS_NOTE_DEFAULT ? "Texto propio" : "Texto original",
    historia: storyWords ? count(storyWords, "palabra", "palabras") : "Sin texto: la sección no aparece",
    cortejo: party.length ? count(party.length, "persona", "personas") : "Nadie cargado: la sección no aparece",
    preguntas: faq.length ? count(faq.length, "pregunta", "preguntas") : "Sin preguntas: la sección no aparece",
    permisos: count(admins.length, "administrador", "administradores"),
  };
  const group = "px-1 pt-2 text-label font-medium text-on-surface-variant";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader title="Ajustes" description="Lo que ven los invitados en su invitación y quién puede administrar qué." />

      <section aria-labelledby="ajustes-invitacion" className="space-y-2">
        <h2 id="ajustes-invitacion" className={group}>Invitación</h2>
        <Block id="plazo" icon={CalendarClock} title="Plazo para confirmar" summary={summaries.plazo} description="Hasta esta fecha y hora los delegados pueden responder o cambiar su respuesta. Después, la confirmación queda bloqueada.">
          <SettingsForm initialDeadline={rsvpDeadline} />
        </Block>

        <Block id="regalos" icon={Gift} title="Regalos" summary={summaries.regalos} description="Se muestran en la sección «Regalos». Si dejas vacíos el alias y el CBU, la sección no aparece.">
          <GiftsForm initial={{ holder: holder ?? "", alias: alias ?? "", cbu: cbu ?? "", note: note ?? "" }} />
        </Block>

        <Block id="ninos" icon={Baby} title="Nota sobre niños" summary={summaries.ninos} description="La ven solo las familias que tienen marcada «Mostrar la nota de celebración sin niños» en Invitados. Es solo informativa.">
          <AdultsNoteForm initial={adultsNote ?? ""} />
        </Block>

        <Block id="historia" icon={BookHeart} title="Nuestra historia" summary={summaries.historia} description="Se muestra solo a quienes iniciaron sesión. Si lo dejas vacío, la sección no aparece.">
          <StoryForm initial={story ?? ""} />
        </Block>

        <Block id="cortejo" icon={HeartHandshake} title="Padrinos y cortejo" summary={summaries.cortejo} description="Aparecen en «Nuestro cortejo», como agradecimiento por su ayuda. Solo los ven los invitados con sesión iniciada.">
          <WeddingPartyForm initial={party} people={people} />
        </Block>

        <Block id="preguntas" icon={MessageCircleQuestion} title="Preguntas y respuestas" summary={summaries.preguntas} description="Las dudas que suelen tener los invitados, con su respuesta. Aparecen en el último paso de la invitación, en el orden de esta lista. Sin preguntas, la sección no aparece.">
          <FaqForm initial={faq} />
        </Block>
      </section>

      <section aria-labelledby="ajustes-equipo" className="space-y-2">
        <h2 id="ajustes-equipo" className={group}>Equipo</h2>
        <Block
          id="permisos"
          icon={ShieldCheck}
          title="Permisos de administradores"
          summary={summaries.permisos}
          description={<>Elige qué puede ver y editar cada administrador. Ver Mesas incluye ver Invitados y Familias. <strong className="font-medium text-on-surface">Los cambios se aplican cuando esa persona cierra sesión y vuelve a entrar.</strong></>}
        >
          <AdminPermissionsManager
            admins={admins}
            permissions={editablePermissions}
            currentUserId={session!.user!.id as number}
          />
        </Block>
      </section>
    </div>
  );
}
