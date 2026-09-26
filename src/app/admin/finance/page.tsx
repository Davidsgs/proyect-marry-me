import { auth } from "@/auth";
import { PageHeader, StatCard } from "@/app/admin/_components/ui";
import { todayLocalISO } from "@/lib/dates";
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

  const today = todayLocalISO();
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of transactions) {
    if (t.type === "INCOME") incomeCents += t.amountCents;
    else expenseCents += t.amountCents;
  }
  let toPayCents = 0;      // cuotas de egresos sin pagar
  let toCollectCents = 0;  // cuotas de ingresos sin cobrar
  let pendingCount = 0;
  let overdueCount = 0;
  for (const p of plans) {
    for (const c of p.installments) {
      if (c.isPaid) {
        if (p.type === "INCOME") incomeCents += c.amountCents;
        else expenseCents += c.amountCents;
      } else {
        if (p.type === "INCOME") toCollectCents += c.amountCents;
        else toPayCents += c.amountCents;
        pendingCount += 1;
        if (c.dueDate && c.dueDate < today) overdueCount += 1;
      }
    }
  }
  const balanceCents = incomeCents - expenseCents;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <PageHeader title="Economía" description="Registra ingresos y egresos, y lleva la trazabilidad de los pagos en cuotas." />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Balance" value={formatMoney(balanceCents)} icon={Wallet} tone={balanceCents < 0 ? "warn" : "default"} />
        <StatCard label="Ingresos" value={formatMoney(incomeCents)} icon={TrendingUp} tone="good" />
        <StatCard label="Egresos" value={formatMoney(expenseCents)} icon={TrendingDown} />
        <StatCard
          label="Cuotas por pagar"
          value={formatMoney(toPayCents)}
          icon={CalendarClock}
          tone={overdueCount > 0 ? "warn" : "default"}
          hint={
            <>
              {pendingCount} {pendingCount === 1 ? "cuota pendiente" : "cuotas pendientes"}
              {overdueCount > 0 && <span className="text-error"> · {overdueCount} {overdueCount === 1 ? "vencida" : "vencidas"}</span>}
              {toCollectCents > 0 && <> · por cobrar {formatMoney(toCollectCents)}</>}
            </>
          }
        />
      </div>

      <FinanceManager
        initialTransactions={transactions}
        initialPlans={plans}
        canWrite={canWrite}
      />
    </div>
  );
}
