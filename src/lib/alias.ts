// Alias único por persona (users.alias): minúsculas, letras, números y guiones.
// Sirve para encontrar a alguien sin ambigüedad (p. ej. al asignarlo como
// responsable en el cronograma). Se genera solo a partir del nombre y se puede editar.
export const ALIAS_MIN = 3;
export const ALIAS_MAX = 30;
export const ALIAS_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** «José María Pérez» → «jose-maria-perez». */
export function slugifyAlias(text: string): string {
    const slug = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, ALIAS_MAX)
        .replace(/-+$/, "");
    return slug.length >= ALIAS_MIN ? slug : `invitado${slug ? `-${slug}` : ""}`;
}

/** Primer alias libre a partir de `base`: base, base-2, base-3… Marca el elegido como ocupado. */
export function uniqueAlias(base: string, taken: Set<string>): string {
    let alias = base;
    for (let n = 2; taken.has(alias); n++) {
        const suffix = `-${n}`;
        alias = base.slice(0, ALIAS_MAX - suffix.length).replace(/-+$/, "") + suffix;
    }
    taken.add(alias);
    return alias;
}

/** Mensaje de error, o null si el alias es válido (no comprueba si está libre). */
export function aliasError(alias: string): string | null {
    if (alias.length < ALIAS_MIN) return `El alias necesita al menos ${ALIAS_MIN} caracteres.`;
    if (alias.length > ALIAS_MAX) return `El alias admite hasta ${ALIAS_MAX} caracteres.`;
    if (!ALIAS_RE.test(alias)) return "Solo minúsculas, números y guiones (sin espacios ni tildes), por ejemplo «tio-pepe».";
    return null;
}

// Self-check mínimo (se ejecuta solo con `npx tsx src/lib/alias.ts`).
if (typeof process !== "undefined" && /[\\/]lib[\\/]alias\.ts$/.test(process.argv?.[1] ?? "")) {
    const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
    assert(slugifyAlias("José María Pérez") === "jose-maria-perez", "tildes");
    assert(slugifyAlias("  Ñandú  ") === "nandu", "eñe");
    assert(slugifyAlias("Al") === "invitado-al", "corto");
    const taken = new Set(["ana-lopez"]);
    assert(uniqueAlias("ana-lopez", taken) === "ana-lopez-2", "duplicado");
    assert(uniqueAlias("ana-lopez", taken) === "ana-lopez-3", "triplicado");
    assert(aliasError("tio-pepe") === null && aliasError("Tio Pepe") !== null, "validación");
    console.log("alias ok");
}
