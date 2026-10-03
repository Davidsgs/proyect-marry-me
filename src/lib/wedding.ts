// Datos fijos de la boda. Única fuente para fecha y textos derivados.
export const WEDDING_DATE_ISO = "2027-04-03T00:00:00-03:00"; // Argentina (UTC-3)
export const WEDDING_DATE_LABEL = "3 de abril de 2027";

/** Días que faltan para la boda (0 o negativo si ya pasó). */
export function daysUntilWedding(): number {
  return Math.ceil((new Date(WEDDING_DATE_ISO).getTime() - Date.now()) / 86_400_000);
}

export const COUPLE_NAMES = "David & Rocío";

export const VENUE = {
  address: "Salón SUM · Quinta Vaccarezza",
  area: "Villa Udaondo, Ituzaingó, Provincia de Buenos Aires",
  mapsUrl: "https://maps.app.goo.gl/NtcHnWBP3NwRZx4J9",
};

export type AvoidColor = { name: string; hex: string };

export const DRESS_CODE = {
  style: "Elegante",
  // Colores reservados para evitar coincidir con la decoración y los novios.
  women: [
    { name: "Rosa", hex: "#e7c6c1" },
    { name: "Verde", hex: "#afc3b1" },
    { name: "Blanco", hex: "#f2eee8" },
  ] as AvoidColor[],
  men: [{ name: "Gris", hex: "#53565A" }] as AvoidColor[],
};

// Evento de día completo: el horario aún no está definido.
export const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(`Boda de ${COUPLE_NAMES}`)}` +
  "&dates=20270403/20270404" +
  `&location=${encodeURIComponent(`${VENUE.address}, ${VENUE.area}`)}`;
