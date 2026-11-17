"use client";

import { useState } from "react";
import { GrowText } from "@/components/GrowText";
import { isTemp, pendingRowCls, tempId, useOptimisticState, type Patch } from "@/app/admin/_components/optimistic";
import { useConfirm } from "@/app/admin/_components/ConfirmDialog";
import { DatePicker } from "@/components/DatePicker";
import { EmptyState, Field, Tabs, btnPrimary, btnGhost, btnGhostSm, btnPrimarySm, iconBtn, iconBtnDanger, inputCls, inputSmCls as inputSm } from "@/app/admin/_components/ui";
import {
  Plus, X, Trash2, Pencil, Save, Check, TrendingUp, TrendingDown,
  CalendarClock, ChevronDown, Wallet, AlertTriangle,
} from "lucide-react";
import {
  createTransaction, updateTransaction, deleteTransaction,
  createInstallmentPlan, deleteInstallmentPlan, toggleInstallmentPaid, updateInstallment,
  type TransactionRow, type PlanWithInstallments,
} from "@/app/actions/finance";
import { formatMoney, pesosToCents, centsToPesos } from "@/lib/money";

type TxType = "INCOME" | "EXPENSE";
type Mutate<T> = (patch: Patch<T>, action: () => Promise<unknown>, msg: { ok?: string; error: string }) => Promise<boolean>;
type TxMutate = Mutate<TransactionRow[]>;
type PlanMutate = Mutate<PlanWithInstallments[]>;
const todayISO = () => new Date().toLocaleDateString("en-CA");
const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

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
  // Cambios optimistas: se ven al momento y se deshacen si el servidor falla.
  const [transactions, mutateTx] = useOptimisticState(initialTransactions);
  const [plans, mutatePlans] = useOptimisticState(initialPlans);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs
        label="Ver movimientos o cuotas"
        value={tab}
        onChange={setTab}
        options={[
          { value: "movimientos", label: "Movimientos", icon: Wallet },
          { value: "cuotas", label: "Pagos en cuotas", icon: CalendarClock },
        ]}
      />

      {tab === "movimientos"
        ? <TransactionsTab transactions={transactions} mutate={mutateTx} canWrite={canWrite} />
        : <PlansTab plans={plans} mutate={mutatePlans} canWrite={canWrite} />}
    </div>
  );
}


// ─── Movimientos ─────────────────────────────────────────────────────────────

function TransactionsTab({ transactions, mutate, canWrite }: { transactions: TransactionRow[]; mutate: TxMutate; canWrite: boolean }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className={btnPrimary}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cerrar" : "Nuevo movimiento"}
          </button>
        </div>
      )}

      {showForm && canWrite && <TransactionForm mutate={mutate} onDone={() => setShowForm(false)} />}

      {transactions.length === 0 ? (
        <EmptyState message="Aún no hay movimientos registrados." />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <TransactionItem key={t.id} tx={t} mutate={mutate} canWrite={canWrite} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionForm({ mutate, onDone }: { mutate: TxMutate; onDone: () => void }) {
  const [type, setType] = useState<TxType>("EXPENSE");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        const concept = (formData.get("concept") as string)?.trim();
        const amountCents = pesosToCents((formData.get("amount") as string) || "");
        if (!concept) { setError("El concepto es obligatorio"); return; }
        if (amountCents <= 0) { setError("El importe debe ser mayor que 0"); return; }
        setError(null);
        const data = {
          type,
          concept,
          category: (formData.get("category") as string) || "",
          amountCents,
          date: (formData.get("date") as string) || undefined,
          notes: (formData.get("notes") as string) || "",
        };
        mutate(
          (s) => [{ ...data, id: tempId(), date: data.date ?? null, createdBy: null, createdAt: nowSql(), updatedAt: nowSql(), createdByName: null }, ...s],
          () => createTransaction(data),
          { ok: "Movimiento registrado", error: "No se pudo registrar el movimiento" },
        );
        onDone();
      }}
      className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4"
    >
      <TypeToggle value={type} onChange={setType} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Field label="Concepto" className="md:col-span-5">
          <GrowText required name="concept" placeholder="Ej. Seña del salón" className={inputCls} />
        </Field>
        <Field label="Categoría" optional className="md:col-span-3">
          <input name="category" placeholder="Salón, Catering…" className={inputCls} />
        </Field>
        <Field label="Importe ($)" className="md:col-span-2">
          <input required type="number" step="0.01" min="0" name="amount" placeholder="0,00" className={inputCls} />
        </Field>
        <Field label="Fecha" className="md:col-span-2">
          <DatePicker name="date" />
        </Field>
      </div>

      <Field label="Notas" optional>
        <GrowText multiline name="notes" placeholder="Detalles adicionales…" className={inputCls} />
      </Field>

      {error && <p className="text-xs text-error font-medium">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
        <button type="submit" className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Registrar
        </button>
      </div>
    </form>
  );
}

function TransactionItem({ tx, mutate, canWrite }: { tx: TransactionRow; mutate: TxMutate; canWrite: boolean }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<TxType>(tx.type);
  const isIncome = tx.type === "INCOME";

  if (editing && canWrite) {
    return (
      <form
        action={(formData) => {
          const concept = (formData.get("concept") as string)?.trim();
          const amountCents = pesosToCents((formData.get("amount") as string) || "");
          if (!concept || amountCents <= 0) return;
          const data = {
            type,
            concept,
            category: (formData.get("category") as string) || "",
            amountCents,
            date: (formData.get("date") as string) || undefined,
            notes: (formData.get("notes") as string) || "",
          };
          setEditing(false);
          mutate(
            (s) => s.map((t) => t.id === tx.id ? { ...t, ...data, date: data.date ?? null } : t),
            () => updateTransaction(tx.id, data),
            { ok: "Movimiento guardado", error: "No se pudo guardar el movimiento" },
          );
        }}
        className="bg-surface-container-lowest p-4 rounded-xl ring-2 ring-primary/30 space-y-3"
      >
        <TypeToggle value={type} onChange={setType} />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <GrowText name="concept" defaultValue={tx.concept} placeholder="Concepto" className={`${inputSm} md:col-span-4`} />
          <input name="category" defaultValue={tx.category} placeholder="Categoría" className={`${inputSm} md:col-span-3`} />
          <input type="number" step="0.01" min="0" name="amount" defaultValue={centsToPesos(tx.amountCents)} className={`${inputSm} md:col-span-2`} />
          <DatePicker name="date" defaultValue={tx.date ?? ""} size="sm" aria-label="Fecha" className="md:col-span-3" />
        </div>
        <GrowText multiline name="notes" defaultValue={tx.notes} placeholder="Notas" className={inputSm} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className={btnGhostSm}>
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
          <button type="submit" className={btnPrimarySm}>
            <Save className="w-3.5 h-3.5" /> Guardar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div aria-busy={isTemp(tx.id) || undefined} className={`group flex items-center gap-3 p-4 rounded-xl bg-surface-container-lowest hover:bg-[#fffdf8] transition-colors ${isTemp(tx.id) ? pendingRowCls : ""}`}>
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-low text-on-surface-variant"}`}>
        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-item font-medium text-on-surface truncate">{tx.concept}</p>
        <p className="text-sm text-on-surface-variant truncate mt-0.5">
          {tx.category && <span className="font-medium">{tx.category} · </span>}{fmtDate(tx.date)}
          {tx.notes && <span> · {tx.notes}</span>}
        </p>
      </div>
      <span className={`shrink-0 text-base font-medium tabular-nums whitespace-nowrap ${isIncome ? "text-on-secondary-container" : "text-on-surface"}`}>
        {isIncome ? "+" : "−"} {formatMoney(tx.amountCents)}
      </span>
      {canWrite && (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setEditing(true)} className={iconBtn} aria-label={`Editar «${tx.concept}»`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (await confirm({ title: `¿Eliminar «${tx.concept}»?`, description: "El movimiento se borrará del registro.", confirmLabel: "Eliminar" }))
                mutate((s) => s.filter((t) => t.id !== tx.id), () => deleteTransaction(tx.id), { ok: "Movimiento eliminado", error: "No se pudo eliminar el movimiento" });
            }}
            className={iconBtnDanger}
            aria-label={`Eliminar «${tx.concept}»`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Pagos en cuotas ─────────────────────────────────────────────────────────

function PlansTab({ plans, mutate, canWrite }: { plans: PlanWithInstallments[]; mutate: PlanMutate; canWrite: boolean }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className={btnPrimary}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cerrar" : "Nuevo plan de cuotas"}
          </button>
        </div>
      )}

      {showForm && canWrite && <PlanForm mutate={mutate} onDone={() => setShowForm(false)} />}

      {plans.length === 0 ? (
        <EmptyState message="Aún no hay planes de pago en cuotas." />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} mutate={mutate} canWrite={canWrite} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanForm({ mutate, onDone }: { mutate: PlanMutate; onDone: () => void }) {
  const [type, setType] = useState<TxType>("EXPENSE");
  const [count, setCount] = useState(3);
  const [total, setTotal] = useState("");
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
        const data = {
          type,
          concept,
          category: (formData.get("category") as string) || "",
          totalAmountCents: totalCents,
          installmentsCount: count,
          firstDueDate: (formData.get("firstDueDate") as string) || undefined,
          notes: (formData.get("notes") as string) || "",
        };
        // Las cuotas las genera el servidor: el plan aparece al momento y sus cuotas al confirmarse.
        mutate(
          (s) => [{
            id: tempId(), type, concept, category: data.category, totalAmountCents: totalCents, installmentsCount: count,
            notes: data.notes, createdBy: null, createdAt: nowSql(), updatedAt: nowSql(), installments: [],
          }, ...s],
          () => createInstallmentPlan(data),
          { ok: "Plan de cuotas creado", error: "No se pudo crear el plan" },
        );
        onDone();
      }}
      className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4"
    >
      <TypeToggle value={type} onChange={setType} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Field label="Concepto" className="md:col-span-6">
          <GrowText required name="concept" placeholder="Ej. Salón de fiestas" className={inputCls} />
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
          <DatePicker name="firstDueDate" />
        </Field>
        <Field label="Notas" optional className="md:col-span-6">
          <GrowText multiline name="notes" placeholder="Detalles, contacto…" className={inputCls} />
        </Field>
      </div>

      {perCuota > 0 && (
        <p className="text-xs text-on-surface-variant font-medium bg-surface-container-low rounded-xl px-4 py-2.5">
          {count} cuota{count === 1 ? "" : "s"} de aprox. <span className="text-primary font-semibold tabular-nums">{formatMoney(perCuota)}</span>
          {" "}· Las fechas se generan mensualmente desde el 1er vencimiento.
        </p>
      )}

      {error && <p className="text-xs text-error font-medium">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btnGhost}>Cancelar</button>
        <button type="submit" className={btnPrimary}>
          <Plus className="w-4 h-4" />
          Crear plan
        </button>
      </div>
    </form>
  );
}

function PlanCard({ plan, mutate, canWrite }: { plan: PlanWithInstallments; mutate: PlanMutate; canWrite: boolean }) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const isIncome = plan.type === "INCOME";

  const paidCount = plan.installments.filter((c) => c.isPaid).length;
  const paidCents = plan.installments.filter((c) => c.isPaid).reduce((s, c) => s + c.amountCents, 0);
  const pct = plan.totalAmountCents > 0 ? Math.round((paidCents / plan.totalAmountCents) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div aria-busy={isTemp(plan.id) || undefined} className={`bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden ${isTemp(plan.id) ? pendingRowCls : ""}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-low text-on-surface-variant"}`}>
          {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
        <button onClick={() => setOpen((v) => !v)} className="flex-1 min-w-0 text-left border-none bg-transparent cursor-pointer">
          <p className="font-sans text-sm font-medium text-on-surface truncate">{plan.concept}</p>
          <p className="text-sm text-on-surface-variant truncate mt-0.5 tabular-nums">
            {plan.category && <span className="font-medium">{plan.category} · </span>}
            {paidCount}/{plan.installmentsCount} cuotas · {formatMoney(paidCents)} de {formatMoney(plan.totalAmountCents)}
          </p>
        </button>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant tabular-nums">{pct}%</span>
          {canWrite && (
            <button
              onClick={async () => {
                if (await confirm({ title: `¿Eliminar el plan «${plan.concept}»?`, description: "Se borrarán también todas sus cuotas, pagadas o no.", confirmLabel: "Eliminar plan" }))
                  mutate((s) => s.filter((p) => p.id !== plan.id), () => deleteInstallmentPlan(plan.id), { ok: "Plan eliminado", error: "No se pudo eliminar el plan" });
              }}
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
          <div className={`h-1.5 rounded-full transition-colors duration-700 ${isIncome ? "bg-on-secondary-container" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          {plan.notes && <p className="text-sm text-on-surface-variant pb-2">{plan.notes}</p>}
          {plan.installments.map((c) => (
            <InstallmentRow key={c.id} cuota={c} mutate={mutate} canWrite={canWrite} today={today} />
          ))}
        </div>
      )}
    </div>
  );
}

type Cuota = PlanWithInstallments["installments"][number];

function InstallmentRow({ cuota, mutate, canWrite, today }: { cuota: Cuota; mutate: PlanMutate; canWrite: boolean; today: string }) {
  const [editing, setEditing] = useState(false);
  const patchCuota = (fn: (c: Cuota) => Cuota): Patch<PlanWithInstallments[]> => (s) =>
    s.map((p) => p.id !== cuota.planId ? p : { ...p, installments: p.installments.map((c) => c.id === cuota.id ? fn(c) : c) });
  const overdue = !cuota.isPaid && cuota.dueDate && cuota.dueDate < today;

  if (editing && canWrite) {
    return (
      <form
        action={(formData) => {
          const amountCents = pesosToCents((formData.get("amount") as string) || "");
          if (amountCents <= 0) return;
          const data = { amountCents, dueDate: (formData.get("dueDate") as string) || undefined };
          setEditing(false);
          mutate(patchCuota((c) => ({ ...c, amountCents, dueDate: data.dueDate ?? null })), () => updateInstallment(cuota.id, data), { ok: "Cuota guardada", error: "No se pudo guardar la cuota" });
        }}
        className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low"
      >
        <span className="shrink-0 text-xs font-medium text-on-surface-variant w-8">#{cuota.number}</span>
        <input type="number" step="0.01" min="0" name="amount" defaultValue={centsToPesos(cuota.amountCents)} className={`${inputSm} flex-1`} />
        <DatePicker name="dueDate" defaultValue={cuota.dueDate ?? ""} size="sm" aria-label="Vencimiento" className="flex-1 min-w-0" />
        <button type="button" onClick={() => setEditing(false)} className={iconBtn} aria-label="Cancelar"><X className="w-4 h-4" /></button>
        <button type="submit" className={iconBtn} aria-label="Guardar">
          <Save className="w-4 h-4" />
        </button>
      </form>
    );
  }

  return (
    <div className={`group flex items-center gap-3 p-2.5 rounded-lg transition-colors ${cuota.isPaid ? "bg-surface-container-low" : "hover:bg-surface-container-low"}`}>
      {canWrite ? (
        <button
          onClick={() => mutate(
            patchCuota((c) => ({ ...c, isPaid: !c.isPaid, paidAt: c.isPaid ? null : todayISO() })),
            () => toggleInstallmentPaid(cuota.id),
            { error: "No se pudo actualizar la cuota" },
          )}
          aria-label={cuota.isPaid ? "Marcar como pendiente" : "Marcar como pagada"}
          type="button"
          aria-pressed={cuota.isPaid}
          className="shrink-0 -my-1.5 w-11 h-11 flex items-center justify-center cursor-pointer group/check"
        >
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
            cuota.isPaid ? "bg-primary text-on-primary" : "bg-surface-container text-transparent group-hover/check:text-primary"
          }`}>
            <Check className="w-4 h-4 stroke-[3]" />
          </span>
        </button>
      ) : (
        <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${cuota.isPaid ? "bg-primary text-on-primary" : "bg-surface-container text-transparent"}`}>
          <Check className="w-4 h-4 stroke-[3]" />
        </span>
      )}

      <span className="shrink-0 text-xs font-medium tabular-nums text-on-surface-variant w-8">#{cuota.number}</span>

      <span className={`flex-1 text-sm font-medium tabular-nums ${cuota.isPaid ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
        {formatMoney(cuota.amountCents)}
      </span>

      {cuota.isPaid ? (
        <span className="shrink-0 text-xs text-on-surface-variant">Pagada {fmtDate(cuota.paidAt)}</span>
      ) : cuota.dueDate ? (
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${overdue ? "bg-error/10 text-error" : "bg-surface-container text-on-surface-variant"}`}>
          {overdue ? <AlertTriangle className="w-3 h-3" aria-hidden /> : <CalendarClock className="w-3 h-3" aria-hidden />}
          {overdue && "Vencida · "}{fmtDate(cuota.dueDate)}
        </span>
      ) : (
        <span className="shrink-0 text-xs text-on-surface-variant">Sin vencimiento</span>
      )}

      {canWrite && !cuota.isPaid && (
        <button onClick={() => setEditing(true)} className={`${iconBtn} pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus:opacity-100`} aria-label="Editar cuota">
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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors border-none cursor-pointer ${
          value === "INCOME" ? "bg-on-secondary-container text-white shadow-sm" : "text-on-surface-variant hover:text-on-secondary-container"
        }`}
      >
        <TrendingUp className="w-4 h-4" /> Ingreso
      </button>
      <button
        type="button"
        onClick={() => onChange("EXPENSE")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors border-none cursor-pointer ${
          value === "EXPENSE" ? "bg-error text-white shadow-sm" : "text-on-surface-variant hover:text-error"
        }`}
      >
        <TrendingDown className="w-4 h-4" /> Egreso
      </button>
    </div>
  );
}
