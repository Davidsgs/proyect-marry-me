# Plan de Desarrollo — Wedding Site (Marry Me)

> Documento pensado para ir alimentando a un agente Gemini Flash (Medium) chunk a chunk.
> Cada chunk es independiente, atómico y tiene un prompt copiable al final.
> **Orden recomendado**: respetar la numeración. Hay dependencias entre fases.

---

## 0. Contexto del proyecto (no asumir, leer antes de cada chunk)

**Stack actual**:
- Next.js 16.1.6 (App Router) + React 19
- TypeScript 5
- Tailwind v4 (con tokens custom: `wedding-sage`, `wedding-blush`, `primary`, `surface`, etc.)
- next-auth v5 beta — único provider: Google
- Drizzle ORM 0.45 + `@libsql/client` (Turso/SQLite)
- lucide-react para iconos

**DB actual** ([src/db/schema.ts](src/db/schema.ts)):
- `families`: id, name, globalRsvpStatus(PENDING/CONFIRMED/DECLINED), timestamps
- `users`: id, email(unique), name, lastName, fullname, familyId(FK), role(ADMIN/MAIN_GUEST/GUEST), isConfirmed, timestamps

**Auth y permisos actuales** ([src/auth.ts](src/auth.ts), [src/middleware.ts](src/middleware.ts)):
- Login con Google; signIn rechaza emails que no existan en tabla `users`.
- Session expone `user.role` y `user.familyId`.
- Middleware redirige por rol: ADMIN → `/admin`, resto → `/dashboard`.

**Rutas actuales**:
- `/` — Landing pública ([src/app/page.tsx](src/app/page.tsx))
- `/login` — Login con Google
- `/dashboard` — Vista invitado (RsvpForm o ReadOnlyRsvp según rol)
- `/admin` — Home admin (parcialmente mockeado: "Budget Overview" y "Próximos Pasos" son hardcoded)
- `/admin/guests` — CRUD de familias y usuarios

**Server actions existentes**:
- [src/app/actions/admin.ts](src/app/actions/admin.ts): `createFamily`, `getFamilies`, `deleteFamily`, `createUser`, `getUsers`, `deleteUser`
- [src/app/actions/rsvp.ts](src/app/actions/rsvp.ts): `updateFamilyRsvp(familyId, status, userUpdates)`

**Decisiones tomadas (por el usuario, en esta conversación)**:
1. **Permisos**: RBAC completo con tablas `roles`, `permissions`, `role_permissions`, `user_roles`.
2. **Lock RSVP**: editable hasta una fecha límite configurable por admin (`rsvp_deadline`).
3. **Detalle de prompts**: alto (archivos exactos, criterios de aceptación, qué no tocar).
4. **Formato**: este archivo, `PLAN.md`.

---

## Convenciones del plan

- **Cada chunk** tiene: Objetivo, Dependencias, Archivos a crear/modificar, Schema DB, Criterios de aceptación, Qué NO tocar, Verificación manual, Prompt para Gemini.
- Si Gemini necesita crear una migración: usar `npx drizzle-kit generate` y luego `npx drizzle-kit push`.
- Mantener el estilo visual (clases Tailwind con tokens `wedding-*` para zona pública y `primary`/`surface-container-*` para `/admin`).
- Nunca usar `any`. Tipar con `typeof tabla.$inferSelect`.
- Server actions siempre con `"use server"` arriba y `revalidatePath` al final.

---

# FASE 1 — Fundaciones (RBAC + deadline)

## Chunk 1 · Migrar a RBAC completo (schema + seed)

**Objetivo**: reemplazar el enum hardcoded `role` por un sistema de roles + permisos en DB. Mantener compatibilidad con código existente vía una columna derivada o seed que reproduzca los 3 roles actuales.

**Dependencias**: ninguna.

**Schema DB nuevo** (agregar a [src/db/schema.ts](src/db/schema.ts), no borrar el campo `role` todavía — lo deprecaremos en chunk 2):

```ts
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),        // ej: "admin", "main_guest", "guest", "wedding_planner"
  label: text("label").notNull(),             // ej: "Administrador"
  isSystem: integer("is_system", { mode: 'boolean' }).default(false).notNull(), // no borrable
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),        // ej: "calendar.read", "tasks.write", "rsvp.confirm_own_family"
  label: text("label").notNull(),
  section: text("section").notNull(),         // ej: "calendar", "tasks", "whiteboard", "rsvp", "users"
});

export const rolePermissions = sqliteTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) }));

export const userRoles = sqliteTable("user_roles", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }) }));
```

Importar `primaryKey` desde `"drizzle-orm/sqlite-core"`.

**Seed inicial** (crear `scripts/seed-rbac.ts`):
- Roles del sistema: `admin`, `main_guest`, `guest` con `isSystem=true`.
- Permisos mínimos (sección entre paréntesis):
  - `users.read`, `users.write` (users)
  - `families.read`, `families.write` (families)
  - `calendar.read`, `calendar.write` (calendar)
  - `tasks.read`, `tasks.write` (tasks)
  - `whiteboard.read`, `whiteboard.write` (whiteboard)
  - `rsvp.confirm_own_family` (rsvp)
  - `rsvp.view_own_family` (rsvp)
  - `admin.dashboard` (admin)
  - `settings.write` (settings)
- Asignaciones:
  - `admin` → TODOS los permisos
  - `main_guest` → `rsvp.confirm_own_family`, `rsvp.view_own_family`
  - `guest` → `rsvp.view_own_family`
- Para cada usuario existente con `role='ADMIN'` insertar `userRoles(user.id, role.admin.id)`. Idem para los otros dos.

**Archivos a crear/modificar**:
- Modificar [src/db/schema.ts](src/db/schema.ts) — agregar las 4 tablas.
- Crear `scripts/seed-rbac.ts` — script ejecutable con `tsx` o `node --import=tsx/esm`.
- Crear migración con `npx drizzle-kit generate` (verificar que `drizzle.config.ts` exista; si no, crearlo apuntando a `src/db/schema.ts` y al url de Turso).

**Criterios de aceptación**:
- `npx drizzle-kit push` ejecuta sin errores contra la DB local/Turso.
- Ejecutar `npx tsx scripts/seed-rbac.ts` puebla las 4 tablas sin duplicados (usar `INSERT OR IGNORE` o check previo).
- Re-ejecutar el seed es idempotente (no duplica filas).
- Los 3 usuarios existentes (si hay alguno admin de prueba) quedan vinculados al rol correspondiente vía `user_roles`.

**Qué NO tocar en este chunk**:
- NO borrar la columna `users.role` (la usaremos en chunk 2 para el fallback durante la transición).
- NO modificar `src/auth.ts` ni el middleware todavía.
- NO tocar la UI.

**Verificación manual**:
```bash
npx drizzle-kit push
npx tsx scripts/seed-rbac.ts
# Inspeccionar via libsql studio o sqlite3 que existan las 4 tablas con datos esperados.
```

**Prompt para Gemini**:
```
Vas a agregar un sistema RBAC al proyecto. Lee primero src/db/schema.ts, drizzle.config.ts (si existe), src/db/index.ts y src/auth.ts para entender el setup actual.

Tarea: agregar 4 tablas (roles, permissions, role_permissions, user_roles) al schema Drizzle y crear un script de seed idempotente.

1. Modifica src/db/schema.ts añadiendo las tablas según el bloque "Schema DB nuevo" del PLAN.md. Importa primaryKey desde drizzle-orm/sqlite-core. NO borres la columna `role` de users.

2. Si no existe drizzle.config.ts en la raíz, créalo con:
   - schema: "./src/db/schema.ts"
   - out: "./drizzle"
   - dialect: "sqlite"
   - driver: "turso"
   - dbCredentials leyendo TURSO_DATABASE_URL y TURSO_AUTH_TOKEN de process.env (usar dotenv).

3. Crea scripts/seed-rbac.ts que:
   - cargue dotenv
   - importe db desde src/db
   - inserte los 3 roles del sistema (admin, main_guest, guest) con isSystem=true, usando ON CONFLICT DO NOTHING (libsql soporta esto vía SQL crudo si Drizzle no expone helper)
   - inserte los permisos listados en el PLAN.md
   - vincule cada rol a sus permisos
   - vincule users existentes a su rol correspondiente leyendo users.role

4. Ejecuta `npx drizzle-kit push` y luego `npx tsx scripts/seed-rbac.ts` para verificar.

NO modifiques src/auth.ts, src/middleware.ts ni nada de UI en este chunk.
Reporta al final qué archivos creaste/modificaste y el resultado de los comandos.
```

---

## Chunk 2 · Helper `hasPermission` + integrar en session/middleware

**Objetivo**: exponer permisos en la sesión y crear un helper server-side `hasPermission(session, key)`. Refactorizar el middleware y los gates de UI para usarlo en lugar del enum `role`.

**Dependencias**: Chunk 1.

**Archivos a crear/modificar**:
- Crear `src/lib/permissions.ts` con:
  - `getUserPermissions(userId: number): Promise<string[]>` — join entre `userRoles`, `roles`, `rolePermissions`, `permissions`.
  - `hasPermission(perms: string[] | undefined, key: string): boolean`.
- Modificar [src/auth.ts](src/auth.ts):
  - En el callback `jwt`, además de `role` y `familyId`, fetch `permissions: string[]` y guardarlas en `token.permissions`.
  - En el callback `session`, exponer `session.user.permissions`.
  - Actualizar la `interface Session` declarada al inicio para incluir `permissions: string[]`.
- Modificar [src/middleware.ts](src/middleware.ts):
  - El gate de `/admin` debe basarse en `permissions.includes('admin.dashboard')` en lugar de `role === 'ADMIN'`.
  - Mantener el redirect de `/dashboard` cuando es admin (es preferencia UX, no es seguridad).
- Modificar [src/app/admin/layout.tsx](src/app/admin/layout.tsx):
  - Cambiar el check `session?.user?.role !== "ADMIN"` por uso de `hasPermission(session?.user?.permissions, 'admin.dashboard')`.
- Modificar [src/app/actions/admin.ts](src/app/actions/admin.ts):
  - Cada server action debe verificar el permiso correspondiente (`users.write`, `families.write`). Si no lo tiene, `throw new Error("Sin permisos")`.

**Criterios de aceptación**:
- Un usuario con rol admin sigue accediendo a `/admin` sin cambios visibles.
- Si se quita el permiso `admin.dashboard` del rol admin (manualmente en DB), el usuario es redirigido fuera de `/admin`.
- TypeScript compila (`npx tsc --noEmit`).
- El campo `session.user.role` se MANTIENE para compatibilidad temporal, pero ya no se usa para gates.

**Qué NO tocar**:
- NO borrar `users.role` aún.
- NO tocar el RsvpForm/ReadOnlyRsvp (eso es chunk 5).

**Verificación manual**:
- Login con cuenta admin → debe entrar a `/admin`.
- En DB: borrar la fila `role_permissions` correspondiente a `admin.dashboard` para el rol admin → re-login → debe redirigir.

**Prompt para Gemini**:
```
Vas a integrar el RBAC del chunk anterior en la sesión y el middleware.

Lee primero: src/auth.ts, src/middleware.ts, src/app/admin/layout.tsx, src/app/actions/admin.ts, y el schema actualizado en src/db/schema.ts.

Tarea:

1. Crea src/lib/permissions.ts con:
   - `export async function getUserPermissions(userId: number): Promise<string[]>` que devuelve los keys de permisos del usuario haciendo join entre userRoles, roles, rolePermissions, permissions usando Drizzle. Devuelve un array de strings deduplicado.
   - `export function hasPermission(perms: string[] | undefined, key: string): boolean`.

2. Modifica src/auth.ts:
   - Extiende la `interface Session` declarada con `next-auth` para incluir `permissions: string[]`.
   - En el callback `jwt`, además de role y familyId, llama a getUserPermissions(dbUser.id) y guarda el resultado en token.permissions.
   - En el callback `session`, expone `session.user.permissions = token.permissions as string[]`.

3. Modifica src/middleware.ts:
   - Reemplaza el check `role === 'ADMIN'` (para `/admin`) por una verificación basada en `req.auth?.user?.permissions?.includes('admin.dashboard')`.
   - Mantén el resto del comportamiento de redirects.

4. Modifica src/app/admin/layout.tsx:
   - Cambia el check `session?.user?.role !== "ADMIN"` por `!hasPermission(session?.user?.permissions, 'admin.dashboard')`.

5. Modifica src/app/actions/admin.ts:
   - Al inicio de cada server action (createFamily, deleteFamily, createUser, deleteUser) llama `await auth()` y verifica el permiso requerido (`families.write` para los de family, `users.write` para los de user). Si no lo tiene, lanza `throw new Error("Sin permisos")`. Las funciones get* (lectura) requieren los permisos `.read` correspondientes.

NO borres la columna users.role.
NO modifiques src/app/dashboard ni src/app/actions/rsvp.ts en este chunk.
Verifica con `npx tsc --noEmit` que compile.
```

---

## Chunk 3 · Tabla `event_config` + UI de Ajustes con `rsvpDeadline`

**Objetivo**: persistir configuración global del evento, en particular la fecha límite para confirmar asistencia.

**Dependencias**: Chunk 2.

**Schema DB**:
```ts
export const eventConfig = sqliteTable("event_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),    // ej: "rsvp_deadline", "event_date", "event_location"
  value: text("value"),                   // siempre string; el caller parsea (ISO date para fechas)
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});
```

**Archivos a crear/modificar**:
- Modificar [src/db/schema.ts](src/db/schema.ts) — agregar `eventConfig`.
- Generar y aplicar migración.
- Crear `src/app/actions/config.ts` con:
  - `getConfig(key: string): Promise<string | null>`
  - `setConfig(key: string, value: string): Promise<void>` (requiere permiso `settings.write`)
  - `getRsvpDeadline(): Promise<Date | null>` — wrapper que parsea ISO.
- Crear `src/app/admin/settings/page.tsx` — form simple con un único campo "Fecha límite de confirmación" (input `datetime-local`).
- Agregar entrada "Ajustes" al sidebar admin en [src/app/admin/_components/AdminSidebar.tsx](src/app/admin/_components/AdminSidebar.tsx) e [src/app/admin/_components/AdminMobileNav.tsx](src/app/admin/_components/AdminMobileNav.tsx) (gated por permiso `settings.write`).
- Sembrar `event_config('rsvp_deadline', '2027-03-01T23:59:00')` en `scripts/seed-rbac.ts` (o un seed separado), usando ON CONFLICT DO NOTHING.

**Criterios de aceptación**:
- En `/admin/settings` el admin puede ver y modificar la fecha límite.
- El valor se persiste en DB.
- Llamar `getRsvpDeadline()` desde cualquier server action devuelve un `Date` válido.
- Un usuario sin `settings.write` que intenta navegar a `/admin/settings` debe ver un 403/redirect.

**Qué NO tocar**:
- NO conectar todavía el deadline al flujo de RSVP (eso es chunk 7).
- NO refactorizar el dashboard admin home.

**Prompt para Gemini**:
```
Vas a agregar configuración global del evento.

Lee: src/db/schema.ts, src/app/admin/layout.tsx, src/app/admin/_components/AdminSidebar.tsx, src/app/admin/_components/AdminMobileNav.tsx, src/lib/permissions.ts.

Tarea:

1. En src/db/schema.ts añade la tabla `eventConfig` según el PLAN.md (campos id, key unique, value, updatedAt).

2. Ejecuta `npx drizzle-kit push`.

3. Crea src/app/actions/config.ts (con "use server" arriba):
   - `getConfig(key)`: lee de DB, devuelve value o null.
   - `setConfig(key, value)`: requiere permiso settings.write (verifica con hasPermission tras await auth()). Hace UPSERT.
   - `getRsvpDeadline(): Promise<Date | null>`: lee 'rsvp_deadline' y parsea.

4. Crea src/app/admin/settings/page.tsx:
   - Server component con `export const dynamic = 'force-dynamic'`.
   - Verifica permiso settings.write o redirect("/admin").
   - Renderiza un form con input datetime-local pre-cargado con el valor actual.
   - El form usa server action setConfig.
   - Mantén el estilo visual del admin (clases primary/surface-container-lowest).

5. Agrega un link "Ajustes" en AdminSidebar y AdminMobileNav apuntando a `/admin/settings`. El link debe renderizarse condicionalmente: solo si la sesión tiene `settings.write`. Para eso, pásale las permissions como prop desde el layout o usa un wrapper client component que reciba `canEditSettings: boolean`.

6. Actualiza scripts/seed-rbac.ts para insertar fila inicial de event_config con key='rsvp_deadline' y value='2027-03-01T23:59:00' usando ON CONFLICT DO NOTHING.

Verifica con `npx tsc --noEmit`.
```

---

# FASE 2 — Flujo de confirmación de invitados

## Chunk 4 · Botón "Confirmar asistencia" en la landing

**Objetivo**: añadir CTA en `/` que lleve a `/login` (o directamente a `/dashboard` si ya está autenticado).

**Dependencias**: ninguna (independiente, se puede hacer en paralelo a chunks 1-3).

**Archivos a modificar**:
- [src/app/page.tsx](src/app/page.tsx):
  - Importar `auth` desde `@/auth` y convertir el componente en async server component.
  - Detectar si hay sesión: si sí → CTA dice "Ver tu invitación" y apunta a `/dashboard` (o `/admin` si tiene `admin.dashboard`).
  - Si no → "Confirmar asistencia" y apunta a `/login?callbackUrl=/dashboard`.
  - El botón va debajo del párrafo "Pronto vas a poder confirmar..." (reemplazar ese párrafo, ya no aplica).

**Diseño**:
- Botón grande, con clase `wedding-blush` o `wedding-olive` para destacar.
- Usar `<Link>` de next/link.
- Estilo coherente con el resto del hero (font serif, drop-shadow).

**Criterios de aceptación**:
- Usuario no autenticado: ve botón "Confirmar asistencia" → click → `/login`.
- Usuario autenticado (no admin): ve "Ver tu invitación" → click → `/dashboard`.
- Usuario admin: ve "Ir al panel" → `/admin`.

**Qué NO tocar**:
- NO modificar el countdown ni el copy principal.
- NO tocar `/login`.

**Prompt para Gemini**:
```
Vas a agregar un botón CTA "Confirmar asistencia" en la landing.

Lee: src/app/page.tsx, src/auth.ts.

Tarea:

1. Convierte el componente `Home` de src/app/page.tsx en async server component.
2. Al inicio del componente llama `const session = await auth()`.
3. Reemplaza el bloque final (el div con texto "Pronto vas a poder confirmar tu asistencia, y tener más novedades.") por un botón:
   - Si !session: <Link href="/login?callbackUrl=/dashboard"> con texto "Confirmar asistencia".
   - Si session.user?.permissions?.includes('admin.dashboard'): <Link href="/admin"> con texto "Ir al panel".
   - En otro caso: <Link href="/dashboard"> con texto "Ver tu invitación".
4. Estilo: clases tailwind que armonicen con el hero. Sugerencia:
   `inline-flex items-center gap-3 px-10 py-4 rounded-full bg-wedding-blush-light text-wedding-sage-darkest font-serif tracking-widest uppercase text-sm shadow-lg hover:bg-wedding-blush transition-all`
5. Coloca el botón en el lugar del párrafo eliminado (mismo `mt-16 md:mt-24`).
6. Mantén el resto del JSX (countdown, fecha, ubicación) intacto.

Verifica con `npx tsc --noEmit` y `npm run dev` que la página carga.
```

---

## Chunk 5 · Mensaje "tu delegado es X" para invitados no-delegados

**Objetivo**: cuando un GUEST (no delegado) entra a `/dashboard`, en lugar del genérico "Otra persona de tu familia es responsable...", mostrar **nombre y email del delegado de su familia**.

**Dependencias**: Chunk 1 (para identificar al delegado vía RBAC) o usar el campo `role='MAIN_GUEST'` existente como puente.

**Decisión de modelado**: agregar columna explícita `families.delegateUserId` (FK a users) para no depender del role.

**Schema DB**:
```ts
// en families:
delegateUserId: integer("delegate_user_id").references(() => users.id, { onDelete: 'set null' }),
```

**Archivos a modificar**:
- [src/db/schema.ts](src/db/schema.ts) — agregar columna.
- Migración: `drizzle-kit push`.
- Backfill: en `scripts/seed-rbac.ts` (o nuevo script) — por cada family sin delegateUserId, setearlo al primer user de esa family con `role='MAIN_GUEST'`.
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx):
  - Cargar el delegado: `const delegate = family.delegateUserId ? await db.select... : null`.
  - Pasarlo como prop a `ReadOnlyRsvp`.
  - Cambiar el check `isMainGuest`: ahora es `session.user.id === family.delegateUserId || hasPermission(perms, 'admin.dashboard')`.
    - Esto requiere exponer `user.id` en la sesión: agregar `id` al token JWT en src/auth.ts.
- [src/app/dashboard/_components/ReadOnlyRsvp.tsx](src/app/dashboard/_components/ReadOnlyRsvp.tsx):
  - Recibir nueva prop `delegate: { name: string; email: string; lastName: string } | null`.
  - Renderizar un bloque destacado: "Para confirmar tu asistencia, **{delegate.name} {delegate.lastName}** ({delegate.email}) debe ingresar y hacerlo por todo el grupo."

**Criterios de aceptación**:
- Un user con `role='GUEST'` cuya familia tiene `delegateUserId` distinto a su id, ve nombre + email del delegado.
- El delegado ve `RsvpForm` (no `ReadOnlyRsvp`).
- Si `delegateUserId` es null, mensaje genérico actual.

**Qué NO tocar**:
- NO borrar la columna `users.role` todavía.
- NO modificar `RsvpForm`.

**Prompt para Gemini**:
```
Vas a personalizar el mensaje que ve un invitado cuando no es el delegado de su grupo.

Lee: src/db/schema.ts, src/auth.ts, src/app/dashboard/page.tsx, src/app/dashboard/_components/ReadOnlyRsvp.tsx, src/app/dashboard/_components/RsvpForm.tsx.

Tarea:

1. Añade en src/db/schema.ts a la tabla families la columna `delegateUserId: integer("delegate_user_id").references(() => users.id, { onDelete: 'set null' })`.

2. Ejecuta `npx drizzle-kit push`.

3. Crea scripts/backfill-delegates.ts que:
   - lee todas las families con delegateUserId null
   - por cada una busca el primer user con role='MAIN_GUEST' de esa familia
   - actualiza family.delegateUserId con el id encontrado
   - imprime cuántas actualizó

4. En src/auth.ts, agrega `id: number` al user de la Session interface. En el jwt callback guarda token.uid = dbUser.id. En el session callback expone session.user.id = token.uid.

5. Modifica src/app/dashboard/page.tsx:
   - Tras cargar family, si family.delegateUserId, carga `const delegate = await db.select({ name: users.name, lastName: users.lastName, email: users.email }).from(users).where(eq(users.id, family.delegateUserId)).get()`.
   - Cambia `const isMainGuest = ...` por `const isDelegate = session.user?.id === family.delegateUserId || session.user?.permissions?.includes('admin.dashboard')`.
   - Pasa `delegate` como prop a ReadOnlyRsvp.

6. Modifica src/app/dashboard/_components/ReadOnlyRsvp.tsx:
   - Acepta prop opcional `delegate: { name: string; lastName: string; email: string } | null`.
   - Al inicio del JSX, si delegate existe, renderiza un bloque destacado (clase bg-wedding-cream/40 border border-wedding-blush/20 rounded-xl p-6 text-center): "Para confirmar tu asistencia, <strong>{delegate.name} {delegate.lastName}</strong> debe ingresar con el correo <strong>{delegate.email}</strong> y hacerlo por todo el grupo."
   - Si delegate es null, mantén el mensaje genérico actual.

Verifica con `npx tsc --noEmit`.
```

---

## Chunk 6 · Pantalla post-confirmación + lock con deadline

**Objetivo**:
1. Tras enviar el RSVP, mostrar una pantalla de confirmación clara ("¡Gracias! Has sido notificado/a...").
2. Si el `globalRsvpStatus` ya no es `PENDING` y la fecha actual supera `rsvp_deadline`, el form queda 100% bloqueado (read-only).
3. Si está dentro del deadline, el delegado puede re-editar.

**Dependencias**: Chunk 3 (deadline) + Chunk 5 (delegateUserId).

**Archivos a modificar**:
- [src/app/dashboard/_components/RsvpForm.tsx](src/app/dashboard/_components/RsvpForm.tsx):
  - Aceptar prop `isLocked: boolean` y `deadline: Date | null`.
  - Si `isLocked` → renderizar el componente nuevo `RsvpSubmittedView` en lugar del form.
  - Mostrar el deadline visible: "Podés modificar tu respuesta hasta el DD/MM/YYYY HH:mm."
  - Tras submit exitoso (success=true), llamar `router.refresh()` para que el server re-evalúe `isLocked` (no hacer redirect, evita pérdida de estado).
- Crear `src/app/dashboard/_components/RsvpSubmittedView.tsx`:
  - Recibe `family`, `members`, `status`, `deadline`, `isLockedHard` (true si pasó deadline).
  - Header grande: "¡Gracias por confirmar!" con un check verde si CONFIRMED, o "Lamentamos que no puedas asistir" con icon si DECLINED.
  - Lista de miembros griseados (mismo render que ReadOnlyRsvp pero estilo más cerrado).
  - Botón "Modificar mi respuesta" si `!isLockedHard` (vuelve al form vía un toggle state).
  - Si `isLockedHard`, sin botón y mensaje "El plazo para modificar la respuesta ha vencido".
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx):
  - Importar `getRsvpDeadline` del chunk 3.
  - Calcular `isLockedHard = deadline && new Date() > deadline && family.globalRsvpStatus !== 'PENDING'`.
  - Pasar `isLocked = family.globalRsvpStatus !== 'PENDING'`, `deadline`, `isLockedHard` al `RsvpForm` (el form decide qué mostrar).
- [src/app/actions/rsvp.ts](src/app/actions/rsvp.ts):
  - Al inicio de `updateFamilyRsvp`, después de validar permisos: cargar deadline; si `new Date() > deadline` y el `globalRsvpStatus` actual de la DB no es PENDING → `throw new Error("El plazo para modificar la respuesta ha vencido")`.

**Criterios de aceptación**:
- Tras enviar el form por primera vez, sin recargar: aparece la pantalla "Has sido notificado/a" con miembros griseados.
- Refresh manual: sigue mostrando la pantalla post-confirmación, no el form.
- Click en "Modificar mi respuesta" (si deadline no vencido): vuelve al form.
- Si el deadline pasó y ya hay confirmación: el form NO se puede abrir y el server action rechaza el update.
- Si `status === 'PENDING'` (todavía nunca confirmó) y deadline pasó: el form sigue abierto (no perder la primera confirmación).

**Qué NO tocar**:
- NO cambiar el schema en este chunk.
- NO tocar `ReadOnlyRsvp` (que sirve a otro caso de uso).

**Prompt para Gemini**:
```
Vas a agregar pantalla post-confirmación y lock con deadline al flujo de RSVP.

Lee: src/app/dashboard/page.tsx, src/app/dashboard/_components/RsvpForm.tsx, src/app/dashboard/_components/ReadOnlyRsvp.tsx, src/app/actions/rsvp.ts, src/app/actions/config.ts.

Tarea:

1. En src/app/dashboard/page.tsx:
   - Importa getRsvpDeadline desde @/app/actions/config.
   - Tras cargar family, calcula:
     ```
     const deadline = await getRsvpDeadline();
     const now = new Date();
     const isPastDeadline = deadline ? now > deadline : false;
     const hasResponded = family.globalRsvpStatus !== 'PENDING';
     const isLocked = hasResponded;            // ya respondió → mostrar pantalla submitted
     const isLockedHard = hasResponded && isPastDeadline;  // no puede re-editar
     ```
   - Pasa estos flags + deadline al RsvpForm (todavía sin tocar ReadOnlyRsvp).

2. Crea src/app/dashboard/_components/RsvpSubmittedView.tsx (client component "use client"):
   - Props: `family`, `members`, `deadline: Date | null`, `isLockedHard: boolean`, `onModify: () => void`.
   - Render:
     - Si family.globalRsvpStatus === 'CONFIRMED': título "¡Gracias por confirmar!" con CheckCircle2 grande verde y bg wedding-olive/10.
     - Si === 'DECLINED': título "Lamentamos que no puedas asistir" con XCircle wedding-blush.
     - Lista de members griseados con su isConfirmed (similar a ReadOnlyRsvp pero con opacity-60).
     - Si !isLockedHard: botón "Modificar mi respuesta" que llama onModify.
     - Si isLockedHard: mensaje "El plazo para modificar la respuesta venció el {format(deadline)}".
   - Para formatear fechas usa `Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(deadline)`.

3. Modifica src/app/dashboard/_components/RsvpForm.tsx:
   - Acepta nuevas props: `isLocked: boolean`, `isLockedHard: boolean`, `deadline: Date | null`.
   - Internamente lleva un `const [editing, setEditing] = useState(!isLocked)`.
   - Si !editing: renderiza <RsvpSubmittedView .../> con onModify={() => setEditing(true)} (solo si !isLockedHard).
   - Si editing: renderiza el form actual, agregando arriba un banner: "Podés modificar tu respuesta hasta el {deadline formateado}".
   - Tras submit exitoso (después de setSuccess(true)), llama `router.refresh()` (importa `useRouter` de next/navigation) y `setEditing(false)`.

4. Modifica src/app/actions/rsvp.ts:
   - Importa getRsvpDeadline.
   - Antes del update, lee el family actual de DB (no confiar en el cliente):
     ```
     const current = await db.select().from(families).where(eq(families.id, familyId)).get();
     const deadline = await getRsvpDeadline();
     if (current && current.globalRsvpStatus !== 'PENDING' && deadline && new Date() > deadline) {
       throw new Error("El plazo para modificar la respuesta ha vencido");
     }
     ```

Verifica `npx tsc --noEmit` y prueba el flujo en `npm run dev`.
```

---

# FASE 3 — Gestión de invitados extendida

## Chunk 7 · Alias de grupo + selección explícita de delegado en admin

**Objetivo**: en `/admin/guests`, permitir al admin (1) ponerle un alias a la familia/grupo y (2) seleccionar explícitamente cuál user es el delegado.

**Dependencias**: Chunk 5 (la columna `delegateUserId` ya existe).

**Schema DB**:
```ts
// agregar a families:
alias: text("alias").default("").notNull(),
```

**Archivos a modificar**:
- [src/db/schema.ts](src/db/schema.ts) — agregar `alias`.
- Migración.
- [src/app/actions/admin.ts](src/app/actions/admin.ts):
  - `createFamily` acepta `alias`.
  - Nueva: `updateFamily(id, { name?, alias?, delegateUserId?, globalRsvpStatus? })`.
- [src/app/admin/_components/FamilyForm.tsx](src/app/admin/_components/FamilyForm.tsx):
  - Agregar input "Alias" (opcional, ej. "Tíos paternos").
- [src/app/admin/_components/FamilyList.tsx](src/app/admin/_components/FamilyList.tsx):
  - Mostrar alias junto al name.
  - Cada family fila tiene un select "Delegado" que lista los usuarios de esa family y permite cambiarlo (llama `updateFamily`).
  - Edición inline del alias también.

**Criterios de aceptación**:
- Admin crea una family con alias "Amigos universidad". Se ve en la lista.
- Admin selecciona un user del select "Delegado" → al cambiarlo, `family.delegateUserId` se actualiza y al recargar el dashboard, ese user es el que ve el RsvpForm.
- Si el rol del user elegido como delegado no es MAIN_GUEST, actualizarlo automáticamente (en `updateFamily`, si se cambia delegateUserId: setear `users.role = 'MAIN_GUEST'` para el nuevo y `'GUEST'` para los demás de la family).

**Qué NO tocar**:
- NO cambiar la UI del dashboard ni la landing.

**Prompt para Gemini**:
```
Vas a agregar alias de grupo y selección de delegado en /admin/guests.

Lee: src/db/schema.ts, src/app/actions/admin.ts, src/app/admin/guests/page.tsx, src/app/admin/_components/FamilyForm.tsx, src/app/admin/_components/FamilyList.tsx, src/app/admin/_components/UserList.tsx.

Tarea:

1. En src/db/schema.ts añade a families la columna `alias: text("alias").default("").notNull()`. Ejecuta `npx drizzle-kit push`.

2. En src/app/actions/admin.ts:
   - Modifica createFamily para aceptar también `alias`.
   - Añade `export async function updateFamily(id: number, data: { name?: string; alias?: string; delegateUserId?: number | null; globalRsvpStatus?: 'PENDING'|'CONFIRMED'|'DECLINED' })`. Verifica permiso families.write.
   - Si data.delegateUserId está definido (no undefined):
     - Hace UPDATE families SET delegateUserId = data.delegateUserId WHERE id = id.
     - Hace UPDATE users SET role = 'GUEST' WHERE familyId = id (todos guest).
     - Si data.delegateUserId !== null: UPDATE users SET role = 'MAIN_GUEST' WHERE id = data.delegateUserId.
   - Llama revalidatePath('/admin') y '/admin/guests'.

3. En src/app/admin/_components/FamilyForm.tsx:
   - Agrega un input "Alias" (opcional) entre Nombre y Estado Global. Pásalo al createFamily.

4. En src/app/admin/_components/FamilyList.tsx:
   - Acepta también la prop `users: typeof users.$inferSelect[]`.
   - Por cada family, además del name muestra el alias en cursiva debajo.
   - Agrega un select "Delegado" que liste los users con familyId === family.id, valor seleccionado = family.delegateUserId, onChange llama a updateFamily(family.id, { delegateUserId: nuevo }) (usa una server action o un wrapper client).
   - Si la family no tiene usuarios, el select muestra "Asigná un invitado primero" deshabilitado.

5. En src/app/admin/guests/page.tsx pásale `users` también a FamilyList.

Verifica con `npx tsc --noEmit` y manualmente: crear una family, agregarle 2 usuarios, cambiar el delegado → loguear con cada uno y confirmar que solo el delegado ve el form.
```

---

# FASE 4 — Nuevas secciones del panel admin

## Chunk 8 · Sección Tareas (Tasks)

**Objetivo**: CRUD de tareas pendientes con estado completed.

**Dependencias**: Chunk 2 (permisos `tasks.read`, `tasks.write`).

**Schema DB**:
```ts
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  dueDate: text("due_date"),                  // ISO date opcional
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false).notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});
```

**Archivos a crear**:
- Migración.
- `src/app/actions/tasks.ts` — `getTasks`, `createTask`, `updateTask`, `toggleTask`, `deleteTask`. Cada uno verifica permisos.
- `src/app/admin/tasks/page.tsx` — server component que lista tasks pendientes arriba (ordenadas por dueDate asc) y completadas abajo (collapsed).
- `src/app/admin/tasks/_components/TaskForm.tsx` — client form.
- `src/app/admin/tasks/_components/TaskItem.tsx` — checkbox + texto + botón delete.
- Link "Tareas" en sidebar admin.

**Criterios de aceptación**:
- Crear tarea con título "Pago al fotógrafo" y dueDate.
- Tildar checkbox la marca completed y la mueve abajo.
- Borrar funciona.
- Sin permiso `tasks.write` el form no se muestra (solo lectura).

**Prompt para Gemini**:
```
Vas a crear una sección de Tareas en el panel admin.

Lee: src/db/schema.ts, src/lib/permissions.ts, src/app/admin/_components/AdminSidebar.tsx, src/app/admin/_components/AdminMobileNav.tsx, src/app/admin/guests/page.tsx (como referencia de estilo).

Tarea:

1. En src/db/schema.ts añade la tabla `tasks` según PLAN.md. Ejecuta drizzle-kit push.

2. Crea src/app/actions/tasks.ts ("use server") con:
   - getTasks(): requiere tasks.read. Devuelve todas las tasks.
   - createTask({ title, description?, dueDate? }): requiere tasks.write. createdBy = session.user.id.
   - updateTask(id, { title?, description?, dueDate? }): requiere tasks.write.
   - toggleTask(id): requiere tasks.write. Invierte isCompleted.
   - deleteTask(id): requiere tasks.write.
   - Todas llaman revalidatePath('/admin/tasks') y '/admin'.

3. Crea src/app/admin/tasks/page.tsx (server, dynamic='force-dynamic'):
   - Verifica tasks.read o redirect.
   - Carga tasks, separa pending/completed.
   - Renderiza TaskForm arriba (solo si tasks.write), luego lista pending, luego sección colapsable con completed.

4. Crea src/app/admin/tasks/_components/TaskForm.tsx (client):
   - Form con inputs title (required), description (textarea opcional), dueDate (date input opcional).
   - Estilo coherente con FamilyForm/UserForm: rounded-xl, bg-surface-container-lowest, etc.

5. Crea src/app/admin/tasks/_components/TaskItem.tsx (client):
   - Checkbox para toggle, título con line-through si completed, dueDate formateado en es-AR, botón trash.

6. Añade link "Tareas" en AdminSidebar y AdminMobileNav con icon ListTodo de lucide-react. Visible solo si permissions incluye tasks.read.

Verifica `npx tsc --noEmit` y prueba flujo completo.
```

---

## Chunk 9 · Sección Calendario (Events)

**Objetivo**: gestionar eventos del calendario (ceremonia, fiesta, prueba de menú, etc.) con vista mensual simple.

**Dependencias**: Chunk 2.

**Schema DB**:
```ts
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  startAt: text("start_at").notNull(),   // ISO datetime
  endAt: text("end_at"),                  // ISO datetime opcional
  location: text("location").default("").notNull(),
  color: text("color").default("#A3A380").notNull(), // hex para el dot del calendario
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});
```

**Archivos**:
- Migración.
- `src/app/actions/events.ts` — CRUD con permisos `calendar.read`/`calendar.write`.
- `src/app/admin/calendar/page.tsx`:
  - Vista mensual: grilla 7×N días. Query string `?month=2026-05`.
  - Sidebar con próximos eventos.
- `src/app/admin/calendar/_components/MonthGrid.tsx` (server) — recibe events del mes y los pinta como dots en cada celda.
- `src/app/admin/calendar/_components/EventForm.tsx` (client) — modal o sección.
- `src/app/admin/calendar/_components/EventList.tsx` (server) — lista próximos.

**Decisión simple**: NO usar libs externas de calendario. Generar la grilla a mano con `Date`.

**Criterios de aceptación**:
- Admin crea evento "Ceremonia" para 03-04-2027 14:00. Aparece como dot en el día 3 de abril 2027.
- Navegación mes anterior/siguiente vía links con `?month=YYYY-MM`.
- Click en un día expande los eventos del día.
- Eventos pasados quedan con opacity reducida.

**Prompt para Gemini**:
```
Vas a crear una sección de Calendario simple en /admin/calendar.

Lee: src/db/schema.ts, src/lib/permissions.ts, src/app/admin/tasks/page.tsx (creada en chunk anterior, sirve como referencia de estructura).

Tarea:

1. Schema: añade la tabla `events` según PLAN.md. drizzle-kit push.

2. src/app/actions/events.ts ("use server"):
   - getEvents(start: Date, end: Date): calendar.read. Devuelve eventos cuyo startAt esté entre start y end (inclusive).
   - createEvent({ title, description?, startAt, endAt?, location?, color? }): calendar.write.
   - updateEvent(id, partial): calendar.write.
   - deleteEvent(id): calendar.write.
   - revalidatePath('/admin/calendar') y '/admin'.

3. src/app/admin/calendar/page.tsx (server, dynamic='force-dynamic'):
   - Lee `searchParams.month` (string YYYY-MM) o usa el mes actual.
   - Calcula `start` (primer día del mes) y `end` (último día).
   - Llama getEvents(start, end).
   - Renderiza:
     - Header con mes actual y botones <Prev y Next> (links con ?month=YYYY-MM ajustado).
     - <MonthGrid month={...} events={events} /> a la izquierda.
     - <EventList events={proximos} /> a la derecha (eventos futuros próximos, máximo 10, ordenados asc).
     - Botón "Nuevo evento" que abre EventForm (puede ser un modal con state client component o una sección debajo).

4. src/app/admin/calendar/_components/MonthGrid.tsx:
   - Server component que recibe `month: Date` y `events: Event[]`.
   - Genera 6 filas × 7 columnas. Días que no son del mes con opacity-30.
   - Cada celda muestra el número del día y hasta 3 dots de eventos (con color del event.color).
   - Si hay más de 3 eventos, "+N más".

5. src/app/admin/calendar/_components/EventForm.tsx (client):
   - Form con inputs title, description, startAt (datetime-local), endAt opcional, location, color (input type=color).
   - Botón submit que llama createEvent.

6. src/app/admin/calendar/_components/EventList.tsx:
   - Lista de eventos próximos con título, fecha formateada es-AR, ubicación. Eventos pasados con opacity-50.
   - Cada item con botón delete (confirm en client).

7. Añade link "Calendario" en AdminSidebar y AdminMobileNav con icon Calendar de lucide-react, visible con calendar.read.

NO uses ninguna librería externa de calendario (date-fns, dayjs, etc). Usá solamente Date nativo + Intl.DateTimeFormat.
Verifica `npx tsc --noEmit`.
```

---

## Chunk 10 · Sección Whiteboard (notas compartidas)

**Objetivo**: pizarra persistida donde todos los admins pueden agregar notas. Modelo simple: lista de notas tipo post-it con autor, contenido, timestamp.

**Dependencias**: Chunk 2.

**Schema DB**:
```ts
export const whiteboardNotes = sqliteTable("whiteboard_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  color: text("color").default("#FFE4B5").notNull(), // pastel
  authorId: integer("author_id").references(() => users.id, { onDelete: 'set null' }),
  position: integer("position").default(0).notNull(),   // orden manual via drag-reorder simple
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).$onUpdate(() => sql`(CURRENT_TIMESTAMP)`).notNull(),
});
```

**Decisión de alcance**: para Gemini Medium, NO implementar drag-and-drop real ni colaboración en tiempo real. Es una grilla de notas, cada una editable inline, con polling cada 30s para refrescar.

**Archivos**:
- Migración.
- `src/app/actions/whiteboard.ts` — `getNotes`, `createNote`, `updateNote`, `deleteNote`.
- `src/app/admin/whiteboard/page.tsx` — server, carga notes, pasa a client.
- `src/app/admin/whiteboard/_components/WhiteboardBoard.tsx` — client, grilla de notas con autorefresh cada 30s.
- `src/app/admin/whiteboard/_components/NoteCard.tsx` — client, textarea editable on click, autosave on blur (debounced 800ms).

**Criterios de aceptación**:
- Admin A crea nota "Llamar al DJ". Admin B (otra sesión) la ve en su próximo refresh.
- Editar inline persiste al blur.
- Cada nota muestra autor + timestamp del último update.
- 6 colores pre-seleccionables al crear.

**Qué NO implementar**:
- NO drag-and-drop.
- NO websockets/realtime (polling es suficiente).

**Prompt para Gemini**:
```
Vas a crear una sección Whiteboard en /admin/whiteboard.

Lee: src/db/schema.ts, src/lib/permissions.ts, server actions ya creadas como referencia (src/app/actions/tasks.ts).

Tarea:

1. Schema: añade `whiteboardNotes` según PLAN.md. drizzle-kit push.

2. src/app/actions/whiteboard.ts ("use server"):
   - getNotes(): whiteboard.read. Join con users para devolver authorName y authorLastName. Ordena por position asc, createdAt asc.
   - createNote({ content?: string; color?: string }): whiteboard.write. authorId = session.user.id. content default "". position = (max position + 1).
   - updateNote(id, { content?, color? }): whiteboard.write. Cualquier admin con permiso puede editar (no solo el autor).
   - deleteNote(id): whiteboard.write.

3. src/app/admin/whiteboard/page.tsx:
   - Server component dynamic='force-dynamic'.
   - Carga notes y las pasa a <WhiteboardBoard initialNotes={notes} />.

4. src/app/admin/whiteboard/_components/WhiteboardBoard.tsx (client "use client"):
   - State con notes (inicial = initialNotes).
   - useEffect con setInterval cada 30000ms que llama a getNotes (server action) y actualiza state SOLO si difiere (compare por updatedAt máx).
   - Botón "+ Nueva nota" con select de color (6 colores pastel hex: #FFE4B5, #FFB5B5, #B5E4FF, #C5FFB5, #E4B5FF, #FFEFB5).
   - Al click → llama createNote → recarga.
   - Grilla CSS grid-cols-2 md:grid-cols-3 lg:grid-cols-4 con cada <NoteCard />.

5. src/app/admin/whiteboard/_components/NoteCard.tsx (client):
   - Recibe note + onUpdate(content) + onDelete + onColorChange.
   - Render: div con bg-color, textarea autoexpand (rows ajustable), abajo "{authorName} • {hace X min}".
   - onChange en textarea → debounce 800ms → onUpdate.
   - Botón X arriba a la derecha → confirm → onDelete.
   - Click en un dot de color (mini paleta) → onColorChange.

6. Añade link "Pizarra" en AdminSidebar y AdminMobileNav con icon StickyNote de lucide-react. Gated por whiteboard.read.

Para "hace X min" implementá un mini helper en src/lib/relativeTime.ts que recibe ISO string y devuelve "hace 2 min", "hace 1 h", etc. Sin librerías.
Verifica `npx tsc --noEmit`.
```

---

## Chunk 11 · Dashboard admin (home) con datos reales

**Objetivo**: reemplazar los cards mockeados de `/admin` ("Budget Overview", "Próximos Pasos" hardcoded) por datos reales: próximas tareas (de Chunk 8), próximos eventos (de Chunk 9), confirmaciones recientes (ya real).

**Dependencias**: Chunks 8, 9.

**Archivos a modificar**:
- [src/app/admin/page.tsx](src/app/admin/page.tsx):
  - Quitar card "Budget Overview" (no aplica al alcance del proyecto).
  - Reemplazar card "Próximos Pasos" hardcoded por una lista de las 3 próximas tareas pending (de `getTasks`) ordenadas por dueDate.
  - Agregar nueva card "Próximo evento" arriba con el siguiente event del calendario.
  - "Confirmaciones Recientes" ya es real, mantenerla.
  - Si tasks o events están vacíos, mostrar empty state amigable con CTA a la sección.

**Criterios de aceptación**:
- Sin tareas: card "Próximos Pasos" dice "No hay tareas pendientes" + link "Crear tarea".
- Con 5 tareas: card muestra las 3 con menor dueDate, ordenadas asc.
- Card "Próximo evento" muestra el primer event futuro o "Sin eventos próximos".

**Qué NO tocar**:
- NO modificar las stats reales (`totalUsers`, `confirmationProgress`, `recentConfirmed`).
- NO cambiar el estilo (cards, gradientes, fonts).

**Prompt para Gemini**:
```
Vas a conectar el dashboard /admin con datos reales de tareas y eventos.

Lee: src/app/admin/page.tsx, src/app/actions/tasks.ts (chunk 8), src/app/actions/events.ts (chunk 9).

Tarea:

1. En src/app/admin/page.tsx:
   - Importa getTasks y getEvents.
   - Carga `const allTasks = await getTasks()` y filtra `pendingTasks = allTasks.filter(t => !t.isCompleted).slice(0, 3)` ordenadas por dueDate asc (poner las que no tienen dueDate al final).
   - Carga `const upcomingEvents = await getEvents(new Date(), new Date(Date.now() + 365*24*60*60*1000))` y toma el primero.
   - Quita la card "Budget Overview" completa.
   - En su lugar, dentro de la "Stats Row", añade una card "Próximo Evento" con el upcomingEvents[0]?.title + fecha formateada, o "Sin eventos próximos".
   - En la columna "Próximos Pasos", reemplaza los 3 divs hardcoded por un map sobre pendingTasks. Cada uno con title, description, dueDate formateado con Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).
   - Si pendingTasks.length === 0: renderiza un solo div con "No hay tareas pendientes" + <Link href="/admin/tasks">Crear tarea</Link>.

2. Mantén el estilo Tailwind existente (clases primary, surface-container-lowest, font-serif, etc.). NO cambies clases ni layout.

3. El mensaje del header "Bienvenida de nuevo, Sarah" cámbialo a "Bienvenido, {session.user.name?.split(' ')[0]}". Para eso necesitarás llamar `auth()` al inicio del componente.

Verifica `npx tsc --noEmit`.
```

---

# FASE 5 — Limpieza opcional (después de estabilizar)

## Chunk 12 · (Opcional) Deprecar columna `users.role`

**Objetivo**: ahora que todo va por RBAC, eliminar la columna `role` redundante. Solo hacer si ya estás 100% seguro de que ningún código la usa.

**Tarea**: grep `users.role` y `role:` en todo el código; reemplazar cualquier uso restante por `hasPermission`. Cuando no quede ninguno: borrar la columna del schema, hacer migración, y limpiar `src/auth.ts` (`token.role`).

**Prompt para Gemini**: posponer este chunk hasta haber probado las fases 1-4 en uso real.

---

# Apéndice A — Comandos útiles

```bash
# Aplicar migraciones (rapid prototyping, sin generar archivos)
npx drizzle-kit push

# Generar migración versionada
npx drizzle-kit generate

# Inspeccionar DB
npx drizzle-kit studio

# Ejecutar scripts ad-hoc
npx tsx scripts/seed-rbac.ts

# Verificar tipos sin compilar
npx tsc --noEmit

# Dev
npm run dev
```

---

# Apéndice B — Orden de ejecución sugerido

```
Chunk 1 → Chunk 2 → Chunk 3
                   ↓
                   Chunk 4 (paralelo)
                   ↓
Chunk 5 → Chunk 6 → Chunk 7
                   ↓
Chunk 8 → Chunk 9 → Chunk 10 → Chunk 11
                                ↓
                                (Opcional) Chunk 12
```

Cada chunk debería poder mergearse a `master` por separado. Si algo falla, el siguiente chunk no rompe lo anterior.

---

# Apéndice C — Cosas que el agente Gemini probablemente equivocará

Avisarle explícitamente en cada prompt:
- **Drizzle ORM**: no usar `pg`, esto es `libsql`/SQLite. Imports siempre de `drizzle-orm/sqlite-core` y `drizzle-orm/libsql`.
- **Next 16**: Server Components son async por defecto. Client components requieren `"use client"` arriba.
- **next-auth v5 beta**: la signature es `import { auth } from "@/auth"` y se usa como `const session = await auth()`. NO usar `getServerSession` (eso era v4).
- **Tailwind v4**: tokens custom como `wedding-sage-darkest` están definidos en globals.css/postcss. No inventar nuevos sin ver el archivo.
- **No mocks**: si el agente no encuentra un dato, que devuelva empty state, no datos hardcoded.
- **revalidatePath**: toda mutación server-side debe llamarlo al final.
