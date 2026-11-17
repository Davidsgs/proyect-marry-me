// Datos fijos de la boda. Única fuente para fecha y textos derivados.
export const WEDDING_DATE_ISO = "2027-04-02T21:00:00-03:00"; // Argentina (UTC-3)
export const WEDDING_DATE_LABEL = "2 de abril de 2027";
export const WEDDING_TIME_LABEL = "21:00 h";
// Minutos de espera tras la hora de inicio; después la puerta se cierra hasta la fiesta.
export const ARRIVAL_TOLERANCE_MIN = 10;

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

// Date → "20270403T000000Z" (formato UTC de Google Calendar).
function calendarUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Evento con hora de inicio real. shortcut: el fin (6 h después) es estimado,
// ajustarlo cuando se sepa la hora de cierre.
const weddingStart = new Date(WEDDING_DATE_ISO);
const weddingEnd = new Date(weddingStart.getTime() + 6 * 3_600_000);
export const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(`Boda de ${COUPLE_NAMES}`)}` +
  `&dates=${calendarUtc(weddingStart)}/${calendarUtc(weddingEnd)}` +
  `&details=${encodeURIComponent(`La ceremonia empieza a las ${WEDDING_TIME_LABEL} (hora de Argentina) con ${ARRIVAL_TOLERANCE_MIN} minutos de tolerancia. Llega con tiempo.`)}` +
  `&location=${encodeURIComponent(`${VENUE.address}, ${VENUE.area}`)}`;

// Padrinos y cortejo (tabla wedding_party): límites de cada campo y papeles sugeridos.
export const PARTY_ROLE_MAX = 40;
export const PARTY_NAME_MAX = 80;
export const PARTY_MESSAGE_MAX = 280;
export const PARTY_ROLE_SUGGESTIONS = ["Padrino", "Madrina", "Testigo", "Dama de honor", "Caballero de honor", "Paje", "Florista", "Portador de anillos"];
