// Importancia de una tarea. En la base se guarda en inglés (HIGHEST…LOW);
// en la interfaz siempre se muestra la etiqueta en español.
export const PRIORITIES = ["HIGHEST", "HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DEFAULT_PRIORITY: Priority = "MEDIUM";

export const PRIORITY_LABEL: Record<Priority, string> = {
    HIGHEST: "Muy alta",
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Baja",
};

// Para ordenar: menor = más importante.
export const PRIORITY_RANK: Record<Priority, number> = { HIGHEST: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const isPriority = (v: unknown): v is Priority => PRIORITIES.includes(v as Priority);
