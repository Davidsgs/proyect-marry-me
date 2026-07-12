"use client";

import { useState, useTransition } from "react";
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
  Plus, X, Trash2, Pencil, Save, Loader2, GripVertical, Clock, Check,
  UtensilsCrossed, Wine, Cake, Soup, Salad, CookingPot, Sparkles, HelpCircle,
  Ban, Leaf, WheatOff, MilkOff, AlertTriangle,
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
  { value: "POSTRE", label: "Postre", icon: Soup },
  { value: "BEBIDA", label: "Bebida", icon: Wine },
  { value: "TORTA", label: "Torta", icon: Cake },
  { value: "OTRO", label: "Otro", icon: UtensilsCrossed },
];

const TYPE_META = Object.fromEntries(TYPES.map((t) => [t.value, t])) as Record<MenuType, (typeof TYPES)[number]>;

const STATUS_META: Record<MenuStatus, { label: string; cls: string }> = {
  IDEA: { label: "Idea", cls: "bg-surface-container text-on-surface-variant" },
  CONFIRMED: { label: "Confirmado", cls: "bg-on-secondary-container/10 text-on-secondary-container" },
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
      {/* Toolbar: filtros + nuevo ítem */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} label="Todo" />
          {TYPES.map((t) => (
            <FilterChip
              key={t.value}
              active={filter === t.value}
              onClick={() => setFilter(t.value)}
              label={t.label}
              icon={t.icon}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowDiscarded((v) => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-sans text-xs tracking-widest uppercase font-medium border-none cursor-pointer ${
              showDiscarded ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <Ban className="w-4 h-4" />
            Descartados
          </button>
          {canWrite && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium border-none cursor-pointer"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cerrar" : "Nuevo ítem"}
            </button>
          )}
        </div>
      </div>

      {showForm && canWrite && <ItemForm moments={moments} onDone={() => setShowForm(false)} />}

      {moments.length === 0 && (
        <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-3 font-medium">
          Aún no hay actividades en el Cronograma. Los ítems quedarán en «Por asignar» hasta que crees
          los momentos de la boda (recepción, cena, brindis…) en la sección Cronograma.
        </p>
      )}

      {visible.length === 0 && (
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
  groupId, title, time, items, moments, canWrite, dragEnabled, isUnassigned,
}: {
  groupId: string;
  title: string;
  time: string | null;
  items: MenuItem[];
  moments: MenuMoment[];
  canWrite: boolean;
  dragEnabled: boolean;
  isUnassigned: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId });

  // Solo se listan los momentos que ya tienen comida cargada: un momento del
  // cronograma sin ítems no aporta nada al menú. El primer ítem de un momento
  // se asigna con el select "Momento" del formulario; el drag & drop mueve
  // entre momentos ya visibles.
  if (items.length === 0) return null;

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
          <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full tabular-nums">
            {time}
          </span>
        )}
        <span className="text-[11px] text-on-surface-variant/60 ml-auto">
          {items.length} ítem{items.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="px-4 pb-4 space-y-2">
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
          className="shrink-0 mt-0.5 text-on-surface-variant/40 hover:text-primary cursor-grab active:cursor-grabbing touch-none border-none bg-transparent"
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
          <span className="text-[10px] tracking-widest uppercase font-medium text-on-surface-variant/70">
            {TYPE_META[item.type].label}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
        </div>

        {item.description && (
          <p className="text-xs text-on-surface-variant/70 mt-1">{item.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          {item.quantity != null && (
            <span className="text-[11px] font-medium text-on-surface-variant">
              {item.quantity} {item.unit || "un."}
            </span>
          )}
          {item.supplier && (
            <span className="text-[11px] text-on-surface-variant/70">· {item.supplier}</span>
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

        {item.notes && <p className="text-xs text-on-surface-variant/60 italic mt-1.5">{item.notes}</p>}
      </div>

      {canWrite && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() =>
              startTransition(() =>
                setMenuItemStatus(item.id, item.status === "CONFIRMED" ? "IDEA" : "CONFIRMED"),
              )
            }
            disabled={pending}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all border-none cursor-pointer ${
              item.status === "CONFIRMED"
                ? "bg-on-secondary-container/10 text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
            aria-label={item.status === "CONFIRMED" ? "Marcar como idea" : "Confirmar con el proveedor"}
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              startTransition(() =>
                setMenuItemStatus(item.id, discarded ? "IDEA" : "DISCARDED"),
              )
            }
            disabled={pending}
            className={iconBtn}
            aria-label={discarded ? "Recuperar" : "Descartar"}
          >
            <Ban className="w-4 h-4" />
          </button>
          <button onClick={() => setEditing(true)} className={iconBtn} aria-label="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar "${item.name}" del menú?`)) startTransition(() => deleteMenuItem(item.id));
            }}
            disabled={pending}
            className={iconBtnDanger}
            aria-label="Eliminar"
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
            <option value="CONFIRMED">Confirmado</option>
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

function FilterChip({
  active, onClick, label, icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: typeof UtensilsCrossed;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-sans tracking-widest uppercase font-medium transition-all border-none cursor-pointer ${
        active ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:text-primary"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-on-surface-variant cursor-pointer">
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
      <label className="block text-xs font-sans tracking-widest uppercase font-medium text-on-surface-variant mb-2">
        {label} {optional && <span className="text-on-surface-variant/50">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm";
const btnPrimary = "flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm font-sans tracking-widest uppercase text-xs font-medium disabled:opacity-60 border-none cursor-pointer";
const btnGhost = "flex items-center gap-2 px-5 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all font-sans tracking-widest uppercase text-xs font-medium border-none cursor-pointer";
const iconBtn = "w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer shrink-0 disabled:opacity-50";
const iconBtnDanger = "w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all border-none cursor-pointer shrink-0 disabled:opacity-50";
