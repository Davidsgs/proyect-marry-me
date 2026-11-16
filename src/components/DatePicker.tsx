"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { parseLocalDate, todayLocalISO } from "@/lib/dates";
import { WEDDING_DATE_ISO } from "@/lib/wedding";

// Selector de fecha propio (valor "YYYY-MM-DD" o ""). Escritorio: calendario
// flotante junto al campo (Popover API, capa superior: no lo recorta un <dialog>).
// Móvil: hoja inferior con días de 44px. Teclado: flechas, RePág/AvPág, Inicio/Fin.
// Con `name` añade un <input type="hidden"> para formularios con FormData.

const WEDDING_DAY = WEDDING_DATE_ISO.slice(0, 10);
const WEEKDAYS = [
    ["L", "lunes"], ["M", "martes"], ["X", "miércoles"], ["J", "jueves"],
    ["V", "viernes"], ["S", "sábado"], ["D", "domingo"],
] as const;

const fmtValue = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });
const fmtDay = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const toISO = (d: Date) => d.toLocaleDateString("en-CA");
function addDays(iso: string, n: number) {
    const d = parseLocalDate(iso);
    d.setDate(d.getDate() + n);
    return toISO(d);
}
function addMonths(iso: string, n: number) {
    const d = parseLocalDate(iso);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return toISO(d);
}
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Props = {
    value?: string;
    defaultValue?: string;
    onChange?: (iso: string) => void;
    name?: string;
    id?: string;
    min?: string;
    max?: string;
    placeholder?: string;
    size?: "md" | "sm";
    /** Muestra la «x» para vaciar el campo. */
    clearable?: boolean;
    /** Clases del contenedor (anchos, columnas de grid). */
    className?: string;
    /** Sustituye el estilo del botón disparador (p. ej. como chip). */
    triggerClassName?: string;
    "aria-label"?: string;
};

export function DatePicker({
    value,
    defaultValue = "",
    onChange,
    name,
    id,
    min,
    max,
    placeholder = "Elegir fecha",
    size = "md",
    clearable = true,
    className = "",
    triggerClassName,
    "aria-label": ariaLabel,
}: Props) {
    const [inner, setInner] = useState(defaultValue);
    const current = value ?? inner;
    const isDesktop = useMediaQuery("(min-width: 640px)");
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const popId = useId();

    function commit(iso: string) {
        if (value === undefined) setInner(iso);
        onChange?.(iso);
    }

    function close() {
        if (popRef.current?.matches(":popover-open")) popRef.current.hidePopover();
        setOpen(false);
        triggerRef.current?.focus();
    }

    function select(iso: string) {
        commit(iso);
        close();
    }

    // Escritorio: el botón abre/cierra el popover con popovertarget; clic fuera y
    // Escape lo cierran solos (light dismiss). Aquí solo se sincroniza el estado.
    useEffect(() => {
        const pop = popRef.current;
        if (!pop || !isDesktop) return;
        const onToggle = (e: Event) => setOpen((e as ToggleEvent).newState === "open");
        pop.addEventListener("toggle", onToggle);
        return () => pop.removeEventListener("toggle", onToggle);
    }, [isDesktop]);

    // Coloca el calendario debajo del campo (arriba si no cabe) y lo cierra si la
    // página se desplaza, porque el campo se movería.
    useLayoutEffect(() => {
        const pop = popRef.current;
        if (!pop || !open || !isDesktop) return;
        const r = triggerRef.current!.getBoundingClientRect();
        const w = pop.offsetWidth, h = pop.offsetHeight;
        const below = r.bottom + 6;
        const top = below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : below;
        const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
        pop.style.top = `${top}px`;
        pop.style.left = `${left}px`;
        pop.dataset.placed = "";
        const hide = (e: Event) => {
            if (e.type === "resize" || !pop.contains(e.target as Node)) pop.hidePopover();
        };
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);
        return () => {
            delete pop.dataset.placed;
            window.removeEventListener("scroll", hide, true);
            window.removeEventListener("resize", hide);
        };
    }, [open, isDesktop]);

    const sm = size === "sm";
    const defaultTrigger =
        `w-full flex items-center gap-2 text-left text-on-surface bg-surface-container-low outline-none transition-[background-color,box-shadow] duration-150 ` +
        `hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-primary/45 ` +
        (sm ? "min-h-11 pointer-fine:min-h-9 px-3 rounded-lg text-sm" : "min-h-11 px-4 py-2.5 rounded-xl text-sm") +
        (clearable && current ? " pr-10" : "");

    const calendar = open && (
        <Calendar value={current} min={min} max={max} onSelect={select} onClear={clearable ? () => select("") : undefined} />
    );

    return (
        <div className={`relative ${className}`}>
            {name && <input type="hidden" name={name} value={current} />}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="dialog"
                aria-expanded={open}
                popoverTarget={isDesktop ? popId : undefined}
                onClick={isDesktop ? undefined : () => setOpen(true)}
                className={triggerClassName ?? defaultTrigger}
            >
                <CalendarDays className="w-4 h-4 shrink-0 text-on-surface-variant" aria-hidden />
                <span className={`truncate ${current ? "" : "text-on-surface-variant/80"}`}>
                    {current ? capitalize(fmtValue.format(parseLocalDate(current))) : placeholder}
                </span>
            </button>
            {clearable && current && !triggerClassName && (
                <button
                    type="button"
                    onClick={() => commit("")}
                    aria-label="Quitar fecha"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 pointer-fine:w-7 pointer-fine:h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                >
                    <X className="w-4 h-4" aria-hidden />
                </button>
            )}

            {isDesktop ? (
                <div
                    ref={popRef}
                    id={popId}
                    popover="auto"
                    role="dialog"
                    aria-label="Elegir fecha"
                    className="fixed m-0 w-80 border-0 p-3 rounded-2xl bg-surface-container-lowest text-on-surface shadow-xl opacity-0 data-placed:opacity-100"
                >
                    {calendar}
                </div>
            ) : (
                <Dialog open={open} onClose={close} title="Elegir fecha" size="sm">
                    <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{calendar}</div>
                </Dialog>
            )}
        </div>
    );
}

function Calendar({
    value,
    min,
    max,
    onSelect,
    onClear,
}: {
    value: string;
    min?: string;
    max?: string;
    onSelect: (iso: string) => void;
    onClear?: () => void;
}) {
    const today = todayLocalISO();
    const [focus, setFocus] = useState(value || (min && min > today ? min : today));
    const [view, setView] = useState(focus.slice(0, 7)); // "YYYY-MM"
    const gridRef = useRef<HTMLDivElement>(null);
    // true al abrir y al mover con el teclado: solo entonces se mueve el foco.
    const moved = useRef(true);

    const out = (iso: string) => Boolean((min && iso < min) || (max && iso > max));
    const first = parseLocalDate(`${view}-01`);
    const start = addDays(`${view}-01`, -((first.getDay() + 6) % 7));
    const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));

    const tabStop = focus.slice(0, 7) === view ? focus : `${view}-01`;

    useEffect(() => {
        if (!moved.current) return;
        moved.current = false;
        gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus();
    }, [focus, view]);

    function moveTo(iso: string) {
        moved.current = true;
        setFocus(iso);
        setView(iso.slice(0, 7));
    }

    function onKeyDown(e: React.KeyboardEvent) {
        const from = (e.target as HTMLElement).dataset.iso ?? focus;
        const map: Record<string, () => string> = {
            ArrowLeft: () => addDays(from, -1),
            ArrowRight: () => addDays(from, 1),
            ArrowUp: () => addDays(from, -7),
            ArrowDown: () => addDays(from, 7),
            PageUp: () => addMonths(from, -1),
            PageDown: () => addMonths(from, 1),
            Home: () => addDays(from, -((parseLocalDate(from).getDay() + 6) % 7)),
            End: () => addDays(from, 6 - ((parseLocalDate(from).getDay() + 6) % 7)),
        };
        const next = map[e.key];
        if (!next) return;
        e.preventDefault();
        moveTo(next());
    }

    const navBtn = "w-11 h-11 pointer-fine:w-9 pointer-fine:h-9 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container-low disabled:opacity-30 disabled:hover:bg-transparent";
    const prevMonth = addMonths(`${view}-01`, -1);
    const nextMonth = addMonths(`${view}-01`, 1);

    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-2">
                <button type="button" onClick={() => setView(prevMonth.slice(0, 7))} disabled={Boolean(min && prevMonth.slice(0, 7) < min.slice(0, 7))} className={navBtn} aria-label="Mes anterior">
                    <ChevronLeft className="w-5 h-5" aria-hidden />
                </button>
                <p className="font-serif text-xl text-primary" aria-live="polite">{capitalize(fmtMonth.format(first))}</p>
                <button type="button" onClick={() => setView(nextMonth.slice(0, 7))} disabled={Boolean(max && nextMonth.slice(0, 7) > max.slice(0, 7))} className={navBtn} aria-label="Mes siguiente">
                    <ChevronRight className="w-5 h-5" aria-hidden />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-medium text-on-surface-variant mb-1" aria-hidden>
                {WEEKDAYS.map(([s, full]) => <abbr key={full} title={full} className="no-underline py-1">{s}</abbr>)}
            </div>

            <div ref={gridRef} onKeyDown={onKeyDown} className="grid grid-cols-7 gap-y-1" role="group" aria-label="Días del mes">
                {days.map((iso) => {
                    const inMonth = iso.slice(0, 7) === view;
                    const selected = iso === value;
                    const isToday = iso === today;
                    const wedding = iso === WEDDING_DAY;
                    const disabled = out(iso);
                    return (
                        <button
                            key={iso}
                            type="button"
                            data-iso={iso}
                            tabIndex={iso === tabStop ? 0 : -1}
                            disabled={disabled}
                            onClick={() => onSelect(iso)}
                            aria-pressed={selected}
                            aria-current={isToday ? "date" : undefined}
                            aria-label={`${fmtDay.format(parseLocalDate(iso))}${wedding ? ", día de la boda" : ""}`}
                            className={`relative mx-auto w-11 h-11 pointer-fine:w-9 pointer-fine:h-9 rounded-full text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-30 disabled:cursor-not-allowed ${
                                selected
                                    ? "bg-primary text-on-primary font-semibold"
                                    : `${inMonth ? "text-on-surface" : "text-on-surface-variant/50"} hover:bg-surface-container-low ${isToday ? "font-semibold ring-1 ring-inset ring-primary/50" : ""}`
                            }`}
                        >
                            {parseLocalDate(iso).getDate()}
                            {wedding && (
                                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${selected ? "bg-on-primary" : "bg-mono-r"}`} aria-hidden />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between gap-2 mt-3">
                <button
                    type="button"
                    onClick={() => onSelect(today)}
                    disabled={out(today)}
                    className="min-h-11 pointer-fine:min-h-9 px-3 rounded-xl text-sm font-medium text-primary hover:bg-surface-container-low disabled:opacity-40"
                >
                    Hoy
                </button>
                {onClear && value && (
                    <button type="button" onClick={onClear} className="min-h-11 pointer-fine:min-h-9 px-3 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low">
                        Quitar fecha
                    </button>
                )}
            </div>
        </div>
    );
}
