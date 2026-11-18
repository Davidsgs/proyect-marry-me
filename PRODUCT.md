# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Invitados.** Familias venezolanas y argentinas, de todas las edades (incluidos mayores poco habituados a la tecnología), que entran casi siempre desde el móvil. Su tarea: abrir la invitación, confirmar asistencia y saber cuándo, dónde y cómo vestirse. En cada familia, un **delegado** confirma por todos; el resto ve la respuesta en modo lectura.
- **La pareja (David y Rocío).** Gestionan todo desde el móvil y el escritorio: invitados, confirmaciones, mesas, cronograma, menú, economía y tareas.
- **Familiares ayudantes.** Entran al panel con permisos limitados por sección (por ejemplo, solo tareas o solo mesas).
- **Proveedores / wedding planner.** Acceso al panel con permisos acotados a lo que coordinan (cronograma, menú, mesas).

## Product Purpose

Invitación digital privada y centro de organización de la boda de David y Rocío (2 de abril de 2027, Ituzaingó, Buenos Aires). Éxito para invitados: confirmar en menos de un minuto sin dudas y llegar al día sabiendo todo lo necesario. Éxito para el panel: que la pareja y sus ayudantes sepan en segundos qué falta (quién no respondió, quién no tiene mesa, qué vence) y lo resuelvan sin preguntar cómo funciona la app.

## Positioning

No es una plataforma de bodas genérica: está hecha a medida para una sola boda, con su lista cerrada de invitados (acceso solo por lista blanca de Google), su modelo de delegado por familia y sus propias secciones de organización.

## Operating Context

- Acceso de invitados: Google, solo correos registrados previamente. Sin registro abierto.
- RSVP por familia con fecha límite configurable; tras el cierre, la respuesta queda bloqueada.
- El seating chart imprimible (`/seating-chart`) se entrega a proveedores.
- El cronograma tiene un «modo día del evento» (bloqueo) para usar durante la boda.
- Importes en pesos argentinos (ARS).
- Los permisos se cargan al iniciar sesión: tras cambiarlos, el usuario debe cerrar sesión y volver a entrar.

## Capabilities and Constraints

- Secciones admin: Resumen, Invitados (familias y personas), Tareas, Mesas (lista con arrastre + plano del salón + imprimible), Cronograma, Menú, Economía, Ajustes (evento y permisos por administrador).
- Lado invitado: landing con cuenta atrás, login, panel con RSVP (con restricción alimentaria por persona), vista de solo lectura para no delegados, «Tu mesa», «Nuestra historia» con fotos y «Regalos».
- Política de niños: solo las familias marcadas con «Mostrar la nota de celebración sin niños» ven, en el RSVP, una nota amable de que la celebración es para adultos. Es solo informativa: no bloquea nada.
- Restricciones alimentarias: opciones cerradas más «Otra», un texto corto de 20 caracteres como máximo.
- Regalos: datos editables en Ajustes; la sección no aparece si están vacíos.
- Vocabulario único (usar siempre estos términos):
  - **Delegado**: el adulto que confirma por su familia (no «titular» ni «invitado principal»).
  - **Acompañante**: miembro de la familia que no es delegado.
  - **Confirmado / No asiste / Pendiente**: estados de RSVP (familia y persona).
  - **Resumen**: la portada del panel (también en móvil).
- Datos pendientes: horario de ceremonia y fiesta aún no definidos; no inventarlos.

## Brand Commitments

- Nombres: David y Rocío. Dominio: www.davidyrocio.wedding.
- Autoridad visual: el manual de marca (`.claude/Manual de Marca de Nuestra Boda David y Rocio.pdf`). Rasgos: campos de color plenos (rosa, rubor, oliva), sombras botánicas difusas, arco crema, polaroids inclinados, banda oliva.
- Personalidad: romántico, botánico, pastel, sutil, minimalista, etéreo.
- Paleta de marca: #f2eee8, #e7c6c1, #afc3b1, #6f7f6a, #d9a3a0. Sin colores vibrantes ni neón. Para texto se usan tonos derivados con contraste AA (tinta #364033, oliva profundo #55634f).
- Monograma «DR» entrelazado como logotipo: `public/monograma-DR-centrado.svg` (D oliva #828A6C, R rosa #DF8E86).
- Tipografías: pareja «Inscripción serena», elegida por la pareja el 2026-11-16 en lugar de las del manual (TAN Pearl no les gustó en pantalla): Marcellus para títulos y subtítulos, Mulish para todo el texto, del invitado y del panel.
- Tono visual: todo claro sobre campos de color de la marca, salvo la portada (`/`), que se mantiene oscura (verde noche #1e2419 sobre foto) con el monograma dorado por decisión de la pareja (2026-11-16).
- Contacto para invitados: solo el correo de soporte. Los teléfonos no se publican.
- Idioma: español neutro que entiendan venezolanos y argentinos; evitar regionalismos fuertes en textos para invitados («pasapalo» se mantiene como término del menú interno).

## Evidence on Hand

- Lugar: Salón SUM, Quinta Vaccarezza, Villa Udaondo, Ituzaingó, Provincia de Buenos Aires (mapa: https://share.google/ltOFm0PLDVjL1RZdF).
- Código de vestimenta: Elegante. Mujeres: no usar rosa, verde ni blanco. Varones: no usar gris.
- «Nuestra historia» (texto del manual): se guarda en la base y se edita en Ajustes; nunca en el código ni en la documentación (el repositorio es público).
- Fotos de la pareja e ilustración: las aporta la pareja. **Solo visibles con sesión activa**: se sirven desde `public/privado/`, protegido por `src/proxy.ts`.
- No hay testimonios: no fabricarlos.

## Product Principles

1. Una respuesta clara antes que muchas opciones: cada pantalla dice qué falta y qué hacer.
2. Lo mismo se hace igual en todas las secciones (crear, editar, borrar, confirmar, filtrar).
3. El móvil es de primera clase: nada importante depende del hover ni de pantallas anchas.
4. Tranquilizar en los momentos importantes: confirmar asistencia, borrar datos, cierre del RSVP.
5. Cálido para invitados, eficiente para quien organiza.

## Accessibility & Inclusion

- Invitados mayores: texto legible (≥14px en contenido, contraste ≥4.5:1), objetivos táctiles grandes, sin depender de tipografía script para información.
- Todo usable con teclado y lector de pantalla (controles nativos, etiquetas reales).
