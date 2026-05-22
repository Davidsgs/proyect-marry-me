import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getTransactions, getPlans } from "@/app/actions/finance";
import { formatMoney } from "@/lib/money";
import { TrendingUp, TrendingDown, Wallet, CalendarClock } from "lucide-react";
import FinanceManager from "./_components/FinanceManager";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const session = await auth();
  const perms = session?.user?.permissions;

  if (!hasPermission(perms, "finance.read")) {
    redirect("/admin");
  }

  const canWrite = hasPermission(perms, "finance.write");
  const [transactions, plans] = await Promise.all([getTransactions(), getPlans()]);

  const today = new Date().toISOString().slice(0, 10);
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of transactions) {
    if (t.type === "INCOME") incomeCents += t.amountCents;
    else expenseCents += t.amountCents;
  }
  let pendingCents = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  for (const p of plans) {
    for (const c of p.installments) {
      if (c.isPaid) {
        if (p.type === "INCOME") incomeCents += c.amountCents;
        else expenseCents += c.amountCents;
      } else {
        pendingCents += c.amountCents;
        pendingCount += 1;
        if (c.dueDate && c.dueDate < today) overdueCount += 1;
      }
    }
  }
  const balanceCents = incomeCents - expenseCents;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="text-center pb-2">
        <h1 className="font-serif italic text-4xl text-primary drop-shadow-sm">Economía</h1>
        <p className="text-sm font-sans text-on-surface-variant mt-2 max-w-md mx-auto">
          Registra ingresos y egresos, y lleva la trazabilidad de los pagos en cuotas.
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Balance</p>
            <Wallet className="w-4 h-4 text-on-surface-variant opacity-60" />
          </div>
          <span className={`text-2xl font-serif ${balanceCents < 0 ? "text-error" : "text-primary"}`}>
            {formatMoney(balanceCents)}
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Ingresos</p>
            <TrendingUp className="w-4 h-4 text-on-secondary-container opacity-80" />
          </div>
          <span className="text-2xl font-serif text-on-secondary-container">{formatMoney(incomeCents)}</span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Egresos</p>
            <TrendingDown className="w-4 h-4 text-error opacity-80" />
          </div>
          <span className="text-2xl font-serif text-error">{formatMoney(expenseCents)}</span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_32px_rgba(81,68,67,0.04)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-widest text-on-surface-variant uppercase font-medium">Cuotas pend.</p>
            <CalendarClock className="w-4 h-4 text-on-surface-variant opacity-60" />
          </div>
          <span className="text-2xl font-serif text-primary">{formatMoney(pendingCents)}</span>
          <p className="text-[11px] text-on-surface-variant font-medium -mt-1">
            {pendingCount} pend.
            {overdueCount > 0 && <span className="text-error"> · {overdueCount} vencida{overdueCount === 1 ? "" : "s"}</span>}
          </p>
        </div>
      </div>

      <FinanceManager
        initialTransactions={transactions}
        initialPlans={plans}
        canWrite={canWrite}
      />

      <div className="pb-16 text-center">
        <p className="font-serif italic text-primary/60 text-lg">David &amp; Rocio · 03 de Abril, 2026</p>
      </div>
    </div>
  );
}
