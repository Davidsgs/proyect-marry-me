"use server";

import { db } from "@/db";
import { financeTransactions, financeInstallmentPlans, financeInstallments, users } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

type TxType = "INCOME" | "EXPENSE";

export type TransactionRow = typeof financeTransactions.$inferSelect & { createdByName?: string | null };
export type Installment = typeof financeInstallments.$inferSelect & { paidByName?: string | null };
export type PlanWithInstallments = typeof financeInstallmentPlans.$inferSelect & { installments: Installment[] };

// ─── Lecturas (cacheadas, tag "finance") ─────────────────────────────────────

const fetchTransactions = unstable_cache(
  async () => db
    .select({
      id: financeTransactions.id,
      type: financeTransactions.type,
      concept: financeTransactions.concept,
      category: financeTransactions.category,
      amountCents: financeTransactions.amountCents,
      date: financeTransactions.date,
      notes: financeTransactions.notes,
      createdBy: financeTransactions.createdBy,
      createdByName: users.fullname,
      createdAt: financeTransactions.createdAt,
      updatedAt: financeTransactions.updatedAt,
    })
    .from(financeTransactions)
    .leftJoin(users, eq(financeTransactions.createdBy, users.id))
    .orderBy(desc(financeTransactions.date), desc(financeTransactions.createdAt))
    .all(),
  ["finance-transactions"],
  { tags: ["finance"] },
);

const fetchPlans = unstable_cache(
  async (): Promise<PlanWithInstallments[]> => {
    const plans = await db.select().from(financeInstallmentPlans)
      .orderBy(desc(financeInstallmentPlans.createdAt)).all();
    const items = await db
      .select({
        id: financeInstallments.id,
        planId: financeInstallments.planId,
        number: financeInstallments.number,
        amountCents: financeInstallments.amountCents,
        dueDate: financeInstallments.dueDate,
        isPaid: financeInstallments.isPaid,
        paidAt: financeInstallments.paidAt,
        paidBy: financeInstallments.paidBy,
        paidByName: users.fullname,
        createdAt: financeInstallments.createdAt,
      })
      .from(financeInstallments)
      .leftJoin(users, eq(financeInstallments.paidBy, users.id))
      .orderBy(asc(financeInstallments.number))
      .all();
    return plans.map((p) => ({ ...p, installments: items.filter((i) => i.planId === p.id) }));
  },
  ["finance-plans"],
  { tags: ["finance"] },
);

function invalidate() {
  updateTag("finance");
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
}

async function requireRead() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "finance.read")) throw new Error("Sin permisos");
  return session;
}

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user?.permissions, "finance.write")) throw new Error("Sin permisos");
  return session;
}

export async function getTransactions() {
  await requireRead();
  return await fetchTransactions();
}

export async function getPlans() {
  await requireRead();
  return await fetchPlans();
}

// Resumen agregado para el dashboard. Una cuota solo cuenta en el balance cuando
// está pagada; las no pagadas se reportan como pendientes/vencidas.
export async function getFinanceSummary() {
  const [txs, plans] = await Promise.all([fetchTransactions(), fetchPlans()]);
  const today = new Date().toISOString().slice(0, 10);

  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of txs) {
    if (t.type === "INCOME") incomeCents += t.amountCents;
    else expenseCents += t.amountCents;
  }

  let pendingCount = 0;
  let pendingCents = 0;
  let overdueCount = 0;
  for (const p of plans) {
    for (const c of p.installments) {
      if (c.isPaid) {
        if (p.type === "INCOME") incomeCents += c.amountCents;
        else expenseCents += c.amountCents;
      } else {
        pendingCount += 1;
        pendingCents += c.amountCents;
        if (c.dueDate && c.dueDate < today) overdueCount += 1;
      }
    }
  }

  return {
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    pendingCount,
    pendingCents,
    overdueCount,
  };
}

// ─── Movimientos sueltos ─────────────────────────────────────────────────────

export async function createTransaction(data: {
  type: TxType; concept: string; category?: string; amountCents: number; date?: string; notes?: string;
}) {
  const session = await requireWrite();
  if (!data.concept?.trim()) throw new Error("El concepto es obligatorio");
  if (!Number.isFinite(data.amountCents) || data.amountCents <= 0) throw new Error("El importe debe ser mayor que 0");

  await db.insert(financeTransactions).values({
    type: data.type,
    concept: data.concept.trim(),
    category: data.category?.trim() || "",
    amountCents: Math.round(data.amountCents),
    date: data.date || new Date().toISOString().slice(0, 10),
    notes: data.notes?.trim() || "",
    createdBy: session?.user?.id ? Number(session.user.id) : null,
  });
  invalidate();
}

export async function updateTransaction(id: number, data: {
  type?: TxType; concept?: string; category?: string; amountCents?: number; date?: string; notes?: string;
}) {
  await requireWrite();
  const set: Record<string, unknown> = {};
  if (data.type !== undefined) set.type = data.type;
  if (data.concept !== undefined) set.concept = data.concept.trim();
  if (data.category !== undefined) set.category = data.category.trim();
  if (data.amountCents !== undefined) {
    if (!Number.isFinite(data.amountCents) || data.amountCents <= 0) throw new Error("El importe debe ser mayor que 0");
    set.amountCents = Math.round(data.amountCents);
  }
  if (data.date !== undefined) set.date = data.date || null;
  if (data.notes !== undefined) set.notes = data.notes.trim();
  if (Object.keys(set).length > 0) {
    await db.update(financeTransactions).set(set).where(eq(financeTransactions.id, id));
  }
  invalidate();
}

export async function deleteTransaction(id: number) {
  await requireWrite();
  await db.delete(financeTransactions).where(eq(financeTransactions.id, id));
  invalidate();
}

// ─── Planes de pago en cuotas ────────────────────────────────────────────────

// Reparte el total en N cuotas enteras (centavos). El resto de la división se
// suma de a 1 centavo en las primeras cuotas, así la suma de cuotas == total.
function splitAmount(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  let remainder = totalCents - base * count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return base + extra;
  });
}

// Suma `n` meses a una fecha ISO "YYYY-MM-DD", devuelve ISO. Maneja fin de mes.
function addMonths(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(d, lastDay));
  return date.toISOString().slice(0, 10);
}

export async function createInstallmentPlan(data: {
  type: TxType; concept: string; category?: string; totalAmountCents: number;
  installmentsCount: number; firstDueDate?: string; notes?: string;
}) {
  const session = await requireWrite();
  if (!data.concept?.trim()) throw new Error("El concepto es obligatorio");
  if (!Number.isFinite(data.totalAmountCents) || data.totalAmountCents <= 0) throw new Error("El importe total debe ser mayor que 0");
  const count = Math.round(data.installmentsCount);
  if (!Number.isInteger(count) || count < 1 || count > 120) throw new Error("Número de cuotas inválido (1-120)");

  const total = Math.round(data.totalAmountCents);
  const plan = await db.insert(financeInstallmentPlans).values({
    type: data.type,
    concept: data.concept.trim(),
    category: data.category?.trim() || "",
    totalAmountCents: total,
    installmentsCount: count,
    notes: data.notes?.trim() || "",
    createdBy: session?.user?.id ? Number(session.user.id) : null,
  }).returning({ id: financeInstallmentPlans.id }).get();

  const amounts = splitAmount(total, count);
  const rows = amounts.map((amountCents, i) => ({
    planId: plan.id,
    number: i + 1,
    amountCents,
    dueDate: data.firstDueDate ? addMonths(data.firstDueDate, i) : null,
  }));
  await db.insert(financeInstallments).values(rows);

  invalidate();
}

export async function deleteInstallmentPlan(id: number) {
  await requireWrite();
  await db.delete(financeInstallmentPlans).where(eq(financeInstallmentPlans.id, id));
  invalidate();
}

export async function toggleInstallmentPaid(id: number) {
  const session = await requireWrite();
  const cuota = await db.select().from(financeInstallments).where(eq(financeInstallments.id, id)).get();
  if (!cuota) throw new Error("Cuota no encontrada");
  const nowPaying = !cuota.isPaid;
  await db.update(financeInstallments).set({
    isPaid: nowPaying,
    paidAt: nowPaying ? new Date().toISOString() : null,
    paidBy: nowPaying ? (session?.user?.id ? Number(session.user.id) : null) : null,
  }).where(eq(financeInstallments.id, id));
  invalidate();
}

export async function updateInstallment(id: number, data: { amountCents?: number; dueDate?: string }) {
  await requireWrite();
  const set: Record<string, unknown> = {};
  if (data.amountCents !== undefined) {
    if (!Number.isFinite(data.amountCents) || data.amountCents <= 0) throw new Error("El importe debe ser mayor que 0");
    set.amountCents = Math.round(data.amountCents);
  }
  if (data.dueDate !== undefined) set.dueDate = data.dueDate || null;
  if (Object.keys(set).length > 0) {
    await db.update(financeInstallments).set(set).where(eq(financeInstallments.id, id));
  }
  invalidate();
}
