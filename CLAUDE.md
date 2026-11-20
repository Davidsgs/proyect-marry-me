# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Wedding app for David & Rocío (invitation, RSVP, admin panel). Next.js 16 App Router + React 19, Tailwind v4, Drizzle ORM on Turso/libSQL, NextAuth v5 (Google only). UI copy, comments and docs are in **Spanish** — keep it that way.

## Commands

```bash
npm run dev                          # dev server
npm run build                        # production build (also the main type check)
npm run lint                         # ESLint
npx drizzle-kit push                 # push src/db/schema.ts to Turso (fresh DBs)
npx tsx scripts/seed-rbac.ts         # idempotent seed of roles/permissions/config
npx tsx scripts/migrate-<name>.ts    # idempotent per-feature migrations on existing DBs
npx tsx scripts/bootstrap-admin.ts <email> [nombre] [apellidos]  # create/promote admin
```

No test suite exists. Verify with `npm run build` + `npm run lint`.

Env in `.env.local` (gitignored): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`. Without `TURSO_DATABASE_URL`, `src/db/index.ts` falls back to `file:./noop.db`.

## Architecture

**Auth & access (whitelist + RBAC)**
- `src/auth.ts`: Google sign-in only succeeds if the email already exists in `users`. On sign-in the JWT is loaded with `uid`, `role`, `familyId`, and `permissions` (from `getUserPermissions`). Permission changes only take effect after the user signs out and back in.
- Effective permissions = role permissions (`role_permissions`) ∪ per-user grants (`user_permissions`), see `src/lib/permissions.ts`. The `admin` role only carries the baseline `admin.dashboard`; every other admin permission is granted per-admin (Discord-style toggles in `/admin/settings`).
- `src/proxy.ts` gates auth and redirects `/admin` and `/welcome` to `/dashboard` without `admin.dashboard`. Section-level checks (`<section>.read` / `<section>.write`) happen in each page (`redirect("/admin")`) **and** again in every server action — both are required.
- `scripts/rbac-catalog.ts` is the single source of truth for roles/permissions (labels + descriptions shown in the permissions editor). `BASELINE_ADMIN_PERMS` is duplicated in `src/lib/permissions.ts`; keep in sync.

**Data flow**
- No API routes besides NextAuth. All reads/writes go through server actions in `src/app/actions/<section>.ts`.
- Action file pattern: reads wrapped in `unstable_cache` with a section tag; writes call a local `invalidate()` that does `updateTag("<tag>")` + `revalidatePath(...)` for the section and `/admin`. Cross-section caches share tags (e.g. menu cache also tagged `schedule`, since menu items group by schedule activities). `requireRead()`/`requireWrite()` helpers throw `"Sin permisos"`.
- Admin pages are server components (`export const dynamic = "force-dynamic"`) that check perms, fetch via actions, and pass data + `canWrite` into a client `_components/<Section>Manager.tsx`.
- **Latency matters**: Turso is remote (~160 ms per query from Argentina). Shared cached reads live in `src/lib/data.ts` (`cachedFamilies`, `cachedUsers`, `cachedTables`, `cachedConfig`, `getRsvpDeadline`; tags `families`/`users`/`tables`/`config`) — pages read from there, never `db` directly, and writers must `updateTag` the matching tag (`config` for `event_config`). That module is not `"use server"`, so it never becomes a callable action. Multi-row writes use `db.batch([...])` (one round trip) instead of `await` in a loop; independent reads go in `Promise.all`.
- Money is stored as integer **cents**; use `src/lib/money.ts` (ARS, es-AR formatting/parsing).

**Adding a new admin section** (pattern followed by finance/menu):
1. Table in `src/db/schema.ts`.
2. Permissions `<section>.read/.write` in `scripts/rbac-catalog.ts`.
3. `scripts/migrate-<section>.ts`: idempotent raw DDL (`CREATE TABLE IF NOT EXISTS`), upsert permissions from catalog, grant them to existing admins.
4. `src/app/actions/<section>.ts`, `src/app/admin/<section>/page.tsx` + `_components/`.
5. Nav link gated by permission in both `AdminSidebar.tsx` and `AdminMobileNav.tsx`.

**Shared admin UI** (use these, don't re-create per section): `src/app/admin/_components/ui.tsx` (buttons `btnPrimary`/`btnSecondary`/`btnDanger`/`btnGhost`/`btnPrimarySm`/`btnGhostSm`/`iconBtn`/`iconBtnDanger`; fields `inputCls`/`inputSmCls`/`selectCls`/`Field`/`Checkbox`; `EmptyState`, `Chip` + `RSVP_CHIP`, `PageHeader`, `StatCard`, `Tabs`), `nav.ts` (single section list for sidebar and bottom bar), `useConfirm()` from `ConfirmDialog.tsx` (never `window.confirm`), `useNotify()` from `Notice.tsx` (feedback after saves), and `Dialog` from `src/components/Dialog.tsx` (native `<dialog>`, bottom sheet on mobile; never hand-rolled `fixed inset-0` modals). Dates use `DatePicker` from `src/components/DatePicker.tsx` (value `"YYYY-MM-DD"`; popover on desktop, bottom sheet on mobile; `name` adds a hidden input for FormData), never `<input type="date">`. Free-text fields whose content can be long (titles, names, concepts, descriptions, notes) use `GrowText` from `src/components/GrowText.tsx` (grows downward; single-line by default with Enter submitting, `multiline` for paragraphs + a `min-h-*` class); keep `<input>` for email, numbers, search and short codes. Pick guests with `PersonPicker` (`src/app/admin/_components/PersonPicker.tsx`: search by name or `@alias`, optional free-text entry), passing only `{id, name, alias}` — never emails. Writes are optimistic: use `useOptimisticState` from `src/app/admin/_components/optimistic.ts` (applies the change instantly, calls the server action in a transition, reverts and notifies on failure); new rows get a negative `tempId()` and render with `pendingRowCls` (pulsing, not clickable) until the server confirms. Don't block buttons with spinners while saving. Row actions stay visible on touch: hide on hover only with `pointer-fine:` variants. Touch targets ≥44px on coarse pointers. Page titles match nav labels.

**Permission implications** live in `IMPLIED_PERMS` (`src/lib/permissions.ts`), e.g. `tables.read` ⇒ `families.read` + `users.read`, applied when building the JWT.

**Fixed wedding data** in `src/lib/wedding.ts` (date); `"YYYY-MM-DD"` strings parse with `src/lib/dates.ts` (`parseLocalDate`, `todayLocalISO`) — never `new Date("YYYY-MM-DD")` (UTC, shows a day early in Argentina).

**Guest side**: `/dashboard` — family delegate (`MAIN_GUEST`) confirms RSVP for each family member until the configured deadline; other members get a read-only view; "Mi mesa" shows table assignment; "Menú" lists only `menu_items.is_public` (never discarded, never supplier/quantities/notes) via `getPublicMenu`; "Nuestro cortejo" lists `wedding_party` and "Preguntas y respuestas" lists `faq_items` (both edited in Ajustes; `cachedFaq`, tag `faq`). `/seating-chart` is a printable per-table list.

**Domain notes**
- Every user has a unique `users.alias` (`src/lib/alias.ts`: generated from the name on create, editable in Invitados, validated client and server side).
- Tasks have `priority` (`HIGHEST`/`HIGH`/`MEDIUM`/`LOW` in data, Spanish labels and icons in `src/lib/priority.ts` + `PriorityIcon.tsx`).
- Cronograma: activities belong to `schedule_sections` (name + optional date); steps (`schedule_tasks`) have a `description`; responsibles are a free name or linked to a user (`user_id`, name copied).
- Mesas: `floor_areas` → `floor_layouts` (one `is_active` per area) → `layout_positions` (one row per table/element per layout); `floor_elements` are non-table items (pista, DJ, mesa dulce…); `tables.area_id` null = first area. `tables.pos_x/pos_y` are legacy, unused.
- RSVP audit: every write that changes a family's RSVP (delegate or admin) appends a `rsvp_events` row via `rsvpEventInsert` from `src/lib/rsvpAudit.ts`, in the same `db.batch` when possible. Rows are append-only; history shows in the family detail (Invitados) and in Resumen.
- Attendance (`users.is_confirmed`) must stay consistent with the family status, or Mesas shows people as «no viene» (`declined` in `src/lib/attendance.ts`): an admin status change sets every member (Confirmado = all come, otherwise none) in the same batch, and anyone who joins a family (`createUser`, `createManyUsers`, `updateUser` with a new `familyId`) comes only if it is already CONFIRMED (`attendsOnJoin`). `scripts/fix-confirmed-attendance.ts` repairs old data (dry run without `--apply`).
- Virtual invitation (`families.is_virtual`, relatives abroad): no RSVP, no table, not counted as in-person guests. Pages split families with `byInvitation` from `src/lib/virtual.ts` (Invitados, Resumen, Mesas, `/seating-chart` take in-person; `/admin/virtuales` takes virtual). Their invitation is `/dashboard/en-vivo` (stream link in `event_config.live_stream_url`, edited in Virtuales). Switching a family's type in `updateFamily` resets it to Pendiente, clears attendance and frees its seats.
- Deletes clean dependent rows explicitly (`db.batch`): don't rely on DB-level cascades/SET NULL.

## Design

`PRODUCT.md` (users, vocabulary, brand commitments) and `DESIGN.md` (visual system) at the repo root are the authority; the brand manual PDF in `.claude/` is the visual source. Read them before UI work. Vocabulary: Delegado, Acompañante, Confirmado / No asiste / Pendiente, Resumen. Key points: full brand color fields (`bg-rosa`, `bg-rubor`, `bg-oliva-profundo`) with cream paper (`Arch`), botanical shadows (`BotanicalShadow`), polaroids, olive `Band`; one action color (`primary` = olive); read text in `text-tinta`; fonts Marcellus (`font-serif`, titles and subtitles; single Regular weight, never italic/bold, hierarchy by size) and Mulish (`font-sans` for UI, `font-text` for guest reading text), both via `next/font/google`. Only three shadows (`shadow-sm`/`md`/`xl`), no arbitrary shadows, no `backdrop-blur`, **no 1px borders to separate sections** (use surface tone steps). The home page `/` is the only dark screen (couple's decision). Couple photos live in `public/privado/` (session-only via `src/proxy.ts`; never serve them through `next/image`).

## Git workflow

Feature branches `feat/<name>` → PR to `master`. Conventional commits scoped by section (`feat(menu): ...`).
