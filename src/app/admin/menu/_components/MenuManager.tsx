"use client";

import { useState, useTransition } from "react";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { btnPrimary, btnSecondary, btnGhost } from "@/app/admin/_components/ui";
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
  Plus, X, Trash2, Pencil, Save, Loader2, GripVertical, Clock,
  UtensilsCrossed, Wine, Cake, IceCreamCone, Salad, CookingPot, Sparkles, HelpCircle,
  Leaf, WheatOff, MilkOff, AlertTriangle,
} from "lucide-react";
import {
  createMenuItem, updateMenuItem, deleteMenuItem, setMenuItemStatus, moveMenuItem,
  type MenuItem, type MenuMoment, type MenuType, type MenuStatus,
} from "@/app/actions/menu";

interface Props {
  initialItems: MenuItem[];
  moments: MenuMoment[];
  canWrite: boolean;
}

const TYPES: { value: MenuType; label: string; icon: typeof UtensilsCrossed }[] = [
  { value: "PASAPALO", label: "Pasapalo", icon: Sparkles },
  { value: "ENTRADA", label: "Entrada", icon: Salad },
  { value: "PRINCIPAL", label: "Principal", icon: CookingPot },
  { value: "POSTRE", label: "Postre", icon: IceCreamCone },
  { value: "BEBIDA", label: "Bebida", icon: Wine },
  { value: "TORTA", label: "Torta", icon: Cake },
  { value: "OTRO", label: "Otro", icon: UtensilsCrossed },
];

const TYPE_META = Object.fromEntries(TYPES.map((t) => [t.value, t])) as Record<MenuType, (typeof TYPES)[number]>;

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
  const [items, setItems] = useState(initialItems);
  const [synced, setSynced] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<MenuType | "ALL">("ALL");
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-sync tras revalidar en el servidor, sin pisar el estado optimista en vuelo.
  if (initialItems !== synced && !isPending) {
    setSynced(initialItems);
    setItems(initialItems);
  }

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

    setItems(ordered.map((i, idx) => ({ ...i, sortOrder: idx })));
    startTransition(() => moveMenuItem(draggedId, targetActivityId, ordered.map((i) => i.id)));
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
            className="px-4 py-3 border-none rounded-xl bg-surface-container-lowest focus:ring-2 focus:ring-primary/50 outline-none text-on-surface text-sm shadow-sm cursor-pointer"
          >
            <option value="ALL">Todos los tipos</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDiscarded}
              onChange={(e) => setShowDiscarded(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            Mostrar descartados{discardedCount > 0 ? ` (${discardedCount})` : ""}
          </label>
        </div>
        {canWrite && (
          <button onClick={() => setShowForm((v) => !v)} className={showForm ? btnSecondary : btnPrimary}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cerrar" : "Nuevo ítem"}
          </button>
        )}
      </div>

      {canWrite && !dragEnabled && visible.length > 0 && (
        <p className="text-xs text-on-surface-variant">
          Para reordenar o mover ítems entre momentos arrastrándolos, quita el filtro y oculta los descartados.
        </p>
      )}

      {showForm && canWrite && <ItemForm moments={moments} onDone={() => setShowForm(false)} />}

      {moments.length === 0 && (
        <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-3 font-medium">
          Aún no hay actividades en el Cronograma. Los ítems quedarán en «Por asignar» hasta que crees
          los momentos de la boda (recepción, cena, brindis…) en la sección Cronograma.
        </p>
      )}

      {(items.length === 0 || (visible.length === 0 && !dragEnabled)) && (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
          <p className="text-on-surface-variant font-sans text-sm">
            {items.length === 0
              ? "Aún no hay nada en el menú."
              : "Ningún ítem coincide con el filtro."}
          </p>
        </div>
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
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-lg opacity-95">
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
  groupId, title, time, items, moments, canWrite, dragEnabled, isUnassigned, showWhenEmpty,
}: {
  groupId: string;
  title: string;
  time: string | null;
  items: MenuItem[];
  moments: MenuMoment[];
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
      className={`rounded-2xl transition-colors ${
        isOver ? "bg-primary/5 ring-2 ring-primary/30" : ""
      } ${isUnassigned ? "bg-error/[0.03]" : ""}`}
    >
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        {isUnassigned ? (
          <HelpCircle className="w-4 h-4 text-error opacity-70 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 text-on-surface-variant opacity-60 shrink-0" />
        )}
        <h2 className={`font-serif text-lg ${isUnassigned ? "text-error" : "text-primary"}`}>{title}</h2>
        {time && (
          <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full tabular-nums">
            {time}
          </span>
        )}
        <span className="text-xs text-on-surface-variant ml-auto">
          {items.length === 0 ? "Vacío" : `${items.length} ${items.length === 1 ? "ítem" : "ítems"}`}
        </span>
      </header>

      <div className="px-4 pb-4 space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-on-surface-variant rounded-xl bg-surface-container-low/60 px-4 py-3">
            Arrastra aquí un ítem, o elige este momento al crearlo.
          </p>
        )}
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              moments={moments}
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
  item, moments, canWrite, dragEnabled,
}: {
  item: MenuItem;
  moments: MenuMoment[];
  canWrite: boolean;
  dragEnabled: boolean;
}) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !dragEnabled,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = TYPE_META[item.type].icon;
  const status = STATUS_META[item.status];
  const discarded = item.status === "DISCARDED";

  if (editing && canWrite) {
    return (
      <ItemForm
        item={item}
        moments={moments}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all ${
        isDragging ? "opacity-40" : ""
      } ${discarded ? "opacity-60" : ""}`}
    >
      {dragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 mt-0.5 text-on-surface-variant/80 hover:text-primary cursor-grab active:cursor-grabbing touch-none border-none bg-transparent"
          aria-label="Reordenar / mover de momento"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <TypeIcon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-sans text-sm font-medium text-on-surface ${discarded ? "line-through" : ""}`}>
            {item.name}
          </p>
          <span className="text-xs text-on-surface-variant">{TYPE_META[item.type].label}</span>
          {!canWrite && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>}
        </div>

        {item.description && (
          <p className="text-xs text-on-surface-variant mt-1">{item.description}</p>
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
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-error/10 text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {item.allergens}
            </span>
          )}
        </div>

        {item.notes && <p className="text-xs text-on-surface-variant italic mt-1.5">{item.notes}</p>}
      </div>

      {canWrite && (
        <div className="flex items-center gap-1 shrink-0">
          <select
            value={item.status}
            onChange={(e) => startTransition(() => setMenuItemStatus(item.id, e.target.value as MenuStatus))}
            disabled={pending}
            aria-label={`Estado de ${item.name}`}
            className={`text-xs font-medium pl-2.5 pr-1 py-1.5 rounded-lg border-none outline-none cursor-pointer focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${status.cls}`}
          >
            <option value="IDEA">Idea</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="DISCARDED">Descartado</option>
          </select>
          <button onClick={() => setEditing(true)} className={iconBtn} aria-label={`Editar ${item.name}`} title="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (await confirm({ title: `¿Eliminar «${item.name}» del menú?`, description: "Si solo lo estás descartando, usa «Descartar» y podrás recuperarlo.", confirmLabel: "Eliminar" }))
                startTransition(() => deleteMenuItem(item.id));
            }}
            disabled={pending}
            className={iconBtnDanger}
            aria-label={`Eliminar ${item.name}`}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function DietTag({ icon: Icon, label }: { icon: typeof Leaf; label: string }) {
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-on-secondary-container/10 text-on-secondary-container flex items-center gap-1">
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

// ─── Formulario (alta y edición) ─────────────────────────────────────────────

function ItemForm({
  item, moments, onDone,
}: {
  item?: MenuItem;
  moments: MenuMoment[];
  onDone: () => void;
}) {
  const [type, setType] = useState<MenuType>(item?.type ?? "PASAPALO");
  const [pending, startTransition] = useTransition();
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
        };

        setError(null);
        startTransition(async () => {
          try {
            if (item) await updateMenuItem(item.id, payload);
            else await createMenuItem(payload);
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar");
          }
        });
      }}
      className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4"
    >
      {/* Tipo */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-low rounded-xl w-fit">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border-none cursor-pointer ${
              type === t.value ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Field label="Nombre" className="md:col-span-5">
          <input required name="name" defaultValue={item?.name} placeholder="Ej. Empanadas de carne" className={inputCls} />
        </Field>
        <Field label="Momento" optional className="md:col-span-4">
          <select name="activityId" defaultValue={item?.activityId ?? ""} className={inputCls}>
            <option value="">Por asignar</option>
            {moments.map((m) => (
              <option key={m.id} value={m.id}>
                {m.time ? `${m.time} · ${m.title}` : m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" className="md:col-span-3">
          <select name="status" defaultValue={item?.status ?? "IDEA"} className={inputCls}>
            <option value="IDEA">Idea</option>
            <option value="CONFIRMED">Confirmado con proveedor</option>
            <option value="DISCARDED">Descartado</option>
          </select>
        </Field>

        <Field label="Descripción" optional className="md:col-span-6">
          <input name="description" defaultValue={item?.description} placeholder="Detalle del plato o bebida…" className={inputCls} />
        </Field>
        <Field label="Cantidad" optional className="md:col-span-2">
          <input type="number" min="0" name="quantity" defaultValue={item?.quantity ?? ""} placeholder="0" className={inputCls} />
        </Field>
        <Field label="Unidad" optional className="md:col-span-2">
          <input name="unit" defaultValue={item?.unit} placeholder="porciones" className={inputCls} />
        </Field>
        <Field label="Proveedor" optional className="md:col-span-2">
          <input name="supplier" defaultValue={item?.supplier} placeholder="Catering…" className={inputCls} />
        </Field>
      </div>

      {/* Etiquetas dietéticas */}
      <div className="flex flex-wrap items-center gap-4">
        <Checkbox name="isVegetarian" label="Vegetariano" defaultChecked={item?.isVegetarian} />
        <Checkbox name="isVegan" label="Vegano" defaultChecked={item?.isVegan} />
        <Checkbox name="isGlutenFree" label="Sin gluten" defaultChecked={item?.isGlutenFree} />
        <Checkbox name="isLactoseFree" label="Sin lactosa" defaultChecked={item?.isLactoseFree} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Alérgenos" optional>
          <input name="allergens" defaultValue={item?.allergens} placeholder="Frutos secos, mariscos…" className={inputCls} />
        </Field>
        <Field label="Notas" optional>
          <input name="notes" defaultValue={item?.notes} placeholder="Detalles para el catering…" className={inputCls} />
        </Field>
      </div>

      {error && <p className="text-xs text-error font-medium">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : item ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {item ? "Guardar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

// ─── Compartidos ─────────────────────────────────────────────────────────────


function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 rounded accent-primary cursor-pointer"
      />
      {label}
    </label>
  );
}

function Field({ label, optional, className, children }: { label: string; optional?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-sm font-sans font-medium text-on-surface-variant mb-2">
        {label} {optional && <span className="font-normal text-on-surface-variant/80">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm";
const iconBtn = "w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer shrink-0 disabled:opacity-50";
const iconBtnDanger = "w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all border-none cursor-pointer shrink-0 disabled:opacity-50";
