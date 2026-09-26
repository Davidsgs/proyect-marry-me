// Fechas "YYYY-MM-DD" (sin hora) guardadas como texto. `new Date("2026-04-03")`
// las interpreta en UTC y en Argentina (UTC-3) se muestran un día antes; aquí
// se interpretan como medianoche local.
export function parseLocalDate(iso: string): Date {
  return new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
}

/** Hoy en hora local como "YYYY-MM-DD", comparable con fechas guardadas. */
export function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}
