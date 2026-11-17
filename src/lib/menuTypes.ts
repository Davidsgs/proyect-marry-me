// Tipos de ítem del menú: etiqueta e ícono. Los usan el panel (Menú) y la
// invitación, para que un plato se nombre y se dibuje igual en los dos.
import { Cake, CookingPot, IceCreamCone, Salad, Sandwich, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";
import type { MenuType } from "@/app/actions/menu";

export const MENU_TYPES: { value: MenuType; label: string; icon: LucideIcon }[] = [
  { value: "PASAPALO", label: "Pasapalo", icon: Sandwich },
  { value: "ENTRADA", label: "Entrada", icon: Salad },
  { value: "PRINCIPAL", label: "Principal", icon: CookingPot },
  { value: "POSTRE", label: "Postre", icon: IceCreamCone },
  { value: "BEBIDA", label: "Bebida", icon: Wine },
  { value: "TORTA", label: "Torta", icon: Cake },
  { value: "OTRO", label: "Otro", icon: UtensilsCrossed },
];

export const MENU_TYPE_META = Object.fromEntries(MENU_TYPES.map((t) => [t.value, t])) as Record<MenuType, (typeof MENU_TYPES)[number]>;
