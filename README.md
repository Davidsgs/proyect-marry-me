# Boda David & Rocío

Aplicación web para la boda de David y Rocío: invitación digital, confirmación de asistencia (RSVP) y un panel de administración completo para gestionar invitados, tareas y la distribución de mesas.

## Stack

- **Next.js 16** (App Router, Server Components y Server Actions)
- **React 19**
- **Tailwind CSS v4** (tema con tokens Material + estética _glassmorphism_)
- **Drizzle ORM** sobre **Turso / libSQL** (SQLite)
- **NextAuth v5** con proveedor **Google** (acceso restringido por lista blanca)
- **@dnd-kit** para arrastrar y soltar
- **lucide-react** para iconografía

## Funcionalidades

### Público / Invitado
- **Landing** con cuenta regresiva al gran día.
- **Login con Google**: solo pueden entrar correos previamente registrados como invitados.
- **Panel del invitado** (`/dashboard`):
  - **RSVP**: el delegado de cada familia confirma o rechaza la asistencia de cada miembro.
  - Vista de **solo lectura** para miembros que no son delegados.
  - **Bloqueo por fecha límite** de RSVP configurable.
  - **Mi mesa**: número de mesa asignada y con quién la comparte.

### Administración (`/admin`, protegido por permisos)
- **Resumen**: métricas de familias, invitados, tareas y estado de mesas (sentados, pendientes por sentar, mesas sobre capacidad).
- **Invitados**: CRUD de familias y personas, alias de familia, asignación de delegado, categoría de edad (adulto/niño/bebé) y estado RSVP.
- **Tareas**: CRUD de tareas con fecha y estado de completado.
- **Mesas**: distribución de invitados
  - **Vista Lista**: arrastrar y soltar invitados (o `select` en móvil) entre el pool «sin asignar» y las mesas; «Sentar familia» respeta la capacidad y deja el sobrante sin asignar; vaciar o borrar mesa.
  - **Vista Plano**: colocar las mesas libremente en un lienzo para recrear la distribución del salón (posición persistida).
  - **Seating chart imprimible** (`/seating-chart`): listado por mesa, exportable a PDF.
- **Ajustes**: configuración del evento (incluida la fecha límite de RSVP).

### Control de acceso (RBAC)
- Roles de sistema: `admin`, `main_guest` (delegado), `guest`.
- Permisos por sección (`users.*`, `families.*`, `tables.*`, `tasks.*`, `rsvp.*`, `settings.*`, `admin.dashboard`).
- Los permisos se cargan en el JWT al iniciar sesión y se verifican en _middleware_, _server actions_ y _UI_.

## Estructura

```
src/
  app/
    page.tsx                 Landing
    login/                   Inicio de sesión
    dashboard/               Panel del invitado (RSVP + mi mesa)
    admin/                   Panel de administración
      page.tsx               Resumen
      guests/                Gestión de invitados
      tasks/                 Gestión de tareas
      tables/                Distribución de mesas (lista + plano)
      settings/              Ajustes del evento
    seating-chart/           Plano imprimible
    actions/                 Server Actions (admin, rsvp, tasks, tables, config)
  db/
    schema.ts                Esquema Drizzle
    index.ts                 Cliente de base de datos
  lib/permissions.ts         Helpers de permisos
  auth.ts                    Configuración de NextAuth
  middleware.ts              Protección de rutas
scripts/
  rbac-catalog.ts            Catálogo compartido de roles y permisos (con descripciones)
  seed-rbac.ts               Siembra idempotente de roles, permisos y config inicial
  migrate-per-admin-perms.ts Migra bases existentes a permisos por administrador
```

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear `.env.local` con:
   ```
   TURSO_DATABASE_URL=...
   TURSO_AUTH_TOKEN=...
   AUTH_GOOGLE_ID=...
   AUTH_GOOGLE_SECRET=...
   AUTH_SECRET=...
   ```
3. Aplicar el esquema a la base de datos:
   ```bash
   npx drizzle-kit push
   ```
4. Sembrar roles, permisos y configuración inicial (idempotente):
   ```bash
   npx tsx scripts/seed-rbac.ts
   ```
5. Arrancar en desarrollo:
   ```bash
   npm run dev
   ```

> Tras añadir nuevos permisos o cambiar el rol de un usuario, este debe **cerrar e iniciar sesión** de nuevo para que el JWT recoja los permisos actualizados.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run lint` — ESLint
- `npx drizzle-kit push` — aplica el esquema a Turso
- `npx tsx scripts/seed-rbac.ts` — siembra RBAC
- `npx tsx scripts/migrate-per-admin-perms.ts` — migra una base existente al modelo de permisos por administrador (idempotente: añade columna/tabla, copia los permisos de cada admin a `user_permissions` y recorta el rol `admin` al acceso base)

## Estado actual

Fase 1 completa: landing, autenticación con lista blanca, RSVP por familia con delegado y fecha límite, panel de administración con RBAC (resumen, invitados, tareas, ajustes) y gestión de mesas (asignación drag & drop, plano posicionable y plano imprimible).
