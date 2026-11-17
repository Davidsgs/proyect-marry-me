import { auth } from "@/auth";
import { PageHeader, StatCard } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getMenu } from "@/app/actions/menu";
import { cachedUsers } from "@/lib/data";
import { DIETARY, DIETARY_LABEL } from "@/lib/diet";
import MenuManager from "./_components/MenuManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await auth();
  const perms = session?.user?.permissions;

  if (!hasPermission(perms, "menu.read")) {
    redirect("/admin");
  }

  const canWrite = hasPermission(perms, "menu.write");
  // Solo recuentos (sin nombres): lo que el catering necesita saber.
  const [{ items, moments }, users] = await Promise.all([getMenu(), cachedUsers()]);

  const active = items.filter((i) => i.status !== "DISCARDED");
  const confirmed = active.filter((i) => i.status === "CONFIRMED").length;
  const drinks = active.filter((i) => i.type === "BEBIDA").length;
  const unassigned = active.filter((i) => i.activityId === null).length;

  const attending = users.filter((u) => u.familyId != null && u.isConfirmed);
  const dietCounts = DIETARY.filter((d) => d !== "NONE" && d !== "OTHER")
    .map((d) => ({ label: DIETARY_LABEL[d], count: attending.filter((u) => u.dietary === d).length }))
    .filter((d) => d.count > 0);
  const others = attending.filter((u) => u.dietary === "OTHER").map((u) => u.dietaryNote).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <PageHeader title="Menú" description="Pasapalos, platos, postres y bebidas: qué se sirve en cada momento de la boda." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ítems" value={active.length} />
        <StatCard label="Confirmados" value={<>{confirmed}<span className="text-sm font-normal text-on-surface-variant"> / {active.length}</span></>} tone="good" />
        <StatCard label="Bebidas" value={drinks} />
        <StatCard label="Por asignar" value={unassigned} tone={unassigned > 0 ? "warn" : "default"} hint={unassigned > 0 ? "Sin momento del cronograma" : undefined} />
      </div>

      <section aria-labelledby="restricciones" className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6">
        <h2 id="restricciones" className="font-serif text-3xl leading-display text-primary">Restricciones de los invitados</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Lo que indicaron los {attending.length} {attending.length === 1 ? "invitado confirmado" : "invitados confirmados"} al responder.
        </p>
        {dietCounts.length === 0 && others.length === 0 ? (
          <p className="mt-4 text-sm text-on-surface">Nadie ha indicado restricciones por ahora.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {dietCounts.map((d) => (
              <li key={d.label} className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3.5 py-1.5 text-sm text-on-secondary-container">
                {d.label} <span className="font-semibold tabular-nums">{d.count}</span>
              </li>
            ))}
            {others.map((note, i) => (
              <li key={`${note}-${i}`} className="inline-flex items-center rounded-full bg-surface-container px-3.5 py-1.5 text-sm text-on-surface">
                {note}
              </li>
            ))}
          </ul>
        )}
      </section>

      <MenuManager
        initialItems={items}
        moments={moments}
        canWrite={canWrite}
      />
    </div>
  );
}
