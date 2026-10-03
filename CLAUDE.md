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

**Shared admin UI** (use these, don't re-create per section): `src/app/admin/_components/ui.tsx` (`PageHeader`, `StatCard` with optional `href`, `Tabs`, `btnPrimary`/`btnSecondary`/`btnDanger`/`btnGhost`) and `useConfirm()` from `ConfirmDialog.tsx` (never `window.confirm`). Row actions stay visible on touch: hide on hover only with `pointer-fine:` variants. Page titles match nav labels.

**Permission implications** live in `IMPLIED_PERMS` (`src/lib/permissions.ts`), e.g. `tables.read` ⇒ `families.read` + `users.read`, applied when building the JWT.

**Fixed wedding data** in `src/lib/wedding.ts` (date); `"YYYY-MM-DD"` strings parse with `src/lib/dates.ts` (`parseLocalDate`, `todayLocalISO`) — never `new Date("YYYY-MM-DD")` (UTC, shows a day early in Argentina).

**Guest side**: `/dashboard` — family delegate (`MAIN_GUEST`) confirms RSVP for each family member until the configured deadline; other members get a read-only view; "Mi mesa" shows table assignment. `/seating-chart` is a printable per-table list.

## Design

`PRODUCT.md` (users, vocabulary, brand commitments) and `DESIGN.md` (visual system) at the repo root are the authority; `.agents/rules/` holds the original brand brief. Read them before UI work. Vocabulary: Delegado, Acompañante, Confirmado / No asiste / Pendiente, Resumen. Key points: romantic/botanical/pastel/minimal aesthetic; palette `#f2eee8`, `#e7c6c1`, `#afc3b1`, `#6f7f6a`, `#d9a3a0`; Material-style surface tokens defined in `src/app/globals.css` (`bg-surface`, `text-primary`, `text-on-surface-variant`…); serif italic for headings (`font-serif`), sans for body; **no 1px borders to separate sections** — use surface color shifts; no vibrant/neon/dark palettes.

## Git workflow

Feature branches `feat/<name>` → PR to `master`. Conventional commits scoped by section (`feat(menu): ...`).
