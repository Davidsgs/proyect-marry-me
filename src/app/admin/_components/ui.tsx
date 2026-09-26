// Piezas visuales compartidas del panel admin. Sin hooks: sirven tanto en
// páginas de servidor como en los managers de cliente.
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

// ─── Botones ─────────────────────────────────────────────────────────────────
const btnBase =
  "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-sans text-sm font-medium transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const btnPrimary = `${btnBase} bg-primary text-on-primary shadow-sm hover:shadow-md`;
export const btnSecondary = `${btnBase} bg-surface-container-low text-on-surface hover:bg-surface-container`;
export const btnDanger = `${btnBase} bg-error text-on-error shadow-sm hover:bg-error/90`;
export const btnGhost = `${btnBase} text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low`;

// ─── Encabezado de página ────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif italic text-3xl sm:text-4xl text-primary text-balance">{title}</h1>
        {description && (
          <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-xl text-pretty">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

// ─── Tarjeta de estadística ──────────────────────────────────────────────────
const TONE_VALUE = {
  default: "text-primary",
  warn: "text-error",
  good: "text-on-secondary-container",
} as const;

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
        <p className="text-xs font-sans font-medium text-on-surface-variant">{label}</p>
        {href ? (
          <ChevronRight className="w-4 h-4 text-on-surface-variant/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        ) : (
          Icon && <Icon className="w-4 h-4 text-on-surface-variant/60" />
        )}
      </div>
      <span className={`text-3xl font-serif tabular-nums leading-none ${TONE_VALUE[tone]}`}>{value}</span>
      {hint && <p className="text-xs font-sans text-on-surface-variant">{hint}</p>}
    </>
  );
  const cls = "bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_20px_rgba(81,68,67,0.04)] flex flex-col gap-3";

  if (!href) return <div className={cls}>{body}</div>;
  return (
    <Link
      href={href}
      className={`${cls} group transition-shadow hover:shadow-[0_8px_28px_rgba(81,68,67,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
    >
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
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
              active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span className="truncate">{opt.label}</span>
            {opt.count !== undefined && (
              <span className={`tabular-nums text-xs ${active ? "text-primary/70" : "text-on-surface-variant/70"}`}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
