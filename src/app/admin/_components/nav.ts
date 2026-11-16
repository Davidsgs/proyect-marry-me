// Única lista de secciones del panel, filtrada por permisos. La usan la barra
// lateral (escritorio) y la barra inferior (móvil).
import {
    LayoutDashboard,
    Users,
    Settings,
    ListTodo,
    Armchair,
    CalendarClock,
    Wallet,
    UtensilsCrossed,
    type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; icon: LucideIcon; label: string };

export function buildNav(permissions?: string[]): NavItem[] {
    const has = (p: string) => !!permissions?.includes(p);
    const items: NavItem[] = [{ href: "/admin", icon: LayoutDashboard, label: "Resumen" }];
    if (has("families.read") && has("users.read")) items.push({ href: "/admin/guests", icon: Users, label: "Invitados" });
    if (has("tasks.read")) items.push({ href: "/admin/tasks", icon: ListTodo, label: "Tareas" });
    if (has("tables.read")) items.push({ href: "/admin/tables", icon: Armchair, label: "Mesas" });
    if (has("calendar.read")) items.push({ href: "/admin/cronograma", icon: CalendarClock, label: "Cronograma" });
    if (has("menu.read")) items.push({ href: "/admin/menu", icon: UtensilsCrossed, label: "Menú" });
    if (has("finance.read")) items.push({ href: "/admin/finance", icon: Wallet, label: "Economía" });
    if (has("settings.write")) items.push({ href: "/admin/settings", icon: Settings, label: "Ajustes" });
    return items;
}

/** Activo en su ruta y sus subrutas (excepto Resumen, que solo es /admin). */
export function isActive(pathname: string, href: string): boolean {
    return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
