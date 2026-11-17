---
name: David & Rocío
description: Invitación privada y panel de organización de la boda de David y Rocío (2 de abril de 2027). Sistema derivado del manual de marca.
colors:
  rosa: "#d9a3a0"
  rubor: "#e7c6c1"
  crema: "#f2eee8"
  salvia: "#afc3b1"
  oliva: "#6f7f6a"
  oliva-profundo: "#55634f"
  tinta: "#364033"
  rosa-profundo: "#7f5351"
  noche: "#1e2419"
  mono-d: "#828a6c"
  mono-r: "#df8e86"
  surface: "#f2eee8"
  surface-container-lowest: "#faf8f3"
  surface-container-low: "#eae4da"
  surface-container: "#e1d9cc"
  primary: "#55634f"
  on-primary: "#f2eee8"
  primary-container: "#e7c6c1"
  on-primary-container: "#364033"
  secondary-container: "#d5e2d6"
  on-secondary-container: "#46594a"
  on-surface: "#364033"
  on-surface-variant: "#5c5f52"
  outline-variant: "rgba(54, 64, 51, 0.16)"
  error: "#a8423a"
  on-error: "#faf8f3"
typography:
  display:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 0.95
  headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1
  text-guest:
    fontFamily: "Mulish, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  ui:
    fontFamily: "Mulish, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  ui-row:
    fontFamily: "Mulish, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  label:
    fontFamily: "Mulish, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  meta:
    fontFamily: "Mulish, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
  numerals:
    fontFamily: "Mulish, system-ui, sans-serif"
    fontWeight: 300
    fontFeature: "tnum"
rounded:
  lg: "0.5rem"
  xl: "0.75rem"
  2xl: "1rem"
  3xl: "1.5rem"
  sheet: "2rem"
  full: "9999px"
shadows:
  sm: "0 1px 2px rgba(54,64,51,.08), 0 1px 3px rgba(54,64,51,.06)"
  md: "0 12px 32px -14px rgba(54,64,51,.22)"
  xl: "0 28px 64px -24px rgba(54,64,51,.4)"
---

# Sistema de diseño: David & Rocío

Autoridad visual: `.claude/Manual de Marca de Nuestra Boda David y Rocio.pdf`. Tokens en `src/app/globals.css` (`@theme`). Este documento describe lo construido en el rediseño de noviembre de 2026.

## Idea

En cada pantalla del invitado, la sombra de hojas que cae sobre el papel de color del manual es el suelo, y el arco crema es el marco del contenido. El panel usa el mismo vocabulario con contención: barra lateral oliva, títulos en Marcellus, fondo crema.

Siete rasgos que deben reconocerse sin leer el texto: campos de color plenos, sombras botánicas, arco crema, Marcellus grande, banda oliva, polaroid inclinado y monograma DR.

## Color

- **Campos:** `rosa` (login), `rubor` (invitación, bienvenida, error, historia), `oliva-profundo` («El gran día», bandas, barra lateral). `noche` solo en la portada `/` (decisión de la pareja: foto con velo y monograma dorado).
- **Papel:** `crema` y las superficies del panel (`surface` → `surface-container-low` → `surface-container`; `surface-container-lowest` es la hoja que se apoya encima). Sin blanco ni negro puros.
- **Acción:** un solo color, `primary` = `oliva-profundo`. Salvia (`secondary-container`) = viene / confirmado / bien. `error` = fallos y borrados.
- **Estado de una familia** (`RsvpChip` y `rsvpSelectCls` en `ui.tsx`): Confirmado = `salvia` con tinta (5.8:1), No asiste = `rosa` con tinta (5.0:1), Pendiente = `ambar` con `on-ambar` (6.3:1). Siempre con ícono (✓, ✕, reloj), nunca solo color. `ambar` es el único color fuera del manual y solo se usa para «Pendiente».
- **Texto:** `tinta` para leer sobre cualquier campo claro. `crema` sobre `oliva-profundo` (5.5:1).
- **Prohibido (contraste medido):** crema sobre `rosa` (1.9:1), `oliva` sobre `rubor` (2.7:1). `oliva` y `rosa-profundo` como texto solo a 24px o más sobre `crema` / `rubor`.

## Tipografía

Pareja «Inscripción serena» (decisión de la pareja, 2026-11-16; sustituye a TAN Pearl, Glacial Indifference y Poppins del manual). Ambas por `next/font/google`, licencia SIL OFL.

- **Marcellus** (`font-serif`): títulos y subtítulos, 20px o más. Un solo peso (Regular): `font-synthesis: none`, sin negrita ni cursiva; la jerarquía se hace con el tamaño.
- **Mulish** (`font-sans` en la interfaz, `font-text` en el texto de lectura del invitado): párrafos, panel, botones, datos. Cifras grandes (cuenta atrás, días, importes) en Mulish ligera con `tabular-nums`.
- Etiquetas de campo a 13px peso 500, mayúscula de frase. Sin rótulos diminutos en mayúsculas espaciadas.
- Títulos: dos líneas como máximo, `text-balance`.

## Piezas de marca (`src/components/`)

- `BotanicalShadow` (`variant`: rama, orquidea, espiga; `sway` opcional): siluetas SVG difusas, `aria-hidden`, color por `text-…` (sobre rubor/rosa: `text-rosa-profundo/15–30`).
- `Arch`: papel crema con semicírculo superior (`rounded-t-[50cqw]` sobre un contenedor). `className` va al contenedor (ancho, márgenes); `innerClassName` al papel (alineación, espaciado).
- `Polaroid`: marco oliva o crema con pie ancho, girado. Usa `<img>` plano.
- `Band`: franja `oliva-profundo` con una línea; pie de login e invitación.
- `Monogram`: `light` (por defecto), `crema` (sobre oliva), `gold` (solo portada).
- `Dialog`: `<dialog>` nativo; hoja inferior en móvil, centrado desde `sm`.
- `DatePicker`: calendario propio (semana desde el lunes, días de 44px en táctil, hoy con anillo, el día de la boda con punto `mono-r`). Escritorio: popover junto al campo; móvil: hoja inferior. Sustituye a `<input type="date">`.

## Panel (`src/app/admin/_components/`)

- `ui.tsx` es la única fuente de botones (`btnPrimary`, `btnSecondary`, `btnGhost`, `btnDanger`, `btnPrimarySm`, `btnGhostSm`, `iconBtn`, `iconBtnDanger`), campos (`inputCls`, `inputSmCls`, `selectCls`, `Field`, `Checkbox`), `EmptyState`, `Chip` + `RSVP_CHIP`, `PageHeader`, `StatCard`, `Tabs`.
- `nav.ts`: lista única de secciones para barra lateral y barra inferior.
- `useConfirm()` para todo borrado; `useNotify()` para avisar tras guardar o fallar (región `aria-live`).
- Patrón lista + detalle: panel lateral fijo en escritorio, `Dialog` en móvil (Invitados, Cronograma). Altas y ediciones en `Dialog`.
- Mesas: tocar a una persona abre el selector de mesa; el arrastre queda como atajo con ratón.

## Forma y profundidad

- Radios: 8px controles compactos, 12px botones y campos, 16px filas y tarjetas, 24px diálogos y secciones, 2rem hojas del invitado, píldora para chips.
- Tres sombras teñidas de tinta: `shadow-sm` (contacto), `shadow-md` (hoja levantada, arrastre), `shadow-xl` (modal). Sin sombras arbitrarias, sin `backdrop-blur`, sin bordes de 1px para separar: pasos de tono.
- Excepciones: el imprimible `/seating-chart` usa bordes en gris para papel; la zona vacía de soltar del Menú usa contorno discontinuo.

## Táctil y móvil

- Objetivos de 44px en punteros gruesos (`pointer-fine:` reduce a 32px con ratón); 56px en el lado invitado (64px las opciones del RSVP).
- Acciones de fila visibles en táctil; con ratón aparecen al pasar o enfocar.
- `min-h-dvh`, zonas seguras con `env(safe-area-inset-*)`, campos a 16px en táctil (sin zoom de iOS).

## Movimiento

- `animate-rise`: entrada de bloques del invitado (escalonada con `animation-delay`).
- `animate-sway`: vaivén lento de las sombras botánicas en login e invitación.
- Diálogos con fundido y deslizamiento. Todo se anula con `prefers-reduced-motion`.

## Vocabulario

Delegado, Acompañante, Confirmado, No asiste, Pendiente, Resumen. Títulos de página = etiquetas de navegación.
