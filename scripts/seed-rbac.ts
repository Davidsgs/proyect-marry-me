import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, and } from "drizzle-orm";

const systemRoles = [
  { key: "admin", label: "Administrador", isSystem: true },
  { key: "main_guest", label: "Invitado Principal (Delegado)", isSystem: true },
  { key: "guest", label: "Invitado", isSystem: true },
];

const systemPermissions = [
  { key: "users.read", label: "Leer Usuarios", section: "users" },
  { key: "users.write", label: "Escribir/Modificar Usuarios", section: "users" },
  { key: "families.read", label: "Leer Familias", section: "families" },
  { key: "families.write", label: "Escribir/Modificar Familias", section: "families" },
  { key: "calendar.read", label: "Leer Calendario", section: "calendar" },
  { key: "calendar.write", label: "Escribir/Modificar Calendario", section: "calendar" },
  { key: "tasks.read", label: "Leer Tareas", section: "tasks" },
  { key: "tasks.write", label: "Escribir/Modificar Tareas", section: "tasks" },
  { key: "whiteboard.read", label: "Leer Pizarra", section: "whiteboard" },
  { key: "whiteboard.write", label: "Escribir/Modificar Pizarra", section: "whiteboard" },
  { key: "rsvp.confirm_own_family", label: "Confirmar RSVP de Familia Propia", section: "rsvp" },
  { key: "rsvp.view_own_family", label: "Ver RSVP de Familia Propia", section: "rsvp" },
  { key: "admin.dashboard", label: "Acceder al Panel Admin", section: "admin" },
  { key: "settings.write", label: "Modificar Ajustes del Evento", section: "settings" },
];

async function main() {
  console.log("Iniciando sembrado del sistema RBAC...");

  // Import dynamically to ensure dotenv is loaded first
  const { db } = await import("../src/db");
  const { roles, permissions, rolePermissions, userRoles, users, eventConfig } = await import("../src/db/schema");

  // 1. Insertar roles del sistema
  for (const role of systemRoles) {
    const existing = await db.select().from(roles).where(eq(roles.key, role.key)).get();
    if (!existing) {
      await db.insert(roles).values(role);
      console.log(`Rol creado: ${role.key}`);
    } else {
      console.log(`Rol existente: ${role.key}`);
    }
  }

  // 2. Insertar permisos
  for (const perm of systemPermissions) {
    const existing = await db.select().from(permissions).where(eq(permissions.key, perm.key)).get();
    if (!existing) {
      await db.insert(permissions).values(perm);
      console.log(`Permiso creado: ${perm.key}`);
    } else {
      console.log(`Permiso existente: ${perm.key}`);
    }
  }

  // Obtener todos los roles y permisos de la base de datos para mapear IDs
  const allRoles = await db.select().from(roles).all();
  const allPerms = await db.select().from(permissions).all();

  const roleMap = new Map(allRoles.map((r) => [r.key, r.id]));
  const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

  // 3. Definir asignaciones de permisos a roles
  const rolePermAssignments = [
    {
      roleKey: "admin",
      perms: systemPermissions.map((p) => p.key),
    },
    {
      roleKey: "main_guest",
      perms: ["rsvp.confirm_own_family", "rsvp.view_own_family"],
    },
    {
      roleKey: "guest",
      perms: ["rsvp.view_own_family"],
    },
  ];

  // Vincular permisos a roles
  for (const assignment of rolePermAssignments) {
    const roleId = roleMap.get(assignment.roleKey);
    if (!roleId) continue;

    for (const permKey of assignment.perms) {
      const permId = permMap.get(permKey);
      if (!permId) continue;

      const existing = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permId)
          )
        )
        .get();

      if (!existing) {
        await db.insert(rolePermissions).values({ roleId, permissionId: permId });
        console.log(`Permiso ${permKey} asignado a rol ${assignment.roleKey}`);
      }
    }
  }

  // 4. Vincular usuarios existentes a sus nuevos roles basados en users.role
  const allUsers = await db.select().from(users).all();
  for (const user of allUsers) {
    let roleKey = "guest";
    if (user.role === "ADMIN") {
      roleKey = "admin";
    } else if (user.role === "MAIN_GUEST") {
      roleKey = "main_guest";
    }

    const roleId = roleMap.get(roleKey);
    if (!roleId) continue;

    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, user.id), eq(userRoles.roleId, roleId)))
      .get();

    if (!existing) {
      await db.insert(userRoles).values({ userId: user.id, roleId });
      console.log(`Usuario ${user.email} vinculado al rol ${roleKey}`);
    }
  }

  // 5. Insertar fecha límite inicial de RSVP en event_config
  const existingDeadline = await db.select().from(eventConfig).where(eq(eventConfig.key, "rsvp_deadline")).get();
  if (!existingDeadline) {
    await db.insert(eventConfig).values({
      key: "rsvp_deadline",
      value: "2027-03-01T23:59:00",
    });
    console.log("Fecha límite de RSVP inicial sembrada: 2027-03-01T23:59:00");
  } else {
    console.log("Fecha límite de RSVP ya existe.");
  }

  console.log("Sembrado del sistema RBAC completado de forma idempotente.");
}

main().catch((err) => {
  console.error("Error durante el sembrado RBAC:", err);
  process.exit(1);
});
