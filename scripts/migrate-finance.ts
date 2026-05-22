import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and } from "drizzle-orm";

/**
 * Migración idempotente de la sección Economía.
 *
 * Pasos:
 *   1. DDL: crea finance_transactions, finance_installment_plans y
 *      finance_installments (CREATE TABLE IF NOT EXISTS).
 *   2. Inserta los permisos finance.read / finance.write si faltan (y refresca
 *      su label/descripción desde el catálogo).
 *   3. Concede ambos permisos a todos los administradores existentes, para que
 *      la sección aparezca de inmediato (se pueden quitar luego con los toggles).
 *
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-finance.ts
 */
async function main() {
  console.log("Migrando sección Economía...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { permissions, users, userPermissions } = await import("../src/db/schema");

  // 1. DDL idempotente -------------------------------------------------------
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      type text NOT NULL,
      concept text NOT NULL,
      category text DEFAULT '' NOT NULL,
      amount_cents integer NOT NULL,
      date text,
      notes text DEFAULT '' NOT NULL,
      created_by integer REFERENCES users(id) ON DELETE SET NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
      updated_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS finance_installment_plans (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      type text DEFAULT 'EXPENSE' NOT NULL,
      concept text NOT NULL,
      category text DEFAULT '' NOT NULL,
      total_amount_cents integer NOT NULL,
      installments_count integer NOT NULL,
      notes text DEFAULT '' NOT NULL,
      created_by integer REFERENCES users(id) ON DELETE SET NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
      updated_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS finance_installments (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      plan_id integer NOT NULL REFERENCES finance_installment_plans(id) ON DELETE CASCADE,
      number integer NOT NULL,
      amount_cents integer NOT NULL,
      due_date text,
      is_paid integer DEFAULT false NOT NULL,
      paid_at text,
      paid_by integer REFERENCES users(id) ON DELETE SET NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )
  `);
  console.log("Tablas de Economía listas.");

  // 2. Permisos --------------------------------------------------------------
  const financePerms = [
    { key: "finance.read", label: "Leer Economía", section: "finance", description: "Ver ingresos, egresos, balance y planes de pago en cuotas." },
    { key: "finance.write", label: "Escribir/Modificar Economía", section: "finance", description: "Registrar/editar/eliminar movimientos y planes de cuotas; marcar cuotas pagadas." },
  ];
  for (const perm of financePerms) {
    const existing = await db.select().from(permissions).where(eq(permissions.key, perm.key)).get();
    if (!existing) {
      await db.insert(permissions).values(perm);
      console.log(`Permiso creado: ${perm.key}`);
    } else {
      await db.update(permissions)
        .set({ label: perm.label, section: perm.section, description: perm.description })
        .where(eq(permissions.key, perm.key));
      console.log(`Permiso existente (refrescado): ${perm.key}`);
    }
  }

  // 3. Conceder a administradores existentes ----------------------------------
  const permRows = await db.select().from(permissions)
    .where(eq(permissions.section, "finance")).all();
  const adminUsers = await db.select().from(users).where(eq(users.role, "ADMIN")).all();
  for (const user of adminUsers) {
    for (const perm of permRows) {
      const existing = await db.select().from(userPermissions)
        .where(and(eq(userPermissions.userId, user.id), eq(userPermissions.permissionId, perm.id)))
        .get();
      if (!existing) {
        await db.insert(userPermissions).values({ userId: user.id, permissionId: perm.id });
      }
    }
    console.log(`Permisos de Economía concedidos a admin ${user.email}`);
  }

  console.log("Migración de Economía completada.");
}

main().catch((err) => {
  console.error("Error en la migración de Economía:", err);
  process.exit(1);
});
