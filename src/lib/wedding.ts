// Datos fijos de la boda. Única fuente para fecha y textos derivados.
export const WEDDING_DATE_ISO = "2027-04-02T00:00:00-03:00"; // Argentina (UTC-3)
export const WEDDING_DATE_LABEL = "2 de abril de 2027";

// Día de la semana derivado de la fecha («Viernes»): no escribirlo a mano.
const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(WEDDING_DATE_ISO));
export const WEDDING_WEEKDAY = weekday.charAt(0).toUpperCase() + weekday.slice(1);

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

// «Nuestra historia»: el texto vive en la base (event_config, clave "story"),
// se edita en Ajustes y solo se muestra con sesión. No escribirlo en el código:
// el repositorio es público. Párrafos separados por una línea en blanco.
export const STORY_MAX = 2000;

// Fotos de la historia, en public/privado/ (protegido por src/proxy.ts). Se
// muestran solo las que estén listadas aquí: añadirlas cuando existan los archivos.
// Ej.: { src: "/privado/historia-1.webp", alt: "David y Rocío bajo un arco de flores" }
export const STORY_PHOTOS: { src: string; alt: string }[] = [];

export const SUPPORT_EMAIL = "soporte@davidyrocio.wedding";

// Nota sobre niños para las familias que no son directas. Se edita en Ajustes
// (clave adults_note de event_config); vacía, se usa este texto.
export const ADULTS_NOTE_DEFAULT =
  "Queremos que sea una noche para que los adultos la disfruten con calma, por eso la celebración será sin niños. Gracias por entenderlo y por organizarse para acompañarnos.";
export const ADULTS_NOTE_MAX = 400;

// "2027-04-02" → "20270403" (fin exclusivo de un evento de día completo).
function nextDayCompact(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10).replaceAll("-", "");
}

// Evento de día completo: el horario aún no está definido.
export const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(`Boda de ${COUPLE_NAMES}`)}` +
  `&dates=${WEDDING_DATE_ISO.slice(0, 10).replaceAll("-", "")}/${nextDayCompact(WEDDING_DATE_ISO.slice(0, 10))}` +
  `&location=${encodeURIComponent(`${VENUE.address}, ${VENUE.area}`)}`;

// Padrinos y cortejo (tabla wedding_party): límites de cada campo y papeles sugeridos.
export const PARTY_ROLE_MAX = 40;
export const PARTY_NAME_MAX = 80;
export const PARTY_MESSAGE_MAX = 280;
export const PARTY_ROLE_SUGGESTIONS = ["Padrino", "Madrina", "Testigo", "Dama de honor", "Caballero de honor", "Paje", "Florista", "Portador de anillos"];
