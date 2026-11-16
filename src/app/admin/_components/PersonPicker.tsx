"use client";

import { useId, useRef, useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import { inputSmCls } from "./ui";

/** Invitado que se puede elegir (solo nombre y alias; nunca correos). */
export type Person = { id: number; name: string; alias: string | null };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Buscador de invitados por nombre o @alias. Elegir una sugerencia llama a
// onPick; Enter (o +) con texto que no es de la lista llama a onFree, para
// quien no tiene cuenta (DJ, catering…). Sin onFree, solo se eligen invitados.
export function PersonPicker({
    people,
    excludeIds,
    onPick,
    onFree,
    placeholder = "Buscar invitado o escribir un nombre…",
    label,
    hint,
}: {
    people: Person[];
    excludeIds?: Set<number>;
    onPick: (p: Person) => void;
    onFree?: (name: string) => void;
    placeholder?: string;
    label: string;
    hint?: string;
}) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();
    const q = norm(query.trim().replace(/^@/, ""));
    const matches = q
        ? people.filter((p) => !excludeIds?.has(p.id) && (norm(p.name).includes(q) || (p.alias ?? "").includes(q))).slice(0, 6)
        : [];
    const optionId = (i: number) => `${listId}-${i}`;

    function addFree() {
        const name = query.trim();
        if (!name || !onFree) return;
        setQuery("");
        onFree(name);
    }

    function pick(p: Person) {
        setQuery("");
        onPick(p);
        inputRef.current?.focus();
    }

    return (
        <div>
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            if (onFree) addFree();
                            else if (matches.length === 1) pick(matches[0]);
                        } else if (e.key === "ArrowDown" && matches.length) {
                            e.preventDefault();
                            document.getElementById(optionId(0))?.focus();
                        }
                    }}
                    placeholder={placeholder}
                    aria-label={label}
                    aria-controls={matches.length ? listId : undefined}
                    autoComplete="off"
                    className={`${inputSmCls} flex-1 min-w-0 min-h-11 pointer-fine:min-h-9`}
                />
                {onFree && (
                    <button
                        type="button"
                        onClick={addFree}
                        disabled={!query.trim()}
                        className="shrink-0 w-11 h-11 pointer-fine:w-9 pointer-fine:h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-40 transition-colors cursor-pointer"
                        aria-label={query.trim() ? `Añadir «${query.trim()}» como nombre libre` : label}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
            {matches.length > 0 ? (
                <ul id={listId} aria-label="Invitados que coinciden" className="mt-1.5 rounded-xl bg-surface-container-low p-1 space-y-0.5">
                    {matches.map((p, i) => (
                        <li key={p.id}>
                            <button
                                id={optionId(i)}
                                type="button"
                                onClick={() => pick(p)}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") { e.preventDefault(); document.getElementById(optionId(i + 1))?.focus(); }
                                    if (e.key === "ArrowUp") { e.preventDefault(); (i === 0 ? inputRef.current : document.getElementById(optionId(i - 1)))?.focus(); }
                                }}
                                className="w-full flex items-center gap-2 min-h-11 pointer-fine:min-h-9 px-3 rounded-lg text-left text-sm text-on-surface hover:bg-surface-container focus-visible:bg-surface-container outline-none cursor-pointer"
                            >
                                <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                                <span className="truncate">{p.name}</span>
                                {p.alias && <span className="ml-auto text-xs text-on-surface-variant truncate">@{p.alias}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                hint && (
                    <p className="mt-1.5 text-xs text-on-surface-variant">
                        {q && onFree ? "Ningún invitado coincide: Enter lo añade como nombre libre." : q ? "Ningún invitado coincide." : hint}
                    </p>
                )
            )}
        </div>
    );
}
