import { auth } from "@/auth";
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
      <div className="text-center pb-2">
        <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Menú</h1>
        <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
          Pasapalos, platos, postres y bebidas: qué se sirve en cada momento de la boda.
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Ítems" value={String(active.length)} icon={UtensilsCrossed} />
        <SummaryCard label="Confirmados" value={`${confirmed}/${active.length}`} icon={Check} />
        <SummaryCard label="Bebidas" value={String(drinks)} icon={Wine} />
        <SummaryCard
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

      <div className="pb-16 text-center">
        <p className="font-serif italic text-primary/60 text-lg">David &amp; Rocio · 03 de Abril, 2026</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, icon: Icon, tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof UtensilsCrossed;
  tone?: "default" | "warn";
}) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">{label}</p>
        <Icon className="w-4 h-4 text-on-surface-variant opacity-60" />
      </div>
      <span className={`text-2xl font-serif ${tone === "warn" ? "text-error" : "text-primary"}`}>{value}</span>
    </div>
  );
}
