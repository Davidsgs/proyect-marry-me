"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDraggable,
    type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { tables as tablesTable, users as usersTable } from "@/db/schema";
import {
    createArea,
    renameArea,
    deleteArea,
    createLayout,
    renameLayout,
    setActiveLayout,
    deleteLayout,
    createElement,
    updateElement,
    deleteElement,
    setItemPosition,
    type ElementKind,
    type ElementShape,
    type FloorElement,
    type FloorPlan,
} from "@/app/actions/floor";
import { isTemp, pendingRowCls, tempId, useOptimisticState, type Patch } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { Checkbox, EmptyState, btnGhost, btnPrimary, btnSecondary, iconBtn, iconBtnDanger, inputCls } from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import { GrowText } from "@/components/GrowText";
import {
    Move, Plus, Pencil, Trash2, Star, Copy, Shapes, Check, Pipette, ZoomIn, ZoomOut, LocateFixed,
    Music, Cake, Disc3, Wine, Mic, Camera, DoorOpen, type LucideIcon,
} from "lucide-react";

type Table = typeof tablesTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type Pos = { x: number; y: number };
type ElementData = { kind: ElementKind; label: string; shape: ElementShape; width: number; height: number; color: string | null };

const NODE_W = 180;
const NODE_H = 120;
const COLS = 4;
const GAP_X = 200;
const GAP_Y = 150;
const PAD = 20;
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");
// Zoom del plano: límites y paso de los botones.
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 1.2;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

// Elementos del plano que no son mesas: nombre, icono, color de marca y tamaño inicial.
export const ELEMENT_KINDS: { kind: ElementKind; label: string; icon: LucideIcon; cls: string; size: [number, number]; shape: ElementShape }[] = [
    { kind: "DANCE_FLOOR", label: "Pista de baile", icon: Disc3, cls: "bg-secondary-container text-on-secondary-container", size: [260, 200], shape: "RECT" },
    { kind: "SWEETS", label: "Mesa dulce", icon: Cake, cls: "bg-rubor text-tinta", size: [200, 90], shape: "RECT" },
    { kind: "DJ", label: "DJ", icon: Music, cls: "bg-primary text-on-primary", size: [140, 90], shape: "RECT" },
    { kind: "BAR", label: "Barra", icon: Wine, cls: "bg-surface-container text-on-surface", size: [220, 80], shape: "RECT" },
    { kind: "STAGE", label: "Escenario", icon: Mic, cls: "bg-oliva text-crema", size: [260, 110], shape: "RECT" },
    { kind: "PHOTO", label: "Rincón de fotos", icon: Camera, cls: "bg-rosa text-tinta", size: [140, 140], shape: "ROUND" },
    { kind: "ENTRANCE", label: "Entrada", icon: DoorOpen, cls: "bg-surface-container-lowest text-on-surface outline-2 outline-dashed outline-outline-variant", size: [140, 60], shape: "RECT" },
    { kind: "OTHER", label: "Otro", icon: Shapes, cls: "bg-surface-container text-on-surface", size: [140, 90], shape: "RECT" },
];
const KIND = Object.fromEntries(ELEMENT_KINDS.map((k) => [k.kind, k])) as Record<ElementKind, (typeof ELEMENT_KINDS)[number]>;

// Colores que se pueden elegir para un elemento: la paleta del manual de marca.
// Sin color propio, cada tipo usa el suyo (ELEMENT_KINDS).
const ELEMENT_COLORS = [
    { hex: "#e7c6c1", name: "Rubor" },
    { hex: "#d9a3a0", name: "Rosa" },
    { hex: "#df8e86", name: "Coral" },
    { hex: "#7f5351", name: "Rosa profundo" },
    { hex: "#d5e2d6", name: "Salvia clara" },
    { hex: "#afc3b1", name: "Salvia" },
    { hex: "#828a6c", name: "Musgo" },
    { hex: "#6f7f6a", name: "Oliva" },
    { hex: "#55634f", name: "Oliva profundo" },
    { hex: "#364033", name: "Tinta" },
    { hex: "#e1d9cc", name: "Arena" },
];
const INK = "#364033";
const PAPER = "#f2eee8";

function luminance(hex: string) {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Fondo elegido + el texto (tinta o crema) que mejor contrasta con él. */
function colorStyle(hex: string | null): React.CSSProperties | undefined {
    if (!hex) return undefined;
    const l = luminance(hex);
    const onInk = (l + 0.05) / (luminance(INK) + 0.05);
    const onPaper = (luminance(PAPER) + 0.05) / (l + 0.05);
    return { backgroundColor: hex, color: onInk >= onPaper ? INK : PAPER };
}

const posKey = (layoutId: number, type: "t" | "e", id: number) => `${layoutId}:${type}:${id}`;

export default function TablePlan({
    tables,
    floor,
    membersByTable,
    canWrite,
    areaId,
    onAreaChange,
    onEditTable,
}: {
    tables: Table[];
    floor: FloorPlan;
    membersByTable: Map<number, User[]>;
    canWrite: boolean;
    areaId: number | null;
    onAreaChange: (id: number) => void;
    onEditTable: (t: Table) => void;
}) {
    const confirm = useConfirm();
    // Cambios optimistas en áreas, alternativas, elementos y posiciones.
    const [plan, mutate] = useOptimisticState(floor);
    const [layoutByArea, setLayoutByArea] = useState<Record<number, number>>({});
    const [dialog, setDialog] = useState<
        | { kind: "area-new" } | { kind: "area-rename" }
        | { kind: "layout-new" } | { kind: "layout-rename" }
        | { kind: "element-new" } | { kind: "element-edit"; element: FloorElement }
        | null
    >(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );
    // ── Vista del lienzo: zoom (rueda en PC, pellizco en el móvil, botones), arrastre
    // del fondo para desplazarse y centrar. Las posiciones guardadas
    // siguen en coordenadas del plano: el zoom solo cambia cómo se ve.
    const [zoom, setZoom] = useState(1);
    const viewport = useRef<HTMLDivElement>(null);
    // Zoom vigente para los manejadores de rueda y pellizco (se actualiza tras cada render).
    const zoomRef = useRef(zoom);
    useLayoutEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);
    // Punto que debe quedar quieto al cambiar el zoom (bajo el cursor o los dedos).
    const anchor = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

    function zoomAt(next: number, px?: number, py?: number) {
        const el = viewport.current;
        const z = zoomRef.current;
        const target = clampZoom(next);
        if (!el || target === z) return;
        const ax = px ?? el.clientWidth / 2;
        const ay = py ?? el.clientHeight / 2;
        anchor.current = { x: (el.scrollLeft + ax) / z, y: (el.scrollTop + ay) / z, px: ax, py: ay };
        setZoom(target);
    }

    // «Centrar»: el zoom que hace entrar todo (sin pasar del 100 %) y el contenido en el
    // medio. Mide las piezas en el DOM (offset* no incluye la escala del lienzo).
    function fit() {
        const el = viewport.current;
        const nodes = el ? Array.from(el.querySelectorAll<HTMLElement>("[data-plan-node]")) : [];
        if (!el || nodes.length === 0) return;
        const minX = Math.min(...nodes.map((n) => n.offsetLeft));
        const minY = Math.min(...nodes.map((n) => n.offsetTop));
        const maxX = Math.max(...nodes.map((n) => n.offsetLeft + n.offsetWidth));
        const maxY = Math.max(...nodes.map((n) => n.offsetTop + n.offsetHeight));
        const margin = 32;
        const z = clampZoom(Math.min(1, (el.clientWidth - margin * 2) / (maxX - minX), (el.clientHeight - margin * 2) / (maxY - minY)));
        const a = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, px: el.clientWidth / 2, py: el.clientHeight / 2 };
        if (z === zoomRef.current) {
            el.scrollLeft = a.x * z - a.px;
            el.scrollTop = a.y * z - a.py;
        } else {
            anchor.current = a;
            setZoom(z);
        }
    }

    // Tras cambiar el zoom, desplaza para que el punto de anclaje no se mueva.
    useLayoutEffect(() => {
        const el = viewport.current;
        const a = anchor.current;
        if (!el || !a) return;
        anchor.current = null;
        el.scrollLeft = a.x * zoom - a.px;
        el.scrollTop = a.y * zoom - a.py;
    }, [zoom]);

    // Rueda y pellizco: escuchas no pasivas para poder evitar el scroll y el zoom de la página.
    useEffect(() => {
        const el = viewport.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const r = el.getBoundingClientRect();
            zoomAt(zoomRef.current * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
        };
        let pinch: { dist: number; zoom: number } | null = null;
        const distOf = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) pinch = { dist: distOf(e.touches), zoom: zoomRef.current };
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!pinch || e.touches.length !== 2) return;
            e.preventDefault();
            const r = el.getBoundingClientRect();
            const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
            const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
            zoomAt(pinch.zoom * (distOf(e.touches) / pinch.dist), mx, my);
        };
        const onTouchEnd = (e: TouchEvent) => {
            if (e.touches.length < 2) pinch = null;
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd);
        el.addEventListener("touchcancel", onTouchEnd);
        return () => {
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            el.removeEventListener("touchcancel", onTouchEnd);
        };
    });

    // Al abrir el plano o cambiar de área o alternativa, se encuadra todo.
    useEffect(() => {
        const id = requestAnimationFrame(() => fit());
        return () => cancelAnimationFrame(id);
    }, [areaId, layoutByArea]);

    // Con el ratón, arrastrar el fondo desplaza el plano (la rueda ahora hace zoom).
    function panStart(e: React.PointerEvent<HTMLDivElement>) {
        const el = viewport.current;
        if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
        if ((e.target as HTMLElement).closest("[data-plan-node]")) return;
        const start = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
        const move = (ev: PointerEvent) => {
            el.scrollLeft = start.left - (ev.clientX - start.x);
            el.scrollTop = start.top - (ev.clientY - start.y);
        };
        const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    }

    // Al soltar tras arrastrar, el navegador dispara también un clic: no abrir el editor.
    const justDragged = useRef(false);
    const openIfClick = (fn: () => void) => () => {
        if (!justDragged.current) fn();
    };
    const endDrag = () => {
        justDragged.current = true;
        setTimeout(() => { justDragged.current = false; }, 0);
    };

    const areas = plan.areas;
    const area = areas.find((a) => a.id === areaId) ?? areas[0] ?? null;
    if (!area) {
        return <EmptyState message="Aún no hay áreas en el plano." />;
    }
    const firstAreaId = areas[0].id;
    const knownAreas = new Set(areas.map((a) => a.id));
    const areaLayouts = plan.layouts.filter((l) => l.areaId === area.id);
    const layout = areaLayouts.find((l) => l.id === layoutByArea[area.id]) ?? areaLayouts.find((l) => l.isActive) ?? areaLayouts[0] ?? null;
    // Mesas sin área (o de un área borrada) se dibujan en la primera.
    const areaTables = tables.filter((t) => (t.areaId != null && knownAreas.has(t.areaId) ? t.areaId : firstAreaId) === area.id);
    const areaElements = plan.elements.filter((e) => e.areaId === area.id);

    const posMap = new Map(plan.positions.map((p) => [p.tableId != null ? posKey(p.layoutId, "t", p.tableId) : posKey(p.layoutId, "e", p.elementId!), { x: p.x, y: p.y }]));
    const tableRows = Math.ceil(areaTables.length / COLS);
    function tablePos(t: Table, i: number): Pos {
        return (layout && posMap.get(posKey(layout.id, "t", t.id))) ?? { x: (i % COLS) * GAP_X + PAD, y: Math.floor(i / COLS) * GAP_Y + PAD };
    }
    function elementPos(e: FloorElement, i: number): Pos {
        return (layout && posMap.get(posKey(layout.id, "e", e.id))) ?? { x: PAD + i * 40, y: tableRows * GAP_Y + PAD * 2 + i * 40 };
    }

    const placedTables = areaTables.map((t, i) => ({ t, pos: tablePos(t, i) }));
    const placedElements = areaElements.map((e, i) => ({ e, pos: elementPos(e, i) }));
    const canvasW = Math.max(COLS * GAP_X + PAD * 2, ...placedTables.map(({ pos }) => pos.x + NODE_W + PAD), ...placedElements.map(({ e, pos }) => pos.x + e.width + PAD));
    const canvasH = Math.max(520, ...placedTables.map(({ pos }) => pos.y + NODE_H + PAD), ...placedElements.map(({ e, pos }) => pos.y + e.height + PAD));


    function upsertPos(layoutId: number, item: { tableId: number } | { elementId: number }, pos: Pos): Patch<FloorPlan> {
        return (p) => {
            const isTable = "tableId" in item;
            const match = (x: FloorPlan["positions"][number]) => x.layoutId === layoutId && (isTable ? x.tableId === item.tableId : x.elementId === item.elementId);
            const exists = p.positions.some(match);
            return {
                ...p,
                positions: exists
                    ? p.positions.map((x) => (match(x) ? { ...x, ...pos } : x))
                    : [...p.positions, { id: tempId(), layoutId, tableId: isTable ? item.tableId : null, elementId: isTable ? null : item.elementId, ...pos }],
            };
        };
    }

    function onDragEnd(event: DragEndEvent) {
        endDrag();
        if (!layout || isTemp(layout.id)) return;
        const [type, rawId] = String(event.active.id).split("-");
        const id = Number(rawId);
        const base = type === "t"
            ? placedTables.find((p) => p.t.id === id)?.pos
            : placedElements.find((p) => p.e.id === id)?.pos;
        if (!base) return;
        // El arrastre llega en píxeles de pantalla: con zoom, se pasan a coordenadas del plano.
        const pos = { x: Math.max(0, Math.round(base.x + event.delta.x / zoom)), y: Math.max(0, Math.round(base.y + event.delta.y / zoom)) };
        const item = type === "t" ? { tableId: id } : { elementId: id };
        mutate(upsertPos(layout.id, item, pos), () => setItemPosition(layout.id, item, pos.x, pos.y), { error: type === "t" ? "No se pudo mover la mesa" : "No se pudo mover el elemento" });
    }

    // ── Áreas y alternativas ──
    function saveArea(name: string) {
        if (dialog?.kind === "area-new") {
            const id = tempId();
            mutate(
                (p) => ({
                    ...p,
                    areas: [...p.areas, { id, name, sortOrder: p.areas.length, createdAt: nowSql() }],
                    layouts: [...p.layouts, { id: tempId(), areaId: id, name: "Principal", isActive: true, sortOrder: 0, createdAt: nowSql() }],
                }),
                () => createArea(name).then((realId) => onAreaChange(realId)),
                { ok: `Área «${name}» creada`, error: "No se pudo crear el área" },
            );
            onAreaChange(id);
        } else {
            mutate((p) => ({ ...p, areas: p.areas.map((a) => (a.id === area!.id ? { ...a, name } : a)) }), () => renameArea(area!.id, name), { ok: "Área renombrada", error: "No se pudo renombrar el área" });
        }
        setDialog(null);
    }

    async function removeArea() {
        const ok = await confirm({
            title: `¿Eliminar el área «${area!.name}»?`,
            description: `Se borran sus alternativas y elementos. Sus ${areaTables.length} mesas no se borran: pasan a «${areas.find((a) => a.id !== area!.id)?.name}».`,
            confirmLabel: "Eliminar área",
        });
        if (!ok) return;
        const goneId = area!.id;
        const next = areas.find((a) => a.id !== goneId)!;
        onAreaChange(next.id);
        mutate(
            (p) => ({ ...p, areas: p.areas.filter((a) => a.id !== goneId), layouts: p.layouts.filter((l) => l.areaId !== goneId), elements: p.elements.filter((e) => e.areaId !== goneId) }),
            () => deleteArea(goneId),
            { ok: "Área eliminada", error: "No se pudo eliminar el área" },
        );
    }

    function saveLayout(name: string, copy: boolean) {
        if (dialog?.kind === "layout-new") {
            const id = tempId();
            const areaIdNow = area!.id;
            const source = copy && layout ? layout.id : null;
            mutate(
                (p) => ({
                    ...p,
                    layouts: [...p.layouts, { id, areaId: areaIdNow, name, isActive: false, sortOrder: areaLayouts.length, createdAt: nowSql() }],
                    positions: source ? [...p.positions, ...p.positions.filter((x) => x.layoutId === source).map((x) => ({ ...x, id: tempId(), layoutId: id }))] : p.positions,
                }),
                () => createLayout(areaIdNow, name, source).then((realId) => setLayoutByArea((m) => ({ ...m, [areaIdNow]: realId }))),
                { ok: `Alternativa «${name}» creada`, error: "No se pudo crear la alternativa" },
            );
            setLayoutByArea((m) => ({ ...m, [areaIdNow]: id }));
        } else if (layout) {
            mutate((p) => ({ ...p, layouts: p.layouts.map((l) => (l.id === layout.id ? { ...l, name } : l)) }), () => renameLayout(layout.id, name), { ok: "Alternativa renombrada", error: "No se pudo renombrar la alternativa" });
        }
        setDialog(null);
    }

    function makeActive() {
        if (!layout) return;
        mutate(
            (p) => ({ ...p, layouts: p.layouts.map((l) => (l.areaId === layout.areaId ? { ...l, isActive: l.id === layout.id } : l)) }),
            () => setActiveLayout(layout.id),
            { ok: `«${layout.name}» es ahora la distribución vigente`, error: "No se pudo marcar como vigente" },
        );
    }

    async function removeLayout() {
        if (!layout) return;
        const ok = await confirm({ title: `¿Eliminar la alternativa «${layout.name}»?`, description: "Se pierden las posiciones de esta alternativa. Las mesas y los invitados no cambian.", confirmLabel: "Eliminar alternativa" });
        if (!ok) return;
        const gone = layout;
        const rest = areaLayouts.filter((l) => l.id !== gone.id);
        setLayoutByArea((m) => ({ ...m, [gone.areaId]: rest[0].id }));
        mutate(
            (p) => ({
                ...p,
                layouts: p.layouts.filter((l) => l.id !== gone.id).map((l) => (gone.isActive && l.id === rest[0].id ? { ...l, isActive: true } : l)),
                positions: p.positions.filter((x) => x.layoutId !== gone.id),
            }),
            () => deleteLayout(gone.id),
            { ok: "Alternativa eliminada", error: "No se pudo eliminar la alternativa" },
        );
    }

    // ── Elementos ──
    function saveElement(data: ElementData) {
        if (dialog?.kind === "element-new" && layout) {
            const id = tempId();
            // Aparece arriba a la izquierda, visible sin desplazar el lienzo.
            const pos = { x: PAD, y: PAD };
            mutate(
                (p) => ({
                    ...p,
                    elements: [...p.elements, { id, areaId: area!.id, ...data, createdAt: nowSql() }],
                    positions: [...p.positions, { id: tempId(), layoutId: layout.id, tableId: null, elementId: id, ...pos }],
                }),
                () => createElement(area!.id, layout.id, data, pos.x, pos.y),
                { ok: `${data.label || KIND[data.kind].label} añadido al plano`, error: "No se pudo añadir el elemento" },
            );
        } else if (dialog?.kind === "element-edit") {
            const el = dialog.element;
            mutate((p) => ({ ...p, elements: p.elements.map((e) => (e.id === el.id ? { ...e, ...data } : e)) }), () => updateElement(el.id, data), { ok: "Elemento guardado", error: "No se pudo guardar el elemento" });
        }
        setDialog(null);
    }

    async function removeElement(el: FloorElement) {
        setDialog(null);
        const name = el.label || KIND[el.kind].label;
        if (!(await confirm({ title: `¿Quitar «${name}» del plano?`, description: "Desaparece de todas las alternativas de esta área.", confirmLabel: "Quitar" }))) return;
        mutate(
            (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== el.id), positions: p.positions.filter((x) => x.elementId !== el.id) }),
            () => deleteElement(el.id),
            { ok: `${name} quitado del plano`, error: "No se pudo quitar el elemento" },
        );
    }

    const chip = (on: boolean) =>
        `inline-flex items-center gap-1.5 min-h-11 pointer-fine:min-h-9 px-3.5 rounded-full text-label font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            on ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
        }`;
    const layoutBusy = !layout || isTemp(layout.id);

    return (
        <div className="space-y-4">
            {/* Áreas */}
            <div className="flex flex-wrap items-center gap-2">
                <span id="plan-areas" className="text-label font-medium text-on-surface-variant mr-1">Área</span>
                <div role="radiogroup" aria-labelledby="plan-areas" className="flex flex-wrap gap-2">
                    {areas.map((a) => (
                        <button key={a.id} type="button" role="radio" aria-checked={a.id === area.id} onClick={() => onAreaChange(a.id)} className={`${chip(a.id === area.id)} ${isTemp(a.id) ? pendingRowCls : ""}`}>
                            {a.name}
                        </button>
                    ))}
                </div>
                {canWrite && (
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setDialog({ kind: "area-new" })} className={iconBtn} aria-label="Nueva área"><Plus className="w-4 h-4" /></button>
                        <button type="button" disabled={isTemp(area.id)} onClick={() => setDialog({ kind: "area-rename" })} className={iconBtn} aria-label={`Renombrar el área «${area.name}»`}><Pencil className="w-4 h-4" /></button>
                        <button type="button" disabled={areas.length <= 1 || isTemp(area.id)} onClick={removeArea} className={iconBtnDanger} aria-label={`Eliminar el área «${area.name}»`} title={areas.length <= 1 ? "Tiene que quedar al menos un área" : undefined}><Trash2 className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            {/* Alternativas del área */}
            <div className="rounded-2xl bg-surface-container-lowest p-3 sm:p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span id="plan-layouts" className="text-label font-medium text-on-surface-variant mr-1">Alternativa</span>
                    <div role="radiogroup" aria-labelledby="plan-layouts" className="flex flex-wrap gap-2">
                        {areaLayouts.map((l) => (
                            <button
                                key={l.id}
                                type="button"
                                role="radio"
                                aria-checked={l.id === layout?.id}
                                onClick={() => setLayoutByArea((m) => ({ ...m, [area.id]: l.id }))}
                                className={`${chip(l.id === layout?.id)} ${isTemp(l.id) ? pendingRowCls : ""}`}
                            >
                                {l.isActive && <Star className="w-3.5 h-3.5 fill-current" aria-label="Vigente" role="img" />}
                                {l.name}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-label text-on-surface-variant">
                    {layout?.isActive
                        ? <>«{layout.name}» es la distribución <span className="font-medium text-on-surface">vigente</span>, la que se usará el día de la boda.</>
                        : <>Estás viendo «{layout?.name}», una alternativa de prueba. La vigente se marca con <Star className="inline w-3 h-3 fill-current align-[-1px]" aria-label="estrella" role="img" />.</>}
                    {" "}Las mesas y los invitados son los mismos en todas: solo cambia dónde está dibujada cada cosa.
                </p>
                {canWrite && (
                    <div className="flex flex-wrap gap-2">
                        {layout && !layout.isActive && (
                            <button type="button" disabled={layoutBusy} onClick={makeActive} className={btnPrimary}>
                                <Star className="w-4 h-4" aria-hidden /> Marcar como vigente
                            </button>
                        )}
                        <button type="button" disabled={layoutBusy} onClick={() => setDialog({ kind: "layout-new" })} className={btnSecondary}>
                            <Copy className="w-4 h-4" aria-hidden /> Nueva alternativa
                        </button>
                        <button type="button" disabled={layoutBusy} onClick={() => setDialog({ kind: "element-new" })} className={btnSecondary}>
                            <Plus className="w-4 h-4" aria-hidden /> Añadir elemento
                        </button>
                        <span className="flex items-center gap-1 sm:ml-auto">
                            <button type="button" disabled={layoutBusy} onClick={() => setDialog({ kind: "layout-rename" })} className={iconBtn} aria-label={`Renombrar la alternativa «${layout?.name}»`}><Pencil className="w-4 h-4" /></button>
                            <button type="button" disabled={layoutBusy || areaLayouts.length <= 1} onClick={removeLayout} className={iconBtnDanger} aria-label={`Eliminar la alternativa «${layout?.name}»`} title={areaLayouts.length <= 1 ? "Cada área necesita al menos una alternativa" : undefined}><Trash2 className="w-4 h-4" /></button>
                        </span>
                    </div>
                )}
            </div>

            <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                <Move className="w-4 h-4 shrink-0" aria-hidden />
                {canWrite
                    ? "Arrastra mesas y elementos (en el móvil, mantén pulsado) para recrear la distribución. Toca uno para editarlo. Todo se guarda solo."
                    : "Distribución del área (solo lectura)."}
                {" "}Acerca o aleja con la rueda del ratón o pellizcando.
            </p>

            {areaTables.length === 0 && areaElements.length === 0 ? (
                <EmptyState message={canWrite ? "Esta área está vacía. Asigna mesas desde «Editar mesa» o añade elementos como la pista o la mesa dulce." : "Esta área está vacía."} />
            ) : (
                <div className="space-y-2">
                <div role="toolbar" aria-label="Vista del plano" className="flex flex-wrap items-center justify-end gap-1">
                    <button type="button" onClick={() => zoomAt(zoom / ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} className={iconBtn} aria-label="Alejar"><ZoomOut className="w-4 h-4" /></button>
                    <span className="min-w-12 text-center text-label font-medium tabular-nums text-on-surface-variant" aria-live="polite">{Math.round(zoom * 100)} %</span>
                    <button type="button" onClick={() => zoomAt(zoom * ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} className={iconBtn} aria-label="Acercar"><ZoomIn className="w-4 h-4" /></button>
                    <button type="button" onClick={fit} className={btnGhost}>
                        <LocateFixed className="w-4 h-4" aria-hidden /> Centrar
                    </button>
                </div>
                {/* touch-action: un dedo desplaza (nativo); el pellizco lo maneja el plano. */}
                <div
                    ref={viewport}
                    onPointerDown={panStart}
                    className="flex h-[min(70vh,40rem)] overflow-auto overscroll-contain rounded-2xl bg-surface-container-low [touch-action:pan-x_pan-y] cursor-grab active:cursor-grabbing"
                >
                    <DndContext id="tables-plan" sensors={sensors} onDragEnd={onDragEnd} onDragCancel={endDrag}>
                        {/* El tamaño escalado da el área de scroll; m-auto centra el plano si es más chico que la ventana. */}
                        <div className="relative m-auto shrink-0" style={{ width: canvasW * zoom, height: canvasH * zoom }}>
                        <div
                            className="absolute left-0 top-0 origin-top-left"
                            style={{
                                width: canvasW,
                                height: canvasH,
                                transform: `scale(${zoom})`,
                            }}
                        >
                            {/* Elementos debajo de las mesas: la pista suele quedar rodeada de mesas */}
                            {placedElements.map(({ e, pos }) => (
                                <ElementNode key={e.id} element={e} pos={pos} zoom={zoom} canWrite={canWrite && !layoutBusy} onOpen={openIfClick(() => setDialog({ kind: "element-edit", element: e }))} />
                            ))}
                            {placedTables.map(({ t, pos }) => (
                                <TableNode key={t.id} table={t} pos={pos} zoom={zoom} count={membersByTable.get(t.id)?.length ?? 0} canWrite={canWrite && !layoutBusy} onOpen={openIfClick(() => onEditTable(t))} />
                            ))}
                        </div>
                        </div>
                    </DndContext>
                </div>
                </div>
            )}

            <Dialog open={dialog?.kind === "area-new" || dialog?.kind === "area-rename"} onClose={() => setDialog(null)} title={dialog?.kind === "area-new" ? "Nueva área" : "Renombrar área"} description={dialog?.kind === "area-new" ? "Un espacio con sus propias mesas y elementos: salón, jardín, terraza…" : undefined} size="sm">
                {(dialog?.kind === "area-new" || dialog?.kind === "area-rename") && (
                    <NameForm key={dialog.kind} initial={dialog.kind === "area-rename" ? area.name : ""} placeholder="Jardín" submitLabel={dialog.kind === "area-new" ? "Crear área" : "Guardar"} onSave={(n) => saveArea(n)} onCancel={() => setDialog(null)} />
                )}
            </Dialog>

            <Dialog open={dialog?.kind === "layout-new" || dialog?.kind === "layout-rename"} onClose={() => setDialog(null)} title={dialog?.kind === "layout-new" ? `Nueva alternativa de «${area.name}»` : "Renombrar alternativa"} size="sm">
                {(dialog?.kind === "layout-new" || dialog?.kind === "layout-rename") && (
                    <NameForm
                        key={dialog.kind}
                        initial={dialog.kind === "layout-rename" ? layout?.name ?? "" : ""}
                        placeholder="Opción B"
                        submitLabel={dialog.kind === "layout-new" ? "Crear alternativa" : "Guardar"}
                        copyFrom={dialog.kind === "layout-new" ? layout?.name : undefined}
                        onSave={(n, copy) => saveLayout(n, copy)}
                        onCancel={() => setDialog(null)}
                    />
                )}
            </Dialog>

            <Dialog open={dialog?.kind === "element-new" || dialog?.kind === "element-edit"} onClose={() => setDialog(null)} title={dialog?.kind === "element-edit" ? "Editar elemento" : "Añadir elemento"} description={dialog?.kind === "element-new" ? `Aparece en «${area.name}», arriba a la izquierda del plano.` : undefined} size="md">
                {(dialog?.kind === "element-new" || dialog?.kind === "element-edit") && (
                    <ElementForm
                        key={dialog.kind === "element-edit" ? dialog.element.id : "new"}
                        initial={dialog.kind === "element-edit" ? dialog.element : undefined}
                        onSave={saveElement}
                        onDelete={dialog.kind === "element-edit" ? () => removeElement(dialog.element) : undefined}
                        onCancel={() => setDialog(null)}
                    />
                )}
            </Dialog>
        </div>
    );
}

// ── Piezas del lienzo ────────────────────────────────────────────────────────

function useNodeDrag(id: string, canWrite: boolean, pos: Pos, zoom: number) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: !canWrite });
    const style: React.CSSProperties = {
        position: "absolute",
        left: pos.x,
        top: pos.y,
        // El lienzo está escalado: el desplazamiento del arrastre (en pantalla) se divide por el zoom.
        transform: transform ? CSS.Translate.toString({ ...transform, x: transform.x / zoom, y: transform.y / zoom }) : undefined,
        zIndex: isDragging ? 50 : undefined,
    };
    return { attributes, listeners, setNodeRef, isDragging, style };
}

function TableNode({ table, pos, zoom, count, canWrite, onOpen }: { table: Table; pos: Pos; zoom: number; count: number; canWrite: boolean; onOpen: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging, style } = useNodeDrag(`t-${table.id}`, canWrite && !isTemp(table.id), pos, zoom);
    const over = count > table.capacity;
    return (
        <div
            ref={setNodeRef}
            data-plan-node
            style={{ ...style, width: NODE_W, zIndex: style.zIndex ?? 2 }}
            {...listeners}
            {...attributes}
            role={canWrite ? "button" : undefined}
            aria-label={canWrite ? `Mesa ${table.number}: arrastra para mover, pulsa para editar` : undefined}
            onClick={canWrite ? onOpen : undefined}
            onKeyDown={canWrite ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}
            className={`select-none ${canWrite ? "touch-none cursor-grab active:cursor-grabbing" : ""} bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${isDragging ? "ring-2 ring-primary/50 shadow-md" : ""} ${isTemp(table.id) ? pendingRowCls : ""}`}
        >
            <h4 className="font-serif text-2xl leading-none text-on-surface truncate">Mesa {table.number}</h4>
            {table.name && <p className="mt-1 text-xs text-on-surface-variant truncate">{table.name}</p>}
            <div className="mt-3 flex items-center justify-center">
                <span className={`text-xs font-medium tabular-nums px-3 py-1 rounded-full ${over ? "bg-error/10 text-error" : "bg-secondary-container text-on-secondary-container"}`}>
                    {count}/{table.capacity} asientos
                </span>
            </div>
        </div>
    );
}

function ElementNode({ element, pos, zoom, canWrite, onOpen }: { element: FloorElement; pos: Pos; zoom: number; canWrite: boolean; onOpen: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging, style } = useNodeDrag(`e-${element.id}`, canWrite && !isTemp(element.id), pos, zoom);
    const meta = KIND[element.kind];
    const Icon = meta.icon;
    const name = element.label || meta.label;
    return (
        <div
            ref={setNodeRef}
            data-plan-node
            style={{ ...style, width: element.width, height: element.height, zIndex: style.zIndex ?? 1, ...colorStyle(element.color) }}
            {...listeners}
            {...attributes}
            role={canWrite ? "button" : undefined}
            aria-label={canWrite ? `${name}: arrastra para mover, pulsa para editar` : name}
            onClick={canWrite ? onOpen : undefined}
            onKeyDown={canWrite ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}
            className={`select-none ${canWrite ? "touch-none cursor-grab active:cursor-grabbing" : ""} ${element.shape === "ROUND" ? "rounded-full" : "rounded-2xl"} ${meta.cls} flex flex-col items-center justify-center gap-1 p-2 text-center shadow-sm ${isDragging ? "ring-2 ring-primary/50 shadow-md" : ""} ${isTemp(element.id) ? pendingRowCls : ""}`}
        >
            <Icon className="w-5 h-5 shrink-0" aria-hidden />
            <span className="text-sm font-medium leading-tight line-clamp-2">{name}</span>
        </div>
    );
}

// ── Formularios ──────────────────────────────────────────────────────────────

function NameForm({ initial, placeholder, submitLabel, copyFrom, onSave, onCancel }: {
    initial: string;
    placeholder: string;
    submitLabel: string;
    /** Si se indica, ofrece copiar las posiciones de esa alternativa. */
    copyFrom?: string;
    onSave: (name: string, copy: boolean) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initial);
    const [copy, setCopy] = useState(true);
    return (
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim(), copy); }} className="space-y-4">
            <label className="block">
                <span className="block text-label font-medium text-on-surface-variant mb-1.5">Nombre</span>
                <GrowText autoFocus required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className={inputCls} />
            </label>
            {copyFrom && <Checkbox checked={copy} onChange={setCopy} label={`Empezar con las posiciones de «${copyFrom}»`} />}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className={btnGhost}>Cancelar</button>
                <button type="submit" disabled={!name.trim()} className={btnPrimary}>{submitLabel}</button>
            </div>
        </form>
    );
}

function ElementForm({ initial, onSave, onDelete, onCancel }: {
    initial?: FloorElement;
    onSave: (data: ElementData) => void;
    onDelete?: () => void;
    onCancel: () => void;
}) {
    const [kind, setKind] = useState<ElementKind>(initial?.kind ?? "DANCE_FLOOR");
    const [label, setLabel] = useState(initial?.label ?? "");
    const [shape, setShape] = useState<ElementShape>(initial?.shape ?? KIND.DANCE_FLOOR.shape);
    const [width, setWidth] = useState(initial?.width ?? KIND.DANCE_FLOOR.size[0]);
    const [height, setHeight] = useState(initial?.height ?? KIND.DANCE_FLOOR.size[1]);
    const [color, setColor] = useState<string | null>(initial?.color ?? null);
    const customColor = color && !ELEMENT_COLORS.some((c) => c.hex === color) ? color : null;
    const meta = KIND[kind];
    const lbl = "block text-label font-medium text-on-surface-variant mb-1.5";

    function pickKind(k: ElementKind) {
        setKind(k);
        // Al crear, cada tipo arranca con su forma y tamaño habituales.
        if (!initial) {
            setShape(KIND[k].shape);
            setWidth(KIND[k].size[0]);
            setHeight(KIND[k].size[1]);
        }
    }

    const scale = Math.min(1, 220 / Math.max(width, height));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ kind, label: label.trim(), shape, width, height, color }); }} className="space-y-5">
            <fieldset>
                <legend className={lbl}>Tipo</legend>
                <div role="radiogroup" aria-label="Tipo de elemento" className="flex flex-wrap gap-2">
                    {ELEMENT_KINDS.map((k) => (
                        <button
                            key={k.kind}
                            type="button"
                            role="radio"
                            aria-checked={kind === k.kind}
                            onClick={() => pickKind(k.kind)}
                            className={`inline-flex items-center gap-1.5 min-h-11 pointer-fine:min-h-9 px-3.5 rounded-full text-label font-medium transition-colors cursor-pointer ${
                                kind === k.kind ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                            }`}
                        >
                            <k.icon className="w-4 h-4" aria-hidden /> {k.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <label className="block">
                <span className={lbl}>Nombre en el plano <span className="font-normal">(opcional)</span></span>
                <GrowText maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={meta.label} className={inputCls} />
            </label>

            <div className="grid gap-5 sm:grid-cols-[1fr_auto] items-start">
                <div className="space-y-4">
                    <fieldset>
                        <legend className={lbl}>Forma</legend>
                        <div role="radiogroup" aria-label="Forma" className="flex gap-1 bg-surface-container-low rounded-xl p-1 w-fit">
                            {([["RECT", "Rectangular"], ["ROUND", "Redonda"]] as const).map(([v, l]) => (
                                <button key={v} type="button" role="radio" aria-checked={shape === v} onClick={() => setShape(v)} className={`min-h-10 px-4 rounded-lg text-sm font-medium cursor-pointer ${shape === v ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <label className="block">
                        <span className={lbl}>Ancho</span>
                        <input type="range" min={60} max={600} step={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full accent-primary" aria-valuetext={`${width} puntos`} />
                    </label>
                    <label className="block">
                        <span className={lbl}>Alto</span>
                        <input type="range" min={40} max={600} step={10} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full accent-primary" aria-valuetext={`${height} puntos`} />
                    </label>
                    <p className="text-xs text-on-surface-variant">Como referencia, una mesa ocupa unos {NODE_W} de ancho.</p>
                    <fieldset>
                        <legend className={lbl}>Color</legend>
                        <div role="radiogroup" aria-label="Color del elemento" className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                role="radio"
                                aria-checked={color === null}
                                onClick={() => setColor(null)}
                                title="El color de su tipo"
                                className={`inline-flex items-center gap-1.5 min-h-11 pointer-fine:min-h-8 pl-1.5 pr-3 rounded-full text-label font-medium cursor-pointer ${
                                    color === null ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest" : ""
                                } bg-surface-container-low text-on-surface hover:bg-surface-container`}
                            >
                                <span className={`w-6 h-6 rounded-full ${meta.cls}`} aria-hidden />
                                Por defecto
                            </button>
                            {ELEMENT_COLORS.map((c) => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    role="radio"
                                    aria-checked={color === c.hex}
                                    aria-label={c.name}
                                    title={c.name}
                                    onClick={() => setColor(c.hex)}
                                    style={{ backgroundColor: c.hex }}
                                    className={`w-11 h-11 pointer-fine:w-8 pointer-fine:h-8 rounded-full ring-1 ring-inset ring-outline-variant cursor-pointer flex items-center justify-center ${
                                        color === c.hex ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest" : ""
                                    }`}
                                >
                                    {color === c.hex && <Check className="w-4 h-4" style={{ color: colorStyle(c.hex)?.color }} aria-hidden />}
                                </button>
                            ))}
                            {/* Color libre: el selector nativo del sistema */}
                            <label
                                title="Otro color"
                                className={`relative w-11 h-11 pointer-fine:w-8 pointer-fine:h-8 rounded-full cursor-pointer flex items-center justify-center ring-1 ring-inset ring-outline-variant ${
                                    customColor ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest" : "bg-surface-container-low"
                                }`}
                                style={customColor ? { backgroundColor: customColor } : undefined}
                            >
                                <Pipette className="w-4 h-4" style={{ color: customColor ? colorStyle(customColor)?.color : undefined }} aria-hidden />
                                <span className="sr-only">Otro color</span>
                                <input
                                    type="color"
                                    value={customColor ?? "#d9a3a0"}
                                    onChange={(e) => setColor(e.target.value.toLowerCase())}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </label>
                        </div>
                    </fieldset>
                </div>
                {/* Vista previa a escala */}
                <div className="w-[236px] h-[236px] rounded-2xl bg-surface-container-low flex items-center justify-center" aria-hidden>
                    <div className={`${shape === "ROUND" ? "rounded-full" : "rounded-2xl"} ${meta.cls} flex flex-col items-center justify-center gap-1 p-2 text-center`} style={{ width: width * scale, height: height * scale, ...colorStyle(color) }}>
                        <meta.icon className="w-5 h-5" />
                        <span className="text-xs font-medium leading-tight line-clamp-2">{label.trim() || meta.label}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-2">
                {onDelete && (
                    <button type="button" onClick={onDelete} className={`${btnGhost} text-error hover:text-error hover:bg-error/10 sm:mr-auto`}>
                        <Trash2 className="w-4 h-4" aria-hidden /> Quitar del plano
                    </button>
                )}
                <button type="button" onClick={onCancel} className={`${btnGhost} ${onDelete ? "" : "sm:ml-auto"}`}>Cancelar</button>
                <button type="submit" className={btnPrimary}>
                    {initial ? "Guardar" : <><Plus className="w-4 h-4" aria-hidden /> Añadir al plano</>}
                </button>
            </div>
        </form>
    );
}
