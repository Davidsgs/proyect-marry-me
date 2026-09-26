import { auth } from "@/auth";
import { PageHeader, StatCard } from "@/app/admin/_components/ui";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getMenu } from "@/app/actions/menu";
import { UtensilsCrossed, Check, Wine, HelpCircle } from "lucide-react";
import MenuManager from "./_components/MenuManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await auth();
  const perms = session?.user?.permissions;

  if (!hasPermission(perms, "menu.read")) {
    redirect("/admin");
  }

  const canWrite = hasPermission(perms, "menu.write");
  const { items, moments } = await getMenu();

  const active = items.filter((i) => i.status !== "DISCARDED");
  const confirmed = active.filter((i) => i.status === "CONFIRMED").length;
  const drinks = active.filter((i) => i.type === "BEBIDA").length;
  const unassigned = active.filter((i) => i.activityId === null).length;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <PageHeader title="Menú" description="Pasapalos, platos, postres y bebidas: qué se sirve en cada momento de la boda." />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ítems" value={String(active.length)} icon={UtensilsCrossed} />
        <StatCard label="Confirmados" value={`${confirmed}/${active.length}`} icon={Check} />
        <StatCard label="Bebidas" value={String(drinks)} icon={Wine} />
        <StatCard
          label="Por asignar"
          value={String(unassigned)}
          icon={HelpCircle}
          tone={unassigned > 0 ? "warn" : "default"}
        />
      </div>

      <MenuManager
        initialItems={items}
        moments={moments}
        canWrite={canWrite}
      />
    </div>
  );
}

