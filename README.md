<div align="center">

# Boda David & Rocío

Invitación digital, confirmación de asistencia y panel de organización para la boda de David y Rocío (2 de abril de 2027).

[![CI](https://github.com/Davidsgs/proyect-marry-me/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Davidsgs/proyect-marry-me/actions/workflows/ci.yml)
[![Despliegue](https://img.shields.io/github/deployments/Davidsgs/proyect-marry-me/Production?label=vercel&logo=vercel&logoColor=white)](https://github.com/Davidsgs/proyect-marry-me/deployments)
[![Último commit](https://img.shields.io/github/last-commit/Davidsgs/proyect-marry-me/master?label=%C3%BAltimo%20commit)](https://github.com/Davidsgs/proyect-marry-me/commits/master)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2?logo=turso&logoColor=black)](https://turso.tech)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-7C3AED?logo=auth0&logoColor=white)](https://authjs.dev)

</div>

---

## Contenido

- [Qué hace](#qué-hace)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Scripts](#scripts)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Calidad y CI](#calidad-y-ci)
- [Despliegue](#despliegue)
- [Diseño](#diseño)
- [Cómo contribuir](#cómo-contribuir)

## Qué hace

### Para los invitados (`/dashboard`)

Solo entran personas invitadas: el login con Google funciona únicamente si el correo ya está cargado en la lista de invitados. Ningún dato de la boda se ve sin sesión, y el sitio no se indexa en buscadores.

La invitación es un carrusel de pasos, con animaciones de entrada y navegación con botones o deslizando en el móvil:

1. **Bienvenida**: nombre de la familia y lo esencial de un vistazo.
2. **Tu respuesta**: el delegado de la familia confirma quién viene, con restricciones alimentarias, hasta la fecha límite. El resto de la familia ve la respuesta en modo lectura.
3. **El gran día**: fecha, hora, cuenta regresiva, aviso de puntualidad y botón para añadirlo al calendario.
4. **Lugar y vestimenta**: cómo llegar, código de vestimenta y colores que no deben usarse.
5. **Tu mesa**: número de mesa y con quién se comparte.
6. **Menú**, **Regalos**, **Nuestra historia** y **Nuestro cortejo**: aparecen solo si tienen contenido cargado.

### Para la organización (`/admin`)

| Sección | Qué permite |
| --- | --- |
| **Resumen** | Métricas de familias, asistentes, mesas y tareas; últimas confirmaciones con quién respondió. |
| **Invitados** | Familias y personas, delegado, alias, categoría de edad, restricciones e historial de respuestas (auditoría). |
| **Tareas** | Pendientes con prioridad y fecha; registra quién la creó y quién la completó. |
| **Mesas** | Asignación por arrastrar y soltar, áreas del salón, planos con mesas y elementos, y listado imprimible por mesa (`/seating-chart`). |
| **Cronograma** | Secciones, actividades y pasos del día, con responsables. |
| **Menú** | Platos por momento, con proveedor y cantidades privados, y visibilidad pública para los invitados. |
| **Economía** | Ingresos, gastos y planes de pago en pesos. |
| **Ajustes** | Fecha límite de respuesta, regalos, historia, cortejo, nota para adultos y permisos de cada administrador. |

### Acceso y permisos

- Roles `admin`, `main_guest` (delegado) y `guest`.
- Permisos por sección (`<sección>.read` / `<sección>.write`), asignados a cada administrador desde Ajustes.
- Los permisos viajan en el JWT y se comprueban en el proxy, en cada página y otra vez en cada server action.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| UI | React 19, Tailwind CSS v4, lucide-react, @dnd-kit |
| Datos | Drizzle ORM sobre Turso (libSQL / SQLite) |
| Autenticación | Auth.js (NextAuth v5) con Google y lista blanca |
| Hosting | Vercel |

## Arquitectura

- **Sin API propia.** Todas las lecturas y escrituras pasan por server actions en `src/app/actions/<sección>.ts`. La única ruta de API es la de Auth.js.
- **Caché por etiquetas.** Las lecturas usan `unstable_cache` con una etiqueta por sección. Cada escritura invalida su etiqueta con `updateTag` y revalida las rutas afectadas. Las lecturas compartidas viven en `src/lib/data.ts`.
- **Latencia.** Turso es remoto (~160 ms por consulta desde Argentina). Por eso las escrituras múltiples van en `db.batch` y las lecturas independientes en paralelo.
- **Interfaz optimista.** Los cambios del panel se aplican al instante y se revierten con aviso si el servidor falla.
- **Auditoría.** Cada cambio en la respuesta de una familia, del delegado o de un administrador, deja una fila en `rsvp_events`, que solo admite inserciones.
- **Dinero en centavos.** Los importes se guardan como enteros y se formatean en ARS con `src/lib/money.ts`.

## Estructura del proyecto

```
src/
  app/
    page.tsx              Portada
    login/                Inicio de sesión
    dashboard/            Invitación (carrusel de pasos)
    admin/                Panel de organización, una carpeta por sección
    seating-chart/        Listado imprimible por mesa
    actions/              Server actions por sección
  components/             Componentes compartidos (Dialog, DatePicker, marca)
  db/                     Esquema Drizzle y cliente
  lib/                    Datos en caché, permisos, fechas, dinero, auditoría
  auth.ts                 Configuración de Auth.js
  proxy.ts                Protección de rutas y de las fotos privadas
scripts/                  Semillas y migraciones idempotentes
.github/workflows/ci.yml  Lint y build en cada PR
```

## Puesta en marcha

**Requisitos:** Node.js 20.9 o superior (CI usa Node 22), una base de datos en [Turso](https://turso.tech) y credenciales OAuth de Google.

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea `.env.local` en la raíz:

   | Variable | Para qué |
   | --- | --- |
   | `TURSO_DATABASE_URL` | URL de la base. Sin ella se usa `file:./noop.db`. |
   | `TURSO_AUTH_TOKEN` | Token de acceso a Turso. |
   | `AUTH_GOOGLE_ID` | Client ID de Google OAuth. |
   | `AUTH_GOOGLE_SECRET` | Client secret de Google OAuth. |
   | `AUTH_SECRET` | Clave para firmar las sesiones (`npx auth secret`). |

3. Prepara la base de datos y crea el primer administrador:

   ```bash
   npx drizzle-kit push                    # crea las tablas en una base nueva
   npx tsx scripts/seed-rbac.ts            # roles, permisos y configuración inicial
   npx tsx scripts/bootstrap-admin.ts <email> [nombre] [apellidos]
   ```

4. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

> [!NOTE]
> Los permisos se leen al iniciar sesión. Tras cambiar el rol o los permisos de alguien, esa persona debe cerrar sesión y volver a entrar.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (también es el chequeo de tipos) |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npx drizzle-kit push` | Aplica `src/db/schema.ts` a una base nueva |
| `npx tsx scripts/seed-rbac.ts` | Siembra roles, permisos y configuración (idempotente) |
| `npx tsx scripts/bootstrap-admin.ts` | Crea o promueve un administrador |

## Base de datos y migraciones

Una base nueva se crea con `drizzle-kit push`. Una base existente se actualiza con los scripts `scripts/migrate-<nombre>.ts`. Son idempotentes: usan `CREATE TABLE IF NOT EXISTS`, cargan los permisos nuevos desde `scripts/rbac-catalog.ts` y se los asignan a los administradores existentes.

```bash
npx tsx scripts/migrate-rsvp-audit.ts   # ejemplo: tabla de auditoría de respuestas
```

`scripts/rbac-catalog.ts` es la única fuente de roles y permisos, con las etiquetas y descripciones que muestra el editor de permisos.

## Calidad y CI

No hay suite de tests. Cada pull request y cada push a `master` pasan por [GitHub Actions](.github/workflows/ci.yml) con `npm run lint` y `npm run build`, que es el chequeo de tipos. El build no necesita secretos.

## Despliegue

Vercel despliega `master` en producción y crea una vista previa por cada pull request. En el proyecto de Vercel deben estar las mismas variables de `.env.local`. Las migraciones se ejecutan a mano contra Turso antes de mergear el cambio que las necesita.

## Diseño

- [`PRODUCT.md`](PRODUCT.md): usuarios, vocabulario y compromisos de marca.
- [`DESIGN.md`](DESIGN.md): sistema visual. Paleta del manual de marca, Marcellus para títulos y Mulish para el texto.

## Cómo contribuir

- Ramas `feat/<nombre>` con pull request a `master`.
- Commits convencionales con la sección como alcance, por ejemplo `feat(menu): …` o `fix(guests): …`.
- Textos de la interfaz, comentarios y documentación en español.
- Antes de abrir el PR: `npm run lint` y `npm run build`.

---

<div align="center">
<sub>Proyecto personal. El repositorio no declara una licencia de uso.</sub>
</div>
