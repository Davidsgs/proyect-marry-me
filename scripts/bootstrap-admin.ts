import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and } from "drizzle-orm";

const TARGET_EMAIL = process.argv[2];
const TARGET_NAME = process.argv[3] ?? "David";
const TARGET_LAST_NAME = process.argv[4] ?? "García Sánchez";

if (!TARGET_EMAIL) {
  console.error("Uso: tsx scripts/bootstrap-admin.ts <email> [nombre] [apellidos]");
  process.exit(1);
}

async function main() {
  const { db } = await import("../src/db");
  const { users, roles, userRoles } = await import("../src/db/schema");

  // 1. Verificar / crear el usuario
  let dbUser = await db.select().from(users).where(eq(users.email, TARGET_EMAIL)).get();

  if (!dbUser) {
    const fullname = `${TARGET_NAME} ${TARGET_LAST_NAME}`.trim();
    await db.insert(users).values({
      email: TARGET_EMAIL,
      name: TARGET_NAME,
      lastName: TARGET_LAST_NAME,
      fullname,
      familyId: null,
      role: "ADMIN",
      isConfirmed: false,
    });
    dbUser = await db.select().from(users).where(eq(users.email, TARGET_EMAIL)).get();
    console.log(`Usuario creado: ${TARGET_EMAIL} (id=${dbUser?.id})`);
  } else {
    if (dbUser.role !== "ADMIN") {
      await db.update(users).set({ role: "ADMIN" }).where(eq(users.id, dbUser.id));
      console.log(`Usuario existente actualizado a ADMIN: ${TARGET_EMAIL}`);
    } else {
      console.log(`Usuario ya es ADMIN: ${TARGET_EMAIL}`);
    }
  }

  if (!dbUser) {
    throw new Error("No se pudo crear/recuperar el usuario");
  }

  // 2. Verificar que el rol "admin" exista
  const adminRole = await db.select().from(roles).where(eq(roles.key, "admin")).get();
  if (!adminRole) {
    console.error("El rol 'admin' no existe. Ejecuta primero: tsx scripts/seed-rbac.ts");
    process.exit(1);
  }

  // 3. Vincular usuario al rol admin (idempotente)
  const existingLink = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, dbUser.id), eq(userRoles.roleId, adminRole.id)))
    .get();

  if (!existingLink) {
    await db.insert(userRoles).values({ userId: dbUser.id, roleId: adminRole.id });
    console.log(`Usuario ${TARGET_EMAIL} vinculado al rol admin`);
  } else {
    console.log(`Usuario ${TARGET_EMAIL} ya estaba vinculado al rol admin`);
  }

  console.log("\nListo. Ahora puedes iniciar sesión con Google.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
