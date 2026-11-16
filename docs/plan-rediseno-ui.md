# Plan de rediseño UI/UX: «El manual hecho web»

Plan de implementación para un agente (Opus 5.5) que trabaja en este repo. Fecha: 16 de noviembre de 2026. Rama de partida: `master` (o la rama activa que indique David).

## 0. Cómo usar este plan

1. Lee antes de tocar nada: `CLAUDE.md`, `PRODUCT.md`, `.claude/Manual de Marca de Nuestra Boda David y Rocio.pdf` (9 páginas, es la autoridad visual) y este archivo. `DESIGN.md` describe el sistema **anterior**: sirve como inventario de componentes y reglas de accesibilidad, no como dirección visual.
2. Skills a cargar en cada sesión de implementación: `impeccable` (lee `reference/craft-floor.md` antes de editar UI), `antislop` en modo **DURANTE** (ya elegido por David, no volver a preguntar) con `antislop-ui`, `antislop-human` y `antislop-layoutmobile`, y `taste-skill` (para el panel, `references/app-screens.md`).
3. Una fase = una rama `feat/<nombre>` y un PR a `master`. Commits convencionales por sección. No hagas commit ni push sin que David lo pida.
4. Verificación mínima de cada fase: `npm run build` + `npm run lint`, revisión visual a 390, 768 y 1440 px, y los criterios de aceptación de la fase. No hay tests.
5. Todo texto de interfaz, comentario y documento va en español. Sin raya larga en ningún texto que escribas (regla R-02 de antislop): usa coma, punto, dos puntos o paréntesis.
6. No inventes datos: horarios, datos bancarios, fotos, teléfonos o textos que falten se piden a David (sección 9) o se dejan con un marcador honesto visible.
7. `DESIGN.md` se reescribe **al final** (fase 10), a partir de lo construido. `PRODUCT.md` se actualiza en la fase 0.

## 1. Decisiones confirmadas por David

| Tema | Decisión |
|---|---|
| Alcance | Nueva dirección visual para toda la app. Se conservan marca, contenido, funciones y vocabulario. |
| Autoridad visual | El manual de marca en PDF. |
| Tipografías | **Actualizado 2026-11-16:** Marcellus (títulos) + Mulish (texto y panel), elegidas por la pareja tras ver TAN Pearl en pantalla. Antes: las del manual (TAN Pearl, Glacial Indifference, Poppins). |
| TAN Pearl | Entregada: `.claude/TAN-Pearl-Regular.woff2` (un solo peso, Regular). Copiarla a `src/fonts/` en la fase 1. |
| Contacto para invitados | Solo el correo de soporte. Los teléfonos del manual no se muestran. |
| Restricciones alimentarias | Opciones cerradas más «Otra», que es un texto corto de 20 caracteres como máximo. |
| Nota de niños | Solo informativa: no impide cargar niños desde el panel. |
| Primer contacto | Sigue siendo `/login`. La portada `/` solo se ve con sesión. |
| Fotos e historia | Entran «Nuestra historia», fotos en marco polaroid y la ilustración de la pareja, **solo para usuarios con sesión**. |
| Contenido nuevo | Restricciones alimentarias por persona, sección Regalos, política de niños. |
| Política de niños | Marca por familia en el panel («familia directa»). Las familias sin la marca ven un mensaje amable de celebración para adultos. |
| Prioridad del panel | Resumen, Invitados, Mesas, Cronograma y Menú. Luego Tareas, Economía y Ajustes. |
| Cuenta atrás | Se mantiene completa: días, horas, minutos y segundos (decisión anterior, sigue vigente). |

Decisiones anteriores que este plan **deroga** (actualizar `PRODUCT.md` en fase 0): tono mixto con portada oscura sobre foto, Inter + Cormorant fijas, monograma dorado sobre fondo oscuro, «No hay fotos de la pareja».

## 2. Dirección

**Lectura de diseño.** Invitación privada y panel de organización para familias venezolanas y argentinas de todas las edades, casi siempre en el móvil, con el lenguaje del manual de marca.
Diales: lado invitado ENERGY 2 / RHYTHM 2 / MOTION 2. Panel ENERGY 1 / RHYTHM 1 / MOTION 1.

**Idea.** En esta web, la sombra de hojas que cae sobre el papel de color del manual se convierte en el suelo de cada pantalla, y el arco crema se convierte en el marco donde vive el contenido.

**Los siete rasgos del manual que deben reconocerse** (si se quitan los textos, la pantalla sigue pareciendo del manual):

1. **Campos de color plenos.** El suelo no es crema: es rosa `#d9a3a0`, rubor `#e7c6c1` u oliva. El crema `#f2eee8` es el papel que se apoya encima.
2. **Sombras botánicas.** Siluetas difusas de ramas, hojas y orquídeas proyectadas sobre el campo de color, entrando desde las esquinas (páginas 1, 3 y 9 del manual).
3. **El arco.** Panel crema con la parte superior en semicírculo, como el de «Historia» (página 3). Es el contenedor de los momentos importantes.
4. **TAN Pearl grande.** Títulos muy grandes, en caja mixta, con sus remates curvos. Nada de cursivas ni mayúsculas espaciadas.
5. **La banda oliva.** Franja oliva de lado a lado, arriba o abajo, que lleva una sola línea (la web, la fecha). También como panel lateral (página 9).
6. **El polaroid inclinado.** Foto con marco y pie ancho, girada entre 6 y 15 grados, en oliva o crema.
7. **El monograma DR** en sus dos colores oficiales (`#828A6C`, `#DF8E86`), sin variantes doradas.

**Lo que no se traslada del manual.** Los degradados crema a rosa de las páginas 5 y 6 (se usan campos planos), el emoji de corazones, y las etiquetas con forma de media píldora de la página de paleta.

**Choques con las reglas de las skills, ya resueltos con el dueño** (no volver a preguntar; anotar en el informe final):

- Tres tipografías (taste pide dos como máximo): la marca manda. Cada una tiene un solo papel (sección 4).
- Fondo cálido con rosa terracota (taste lo marca como paleta genérica): es la paleta de la marca. Se compensa con compromiso de color: campos rosa y oliva reales, no crema con un acento.
- Iconos Lucide en el panel: se quedan porque son señales funcionales de navegación y acción que el usuario ya conoce. En el lado invitado se reducen al mínimo (sección 6).

## 3. Color

Contrastes medidos con la herramienta de antislop. Los nuevos tonos derivados (tinta y oliva profundo) son puntos de partida verificados: puedes ajustarlos un paso si vuelves a medir.

| Token | Valor | Papel |
|---|---|---|
| `rosa` | `#d9a3a0` | Campo de portada y login. |
| `rubor` | `#e7c6c1` | Campo de las páginas del invitado. |
| `crema` | `#f2eee8` | Papel: arcos, hojas, suelo del panel. |
| `salvia` | `#afc3b1` | Estados positivos (viene, confirmado, pagado). |
| `oliva` | `#6f7f6a` | Bandas, marcos de polaroid, títulos grandes. |
| `oliva-profundo` | `#55634f` | Botón principal, banda con texto, barra lateral del panel. |
| `tinta` | `#364033` | Texto de lectura sobre cualquier campo claro. |
| `rosa-profundo` | `#7f5351` | Acento de texto y enlaces sobre crema. |
| `error` | `#a8423a` | Fallos y acciones destructivas. |

| Texto | Fondo | Ratio | Uso permitido |
|---|---|---|---|
| `crema` | `oliva-profundo` | 5.53 | Todo texto. |
| `oliva-profundo` | `crema` | 5.53 | Todo texto. |
| `tinta` | `rosa` | 5.00 | Todo texto. |
| `tinta` | `rubor` | mayor que 5.87 | Todo texto. |
| `tinta` | `salvia` | mayor que 4.99 | Todo texto. |
| `rosa-profundo` | `crema` | 5.58 | Todo texto. |
| `error` | `crema` | 5.18 | Todo texto. |
| `crema` | `oliva` | 3.69 | Solo títulos de 24 px o más. |
| `oliva` | `crema` | 3.69 | Solo títulos de 24 px o más. |
| `rosa-profundo` | `rubor` | 4.06 | Solo títulos de 24 px o más. |
| `crema` | `rosa` | 1.87 | **Prohibido** (así está la portada del manual: no copiar). |
| `oliva` | `rubor` | 2.69 | **Prohibido** para texto (así están los párrafos del manual). |

Reglas:

- Un solo color de acción: `oliva-profundo`. Salvia y `error` son estados, no decoración.
- Sin blanco puro y sin negro puro. Las superficies del panel se separan por pasos de tono a partir del crema (una más clara para hojas, una más oscura para zonas agrupadas); mide el contraste de cada paso que crees.
- Sombras de caja: máximo tres tokens (`contacto`, `hoja`, `modal`) definidos en `globals.css`, teñidos de `tinta`. Hoy hay 14 sombras arbitrarias distintas: eliminarlas todas.
- Sin degradados, sin brillos, sin `backdrop-blur` (hoy 4 usos: cabecera móvil y barra inferior pasan a fondo sólido).

## 4. Tipografía

| Familia | Carga | Papel único |
|---|---|---|
| TAN Pearl | `next/font/local` desde `src/fonts/TAN-Pearl-Regular.woff2` (copia de `.claude/TAN-Pearl-Regular.woff2`), solo peso 400 | Títulos a 28 px o más: nombres, títulos de sección del invitado, título de página del panel, cifras grandes. |
| Glacial Indifference | `next/font/local` (licencia SIL OFL; descarga del autor, Regular, Bold e Italic) | Texto de lectura del lado invitado, 16 px o más. |
| Poppins | `next/font/google`, pesos 400, 500 y 600 | Interfaz del panel (etiquetas, botones, datos, tablas) y botones del lado invitado. |

Tareas y comprobaciones:

- Exponer tres variables (`--font-display`, `--font-text`, `--font-ui`) en `src/app/layout.tsx` y `@theme` de `globals.css`. Quitar Inter, Cormorant y Pinyon Script.
- TAN Pearl solo tiene peso Regular: no pidas negrita ni cursiva sobre `--font-display` (el navegador las falsearía). Desactiva la síntesis con `font-synthesis: none` en los títulos.
- Antes de usar cada fuente local, comprueba los glifos `á é í ó ú ñ ü ¿ ¡ &` y las cifras. Si TAN Pearl no trae cifras adecuadas, la cuenta atrás y las cifras grandes usan Poppins 300 o 400.
- Comprueba si Poppins responde a `tabular-nums`. Si no, alinea importes a la derecha con ancho fijo por columna.
- Títulos: dos líneas como máximo en cualquier ancho. Recorta palabras antes de bajar el tamaño.
- Eliminar el patrón de rótulo diminuto: hoy hay 25 usos de `text-[10px]`/`text-[11px]`, 38 de `uppercase` y 37 de `tracking-widest` o similar. Las etiquetas pasan a 12 o 13 px, peso 500, mayúscula de frase. Las etiquetas de la barra inferior móvil, a 11 o 12 px sin mayúsculas.
- Lado invitado: cuerpo 16 px o más, nada que deba leerse por debajo de 14 px (se mantiene la regla de `PRODUCT.md` para invitados mayores).

## 5. Fase 0 y fase 1: cimientos

### Fase 0. Contexto (`feat/redesign-context`)

- Actualizar `PRODUCT.md`: compromisos de marca (tipografías, tono único claro, fotos disponibles solo con sesión), capacidades nuevas (restricciones alimentarias, regalos, política de niños) y «Evidence on Hand» (historia, fotos).
- Guardar el contrato de dirección del lado invitado con `impeccable surface-brief write` (seis bloques, ver `reference/new-work.md` sección 5). La dirección la fijó el dueño con el manual de marca, que sustituye a la tirada de direcciones: anótalo así en el bloque FORM, con la referencia `seed:e2ab47f3df750957`.

### Fase 1. Sistema (`feat/redesign-foundations`)

Tokens y fuentes de las secciones 3 y 4, más estas piezas. Colócalas donde ya vive lo compartido (`src/components/` para ambos lados, `src/app/admin/_components/ui.tsx` para el panel). No crees una librería nueva.

**Piezas de marca** (`src/components/`):

- `BotanicalShadow`: 3 o 4 siluetas SVG dibujadas en código (rama de hojas anchas, rama de orquídea, espiga), `aria-hidden`, color `tinta` con opacidad baja y desenfoque por CSS para que parezcan sombra proyectada. Se anclan a las esquinas y pueden salirse del borde. Sustituye a `Sprig`.
- `Arch`: contenedor crema con la parte superior semicircular. En móvil ocupa casi todo el ancho.
- `Polaroid`: marco con pie ancho, giro configurable, variantes oliva y crema.
- `Band`: franja oliva de ancho completo con una sola línea de texto.
- `Monogram`: quitar `tone="gold"` y `tone="dark"` si quedan sin uso tras la fase 2.

**Primitivas de interfaz** (hoy duplicadas):

- `Field`, `Input`, `Select`, `Textarea`, `Checkbox`: hoy `inputCls` está copiado en `FinanceManager`, `MenuManager`, `FamilyDialog` y en línea en `GuestsManager`, con flechas de `select` hechas a mano. Una sola definición, etiqueta real asociada, estados de foco, error y deshabilitado.
- `EmptyState`: hoy definido cuatro veces (Cronograma, Mesas, Economía, Menú). Uno solo, con texto que diga qué hacer.
- `Dialog`: envoltorio del `<dialog>` nativo (Escape, clic fuera, foco). Sustituye los 3 modales hechos con `fixed inset-0` (`TaskDetailModal`, hoja «Más» del móvil, detalle móvil del Cronograma). En móvil se presenta como hoja inferior.
- `Chip` de estado con el vocabulario fijo.
- Botones: actualizar `btnPrimary` y compañía a los tokens nuevos. Añadir tamaño grande para el invitado en lugar de clases sueltas en `RsvpForm`.
- Aviso de guardado: hoy no hay respuesta visible tras guardar. Añadir un mensaje breve con `aria-live` reutilizable. Sin dependencias nuevas.

**Arreglos de móvil para toda la app:**

- Exportar `viewport` en `src/app/layout.tsx` con `themeColor` y `viewportFit: "cover"`.
- Zonas seguras: la barra inferior usa `pb-8` fijo y no hay ningún `env(safe-area-inset-*)`. Aplicarlo a barra inferior, hojas y cabecera.
- Sustituir los 9 `min-h-screen` por `min-h-dvh`.
- Los 7 campos con `text-sm` provocan zoom en iOS: 16 px en pantallas táctiles.
- Sustituir los 59 `transition-all` por la propiedad concreta que cambia.
- Objetivos táctiles: 44 px como mínimo en punteros gruesos (hoy los botones de icono miden 32 px). El lado invitado mantiene 56 px.
- Las acciones de fila siguen visibles en táctil (`pointer-fine:` para ocultar solo con ratón).

**Aceptación de la fase 1:** ninguna pantalla rota, cero sombras arbitrarias, cero `backdrop-blur`, cero definiciones duplicadas de campos o estados vacíos, build y lint en verde.

## 6. Lado invitado

### Fase 2. Entrada (`feat/redesign-entrada`)

**Login (`/login`), primer contacto, público.** No muestra fotos, historia ni datos privados.

- Campo `rosa` a pantalla completa con sombras botánicas en dos esquinas opuestas.
- Un arco crema centrado con: monograma, «Tu invitación» en TAN Pearl, la frase que explica con qué cuenta de Google entrar, el botón de Google (56 px) y el aviso de correo no encontrado cuando aplique.
- Banda oliva al pie con `www.davidyrocio.wedding` y los enlaces legales.
- Escritorio: mismo arco, más ancho de sombra a los lados. No lo conviertas en dos columnas de texto y dibujo.
- Estados: error `AccessDenied`, botón enviando.

**Portada (`/`), solo con sesión.** Verifica en `src/proxy.ts` que sigue exigiendo sesión.

- Campo `rosa`, sin foto de fondo ni velo oscuro. Borrar `public/background-placeholder.webp` y los SVG de plantilla sin uso (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) tras comprobar con una búsqueda que nadie los referencia.
- Primer pantallazo: «David y Rocío» en TAN Pearl muy grande, la frase de invitación, la fecha y el botón «Ver mi invitación». Un polaroid inclinado con una foto real se asoma por un lado (queda fuera hasta que David entregue las fotos; sin foto, ese hueco lo ocupa una sombra botánica, no un marcador gris).
- Cuenta atrás completa en cuatro unidades. Mantener la reserva de altura antes de hidratar y `prefers-reduced-motion`.
- Lugar con enlace al mapa. Enlace «Panel de organización» para administradores.

**Bienvenida (`/welcome`), páginas legales y `error.tsx`:** mismos tokens. Las legales son de lectura: crema, una columna, sin ornamento más allá del monograma.

**Aceptación:** en 5 segundos un invitado mayor entiende qué es y qué botón tocar; contraste AA medido en todo texto sobre `rosa`; sin desbordes a 390 px; navegación completa con teclado.

### Fase 3. Invitación (`feat/redesign-invitacion`)

`/dashboard` pasa de cuatro tarjetas blancas iguales y centradas a una secuencia de campos de color con composición distinta en cada tramo. Orden:

1. **Saludo.** Campo `rubor`, nombre de la familia en TAN Pearl dentro de un arco, frase de bienvenida. Cabecera simple: monograma, «Panel» si es administrador, «Salir».
2. **Confirmación (RSVP), el foco de la página.** Hoja crema. Se conserva toda la lógica y accesibilidad actual (`fieldset`, radios y casillas nativos ocultos, foco en la etiqueta, estado dicho en palabras, plazo, bloqueo tras el cierre, vista de solo lectura). Cambios:
   - Al marcar a una persona como «Viene», aparece debajo su restricción alimentaria (ver datos).
   - **Política de niños:** si la familia no tiene la marca de familia directa, se muestra una nota dentro de «¿Quiénes vendrán?», antes de enviar. Tono cálido, sin negritas de advertencia ni color de error. Borrador para que lo aprueben David y Rocío: «Queremos que sea una noche para que los adultos la disfruten con calma, por eso la celebración será sin niños. Gracias por entenderlo y por organizarse para acompañarnos.» Las familias con la marca no ven nada.
   - Vista enviada: mismos bloques «Vienen» y «No vienen», con las restricciones indicadas.
3. **El gran día.** Campo `oliva-profundo` con texto crema. Cuándo, Dónde y Vestimenta en una composición distinta a tres columnas con icono en círculo: fecha grande en TAN Pearl, lugar con mapa, vestimenta. Los colores a evitar se muestran como las muestras tipo polaroid de la página 5 del manual, grandes y con su nombre, sin necesidad de abrir un diálogo. Horario: «por confirmar» hasta que exista. Botón «Añadir a mi calendario».
4. **Tu mesa.** Número de mesa grande y compañeros. Estado de espera si aún no hay mesa.
5. **Nuestra historia.** Campo `rubor`, arco crema con el texto del manual (corrigiendo tildes: «Rocío») y dos polaroids inclinados; la ilustración de la pareja en un tercero. En móvil los polaroids se apilan solapados por encima y por debajo del arco.
6. **Regalos.** Solo se muestra si hay datos cargados en Ajustes. Alias y CBU con botón «Copiar» y confirmación visible.
7. **Cierre.** Banda oliva con el correo de soporte y la fecha.

Iconos: solo donde ayudan a actuar (mapa, calendario, copiar, candado de plazo). Fuera los iconos decorativos en círculo.

**Privacidad de fotos e historia (requisito de David).** El `matcher` de `src/proxy.ts` excluye los archivos estáticos y `_next/image`, así que cualquier imagen en `public/` se puede abrir sin sesión con su URL. Por tanto:

- Las fotos y la ilustración no van en una ruta pública sin control. Guárdalas bajo un prefijo propio (por ejemplo `public/privado/`) y amplía el `matcher` y la lógica de `proxy.ts` para exigir sesión en ese prefijo.
- No las sirvas con el optimizador de `next/image` (su URL `/_next/image` queda fuera del control). Usa archivos `.webp` ya dimensionados y `<img>` con `width`, `height` y `alt`.
- Prueba obligatoria: pedir la URL de una foto sin cookie de sesión debe redirigir a `/login`. Pega el resultado en el PR.
- El texto de la historia solo se renderiza en `/dashboard`.

**Datos nuevos** (seguir el patrón de `CLAUDE.md`: esquema, migración idempotente en `scripts/migrate-<nombre>.ts`, acciones con `requireWrite`, invalidación de etiquetas de caché):

- `families`: marca booleana de familia directa (por defecto, falso). Casilla en `FamilyDialog` con texto que explique el efecto. Solo con permiso `families.write`.
- `users`: restricción alimentaria. Opciones cerradas que coincidan con las etiquetas que ya usa el Menú (sin gluten, sin lactosa, vegetariano o vegano según exista) más «Otra», que abre un texto corto de 20 caracteres como máximo. El límite se aplica en el campo (`maxLength={20}`, con contador visible) y otra vez en servidor (recortar espacios y rechazar si supera 20). Se guarda en la misma acción `updateFamilyRsvp`, validando en servidor que el usuario pertenece a la familia.
- Regalos: claves en `event_config` editables en Ajustes (titular, alias, CBU, nota). Invalidar la etiqueta `config`.
- Panel: la restricción se ve en la pestaña de personas de Invitados y se resume por tipo en Menú.

**Aceptación:** confirmar asistencia sigue costando menos de un minuto en móvil; estados vacío, cargando y error en cada bloque con datos; ninguna familia directa ve la nota de niños y todas las demás sí; fotos inaccesibles sin sesión.

## 7. Panel de organización

Modo operar: precisión y coherencia antes que expresión. La marca vive en la barra lateral oliva, los títulos en TAN Pearl y el color de acción. Fondo crema, sin sombras botánicas dentro de las pantallas de trabajo (como mucho una, estática, en estados vacíos).

### Fase 4. Estructura (`feat/redesign-panel-shell`)

- Barra lateral de escritorio en `oliva-profundo` con texto crema (el panel lateral de la página 9 del manual). Elemento activo como hoja crema.
- Móvil: cabecera y barra inferior sólidas, con zona segura. Etiquetas legibles sin mayúsculas. «Más» abre el `Dialog` como hoja inferior.
- Mantener una sola lista de navegación compartida entre `AdminSidebar` y `AdminMobileNav` (hoy está copiada en los dos archivos).
- `PageHeader` con título en TAN Pearl. `loading.tsx` con esqueleto por sección, no uno genérico.

### Fase 5. Resumen (`feat/redesign-resumen`)

Hoy: seis tarjetas de cifra iguales y, debajo, las listas. La pantalla no dice qué hacer primero.

- Arriba y más grande: **«Por resolver»**, la lista de lo que hay que perseguir, con su estado vacío («Todo al día»).
- Las cifras pasan a una franja compacta de estado (una fila en escritorio, lista en dos columnas en móvil), cada una enlazada a su sección. Sin seis tarjetas idénticas.
- Días que faltan como cifra grande de cabecera.
- «Próximas tareas» y «Últimas confirmaciones» como listas secundarias.
- En móvil el orden es: días, por resolver, estado, listas.

### Fase 6. Invitados (`feat/redesign-invitados`)

- Escritorio: lista a la izquierda y detalle de la familia a la derecha (mismo patrón que ya usa Cronograma). Móvil: lista y detalle en hoja a pantalla completa.
- Filtros visibles como opciones de un toque (Todas, Sin responder, Sin delegado), no como desplegables.
- Alta de familia y alta masiva de personas dentro del `Dialog`, no como formularios que empujan la página. En móvil cada persona es un bloque apilado, no una fila de doce columnas.
- Nuevos campos: familia directa y restricción alimentaria.
- Estados: sin familias, sin resultados de búsqueda, guardando, error al guardar.

### Fase 7. Mesas (`feat/redesign-mesas`)

- Arrastrar funciona mal con el dedo: añadir alternativa de un toque (tocar a la persona, elegir mesa en una hoja). El arrastre queda como atajo con ratón.
- «Sin mesa» siempre a la vista: columna fija en escritorio, franja superior plegable en móvil.
- Capacidad de cada mesa legible de un vistazo, con el exceso en `error` y texto.
- Revisar `TablePlan` y `/seating-chart` con los tokens nuevos. El imprimible va en blanco y negro limpio: comprobar con la vista previa de impresión.

### Fase 8. Cronograma y Menú (`feat/redesign-cronograma-menu`)

- Cronograma: conservar lista y detalle. Unificar el panel de detalle con el de Invitados. El modo «día del evento» necesita objetivos grandes y alto contraste: se usa de pie, con prisa y a pleno sol.
- Menú: grupos por momento con jerarquía clara, «Por asignar» destacado sin pintarlo todo de rojo, etiquetas de dieta coherentes con las del RSVP, resumen de restricciones de los invitados.
- Formularios con las primitivas de la fase 1.

### Fase 9. Tareas, Economía y Ajustes (`feat/redesign-resto-panel`)

- Tareas: `TaskDetailModal` pasa al `Dialog`. Fuera rótulos de 10 px.
- Economía: importes alineados y con cifras de ancho estable. Cuotas vencidas con texto además de color.
- Ajustes: formulario de regalos y la nota de que los permisos se aplican al volver a iniciar sesión.

**Aceptación común del panel (fases 4 a 9):** lo mismo se hace igual en todas las secciones (crear, editar, borrar, filtrar); toda acción destructiva pasa por `useConfirm()`; nada depende del hover; cada sección tiene estado vacío, cargando y error; permisos de lectura y escritura comprobados en página y en cada acción, sin cambios de comportamiento.

## 8. Fase 10: movimiento, cierre y documentación (`feat/redesign-cierre`)

**Movimiento.** Solo `transform` y `opacity`, siempre con alternativa para `prefers-reduced-motion`.

- Invitado: entrada escalonada de título, texto e imagen por sección; las sombras botánicas con un vaivén muy lento en portada y login; respuesta al tocar en cada control; el momento de enviar el RSVP como única animación celebratoria.
- Panel: solo respuesta de controles, apertura de diálogos y hojas, y reordenación al arrastrar.

**Puertas de calidad, en este orden:**

1. `npm run build` y `npm run lint`.
2. Detector de impeccable una sola vez sobre lo cambiado: `impeccable detect --json <rutas>`.
3. Inspector de taste a 390, 768 y 1440 (`inspect.mjs`, con `--app` para el panel). Necesita Node 22 y Chrome; si no están, dilo en el informe.
4. Contraste: medir cada par texto y fondo nuevo con la herramienta de antislop.
5. Recorrido manual con teclado y a 390 px de cada pantalla, pulsando cada control. Anotar el resultado control por control.
6. Puerta de entrega de antislop (cuatro bloques) como informe PASS o FAIL con evidencia. Con un FAIL no se entrega.
7. Revisor final de impeccable (`impeccable-finish-reviewer`) con capturas de escritorio y móvil.

**Documentación.** Reescribir `DESIGN.md` desde lo construido con el documentador de impeccable. Actualizar `CLAUDE.md` (sección Design: tipografías, paleta, piezas de marca, regla de fotos privadas).

## 9. Lo que David debe entregar

| Qué | Para qué fase | Si falta |
|---|---|---|
| Fotos originales (las dos del manual o las que elijan) y la ilustración, en buena resolución | 2 y 3 | Portada e historia salen sin polaroids. |
| Aprobación o corrección del texto de la política de niños | 3 | No se publica la nota. |
| Datos de regalos: titular, alias, CBU, nota | 3 | La sección no aparece. |
| Horario de ceremonia y fiesta | 3 | Se mantiene «por confirmar». |
| Lista de familias directas | 3 | Todas ven la nota hasta que se marquen: avisar antes de desplegar. |

## 10. Decisión resuelta

La portada (`/`) **se mantiene oscura y dorada** (respuesta de David, 16 de noviembre de 2026): foto de fondo con velo verde noche (`--color-noche`) y monograma `tone="gold"`. Solo cambian tipografías, cuenta atrás y detalles. Ignorar en la fase 2 las líneas de la portada que dicen campo rosa o borrar `background-placeholder.webp`.

## 11. Reglas duras (valen para todas las fases)

- No cambiar comportamiento, permisos, rutas ni acciones de servidor salvo lo que este plan pide de forma explícita.
- Nada de datos inventados, testimonios, cifras ni secciones de relleno.
- Sin dependencias nuevas sin preguntar.
- Sin bordes de 1 px para separar secciones: pasos de tono y espacio.
- Vocabulario fijo: Delegado, Acompañante, Confirmado, No asiste, Pendiente, Resumen.
- Fechas con `src/lib/dates.ts`. Dinero con `src/lib/money.ts`. Lecturas compartidas desde `src/lib/data.ts`.
- Informe final de cada fase: qué se hizo, qué se verificó y cómo, qué quedó pendiente. No afirmar una comprobación que no se ejecutó.
