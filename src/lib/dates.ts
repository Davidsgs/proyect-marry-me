// Fechas "YYYY-MM-DD" (sin hora) guardadas como texto. `new Date("2026-04-03")`
// las interpreta en UTC y en Argentina (UTC-3) se muestran un día antes; aquí
// se interpretan como medianoche local.
export function parseLocalDate(iso: string): Date {
  return new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
}

const fmtStamp = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

/**
 * CURRENT_TIMESTAMP de SQLite ("YYYY-MM-DD HH:MM:SS", en UTC) → «16 nov, 18:30»
 * en hora de Argentina. Zona fija: el servidor y el navegador dan el mismo texto.
 */
export function formatSqlTimestamp(ts: string): string {
  return fmtStamp.format(new Date(ts.replace(" ", "T") + "Z"));
}

/** Hoy en hora local como "YYYY-MM-DD", comparable con fechas guardadas. */
export function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}
