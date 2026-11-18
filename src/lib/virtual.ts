// Invitación virtual (families.is_virtual): familiares que siguen la boda en vivo
// desde otro país (/dashboard/en-vivo). No cuentan entre los presenciales: Invitados, Resumen, Mesas y
// la lista de mesas trabajan solo con las familias presenciales; Virtuales, con
// las virtuales. Las personas sin familia aparecen en las dos (se pueden sumar a
// cualquier familia).

export const LIVE_STREAM_KEY = "live_stream_url"; // event_config

type F = { id: number; isVirtual: boolean };
type U = { familyId: number | null };

/** Familias de un tipo y las personas que les corresponden (más las sin familia). */
export function byInvitation<Fam extends F, Usr extends U>(families: Fam[], users: Usr[], virtual: boolean) {
    const kept = families.filter((f) => f.isVirtual === virtual);
    const ids = new Set(kept.map((f) => f.id));
    return { families: kept, users: users.filter((u) => u.familyId == null || ids.has(u.familyId)) };
}

/** Enlace válido de la transmisión (http/https) o null. */
export function parseStreamUrl(raw: string): string | null {
    try {
        const url = new URL(raw.trim());
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
    } catch {
        return null;
    }
}
