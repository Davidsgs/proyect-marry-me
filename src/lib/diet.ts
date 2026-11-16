// Restricciones alimentarias por persona. Opciones cerradas más «Otra», que
// lleva un texto corto. Compartido por el RSVP, el panel y la validación en servidor.
export const DIETARY = ["NONE", "VEGETARIAN", "VEGAN", "GLUTEN_FREE", "LACTOSE_FREE", "OTHER"] as const;
export type Dietary = (typeof DIETARY)[number];

export const DIETARY_LABEL: Record<Dietary, string> = {
    NONE: "Ninguna",
    VEGETARIAN: "Vegetariano",
    VEGAN: "Vegano",
    GLUTEN_FREE: "Sin gluten (celíaco)",
    LACTOSE_FREE: "Sin lactosa",
    OTHER: "Otra",
};

export const DIETARY_NOTE_MAX = 20;

/** Normaliza y valida una restricción. Lanza un Error con mensaje para el usuario. */
export function parseDietary(value: unknown, note: unknown): { dietary: Dietary; dietaryNote: string } {
    const dietary = (DIETARY as readonly string[]).includes(value as string) ? (value as Dietary) : "NONE";
    if (dietary !== "OTHER") return { dietary, dietaryNote: "" };
    const text = typeof note === "string" ? note.trim().replace(/\s+/g, " ") : "";
    if (!text) throw new Error("Escribe cuál es la restricción en «Otra».");
    if (text.length > DIETARY_NOTE_MAX) throw new Error(`La restricción «Otra» admite hasta ${DIETARY_NOTE_MAX} caracteres.`);
    return { dietary, dietaryNote: text };
}

/** Texto para mostrar: la etiqueta o, si es «Otra», la nota escrita. */
export function dietaryText(dietary: string | null | undefined, note: string | null | undefined): string | null {
    if (!dietary || dietary === "NONE") return null;
    if (dietary === "OTHER") return note || "Otra";
    return DIETARY_LABEL[dietary as Dietary] ?? null;
}
