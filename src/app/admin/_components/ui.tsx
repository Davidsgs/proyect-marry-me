// Piezas visuales compartidas del panel admin. Sin hooks: sirven tanto en
// páginas de servidor como en los managers de cliente. Una sola definición de
// botones, campos, estados vacíos y chips: no copiarlas en cada sección.
import Link from "next/link";
import { Check, ChevronRight, Clock, X, type LucideIcon } from "lucide-react";

// ─── Botones ─────────────────────────────────────────────────────────────────
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const btnBase =
  `inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 rounded-xl font-sans text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${focusRing}`;
export const btnPrimary = `${btnBase} bg-primary text-on-primary shadow-sm hover:bg-[#4a5745]`;
export const btnSecondary = `${btnBase} bg-surface-container-low text-on-surface hover:bg-surface-container`;
export const btnDanger = `${btnBase} bg-error text-on-error shadow-sm hover:bg-[#953a33]`;
export const btnGhost = `${btnBase} text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low`;

// Compactos (dentro de filas y formularios en línea).
const btnSmBase = `inline-flex items-center justify-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg font-sans text-label font-medium transition-[background-color,color] duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;
export const btnPrimarySm = `${btnSmBase} bg-primary text-on-primary hover:bg-[#4a5745]`;
export const btnGhostSm = `${btnSmBase} text-on-surface-variant hover:text-on-surface hover:bg-surface-container`;

// Botones de icono: 44px en táctil, 32px con ratón.
const iconBtnBase = `inline-flex items-center justify-center shrink-0 w-11 h-11 pointer-fine:w-8 pointer-fine:h-8 rounded-xl transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`;
export const iconBtn = `${iconBtnBase} text-on-surface-variant hover:text-on-surface hover:bg-surface-container`;
export const iconBtnDanger = `${iconBtnBase} text-error hover:bg-error/10`;

// ─── Campos ──────────────────────────────────────────────────────────────────
export const inputCls =
  "w-full min-h-11 px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/70 outline-none transition-[background-color,box-shadow] duration-150 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/45 disabled:opacity-60 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-error/60";
export const inputSmCls =
  "min-h-9 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none transition-[background-color,box-shadow] duration-150 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/45";
// Select nativo con flecha propia (la del sistema no respeta la paleta).
export const selectCls = `${inputCls} appearance-none pr-10 cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235c5f52'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z'/%3E%3C/svg%3E")] bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat`;
// Select del estado de una familia: se tiñe con el color del estado elegido
// (sin hooks, con :has sobre la opción marcada) y cada opción lleva su color
// en la lista desplegable donde el navegador lo permite (escritorio).
export const rsvpSelectCls =
  `${selectCls} font-medium` +
  " [&:has(option[value=CONFIRMED]:checked)]:bg-salvia [&:has(option[value=CONFIRMED]:checked)]:text-tinta" +
  " [&:has(option[value=DECLINED]:checked)]:bg-rosa [&:has(option[value=DECLINED]:checked)]:text-tinta" +
  " [&:has(option[value=PENDING]:checked)]:bg-ambar [&:has(option[value=PENDING]:checked)]:text-on-ambar" +
  " [&>option[value=CONFIRMED]]:bg-salvia [&>option[value=DECLINED]]:bg-rosa [&>option[value=PENDING]]:bg-ambar [&>option]:text-tinta";

export function Field({
  label,
  optional,
  hint,
  error,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: string;
  /** Si el control no está dentro de la etiqueta, el id del control. */
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const text = (
    <span className="block text-label font-medium text-on-surface-variant mb-1.5">
      {label} {optional && <span className="font-normal">(opcional)</span>}
    </span>
  );
  return (
    <div className={className}>
      {htmlFor ? (
        <>
          <label htmlFor={htmlFor} className="block">{text}</label>
          {children}
        </>
      ) : (
        <label className="block">{text}{children}</label>
      )}
      {hint && !error && <p className="mt-1.5 text-xs text-on-surface-variant">{hint}</p>}
      {error && <p role="alert" className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
  checked,
  onChange,
}: {
  name?: string;
  label: React.ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2.5 min-h-11 pointer-fine:min-h-8 text-sm text-on-surface cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="w-5 h-5 rounded cursor-pointer accent-primary"
      />
      {label}
    </label>
  );
}

// ─── Estado vacío ────────────────────────────────────────────────────────────
export function EmptyState({
  message,
  icon: Icon,
  action,
  className = "",
}: {
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-surface-container-low px-6 py-10 flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      {Icon && <Icon className="w-6 h-6 text-on-surface-variant" strokeWidth={1.5} aria-hidden />}
      <p className="text-sm text-on-surface-variant max-w-sm text-pretty">{message}</p>
      {action}
    </div>
  );
}

// ─── Chips de estado (vocabulario fijo) ──────────────────────────────────────
const CHIP_TONE = {
  good: "bg-secondary-container text-on-secondary-container",
  warn: "bg-error/10 text-error",
  neutral: "bg-surface-container text-on-surface-variant",
  brand: "bg-primary-container text-on-primary-container",
  // Estados de respuesta de una familia: tres colores bien distintos (AA ≥5:1).
  yes: "bg-salvia text-tinta",
  no: "bg-rosa text-tinta",
  wait: "bg-ambar text-on-ambar",
} as const;

export function Chip({ tone = "neutral", children, className = "" }: { tone?: keyof typeof CHIP_TONE; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${CHIP_TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

// Color + ícono: el estado no depende solo del color.
export const RSVP_CHIP = {
  CONFIRMED: { tone: "yes", label: "Confirmado", icon: Check },
  DECLINED: { tone: "no", label: "No asiste", icon: X },
  PENDING: { tone: "wait", label: "Pendiente", icon: Clock },
} as const;

export function RsvpChip({ status, className = "" }: { status: keyof typeof RSVP_CHIP; className?: string }) {
  const { tone, label, icon: Icon } = RSVP_CHIP[status];
  return (
    <Chip tone={tone} className={className}>
      <Icon className="w-3 h-3" strokeWidth={2.5} aria-hidden />
      {label}
    </Chip>
  );
}

// ─── Encabezado de página ────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-primary text-balance">{title}</h1>
        {description && (
          <p className="text-sm text-on-surface-variant mt-2 max-w-xl text-pretty">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

// ─── Cifra de estado ─────────────────────────────────────────────────────────
const TONE_VALUE = {
  default: "text-on-surface",
  warn: "text-error",
  good: "text-on-secondary-container",
} as const;

// Cifra compacta: rótulo, valor y pista. Si lleva href, toda la pieza enlaza.
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  tone?: keyof typeof TONE_VALUE;
  /** Si se indica, toda la tarjeta lleva a esa sección. */
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-label font-medium text-on-surface-variant">{label}</p>
        {href ? (
          <ChevronRight className="w-4 h-4 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
        ) : (
          Icon && <Icon className="w-4 h-4 text-on-surface-variant" aria-hidden />
        )}
      </div>
      <span className={`text-2xl font-sans font-medium tabular-nums leading-none ${TONE_VALUE[tone]}`}>{value}</span>
      {hint && <div className="text-xs text-on-surface-variant">{hint}</div>}
    </>
  );
  const cls = "bg-surface-container-lowest p-4 sm:p-5 rounded-2xl flex flex-col gap-2.5";

  if (!href) return <div className={cls}>{body}</div>;
  return (
    <Link href={href} className={`${cls} group transition-colors hover:bg-[#fffdf8] ${focusRing}`}>
      {body}
    </Link>
  );
}

// ─── Pestañas (control segmentado) ───────────────────────────────────────────
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: LucideIcon; count?: number }[];
  /** Nombre accesible del grupo de pestañas. */
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex w-full sm:w-fit gap-1 bg-surface-container-low rounded-xl p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-10 px-4 py-2 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] duration-150 cursor-pointer ${focusRing} ${
              active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden />}
            <span className="truncate">{opt.label}</span>
            {opt.count !== undefined && (
              <span className="tabular-nums text-xs text-on-surface-variant">{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
