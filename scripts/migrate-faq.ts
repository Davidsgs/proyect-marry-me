import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Migración idempotente: preguntas y respuestas de la invitación.
 *
 * Pasos:
 *   1. Tabla faq_items (pregunta, respuesta y orden).
 *   2. Si está vacía, carga preguntas sugeridas (se editan o borran en Ajustes).
 *      Solo usan datos que la invitación ya muestra; nada de teléfonos.
 *
 * Se edita en Ajustes (permiso settings.write): no requiere permisos nuevos.
 * Re-ejecutable sin efectos secundarios:  npx tsx scripts/migrate-faq.ts
 */
const SUGGESTED: { question: string; answer: string }[] = [
  {
    question: "¿Hasta cuándo puedo confirmar mi asistencia?",
    answer: "Hasta la fecha límite que figura en el paso «Tu respuesta». Confirma la persona delegada de cada familia, desde esta misma invitación, y puede cambiar la respuesta hasta esa fecha.",
  },
  {
    question: "¿Puedo ir con alguien que no figura en mi invitación?",
    answer: "La invitación es personal e intransferible: vale solo para las personas que figuran en ella. Si alguien no puede venir, su lugar no puede cederse a otra persona.",
  },
  {
    question: "¿Pueden ir niños?",
    answer: "Depende de cada invitación. Si en la suya aparece la nota de que la celebración es para adultos, les pedimos venir sin niños. ¡Gracias por entenderlo!",
  },
  {
    question: "¿A qué hora tengo que llegar?",
    answer: "La ceremonia empieza a las 21:00 h y hay 10 minutos de tolerancia: una vez empezada, la puerta se cierra y vuelve a abrirse recién para la fiesta. Les recomendamos llegar con tiempo.",
  },
  {
    question: "¿Cuál es el código de vestimenta?",
    answer: "Elegante / Gala, y será necesario para ingresar. Además, les pedimos no usar los colores reservados para la decoración y los novios: rosa, verde y blanco en el caso de las mujeres, y gris en el de los varones.",
  },
  {
    question: "¿Cómo llego al salón?",
    answer: "En el paso «Lugar y vestimenta» están la dirección y el botón «Cómo llegar», que abre el mapa con el recorrido.",
  },
  {
    question: "Tengo una restricción alimentaria, ¿cómo la aviso?",
    answer: "Al confirmar la asistencia, la persona delegada puede indicar para cada integrante si es vegetariano, vegano, celíaco, intolerante a la lactosa u otra restricción.",
  },
  {
    question: "¿Dónde veo en qué mesa estoy?",
    answer: "En el paso «Tu mesa». Estamos organizando la distribución y la publicaremos ahí más adelante, junto con quiénes comparten la mesa con ustedes.",
  },
  {
    question: "Si no puedo ir, ¿puedo verlo de alguna forma?",
    answer: "¡Sí! Si avisan que no pueden venir, desde su respuesta pueden entrar a la transmisión en vivo de la ceremonia.",
  },
  {
    question: "¿Qué regalo puedo hacer?",
    answer: "Su presencia es el mejor regalo. Si además desean hacernos un obsequio, en el paso «Regalos» están los datos para hacerlo por transferencia.",
  },
  {
    question: "Tengo otra duda, ¿a quién le escribo?",
    answer: "Escríbannos a soporte@davidyrocio.wedding y les respondemos a la brevedad.",
  },
];

async function main() {
  console.log("Migrando preguntas y respuestas...");

  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");

  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS faq_items (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
  )`));
  console.log("  faq_items lista.");

  const rows = await db.all<{ n: number }>(sql.raw("SELECT COUNT(*) AS n FROM faq_items"));
  if ((rows[0]?.n ?? 0) > 0) {
    console.log("  Ya hay preguntas cargadas: no se agregan las sugeridas.");
  } else {
    const { faqItems } = await import("../src/db/schema");
    await db.insert(faqItems).values(SUGGESTED.map((q, i) => ({ ...q, sortOrder: i })));
    console.log(`  ${SUGGESTED.length} preguntas sugeridas cargadas.`);
  }

  console.log("Listo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
