import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: planos de mesas con áreas, alternativas y elementos.
 *
 * Pasos:
 *   1. Tablas floor_areas, floor_layouts, floor_elements y layout_positions.
 *   2. tables.area_id (FK, ON DELETE SET NULL) y floor_elements.color
 *      (color elegido; nulo = el del tipo).
 *   3. Si no hay áreas: crea «Salón» con la alternativa «Principal» (vigente),
 *      le asigna todas las mesas y copia las posiciones del plano antiguo
 *      (tables.pos_x / pos_y).
 *
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-floor-plans.ts
 */
async function main() {
  console.log("Migrando planos de mesas...");

  const { sql, isNull, isNotNull, and } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { floorAreas, floorLayouts, layoutPositions, tables } = await import("../src/db/schema");

  const ddl = [
    `CREATE TABLE IF NOT EXISTS floor_areas (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS floor_layouts (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      area_id integer NOT NULL REFERENCES floor_areas(id) ON DELETE cascade,
      name text NOT NULL,
      is_active integer DEFAULT false NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS floor_elements (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      area_id integer NOT NULL REFERENCES floor_areas(id) ON DELETE cascade,
      kind text DEFAULT 'OTHER' NOT NULL,
      label text DEFAULT '' NOT NULL,
      shape text DEFAULT 'RECT' NOT NULL,
      width integer DEFAULT 160 NOT NULL,
      height integer DEFAULT 100 NOT NULL,
      created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS layout_positions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      layout_id integer NOT NULL REFERENCES floor_layouts(id) ON DELETE cascade,
      table_id integer REFERENCES tables(id) ON DELETE cascade,
      element_id integer REFERENCES floor_elements(id) ON DELETE cascade,
      x integer NOT NULL,
      y integer NOT NULL
    )`,
    "CREATE UNIQUE INDEX IF NOT EXISTS layout_positions_table_unique ON layout_positions (layout_id, table_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS layout_positions_element_unique ON layout_positions (layout_id, element_id)",
  ];
  for (const q of ddl) await db.run(sql.raw(q));
  console.log("  Tablas del plano listas.");

  const cols = await db.all<{ name: string }>(sql.raw("PRAGMA table_info(tables)"));
  if (cols.some((c) => c.name === "area_id")) {
    console.log("  tables.area_id ya existe.");
  } else {
    await db.run(sql.raw("ALTER TABLE tables ADD COLUMN area_id integer REFERENCES floor_areas(id) ON DELETE set null"));
    console.log("  tables.area_id creada.");
  }

  const elCols = await db.all<{ name: string }>(sql.raw("PRAGMA table_info(floor_elements)"));
  if (elCols.some((c) => c.name === "color")) {
    console.log("  floor_elements.color ya existe.");
  } else {
    await db.run(sql.raw("ALTER TABLE floor_elements ADD COLUMN color text"));
    console.log("  floor_elements.color creada.");
  }

  const areas = await db.select().from(floorAreas).all();
  if (areas.length > 0) {
    console.log(`  Ya hay ${areas.length} áreas.`);
  } else {
    const [salon] = await db.insert(floorAreas).values({ name: "Salón", sortOrder: 0 }).returning();
    const [principal] = await db.insert(floorLayouts).values({ areaId: salon.id, name: "Principal", isActive: true, sortOrder: 0 }).returning();
    const moved = await db.update(tables).set({ areaId: salon.id }).where(isNull(tables.areaId)).returning({ id: tables.id });
    const placed = await db.select({ id: tables.id, x: tables.posX, y: tables.posY }).from(tables)
      .where(and(isNotNull(tables.posX), isNotNull(tables.posY))).all();
    if (placed.length > 0) {
      await db.insert(layoutPositions).values(placed.map((t) => ({ layoutId: principal.id, tableId: t.id, x: t.x!, y: t.y! })));
    }
    console.log(`  Área «Salón» con alternativa «Principal»: ${moved.length} mesas, ${placed.length} posiciones copiadas.`);
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
