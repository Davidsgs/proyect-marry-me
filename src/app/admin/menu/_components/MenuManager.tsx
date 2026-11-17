"use client";

import { useState } from "react";
import { isTemp, pendingRowCls, tempId, useOptimisticState, type Patch } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { Checkbox, EmptyState, Field, btnPrimary, btnSecondary, btnGhost, btnGhostSm, iconBtn, iconBtnDanger, inputCls, selectCls } from "@/app/admin/_components/ui";
import { Dialog } from "@/components/Dialog";
import { GrowText } from "@/components/GrowText";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Trash2, Pencil, Save, GripVertical, Clock,
  UtensilsCrossed, HelpCircle,
  Leaf, WheatOff, MilkOff, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import {
  createMenuItem, updateMenuItem, deleteMenuItem, setMenuItemStatus, setMenuItemPublic, showMenuItems, moveMenuItem,
  type MenuItem, type MenuMoment, type MenuType, type MenuStatus,
} from "@/app/actions/menu";
import { MENU_TYPES, MENU_TYPE_META } from "@/lib/menuTypes";

type Mutate = (patch: Patch<MenuItem[]>, action: () => Promise<unknown>, msg: { ok?: string; error: string }) => Promise<boolean>;
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

interface Props {
  initialItems: MenuItem[];
  moments: MenuMoment[];
  canWrite: boolean;
}

const TYPES = MENU_TYPES;
const TYPE_META = MENU_TYPE_META;

// Idea = en estudio; Confirmado = cerrado con el proveedor; Descartado = no va,
// pero se conserva por si se recupera.
const STATUS_META: Record<MenuStatus, { label: string; cls: string }> = {
  IDEA: { label: "Idea", cls: "bg-surface-container text-on-surface-variant" },
  CONFIRMED: { label: "Confirmado", cls: "bg-secondary-container text-on-secondary-container" },
  DISCARDED: { label: "Descartado", cls: "bg-error/10 text-error" },
};

// Clave de grupo para el DnD: cada momento del cronograma es un contenedor, más
// el pseudo-momento "sin asignar".
const groupKey = (activityId: number | null) => (activityId == null ? "group:none" : `group:${activityId}`);
const groupActivityId = (key: string): number | null => {
  const raw = key.slice("group:".length);
  return raw === "none" ? null : Number(raw);
};

export default function MenuManager({ initialItems, moments, canWrite }: Props) {
  // Cambios optimistas (alta, edición, estado, borrado y arrastre): se ven al
  // momento y se deshacen si el servidor falla.
  const [items, mutate] = useOptimisticState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<MenuType | "ALL">("ALL");
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  // Grupos en orden de cronograma; "Por asignar" siempre al final.
  const groups: { key: string; title: string; time: string | null; activityId: number | null }[] = [
    ...moments.map((m) => ({ key: groupKey(m.id), title: m.title, time: m.time, activityId: m.id })),
    { key: "group:none", title: "Por asignar", time: null, activityId: null },
  ];

  const visible = items.filter(
    (i) => (filter === "ALL" || i.type === filter) && (showDiscarded || i.status !== "DISCARDED"),
  );
  const itemsOf = (activityId: number | null) => visible.filter((i) => i.activityId === activityId);
  const discardedCount = items.filter((i) => i.status === "DISCARDED").length;
  const publicCount = items.filter((i) => i.isPublic && i.status !== "DISCARDED").length;
  // Confirmados con el proveedor que los invitados todavía no ven: se publican de una vez.
  const hiddenConfirmed = items.filter((i) => i.status === "CONFIRMED" && !i.isPublic && !isTemp(i.id)).map((i) => i.id);

  function showConfirmed() {
    const ids = new Set(hiddenConfirmed);
    mutate(
      (s) => s.map((i) => (ids.has(i.id) ? { ...i, isPublic: true } : i)),
      () => showMenuItems([...ids]),
      { ok: `Los invitados ya ven ${ids.size} ${ids.size === 1 ? "ítem confirmado" : "ítems confirmados"}`, error: "No se pudieron mostrar los ítems" },
    );
  }

  // El drag reordena el listado completo: con un filtro activo el orden mostrado
  // no es el real, así que solo se arrastra en la vista sin filtrar.
  const dragEnabled = canWrite && filter === "ALL" && !showDiscarded;

  function onDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const draggedId = Number(active.id);
    const dragged = items.find((i) => i.id === draggedId);
    if (!dragged) return;

    // El destino puede ser otro ítem (soltar entre ítems) o el contenedor de un
    // momento vacío.
    const overIsGroup = String(over.id).startsWith("group:");
    const targetActivityId = overIsGroup
      ? groupActivityId(String(over.id))
      : items.find((i) => i.id === Number(over.id))?.activityId ?? null;

    const sameGroup = targetActivityId === dragged.activityId;
    if (sameGroup && Number(over.id) === draggedId) return;

    // Reconstruir el orden global recorriendo los grupos en el orden mostrado.
    const rest = items.filter((i) => i.id !== draggedId);
    const moved = { ...dragged, activityId: targetActivityId };

    const ordered: MenuItem[] = [];
    for (const g of groups) {
      const groupItems = rest.filter((i) => i.activityId === g.activityId);
      if (g.activityId !== targetActivityId) {
        ordered.push(...groupItems);
        continue;
      }
      if (overIsGroup) {
        ordered.push(...groupItems, moved);
        continue;
      }
      const idx = groupItems.findIndex((i) => i.id === Number(over.id));
      if (idx === -1) ordered.push(...groupItems, moved);
      else ordered.push(...groupItems.slice(0, idx), moved, ...groupItems.slice(idx));
    }

    const next = ordered.map((i, idx) => ({ ...i, sortOrder: idx }));
    mutate(() => next, () => moveMenuItem(draggedId, targetActivityId, ordered.map((i) => i.id)), { error: "No se pudo mover el ítem" });
  }

  const dragging = activeId != null ? items.find((i) => i.id === activeId) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Toolbar: filtro por tipo, descartados y alta */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as MenuType | "ALL")}
            aria-label="Filtrar por tipo"
            className={`${selectCls} w-auto bg-surface-container-lowest`}
          >
            <option value="ALL">Todos los tipos</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <Checkbox checked={showDiscarded} onChange={setShowDiscarded} label={`Mostrar descartados${discardedCount > 0 ? ` (${discardedCount})` : ""}`} />
        </div>
        {canWrite && (
          <button type="button" onClick={() => setShowForm(true)} className={btnPrimary}>
            <Plus className="w-4 h-4" aria-hidden />
            Nuevo ítem
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Eye className="w-4 h-4 shrink-0" aria-hidden />
            {publicCount === 0
              ? "Los invitados aún no ven ningún ítem. Usa el ojo de cada ítem para mostrarlo en su invitación."
              : `Los invitados ven ${publicCount} ${publicCount === 1 ? "ítem" : "ítems"} en su invitación.`}
          </p>
          {canWrite && hiddenConfirmed.length > 0 && (
            <button type="button" onClick={showConfirmed} className={`${btnGhostSm} self-start sm:self-auto`}>
              <Eye className="w-3.5 h-3.5" aria-hidden />
              Mostrar los {hiddenConfirmed.length} confirmados
            </button>
          )}
        </div>
      )}

      {canWrite && !dragEnabled && visible.length > 0 && (
        <p className="text-sm text-on-surface-variant">
          Para reordenar o mover ítems entre momentos arrastrándolos, quita el filtro y oculta los descartados.
        </p>
      )}

      <Dialog open={showForm && canWrite} onClose={() => setShowForm(false)} title="Nuevo ítem del menú" size="lg">
        <ItemForm moments={moments} mutate={mutate} onDone={() => setShowForm(false)} />
      </Dialog>

      {moments.length === 0 && (
        <p className="text-sm text-on-surface bg-surface-container-low rounded-xl px-4 py-3">
          Aún no hay actividades en el Cronograma. Los ítems quedarán en «Por asignar» hasta que crees
          los momentos de la boda (recepción, cena, brindis…) en la sección Cronograma.
        </p>
      )}

      {(items.length === 0 || (visible.length === 0 && !dragEnabled)) && (
        <EmptyState
          icon={UtensilsCrossed}
          message={items.length === 0 ? (canWrite ? "Aún no hay nada en el menú. Empieza con «Nuevo ítem»." : "Aún no hay nada en el menú.") : "Ningún ítem coincide con el filtro."}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="space-y-4">
          {groups.map((g) => (
            <MomentGroup
              key={g.key}
              groupId={g.key}
              title={g.title}
              time={g.time}
              items={itemsOf(g.activityId)}
              moments={moments}
              mutate={mutate}
              canWrite={canWrite}
              dragEnabled={dragEnabled}
              isUnassigned={g.activityId === null}
              // Con el arrastre activo, los momentos vacíos se muestran como destino.
              showWhenEmpty={dragEnabled && g.activityId !== null}
            />
          ))}
        </div>

        <DragOverlay>
          {dragging && (
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-md ring-2 ring-primary/40">
              <p className="font-sans text-sm font-medium text-on-surface">{dragging.name}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Grupo (momento de la boda) ──────────────────────────────────────────────

function MomentGroup({
  groupId, title, time, items, moments, mutate, canWrite, dragEnabled, isUnassigned, showWhenEmpty,
}: {
  groupId: string;
  title: string;
  time: string | null;
  items: MenuItem[];
  moments: MenuMoment[];
  mutate: Mutate;
  canWrite: boolean;
  dragEnabled: boolean;
  isUnassigned: boolean;
  showWhenEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId });

  if (items.length === 0 && !showWhenEmpty) return null;

  return (
    <section
      ref={setNodeRef}
      // En móvil los momentos vacíos no se muestran: arrastrar entre momentos
      // lejanos no es práctico ahí y el momento se elige al crear o editar el ítem.
      className={`rounded-2xl transition-colors ${items.length === 0 ? "max-sm:hidden" : ""} ${
        isOver ? "bg-secondary-container/50 ring-2 ring-primary/30" : isUnassigned ? "bg-surface-container-low" : ""
      }`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 sm:px-4 pt-4 pb-2">
        {isUnassigned ? (
          <HelpCircle className="w-5 h-5 text-error shrink-0" aria-hidden />
        ) : (
          <Clock className="w-5 h-5 text-on-surface-variant shrink-0" aria-hidden />
        )}
        <h2 className="font-serif text-2xl sm:text-3xl leading-display text-primary">{title}</h2>
        {time && (
          <span className="text-sm font-medium text-on-secondary-container bg-secondary-container px-2.5 py-0.5 rounded-full tabular-nums">
            {time}
          </span>
        )}
        <span className={`text-sm ml-auto ${isUnassigned && items.length > 0 ? "text-error font-medium" : "text-on-surface-variant"}`}>
          {items.length === 0 ? "Vacío" : isUnassigned ? `${items.length} sin momento` : `${items.length} ${items.length === 1 ? "ítem" : "ítems"}`}
        </span>
      </header>

      <div className="sm:px-4 pb-4 space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-on-surface-variant rounded-xl outline-2 outline-dashed outline-outline-variant px-4 py-3">
            Arrastra aquí un ítem, o elige este momento al crearlo.
          </p>
        )}
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              moments={moments}
              mutate={mutate}
              canWrite={canWrite}
              dragEnabled={dragEnabled}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

// ─── Ítem ────────────────────────────────────────────────────────────────────

function ItemRow({
  item, moments, mutate, canWrite, dragEnabled,
}: {
  item: MenuItem;
  moments: MenuMoment[];
  mutate: Mutate;
  canWrite: boolean;
  dragEnabled: boolean;
}) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const temp = isTemp(item.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !dragEnabled || temp,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = TYPE_META[item.type].icon;
  const status = STATUS_META[item.status];
  const discarded = item.status === "DISCARDED";
  const shownToGuests = item.isPublic && !discarded;

  return (
    <>
    <Dialog open={editing && canWrite} onClose={() => setEditing(false)} title={`Editar «${item.name}»`} size="lg">
      {editing && <ItemForm item={item} moments={moments} mutate={mutate} onDone={() => setEditing(false)} />}
    </Dialog>
    <Dialog open={viewing} onClose={() => setViewing(false)} title={item.name} size="lg">
      <ItemDetail
        item={item}
        moment={moments.find((m) => m.id === item.activityId) ?? null}
        onEdit={canWrite ? () => { setViewing(false); setEditing(true); } : undefined}
        onClose={() => setViewing(false)}
      />
    </Dialog>
    <div
      ref={setNodeRef}
      style={style}
      // relative: el nombre es un botón que se estira a toda la fila (clic en
      // cualquier parte abre el detalle); arrastre y acciones quedan por encima.
      className={`group relative flex flex-wrap sm:flex-nowrap items-start gap-3 p-4 rounded-xl bg-surface-container-lowest transition-colors hover:bg-[#fffdf8] ${
        isDragging ? "opacity-40" : ""
      } ${discarded ? "opacity-60" : ""} ${temp ? pendingRowCls : ""}`}
      aria-busy={temp || undefined}
    >
      {dragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="relative z-10 shrink-0 -ml-2 -my-1 w-8 h-11 flex items-center justify-center text-on-surface-variant hover:text-primary cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Reordenar o mover «${item.name}»`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <div className="shrink-0 w-9 h-9 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
        <TypeIcon className="w-4 h-4" aria-hidden />
      </div>

      <div className="flex-1 min-w-0 basis-0">
        <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
          <button
            type="button"
            onClick={() => setViewing(true)}
            aria-haspopup="dialog"
            className={`text-left text-item font-medium text-on-surface hover:text-primary after:absolute after:inset-0 after:rounded-xl after:content-[''] ${discarded ? "line-through" : ""}`}
          >
            {item.name}
          </button>
          <span className="text-xs text-on-surface-variant">{TYPE_META[item.type].label}</span>
          {!canWrite && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>}
          {!canWrite && shownToGuests && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container flex items-center gap-1">
              <Eye className="w-3 h-3" aria-hidden /> Visible para invitados
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-on-surface-variant mt-1">{item.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          {item.quantity != null && (
            <span className="text-xs font-medium text-on-surface-variant">
              {item.quantity} {item.unit || "un."}
            </span>
          )}
          {item.supplier && (
            <span className="text-xs text-on-surface-variant">· {item.supplier}</span>
          )}
          {item.isVegan && <DietTag icon={Leaf} label="Vegano" />}
          {item.isVegetarian && !item.isVegan && <DietTag icon={Leaf} label="Vegetariano" />}
          {item.isGlutenFree && <DietTag icon={WheatOff} label="Sin gluten" />}
          {item.isLactoseFree && <DietTag icon={MilkOff} label="Sin lactosa" />}
          {item.allergens && (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-error/10 text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" aria-hidden /> {item.allergens}
            </span>
          )}
        </div>

        {item.notes && <p className="text-sm text-on-surface-variant mt-1.5">{item.notes}</p>}
      </div>

      {canWrite && (
        // Móvil: bandeja a todo el ancho bajo el contenido (antes las acciones
        // dejaban al nombre en una columna de una letra y el borrar se salía).
        <div className="relative z-10 flex items-center gap-1 w-full sm:w-auto shrink-0 max-sm:-mb-1">
          <select
            value={item.status}
            onChange={(e) => {
              const next = e.target.value as MenuStatus;
              mutate((s) => s.map((i) => i.id === item.id ? { ...i, status: next } : i), () => setMenuItemStatus(item.id, next), { error: "No se pudo cambiar el estado" });
            }}
            aria-label={`Estado de ${item.name}`}
            className={`max-sm:mr-auto min-h-11 pointer-fine:min-h-8 text-label font-medium pl-2.5 pr-1 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${status.cls}`}
          >
            <option value="IDEA">Idea</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="DISCARDED">Descartado</option>
          </select>
          <button
            type="button"
            disabled={discarded}
            aria-pressed={item.isPublic}
            onClick={() => {
              const next = !item.isPublic;
              mutate(
                (s) => s.map((i) => i.id === item.id ? { ...i, isPublic: next } : i),
                () => setMenuItemPublic(item.id, next),
                { ok: next ? `«${item.name}» ya se ve en el menú de los invitados` : `«${item.name}» quedó oculto para los invitados`, error: "No se pudo cambiar la visibilidad" },
              );
            }}
            title={discarded ? "Los descartados no se muestran a los invitados" : item.isPublic ? "Visible para invitados: pulsa para ocultarlo" : "Oculto para invitados: pulsa para mostrarlo"}
            aria-label={discarded ? `${item.name}: descartado, no se muestra a los invitados` : item.isPublic ? `Ocultar «${item.name}» a los invitados` : `Mostrar «${item.name}» a los invitados`}
            className={`${iconBtn} ${shownToGuests ? "text-primary bg-primary-container/60 hover:bg-primary-container" : ""}`}
          >
            {shownToGuests ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setEditing(true)} className={iconBtn} aria-label={`Editar ${item.name}`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (await confirm({ title: `¿Eliminar «${item.name}» del menú?`, description: "Si solo lo estás descartando, usa «Descartar» y podrás recuperarlo.", confirmLabel: "Eliminar" }))
                mutate((s) => s.filter((i) => i.id !== item.id), () => deleteMenuItem(item.id), { ok: "Ítem eliminado", error: "No se pudo eliminar el ítem" });
            }}
            type="button"
            className={iconBtnDanger}
            aria-label={`Eliminar ${item.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
    </>
  );
}

// Ficha completa de un ítem (clic en la fila): todo lo que se cargó, incluido lo
// que los invitados nunca ven (proveedor, cantidades, notas).
function ItemDetail({ item, moment, onEdit, onClose }: { item: MenuItem; moment: MenuMoment | null; onEdit?: () => void; onClose: () => void }) {
  const TypeIcon = TYPE_META[item.type].icon;
  const status = STATUS_META[item.status];
  const discarded = item.status === "DISCARDED";
  const diets = [
    item.isVegan ? { icon: Leaf, label: "Vegano" } : item.isVegetarian ? { icon: Leaf, label: "Vegetariano" } : null,
    item.isGlutenFree ? { icon: WheatOff, label: "Sin gluten" } : null,
    item.isLactoseFree ? { icon: MilkOff, label: "Sin lactosa" } : null,
  ].filter((d): d is { icon: typeof Leaf; label: string } => d !== null);
  const rows: [string, React.ReactNode][] = [
    ["Momento", moment ? <>{moment.title}{moment.time && <span className="tabular-nums"> · {moment.time} h</span>}</> : <span className="text-error">Sin momento del cronograma</span>],
    ["Cantidad", item.quantity != null ? <span className="tabular-nums">{item.quantity} {item.unit || "un."}</span> : "Sin definir"],
    ["Proveedor", item.supplier || "Sin definir"],
  ];

  return (
    <div className="space-y-5">
      <p className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 text-sm font-medium text-on-surface">
          <TypeIcon className="w-4 h-4 text-primary" aria-hidden /> {TYPE_META[item.type].label}
        </span>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.cls}`}>{status.label}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          {item.isPublic && !discarded ? <Eye className="w-4 h-4" aria-hidden /> : <EyeOff className="w-4 h-4" aria-hidden />}
          {discarded ? "Descartado: no lo ven los invitados" : item.isPublic ? "Visible para invitados" : "Oculto para invitados"}
        </span>
      </p>

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-label font-medium text-on-surface-variant">{term}</dt>
            <dd className="mt-0.5 text-sm text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>

      {item.description && (
        <div>
          <h3 className="text-label font-medium text-on-surface-variant">Descripción (la ven los invitados)</h3>
          <p className="mt-1 text-sm text-on-surface whitespace-pre-line">{item.description}</p>
        </div>
      )}
      {item.notes && (
        <div className="rounded-xl bg-surface-container-low px-4 py-3">
          <h3 className="text-label font-medium text-on-surface-variant">Notas internas</h3>
          <p className="mt-1 text-sm text-on-surface whitespace-pre-line">{item.notes}</p>
        </div>
      )}
      {(diets.length > 0 || item.allergens) && (
        <div className="flex flex-wrap gap-1.5">
          {diets.map((d) => <DietTag key={d.label} icon={d.icon} label={d.label} />)}
          {item.allergens && (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-error/10 text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" aria-hidden /> Contiene: {item.allergens}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className={btnSecondary}>Cerrar</button>
        {onEdit && (
          <button type="button" onClick={onEdit} className={btnPrimary}>
            <Pencil className="w-4 h-4" aria-hidden /> Editar
          </button>
        )}
      </div>
    </div>
  );
}

function DietTag({ icon: Icon, label }: { icon: typeof Leaf; label: string }) {
  return (
    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container flex items-center gap-1">
      <Icon className="w-3 h-3" aria-hidden /> {label}
    </span>
  );
}

// ─── Formulario (alta y edición) ─────────────────────────────────────────────

function ItemForm({
  item, moments, mutate, onDone,
}: {
  item?: MenuItem;
  moments: MenuMoment[];
  mutate: Mutate;
  onDone: () => void;
}) {
  const [type, setType] = useState<MenuType>(item?.type ?? "PASAPALO");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        const name = (formData.get("name") as string)?.trim();
        if (!name) { setError("El nombre es obligatorio"); return; }
        const qtyRaw = (formData.get("quantity") as string)?.trim();
        const quantity = qtyRaw ? Number(qtyRaw) : null;
        if (quantity != null && (!Number.isFinite(quantity) || quantity < 0)) {
          setError("La cantidad no puede ser negativa"); return;
        }
        const momentRaw = formData.get("activityId") as string;
        const activityId = momentRaw ? Number(momentRaw) : null;

        const payload = {
          name,
          type,
          activityId,
          description: (formData.get("description") as string) || "",
          quantity,
          unit: (formData.get("unit") as string) || "",
          supplier: (formData.get("supplier") as string) || "",
          notes: (formData.get("notes") as string) || "",
          isVegetarian: formData.get("isVegetarian") === "on",
          isVegan: formData.get("isVegan") === "on",
          isGlutenFree: formData.get("isGlutenFree") === "on",
          isLactoseFree: formData.get("isLactoseFree") === "on",
          allergens: (formData.get("allergens") as string) || "",
          status: (formData.get("status") as MenuStatus) || "IDEA",
          isPublic: formData.get("isPublic") === "on",
        };

        setError(null);
        if (item) {
          mutate((s) => s.map((i) => i.id === item.id ? { ...i, ...payload } : i), () => updateMenuItem(item.id, payload), { ok: "Ítem guardado", error: "No se pudo guardar el ítem" });
        } else {
          mutate(
            (s) => [...s, { ...payload, id: tempId(), sortOrder: s.length, createdBy: null, createdAt: nowSql(), updatedAt: nowSql() }],
            () => createMenuItem(payload),
            { ok: "Ítem agregado al menú", error: "No se pudo agregar el ítem" },
          );
        }
        onDone();
      }}
      className="space-y-4"
    >
      {/* Tipo */}
      <div role="radiogroup" aria-label="Tipo" className="flex flex-wrap items-center gap-1 p-1 bg-surface-container-low rounded-xl w-fit">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => setType(t.value)}
            className={`flex items-center gap-1.5 min-h-10 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              type === t.value ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <t.icon className="w-4 h-4" aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Field label="Nombre" className="md:col-span-5">
          <GrowText required name="name" defaultValue={item?.name} placeholder="Ej. Empanadas de carne" className={inputCls} />
        </Field>
        <Field label="Momento" optional className="md:col-span-4">
          <select name="activityId" defaultValue={item?.activityId ?? ""} className={selectCls}>
            <option value="">Por asignar</option>
            {moments.map((m) => (
              <option key={m.id} value={m.id}>
                {m.time ? `${m.time} · ${m.title}` : m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" className="md:col-span-3">
          <select name="status" defaultValue={item?.status ?? "IDEA"} className={selectCls}>
            <option value="IDEA">Idea</option>
            <option value="CONFIRMED">Confirmado con proveedor</option>
            <option value="DISCARDED">Descartado</option>
          </select>
        </Field>

        <Field label="Descripción" optional className="md:col-span-6">
          <GrowText multiline name="description" defaultValue={item?.description} placeholder="Detalle del plato o bebida…" className={inputCls} />
        </Field>
        <Field label="Cantidad" optional className="md:col-span-2">
          <input type="number" inputMode="numeric" min="0" name="quantity" defaultValue={item?.quantity ?? ""} placeholder="0" className={inputCls} />
        </Field>
        <Field label="Unidad" optional className="md:col-span-2">
          <input name="unit" defaultValue={item?.unit} placeholder="porciones" className={inputCls} />
        </Field>
        <Field label="Proveedor" optional className="md:col-span-2">
          <input name="supplier" defaultValue={item?.supplier} placeholder="Catering…" className={inputCls} />
        </Field>
      </div>

      {/* Etiquetas dietéticas */}
      <div className="flex flex-wrap items-center gap-x-5">
        <Checkbox name="isVegetarian" label="Vegetariano" defaultChecked={item?.isVegetarian} />
        <Checkbox name="isVegan" label="Vegano" defaultChecked={item?.isVegan} />
        <Checkbox name="isGlutenFree" label="Sin gluten" defaultChecked={item?.isGlutenFree} />
        <Checkbox name="isLactoseFree" label="Sin lactosa" defaultChecked={item?.isLactoseFree} />
      </div>

      <div className="rounded-xl bg-surface-container-low px-4 py-1">
        <Checkbox
          name="isPublic"
          defaultChecked={item?.isPublic ?? false}
          label={<span>Visible para invitados <span className="text-on-surface-variant">· aparece en el menú de su invitación con nombre, descripción y etiquetas</span></span>}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Alérgenos" optional>
          <GrowText name="allergens" defaultValue={item?.allergens} placeholder="Frutos secos, mariscos…" className={inputCls} />
        </Field>
        <Field label="Notas" optional>
          <GrowText multiline name="notes" defaultValue={item?.notes} placeholder="Detalles para el catering…" className={inputCls} />
        </Field>
      </div>

      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
        <button type="submit" className={btnPrimary}>
          {item ? <Save className="w-4 h-4" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
          {item ? "Guardar cambios" : "Agregar al menú"}
        </button>
      </div>
    </form>
  );
}
