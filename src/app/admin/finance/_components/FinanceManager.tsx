"use client";

import { useState, useTransition } from "react";
import {
  Plus, X, Trash2, Pencil, Save, Check, Loader2, TrendingUp, TrendingDown,
  CalendarClock, ChevronDown, Wallet, AlertTriangle,
} from "lucide-react";
import {
  createTransaction, updateTransaction, deleteTransaction,
  createInstallmentPlan, deleteInstallmentPlan, toggleInstallmentPaid, updateInstallment,
  type TransactionRow, type PlanWithInstallments,
} from "@/app/actions/finance";
import { formatMoney, pesosToCents, centsToPesos } from "@/lib/money";

type TxType = "INCOME" | "EXPENSE";

interface Props {
  initialTransactions: TransactionRow[];
  initialPlans: PlanWithInstallments[];
  canWrite: boolean;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export default function FinanceManager({ initialTransactions, initialPlans, canWrite }: Props) {
  const [tab, setTab] = useState<"movimientos" | "cuotas">("movimientos");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-2xl w-fit mx-auto">
        <TabButton active={tab === "movimientos"} onClick={() => setTab("movimientos")} icon={Wallet} label="Movimientos" />
        <TabButton active={tab === "cuotas"} onClick={() => setTab("cuotas")} icon={CalendarClock} label="Pagos en cuotas" />
      </div>

      {tab === "movimientos"
        ? <TransactionsTab transactions={initialTransactions} canWrite={canWrite} />
        : <PlansTab plans={initialPlans} canWrite={canWrite} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Wallet; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-widest uppercase font-medium transition-all border-none cursor-pointer ${
        active ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Movimientos ─────────────────────────────────────────────────────────────

function TransactionsTab({ transactions, canWrite }: { transactions: TransactionRow[]; canWrite: boolean }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium border-none cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cerrar" : "Nuevo movimiento"}
          </button>
        </div>
      )}

      {showForm && canWrite && <TransactionForm onDone={() => setShowForm(false)} />}

      {transactions.length === 0 ? (
        <EmptyState message="Aún no hay movimientos registrados." />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <TransactionItem key={t.id} tx={t} canWrite={canWrite} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<TxType>("EXPENSE");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        const concept = (formData.get("concept") as string)?.trim();
        const amountCents = pesosToCents((formData.get("amount") as string) || "");
        if (!concept) { setError("El concepto es obligatorio"); return; }
        if (amountCents <= 0) { setError("El importe debe ser mayor que 0"); return; }
        setError(null);
        startTransition(async () => {
          try {
            await createTransaction({
              type,
              concept,
              category: (formData.get("category") as string) || "",
              amountCents,
              date: (formData.get("date") as string) || undefined,
              notes: (formData.get("notes") as string) || "",
            });
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar");
          }
        });
      }}
      className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4"
    >
      <TypeToggle value={type} onChange={setType} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Field label="Concepto" className="md:col-span-5">
          <input required name="concept" placeholder="Ej. Seña del salón" className={inputCls} />
        </Field>
        <Field label="Categoría" optional className="md:col-span-3">
          <input name="category" placeholder="Salón, Catering…" className={inputCls} />
        </Field>
        <Field label="Importe ($)" className="md:col-span-2">
          <input required type="number" step="0.01" min="0" name="amount" placeholder="0,00" className={inputCls} />
        </Field>
        <Field label="Fecha" className="md:col-span-2">
          <input type="date" name="date" className={inputCls} />
        </Field>
      </div>

      <Field label="Notas" optional>
        <input name="notes" placeholder="Detalles adicionales…" className={inputCls} />
      </Field>

      {error && <p className="text-xs text-error font-medium">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Registrar
        </button>
      </div>
    </form>
  );
}

function TransactionItem({ tx, canWrite }: { tx: TransactionRow; canWrite: boolean }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<TxType>(tx.type);
  const [pending, startTransition] = useTransition();
  const isIncome = tx.type === "INCOME";

  if (editing && canWrite) {
    return (
      <form
        action={(formData) => {
          const concept = (formData.get("concept") as string)?.trim();
          const amountCents = pesosToCents((formData.get("amount") as string) || "");
          if (!concept || amountCents <= 0) return;
          startTransition(async () => {
            await updateTransaction(tx.id, {
              type,
              concept,
              category: (formData.get("category") as string) || "",
              amountCents,
              date: (formData.get("date") as string) || undefined,
              notes: (formData.get("notes") as string) || "",
            });
            setEditing(false);
          });
        }}
        className="bg-surface-container-lowest p-4 rounded-xl shadow-md border border-primary/20 space-y-3"
      >
        <TypeToggle value={type} onChange={setType} />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input name="concept" defaultValue={tx.concept} placeholder="Concepto" className={`${inputSm} md:col-span-4`} />
          <input name="category" defaultValue={tx.category} placeholder="Categoría" className={`${inputSm} md:col-span-3`} />
          <input type="number" step="0.01" min="0" name="amount" defaultValue={centsToPesos(tx.amountCents)} className={`${inputSm} md:col-span-2`} />
          <input type="date" name="date" defaultValue={tx.date ?? ""} className={`${inputSm} md:col-span-3`} />
        </div>
        <input name="notes" defaultValue={tx.notes} placeholder="Notas" className={inputSm} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className={btnGhostSm}>
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
          <button type="submit" disabled={pending} className={btnPrimarySm}>
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group flex items-center gap-3 p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all">
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? "bg-on-secondary-container/10 text-on-secondary-container" : "bg-error/10 text-error"}`}>
        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-medium text-on-surface truncate">{tx.concept}</p>
        <p className="text-xs text-on-surface-variant/70 truncate mt-0.5">
          {tx.category && <span className="font-medium">{tx.category} · </span>}{fmtDate(tx.date)}
          {tx.notes && <span> · {tx.notes}</span>}
        </p>
      </div>
      <span className={`shrink-0 font-serif text-base ${isIncome ? "text-on-secondary-container" : "text-error"}`}>
        {isIncome ? "+" : "−"} {formatMoney(tx.amountCents)}
      </span>
      {canWrite && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing(true)} className={iconBtn} aria-label="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => { if (confirm("¿Eliminar este movimiento?")) startTransition(() => deleteTransaction(tx.id)); }}
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

// ─── Pagos en cuotas ─────────────────────────────────────────────────────────

function PlansTab({ plans, canWrite }: { plans: PlanWithInstallments[]; canWrite: boolean }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-sans text-xs tracking-widest uppercase font-medium border-none cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cerrar" : "Nuevo plan de cuotas"}
          </button>
        </div>
      )}

      {showForm && canWrite && <PlanForm onDone={() => setShowForm(false)} />}

      {plans.length === 0 ? (
        <EmptyState message="Aún no hay planes de pago en cuotas." />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} canWrite={canWrite} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<TxType>("EXPENSE");
  const [count, setCount] = useState(3);
  const [total, setTotal] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalCents = pesosToCents(total);
  const perCuota = count > 0 && totalCents > 0 ? Math.floor(totalCents / count) : 0;

  return (
    <form
      action={(formData) => {
        const concept = (formData.get("concept") as string)?.trim();
        if (!concept) { setError("El concepto es obligatorio"); return; }
        if (totalCents <= 0) { setError("El importe total debe ser mayor que 0"); return; }
        if (count < 1 || count > 120) { setError("Número de cuotas inválido (1-120)"); return; }
        setError(null);
        startTransition(async () => {
          try {
            await createInstallmentPlan({
              type,
              concept,
              category: (formData.get("category") as string) || "",
              totalAmountCents: totalCents,
              installmentsCount: count,
              firstDueDate: (formData.get("firstDueDate") as string) || undefined,
              notes: (formData.get("notes") as string) || "",
            });
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar");
          }
        });
      }}
      className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4"
    >
      <TypeToggle value={type} onChange={setType} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Field label="Concepto" className="md:col-span-6">
          <input required name="concept" placeholder="Ej. Salón de fiestas" className={inputCls} />
        </Field>
        <Field label="Categoría" optional className="md:col-span-3">
          <input name="category" placeholder="Salón…" className={inputCls} />
        </Field>
        <Field label="Importe total ($)" className="md:col-span-3">
          <input required type="number" step="0.01" min="0" name="total" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0,00" className={inputCls} />
        </Field>
        <Field label="Nº de cuotas" className="md:col-span-3">
          <input required type="number" min="1" max="120" name="count" value={count} onChange={(e) => setCount(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="1er vencimiento" optional className="md:col-span-3">
          <input type="date" name="firstDueDate" className={inputCls} />
        </Field>
        <Field label="Notas" optional className="md:col-span-6">
          <input name="notes" placeholder="Detalles, contacto…" className={inputCls} />
        </Field>
      </div>

      {perCuota > 0 && (
        <p className="text-xs text-on-surface-variant font-medium bg-surface-container-low rounded-xl px-4 py-2.5">
          {count} cuota{count === 1 ? "" : "s"} de aprox. <span className="text-primary font-semibold">{formatMoney(perCuota)}</span>
          {" "}· Las fechas se generan mensualmente desde el 1er vencimiento.
        </p>
      )}

      {error && <p className="text-xs text-error font-medium">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Crear plan
        </button>
      </div>
    </form>
  );
}

function PlanCard({ plan, canWrite }: { plan: PlanWithInstallments; canWrite: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isIncome = plan.type === "INCOME";

  const paidCount = plan.installments.filter((c) => c.isPaid).length;
  const paidCents = plan.installments.filter((c) => c.isPaid).reduce((s, c) => s + c.amountCents, 0);
  const pct = plan.totalAmountCents > 0 ? Math.round((paidCents / plan.totalAmountCents) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? "bg-on-secondary-container/10 text-on-secondary-container" : "bg-error/10 text-error"}`}>
          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <button onClick={() => setOpen((v) => !v)} className="flex-1 min-w-0 text-left border-none bg-transparent cursor-pointer">
          <p className="font-sans text-sm font-medium text-on-surface truncate">{plan.concept}</p>
          <p className="text-xs text-on-surface-variant/70 truncate mt-0.5">
            {plan.category && <span className="font-medium">{plan.category} · </span>}
            {paidCount}/{plan.installmentsCount} cuotas · {formatMoney(paidCents)} de {formatMoney(plan.totalAmountCents)}
          </p>
        </button>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-medium text-on-surface-variant tabular-nums">{pct}%</span>
          {canWrite && (
            <button
              onClick={() => { if (confirm("¿Eliminar este plan y todas sus cuotas?")) startTransition(() => deleteInstallmentPlan(plan.id)); }}
              disabled={pending}
              className={iconBtnDanger}
              aria-label="Eliminar plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className={iconBtn} aria-label={open ? "Contraer" : "Expandir"}>
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="px-4 -mt-1 pb-3">
        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
          <div className={`h-1.5 rounded-full transition-all duration-700 ${isIncome ? "bg-on-secondary-container" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          {plan.notes && <p className="text-xs text-on-surface-variant italic pb-2">{plan.notes}</p>}
          {plan.installments.map((c) => (
            <InstallmentRow key={c.id} cuota={c} canWrite={canWrite} today={today} />
          ))}
        </div>
      )}
    </div>
  );
}

function InstallmentRow({ cuota, canWrite, today }: { cuota: PlanWithInstallments["installments"][number]; canWrite: boolean; today: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const overdue = !cuota.isPaid && cuota.dueDate && cuota.dueDate < today;

  if (editing && canWrite) {
    return (
      <form
        action={(formData) => {
          const amountCents = pesosToCents((formData.get("amount") as string) || "");
          if (amountCents <= 0) return;
          startTransition(async () => {
            await updateInstallment(cuota.id, {
              amountCents,
              dueDate: (formData.get("dueDate") as string) || undefined,
            });
            setEditing(false);
          });
        }}
        className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low"
      >
        <span className="shrink-0 text-xs font-medium text-on-surface-variant w-8">#{cuota.number}</span>
        <input type="number" step="0.01" min="0" name="amount" defaultValue={centsToPesos(cuota.amountCents)} className={`${inputSm} flex-1`} />
        <input type="date" name="dueDate" defaultValue={cuota.dueDate ?? ""} className={`${inputSm} flex-1`} />
        <button type="button" onClick={() => setEditing(false)} className={iconBtn} aria-label="Cancelar"><X className="w-4 h-4" /></button>
        <button type="submit" disabled={pending} className={iconBtn} aria-label="Guardar">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
      </form>
    );
  }

  return (
    <div className={`group flex items-center gap-3 p-2.5 rounded-lg transition-colors ${cuota.isPaid ? "bg-surface-container-low/40" : "hover:bg-surface-container-low/60"}`}>
      {canWrite ? (
        <button
          onClick={() => startTransition(() => toggleInstallmentPaid(cuota.id))}
          aria-label={cuota.isPaid ? "Marcar como pendiente" : "Marcar como pagada"}
          className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all border-none cursor-pointer ${
            cuota.isPaid ? "bg-primary text-on-primary" : "bg-surface-container text-transparent hover:bg-primary/20 hover:text-primary"
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </button>
      ) : (
        <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${cuota.isPaid ? "bg-primary text-on-primary" : "bg-surface-container text-transparent"}`}>
          <Check className="w-4 h-4 stroke-[3]" />
        </span>
      )}

      <span className="shrink-0 text-xs font-medium text-on-surface-variant w-8">#{cuota.number}</span>

      <span className={`flex-1 text-sm font-medium ${cuota.isPaid ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
        {formatMoney(cuota.amountCents)}
      </span>

      {cuota.isPaid ? (
        <span className="shrink-0 text-[11px] text-on-surface-variant">Pagada {fmtDate(cuota.paidAt)}</span>
      ) : cuota.dueDate ? (
        <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${overdue ? "bg-error/10 text-error" : "bg-surface-container text-on-surface-variant"}`}>
          {overdue ? <AlertTriangle className="w-3 h-3" /> : <CalendarClock className="w-3 h-3" />}
          {fmtDate(cuota.dueDate)}
        </span>
      ) : (
        <span className="shrink-0 text-[11px] text-on-surface-variant/50">Sin vencimiento</span>
      )}

      {canWrite && !cuota.isPaid && (
        <button onClick={() => setEditing(true)} className={`${iconBtn} opacity-0 group-hover:opacity-100 focus:opacity-100`} aria-label="Editar cuota">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Compartidos ─────────────────────────────────────────────────────────────

function TypeToggle({ value, onChange }: { value: TxType; onChange: (v: TxType) => void }) {
  return (
    <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl w-fit">
      <button
        type="button"
        onClick={() => onChange("INCOME")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border-none cursor-pointer ${
          value === "INCOME" ? "bg-on-secondary-container text-white shadow-sm" : "text-on-surface-variant hover:text-on-secondary-container"
        }`}
      >
        <TrendingUp className="w-4 h-4" /> Ingreso
      </button>
      <button
        type="button"
        onClick={() => onChange("EXPENSE")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border-none cursor-pointer ${
          value === "EXPENSE" ? "bg-error text-white shadow-sm" : "text-on-surface-variant hover:text-error"
        }`}
      >
        <TrendingDown className="w-4 h-4" /> Egreso
      </button>
    </div>
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-sm">
      <p className="text-on-surface-variant font-sans text-sm">{message}</p>
    </div>
  );
}

const inputCls = "w-full px-4 py-3 border-none rounded-xl bg-surface-container-low focus:bg-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder-on-surface-variant/50 shadow-sm";
const inputSm = "px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/50 border-none";
const btnPrimary = "flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-sm font-sans tracking-widest uppercase text-xs font-medium disabled:opacity-60 border-none cursor-pointer";
const btnGhost = "flex items-center gap-2 px-5 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all font-sans tracking-widest uppercase text-xs font-medium border-none cursor-pointer";
const btnPrimarySm = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-on-primary hover:bg-primary/90 transition-all disabled:opacity-50 border-none cursor-pointer";
const btnGhostSm = "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer";
const iconBtn = "w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-all border-none cursor-pointer shrink-0";
const iconBtnDanger = "w-8 h-8 flex items-center justify-center rounded-xl text-error hover:bg-error/10 transition-all border-none cursor-pointer shrink-0 disabled:opacity-50";
