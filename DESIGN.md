---
name: David & Rocío
description: Invitación privada y panel de organización de la boda de David y Rocío (3 de abril de 2027).
colors:
  primary: "#7f5351"
  on-primary: "#ffffff"
  primary-container: "#d9a3a0"
  on-primary-container: "#603837"
  secondary-container: "#d3e8d5"
  on-secondary-container: "#56695a"
  error: "#a8423a"
  on-error: "#ffffff"
  surface: "#fdf9f3"
  surface-container: "#f1ede7"
  surface-container-low: "#f7f3ed"
  surface-container-lowest: "#ffffff"
  on-surface: "#1c1c18"
  on-surface-variant: "#514443"
  outline-variant: "rgba(81, 68, 67, 0.15)"
  wedding-cream: "#f2eee8"
  wedding-blush: "#e7c6c1"
  wedding-blush-light: "#f1dad7"
  wedding-sage: "#afc3b1"
  wedding-sage-light: "#c8d6c9"
  wedding-olive: "#6f7f6a"
  wedding-sage-darkest: "#1E2419"
typography:
  display:
    fontFamily: "Cormorant, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  display-guest:
    fontFamily: "Cormorant, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.25
  headline:
    fontFamily: "Cormorant, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Cormorant, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  body-guest:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  eyebrow:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.1em"
rounded:
  lg: "0.5rem"
  xl: "0.75rem"
  2xl: "1rem"
  3xl: "1.5rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-container}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-ghost:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
  button-guest-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-guest}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
    height: "56px"
  button-landing:
    backgroundColor: "{colors.wedding-blush-light}"
    textColor: "{colors.wedding-sage-darkest}"
    typography: "{typography.body-guest}"
    rounded: "{rounded.full}"
    padding: "16px 40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  tabs:
    backgroundColor: "{colors.surface-container-low}"
    rounded: "{rounded.xl}"
    padding: "4px"
  tab-active:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  card-section:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.3xl}"
    padding: "24px"
  guest-card:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.3xl}"
    padding: "24px"
  stat-card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.primary}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  rsvp-choice:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-guest}"
    rounded: "{rounded.2xl}"
    padding: "0 16px"
    height: "64px"
  rsvp-choice-yes:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
  rsvp-choice-no:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  member-row:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-guest}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    height: "56px"
  member-row-coming:
    backgroundColor: "{colors.secondary-container}"
  name-pill:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  chip-confirmed:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  chip-alert:
    textColor: "{colors.error}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-item:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  nav-item-active:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.primary}"
  dialog:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.3xl}"
    padding: "24px"
---

# Design System: David & Rocío

## Overview

**Creative North Star: "El cuaderno de la boda"**

Papelería fina convertida en herramienta. El panel de organización es un cuaderno de papel grueso color crema donde cada sección es una hoja blanca apoyada sobre otra: la profundidad sale de capas de papel (cambios de superficie) y de una sombra tan tenue que apenas se percibe, nunca de líneas ni marcos. La voz romántica vive en los títulos en Cormorant cursiva y en el rosa viejo del color primario; todo lo demás, datos, formularios, listas, habla en Inter, pequeño y claro, porque la pareja y sus ayudantes necesitan saber en segundos qué falta.

Densidad media: el panel es eficiente (texto de 14px, etiquetas pequeñas en mayúsculas espaciadas, acciones cercanas a lo que afectan) pero respira con márgenes generosos entre bloques (40px). El móvil es de primera clase: navegación inferior con desborde «Más», acciones de fila siempre visibles en pantallas táctiles, diálogos de confirmación propios.

El tono es **mixto** por decisión explícita: la landing conserva la foto con fondo oscuro (`wedding-sage-darkest`); todo lo demás va en claro, crema y botánico. El fondo por defecto del `body` es `surface`. Rechazos confirmados: colores vibrantes o neón, paletas oscuras fuera del hero de la landing, tipografías tecnológicas, cómic o góticas.

**Lado invitado.** Login, bienvenida, página de error y panel del invitado (RSVP, «El gran día», «Tu mesa») comparten el mismo sistema de tokens que el panel: suelo `surface`, hojas `surface-container-lowest`, zonas agrupadas `surface-container-low`, acento `primary` y salvia (`secondary-container`) para «viene / confirmado». Lo que cambia es la escala: el invitado lee una vez y con calma, a menudo en el móvil y a veces con vista cansada, así que el cuerpo sube a 16px, los títulos son más grandes y los objetivos táctiles miden al menos 56px. El monograma tipográfico «DR» y la ramita (Sprig) son la firma de estas pantallas. La landing es la única superficie oscura.

**Key Characteristics:**
- Superficies crema y blancas en capas; sin líneas divisorias.
- Rosa viejo (`primary`) como única voz de acento; verde salvia solo para estados positivos.
- Títulos serif cursiva; cuerpo sans en 14px en el panel y 16px en el lado invitado; etiquetas diminutas en mayúsculas espaciadas solo en el panel.
- Esquinas generosas (12–24px) en todo; píldoras para estados.
- Sombras ambientales teñidas del marrón de la tinta, casi invisibles.
- Nada importante depende del hover.

## Colors

Paleta pastel cálida: crema, rosa empolvado y salvia, anclada por un rosa viejo profundo que da contraste suficiente para texto y botones.

### Primary
- **Rosa viejo** (`primary`): color de acción y de marca en el panel y en el lado invitado. Botón principal, títulos de página, cifras de las tarjetas de estadística, elemento activo de la navegación y pestañas, monograma, iconos de detalle, anillo de foco global, `accent-color` y cursor de texto. Sus tintes al 5–20% (`primary/5`, `primary/10`) sirven de hover y fondos de selección suaves.
- **Terracota rosada** (`primary-container`): relleno suave de marca, con texto en `on-primary-container` (marrón rojizo profundo). En el RSVP marca la opción elegida «No podremos asistir» (al 50%, con anillo `primary`): una respuesta legítima, no un error.

### Secondary
- **Salvia pálida** (`secondary-container`) con **Verde musgo apagado** (`on-secondary-container`): estados positivos (Confirmado, pagado, dentro de capacidad). En el lado invitado es el color de «viene»: opción «Sí, asistiremos», filas de personas marcadas (al 60%), bloque «Vienen» (al 50%) y el círculo con check de «¡Gracias por confirmar!». El texto verde también tiñe las cifras «buenas» de las tarjetas de estadística.

### Tertiary
- **Rojo terracota apagado** (`error`): acciones destructivas, vencidos, sobre capacidad, No asiste en el panel. Se usa como texto, como fondo tintado al 10% para chips, avisos y hovers de icono, y como relleno del botón de peligro. Contraste ~5.9:1 sobre blanco. En el lado invitado solo aparece en avisos de fallo (correo no encontrado, error al guardar, «marca al menos a una persona»), nunca para pintar a quien no viene.

### Neutral
- **Papel crema** (`surface`): fondo base de todo el panel, del lado invitado (`body` por defecto) y de los campos de formulario.
- **Crema sombreada** (`surface-container-low`): barra lateral, cabeceras (panel móvil y panel del invitado), barra inferior móvil, pistas de pestañas, botón secundario, zonas agrupadas, bloque «No vienen», píldoras de nombres.
- **Crema tostada** (`surface-container`): hover del botón secundario y fondos de tercer nivel.
- **Blanco papel** (`surface-container-lowest`): tarjetas, diálogos, pestaña y navegación activas, secciones del invitado; la hoja que «flota» sobre el crema.
- **Tinta** (`on-surface`): texto principal. Nunca negro puro.
- **Tinta marrón suave** (`on-surface-variant`): texto secundario, descripciones, etiquetas, iconos en reposo. El color de texto más usado del panel.
- **Borde fantasma** (`outline-variant`, 15% de la tinta): único borde permitido, y solo cuando hace falta un límite (zona de soltar vacía, separador dentro de una hoja modal).

### Brand
- **Crema, Rosa empolvado, Salvia, Oliva** (`wedding-cream`, `wedding-blush`, `wedding-sage`, `wedding-olive`, más `wedding-blush-light` y `wedding-sage-light`): la paleta de marca original. En el panel aparecen solo como tintes decorativos muy suaves (selección de texto en `wedding-blush`, fondos al 10%); el trabajo funcional lo hacen los tokens de superficie. `wedding-olive` tiñe la ramita (Sprig) en las pantallas claras del invitado.
- **Verde noche** (`wedding-sage-darkest`): exclusivo del hero oscuro de la landing, como fondo y como velo al 75% sobre la foto. Sobre él, el texto va en `wedding-cream` (al 80–90% para lo secundario) y los acentos en `wedding-blush-light` (nombres, monograma, icono de ubicación, botón principal).

### Named Rules
**La regla de la voz única.** El rosa viejo es el único acento. Verde y rojo terracota son estados, no decoración: si un elemento no comunica «bien» o «peligro», no lleva verde ni rojo.

**La regla de la tinta teñida.** Todo lo oscuro deriva del marrón de la tinta (`#514443` / `rgba(81,68,67,…)`): texto secundario, sombras, bordes fantasma, fondo del diálogo modal. Nada de negro puro ni grises neutros.

**La regla de la noche única.** La landing es la única superficie oscura: foto + velo `wedding-sage-darkest/75`. Login, bienvenida, error y panel del invitado van en claro, sobre `surface`.

## Typography

**Display Font:** Cormorant (con Georgia, serif)
**Body Font:** Inter (con system-ui, sans-serif)
**Script:** Pinyon Script, solo para los nombres de la pareja en la landing.

**Character:** Cormorant en cursiva pone la caligrafía de invitación en cada título; Inter, pequeño y medio, hace que listas, importes y formularios se lean sin esfuerzo. La pareja es fija por decisión explícita.

### Hierarchy
- **Display** (Cormorant cursiva 400, 1.875rem en móvil → 2.25rem desde `sm`): título de página en `PageHeader`, siempre en `primary`, con `text-balance`.
- **Headline** (Cormorant 400, 1.875rem, interlineado 1, cifras tabulares): valor de las tarjetas de estadística y números destacados.
- **Title** (Cormorant 400, 1.125–1.25rem): títulos de tarjeta, nombres de familia, mesa, tarea o plato; título del diálogo de confirmación (1.25rem). Cursiva opcional en títulos de bloque (1.5rem).
- **Body** (Inter 400/500, 0.875rem): texto de contenido, botones, pestañas, campos, descripciones (máx. ~36rem en la descripción de página).
- **Label** (Inter 500, 0.75rem): etiquetas de estadística, metadatos, contadores, pistas.
- **Eyebrow** (Inter 500, 10–11px, mayúsculas, tracking 0.1em): rótulos de grupo sobre campos, chips de estado, etiquetas de la barra inferior móvil, fecha bajo el nombre de la pareja.

### Lado invitado
- **Display invitado** (Cormorant cursiva 400, 3rem → 3.75rem desde `md`, `primary`, `text-balance`): nombre de la familia en el panel del invitado. En login, bienvenida y error el título de entrada va a 2.25rem.
- **Títulos de sección** (Cormorant cursiva 1.875rem, `primary`): «¿Nos acompañan?», «El gran día», «Tu mesa», confirmaciones. El número de mesa sube a 3rem en Cormorant recta.
- **Cuerpo invitado** (Inter 16px, interlineado 1.625): párrafos, nombres de personas, opciones del RSVP, botón de envío. 14px solo para pistas y subtítulos de apoyo (plazo, «Desmarca a quien no pueda venir»), rótulos de detalle («Cuándo», «Dónde») en peso 500 y píldoras de nombres.
- **Sin eyebrows en claro:** las pantallas claras del invitado no usan mayúsculas espaciadas de 10px (la única excepción del lado invitado son los rótulos de la cuenta atrás en la landing); sus rótulos van en 14px, peso 500, mayúscula de frase.
- **Script** (Pinyon Script 400, 3.75rem → 6rem): solo «David & Rocío» en la landing, sobre fondo oscuro.

### Named Rules
**La regla de la frase normal.** Los botones van en `body` (14px, peso 500; 16px en el lado invitado) y en mayúscula de frase («Guardar cambios», no «GUARDAR CAMBIOS»). Las mayúsculas espaciadas son de las etiquetas (eyebrow), nunca de las acciones.

**La regla de la información legible.** El contenido que el usuario necesita leer va a 14px o más. Los tamaños de 10–12px son solo rótulos y metadatos que acompañan a un contenido mayor; y la tipografía script (Pinyon Script) nunca transporta información: solo repite los nombres de la pareja.

**La regla de la letra grande.** Entre los invitados hay personas mayores: en el lado invitado el cuerpo es de 16px, lo que hay que leer nunca baja de 14px y todo control que se toca mide al menos 56px de alto (`min-h-14`; las opciones del RSVP, 64px).

## Layout

- **Escritorio (≥1024px):** barra lateral fija de 18rem (`surface-container-low`) y área principal en `surface` con 32px de margen lateral y 48px vertical. Las páginas se centran con un ancho máximo según su densidad: 72rem (`max-w-6xl`) para secciones con rejillas y tablas, 42–64rem para formularios y listas estrechas.
- **Móvil (<1024px):** cabecera fija translúcida (nombre de la pareja + fecha) y barra de navegación inferior de hasta 5 huecos; si hay más secciones, el último hueco pasa a «Más» y abre una hoja inferior con el resto y las acciones de cuenta. El contenido deja 96px libres abajo para la barra.
- **Ritmo:** base de 4px. 8px entre elementos hermanos (el espaciado más usado), 16px de padding horizontal en controles, 20–24px dentro de tarjetas, 40px entre bloques de página.
- **Encabezado de página:** título y descripción a la izquierda; acciones a la derecha desde `sm`, debajo en móvil.
- **Rejillas:** tarjetas de estadística en rejilla que colapsa a una columna; formularios en rejilla de 12 columnas en escritorio, una columna en móvil.
- **Punteros:** los objetivos táctiles del panel miden al menos 32px (botones de icono de 32px, botones de texto de ~44px de alto); los del lado invitado, al menos 56px.
- **Lado invitado:** una sola columna centrada. Pantallas de entrada (login, error) a `max-w-md` y bienvenida a `max-w-xl`, centradas vertical y horizontalmente sobre `surface`. Panel del invitado: cabecera `surface-container-low` (monograma pequeño, nombre de la pareja desde `sm`, saludo o enlace «Panel», «Salir») y contenido a `max-w-3xl` con 32px entre secciones: encabezado centrado (ramita + nombre de familia + frase de bienvenida), hoja de RSVP, «El gran día», «Tu mesa».
- **Landing:** pantalla completa, columna centrada `max-w-3xl`, 40–56px entre bloques: monograma y nombres, cuenta atrás, fecha y dirección, acciones.

## Elevation & Depth

Híbrido con predominio tonal. La jerarquía la dan las capas de superficie (`surface` → `surface-container-low` → `surface-container-lowest`); las sombras son un susurro teñido de tinta que confirma la capa, no la crea. La sombra crece solo como respuesta a estado (hover de tarjeta enlazada, arrastre, diálogo abierto).

### Shadow Vocabulary
- **Hoja** (`box-shadow: 0 8px 32px rgba(81,68,67,0.04)`): tarjetas de sección grandes (rounded 3xl).
- **Invitación** (`box-shadow: 0 4px 24px rgba(81,68,67,0.06)`): hojas del lado invitado (tarjeta de login, secciones del panel del invitado, opciones de bienvenida). Un punto más presente que la hoja del panel porque cada hoja está sola sobre el crema.
- **Tarjeta de estadística** (`box-shadow: 0 4px 20px rgba(81,68,67,0.04)`), y al hover si enlaza (`0 8px 28px rgba(81,68,67,0.09)`).
- **Contacto** (`shadow-sm` de Tailwind): tarjetas pequeñas, campos, pestaña activa, elemento activo de navegación, botones principales.
- **Levantado** (`shadow-md`): hover del botón principal, elemento en edición o arrastre.
- **Modal** (`shadow-xl`): diálogo de confirmación, sobre un velo `on-surface` al 30%.

### Named Rules
**La regla del papel apilado.** Una hoja blanca sobre crema ya es elevación. Si necesitas separar dos zonas, cambia la superficie antes de añadir sombra, y añade sombra antes de pensar en un borde.

## Shapes

Esquinas generosas y suaves en todo, ninguna esquina viva. Escala por tamaño de objeto: 8px (`lg`) para controles compactos y pestañas internas; 12px (`xl`) para botones, campos, elementos de navegación y botones de icono (la esquina por defecto); 16px (`2xl`) para tarjetas y estadísticas; 24px (`3xl`) para tarjetas de sección, diálogos y hojas inferiores; píldora completa (`full`) para chips de estado, avatares y contadores. En el lado invitado, `full` también viste las píldoras de nombres y los círculos de icono de estado; en la landing, los botones de acción son píldoras.

Sin bordes: los contenedores se delimitan por superficie y sombra. Excepción nativa del sistema: la zona vacía de arrastre usa un borde discontinuo en `outline-variant`, porque ahí el borde *es* el mensaje («suelta aquí»).

## Components

### Buttons
Contenidos y cálidos: rellenos planos, esquina de 12px, texto en mayúscula de frase.
- **Shape:** esquina suave (`xl`, 12px), padding 12px × 20px, icono opcional a 8px del texto.
- **Primary** (`btnPrimary`): relleno `primary`, texto `on-primary`, sombra de contacto que sube a `shadow-md` al hover. Una por zona.
- **Secondary** (`btnSecondary`): relleno `surface-container-low`, texto `on-surface`; al hover `surface-container`.
- **Danger** (`btnDanger`): relleno `error`, texto `on-error`; al hover `error` al 90%. Solo para confirmar un borrado o vaciado.
- **Ghost** (`btnGhost`): sin relleno, texto `on-surface-variant`; al hover texto `on-surface` y fondo `surface-container-low`. Cancelar y acciones terciarias.
- **Foco / Deshabilitado:** contorno de 2px `primary` con separación de 2px; deshabilitado al 60% de opacidad con cursor prohibido.
- **Botón de icono:** 32px, esquina `xl`; en rojo `error` con hover `error/10` si destruye.
- **Lado invitado:** mismas variantes, más grandes. «Enviar respuesta» ocupa el ancho disponible, 16px, padding 16px × 24px; secundarios («Cambiar respuesta», «Añadir a mi calendario», «Escribirnos») en `surface-container-low` con 12px × 24px. «Continuar con Google» es una hoja blanca de 56px con el logotipo oficial de Google.
- **Landing:** «Ver mi invitación» en píldora `wedding-blush-light` con texto `wedding-sage-darkest`, 16px × 40px, hover `wedding-blush`; «Panel de organización» como píldora fantasma en `wedding-cream`.

### Chips
- **Estilo:** píldora, rótulo eyebrow (10px, mayúsculas espaciadas), padding 2px × 8px.
- **Estados:** Confirmado en salvia (`secondary-container` o `on-secondary-container` al 10%) con texto `on-secondary-container`; No asiste / vencido / alerta en `error` al 10% con texto `error`; Pendiente en tono neutro o `primary` tintado.
- **Vocabulario fijo:** Delegado, Acompañante, Confirmado, No asiste, Pendiente.
- **Píldoras de nombres (invitado):** `surface-container-low`, texto `on-surface` 14px, padding 6px × 12px, en «Compartes mesa con» y «En esta invitación». No son chips de estado y no llevan mayúsculas.

### Cards / Containers
- **Corner Style:** 16px (`2xl`) para tarjetas; 24px (`3xl`) para bloques de sección y hojas del invitado.
- **Background:** `surface-container-lowest` sobre `surface`.
- **Shadow Strategy:** contacto (`shadow-sm`), hoja ambiental o invitación; ver Elevation & Depth.
- **Border:** ninguno.
- **Internal Padding:** 20px (estadística), 24px (tarjeta y sección), 40px centrado en estados vacíos. Hojas del invitado: 24px en móvil → 32–40px desde `md`.

### Inputs / Fields
- **Style:** sin borde, relleno `surface` (o `surface-container-low` que pasa a `surface` al enfocar), esquina `xl`, padding 12px × 16px, sombra de contacto. Compactos: esquina `lg`, padding 8px × 12px, 14px.
- **Focus:** anillo de 2px en `primary` al 50%.
- **Etiqueta:** rótulo eyebrow en `on-surface-variant` encima del campo, 8px de separación; etiqueta real asociada al control.
- **Nativos primero:** `<select>`, `<input type="date">`, checkbox tematizados por `accent-color`.

### Tabs
Control segmentado (`Tabs`): pista `surface-container-low` con 4px de padding y esquina `xl`; la pestaña activa es una hoja blanca con texto `primary` y sombra de contacto; las inactivas en `on-surface-variant` pasan a `primary` al hover. Contador opcional en cifras tabulares. En móvil ocupa todo el ancho y reparte las pestañas.

### Navigation
- **Escritorio:** barra lateral `surface-container-low`, nombre de la pareja en Cormorant 1.875rem `primary` con la fecha en eyebrow debajo. Elementos con icono de 20px, texto `body` peso 500, esquina `xl`; activo = hoja blanca + texto `primary` + sombra de contacto; hover = `primary/5` y texto `primary`. Pie con «Ver mi invitación» y «Cerrar sesión».
- **Móvil:** barra inferior translúcida (`surface-container-low` al 95% con desenfoque), esquinas superiores de 24px, iconos de 24px con rótulo eyebrow; el activo lleva el icono sobre una hoja blanca. Desborde en «Más» → hoja inferior con rejilla de 3 columnas.
- **Etiquetas:** Resumen, Invitados, Tareas, Mesas, Cronograma, Menú, Economía, Ajustes. El título de cada página coincide con su etiqueta de navegación.

### Page Header
`PageHeader`: título Display en cursiva `primary`, descripción `body` en `on-surface-variant` de una frase, acciones agrupadas a la derecha. Toda página del panel empieza así; ninguna termina con pies decorativos.

### Stat Card
`StatCard`: rótulo `label` arriba con icono (o chevron si enlaza), cifra Headline en tono `default` (`primary`), `good` (`on-secondary-container`) o `warn` (`error`), pista opcional. Si enlaza, toda la tarjeta es el enlace y el chevron se desplaza 2px al hover.

### Confirm Dialog
`ConfirmDialog` / `useConfirm()`: `<dialog>` nativo modal, hoja blanca de esquina 24px y máx. 24rem, velo `on-surface` al 30%, entrada con fundido + zoom 95% en 150ms. Título en pregunta con Cormorant («¿Eliminar la mesa 3?»), descripción de consecuencias, Cancelar (ghost) + acción (danger por defecto, primary si no destruye). En peligro, el foco inicial cae en Cancelar. Escape o clic fuera cancela.

### Row Actions
Editar/borrar en filas y tarjetas: botones de icono de 32px. En punteros finos se revelan al hover o foco de la fila; en táctil están **siempre visibles**.

### Monogram & Sprig
`Monogram` (`src/components/Monogram.tsx`): monograma tipográfico provisional «DR» en Cormorant cursiva, la R solapada y al 80%, con `role="img"` y nombre accesible «David y Rocío». Tres tamaños: `sm` (cabecera del invitado), `md` (bienvenida, error, landing), `lg` (login). Hereda el color: `primary` en claro, `wedding-blush-light` en la landing. `Sprig`: ramita de línea fina (trazo de 1px, `currentColor`, en `wedding-olive`) que hace de divisor ornamental bajo el monograma o sobre el nombre de la familia. Es un ornamento, no un separador de secciones.

### RSVP
- **Opciones de respuesta:** `<input type="radio">` nativos visualmente ocultos (`sr-only`) dentro de su `<label>`, en `fieldset` con `legend`. Cada opción es una tarjeta de 64px, esquina `2xl`, 16px peso 500, con icono. En reposo `surface-container-low`; elegida: «Sí, asistiremos» en `secondary-container` con anillo `on-secondary-container`, «No podremos asistir» en `primary-container/50` con anillo `primary`.
- **Quiénes vendrán:** `<input type="checkbox">` nativos ocultos; cada persona es una fila de 56px, esquina `xl`, con casilla dibujada de 24px, nombre en 16px y el estado en palabras («Viene» / «No viene»). Marcada: fondo `secondary-container/60` y casilla `on-secondary-container`; desmarcada: `surface-container-low`. Todos vienen marcados por defecto.
- **Foco:** la etiqueta recibe el contorno de 2px `primary` con separación de 2px vía `has-[:focus-visible]`.
- **Enviado:** círculo de 56px con check sobre `secondary-container` (o corazón sobre `surface-container` si no vienen), título de agradecimiento, bloques «Vienen» (`secondary-container/50`) y «No vienen» (`surface-container-low`, texto `on-surface-variant`). Pasado el plazo, un aviso con candado sustituye a «Cambiar respuesta».
- **Vista de solo lectura:** mismos bloques; si la familia no respondió, nombra a la persona delegada y su correo.

### Event Details & Tu mesa
«El gran día»: lista de definición en tres columnas desde `sm` (Cuándo, Dónde, Vestimenta), icono `primary` de 20px, término en 14px peso 500 y dato en 16px; enlace «Ver en el mapa» subrayado en `primary`; botón secundario «Añadir a mi calendario». Los datos salen de `src/lib/wedding.ts`. «Tu mesa»: número de mesa en Cormorant 3rem, nombre opcional en cursiva, compañeros de mesa en píldoras de nombres; sin asignar, una frase de espera.

### Countdown
Landing, decisión fijada por la pareja: cuenta atrás completa de días : horas : minutos : segundos, actualizada cada segundo. Cada unidad es una columna (mín. 70px → 100px desde `sm`) con la cifra en Cormorant light 2.25rem → 3.75rem → 6rem en `wedding-cream` con sombra suave, y debajo su rótulo en mayúsculas espaciadas (12–14px, `wedding-cream/80`) sobre un filete de 1px en `wedding-blush-light/30`; los dos puntos entre unidades en `wedding-blush-light/60`. Horas, minutos y segundos con dos dígitos. Reserva 96px de alto antes de hidratar. El filete y las mayúsculas espaciadas son propios de este reloj en la noche de la landing; no se trasladan a las pantallas claras.

## Do's and Don'ts

### Do:
- **Do** separar zonas con cambios de superficie (`surface` → `surface-container-low` → `surface-container-lowest`) y, si hace falta más, con la sombra ambiental teñida (`rgba(81,68,67,0.04)`).
- **Do** usar los botones compartidos (`btnPrimary`, `btnSecondary`, `btnDanger`, `btnGhost`) en mayúscula de frase, 14px, peso 500.
- **Do** confirmar todo borrado o vaciado con `useConfirm()` y un título en forma de pregunta que nombre el objeto.
- **Do** ocultar acciones de fila solo bajo `pointer-fine` (hover/foco); en táctil siempre visibles.
- **Do** abrir cada página con `PageHeader` y un título idéntico a su etiqueta de navegación.
- **Do** usar el vocabulario fijo: Delegado, Acompañante, Confirmado, No asiste, Pendiente, Resumen.
- **Do** usar cifras tabulares para importes, contadores y estadísticas.
- **Do** escribir el lado invitado a 16px con objetivos táctiles de 56px o más.
- **Do** construir selecciones del invitado con radio y checkbox nativos ocultos dentro de su etiqueta, con el foco visible en la etiqueta (`has-[:focus-visible]`) y el estado dicho también en palabras.
- **Do** leer fecha, lugar y vestimenta de `src/lib/wedding.ts`.

### Don't:
- **Don't** usar bordes de 1px para separar secciones, filas o tarjetas; el único borde admitido es `outline-variant` en zonas de soltar o separadores internos de hojas modales. La ramita (Sprig) y el filete bajo las cifras de la cuenta atrás son ornamentos de línea, no bordes de sección.
- **Don't** poner botones en mayúsculas con tracking amplio; las mayúsculas espaciadas son solo para rótulos eyebrow.
- **Don't** usar `window.confirm()` ni `alert()` del navegador.
- **Don't** hacer que una acción dependa solo del hover.
- **Don't** usar negro puro, grises neutros ni sombras negras; la oscuridad deriva de la tinta `#514443`.
- **Don't** introducir colores vibrantes, neón ni fondos oscuros fuera del hero de la landing.
- **Don't** añadir pies decorativos por página.
- **Don't** tachar a las personas que no vienen ni pintarlas en rojo: van en su propio bloque, en `on-surface-variant`.
- **Don't** recortar la cuenta atrás de la landing a solo días: la versión completa (días, horas, minutos, segundos) es una decisión fijada por la pareja.
- **Don't** usar Pinyon Script fuera de los nombres de la pareja en la landing.
