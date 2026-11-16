import { ChevronDown, ChevronUp, ChevronsUp, Equal, type LucideIcon } from "lucide-react";
import { PRIORITIES, PRIORITY_LABEL, type Priority } from "@/lib/priority";

// Un icono por grado de importancia (flechas tipo gestor de tareas). El color
// refuerza, nunca es la única señal: el icono cambia de forma y lleva etiqueta.
export const PRIORITY_ICON: Record<Priority, { icon: LucideIcon; cls: string }> = {
    HIGHEST: { icon: ChevronsUp, cls: "text-error" },
    HIGH: { icon: ChevronUp, cls: "text-rosa-profundo" },
    MEDIUM: { icon: Equal, cls: "text-on-surface-variant" },
    LOW: { icon: ChevronDown, cls: "text-on-secondary-container" },
};

export function PriorityIcon({ priority, className = "w-4 h-4" }: { priority: Priority; className?: string }) {
    const { icon: Icon, cls } = PRIORITY_ICON[priority];
    return <Icon className={`${className} ${cls} shrink-0`} strokeWidth={2.25} aria-label={`Importancia ${PRIORITY_LABEL[priority].toLowerCase()}`} role="img" />;
}

// Selector de importancia: cuatro botones con icono y etiqueta.
export function PriorityPicker({ value, onChange, idPrefix }: { value: Priority; onChange: (p: Priority) => void; idPrefix: string }) {
    return (
        <fieldset>
            <legend id={`${idPrefix}-prio`} className="block text-[13px] font-medium text-on-surface-variant mb-1.5">Importancia</legend>
            <div role="radiogroup" aria-labelledby={`${idPrefix}-prio`} className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => {
                    const { icon: Icon, cls } = PRIORITY_ICON[p];
                    const on = p === value;
                    return (
                        <button
                            key={p}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => onChange(p)}
                            className={`inline-flex items-center gap-1.5 min-h-11 pointer-fine:min-h-9 px-3.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                                on ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${on ? "" : cls}`} strokeWidth={2.25} aria-hidden />
                            {PRIORITY_LABEL[p]}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}
