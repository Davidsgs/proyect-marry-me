// Tipos de ítem del menú: etiqueta e ícono. Los usan el panel (Menú) y la
// invitación, para que un plato se nombre y se dibuje igual en los dos.
import { Cake, Carrot, CookingPot, IceCreamCone, Salad, Sandwich, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";
import type { MenuType } from "@/app/actions/menu";

export const MENU_TYPES: { value: MenuType; label: string; icon: LucideIcon }[] = [
  { value: "PASAPALO", label: "Pasapalo", icon: Sandwich },
  { value: "ENTRADA", label: "Entrada", icon: Salad },
  { value: "PRINCIPAL", label: "Principal", icon: CookingPot },
  // Guarnición del plato principal. «Acompañante» ya nombra a los invitados que no son delegados.
  { value: "ACOMPANAMIENTO", label: "Acompañamiento", icon: Carrot },
  { value: "POSTRE", label: "Postre", icon: IceCreamCone },
  { value: "BEBIDA", label: "Bebida", icon: Wine },
  { value: "TORTA", label: "Torta", icon: Cake },
  { value: "OTRO", label: "Otro", icon: UtensilsCrossed },
];

export const MENU_TYPE_META = Object.fromEntries(MENU_TYPES.map((t) => [t.value, t])) as Record<MenuType, (typeof MENU_TYPES)[number]>;

// Orden y nombre de cada «curso» en la carta de la invitación, como en un
// restaurante: primero lo que se come, al final las bebidas.
export const MENU_COURSES: { value: MenuType; plural: string }[] = [
  { value: "PASAPALO", plural: "Pasapalos" },
  { value: "ENTRADA", plural: "Entradas" },
  { value: "PRINCIPAL", plural: "Principales" },
  { value: "ACOMPANAMIENTO", plural: "Acompañamientos" },
  { value: "POSTRE", plural: "Postres" },
  { value: "TORTA", plural: "Torta" },
  { value: "OTRO", plural: "Otros" },
  { value: "BEBIDA", plural: "Bebidas" },
];
