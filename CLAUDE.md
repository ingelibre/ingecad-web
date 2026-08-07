# IngeCAD · Landing Page

Sitio web público de **IngeCAD** (https://ingecad.org) — CAD 2D libre para
Linux, con DWG de fábrica. Hermano visual de `~/Proyectos/ingetrazo/web`
(ingetrazo.com) y `~/Proyectos/ingepresupuestos/web` (ingepresupuestos.com):
mismo stack, misma estructura, mismas convenciones. **Ante la duda, el
CLAUDE.md de ingepresupuestos-web es la referencia extendida.**

Repo del producto: `~/Proyectos/ingecad/` → github.com/ingelibre/ingecad
(GPL-3.0). **Este repo es independiente del producto a propósito**: un cambio
de copy no dispara el CI del producto ni al revés. Por eso `web/` está en el
`.gitignore` de aquél.

## Stack (idéntico a los hermanos)

- HTML + CSS + JS vanilla, **sin build step**. Inter vía Google Fonts.
- Hosting: **Cloudflare Worker con assets estáticos** (`wrangler.jsonc` +
  `.assetsignore`; deploy con `npx wrangler deploy`, ver `COMO-PUBLICAR.md`).
- `script.js`: versión y **URL exacta del AppImage** desde la GitHub Releases
  API — también reescribe el bloque copiable con el nombre real del archivo y
  su tamaño en MB. Menú móvil, scroll reveal, lightbox, botón copiar.
- SEO: JSON-LD (SoftwareApplication + FAQPage — **espejados con el HTML del
  FAQ**), canonical, OG/Twitter (`images/og-banner.jpg` 1200×630), sitemap,
  robots. `_headers` con CSP (lista blanca: fonts + api.github.com).

## Identidad visual

Sistema de la familia Inge[X] con **acento por producto**:

- IngeCAD = **Lime `#479B1B`** (`--accent`), que es el eje Y del propio icono.
  Es el Lime de elementary (`#68B723`) oscurecido para que el texto blanco
  sobre él pase contraste; el `#68B723` puro queda para los degradados.
- IngeTrazo = Blueberry `#3689E6` (`--blue`); IngePresupuestos = naranja
  `#F37329` (`--orange`). Los dos aparecen SOLO en la sección puente.
- Secciones coloreadas: **DWG** = rojo suave `--straw-soft` (el eje X del
  icono), **fidelidad del archivo** = degradado lime (la tesis del producto),
  **puente** = azul suave.
- Resto idéntico a los hermanos: header slate-700, impact slate-900,
  screenshots grandes alternando lado, **español neutro** (tuteo: «escribe», «abres», «tienes» — Marco pidió
  explícitamente evitar el voseo el 2026-08-07), "Ing. Marco Sumari".

## Screenshots (`images/screenshots/`)

Todas REALES, capturadas de la app corriendo con GL. **El visor es un
QOpenGLWidget y `QScreen.grabWindow()` NO sirve**: bajo Wayland devuelve negro
porque un cliente X11 no puede leer la pantalla. Lo que funciona:

```sh
DISPLAY=:0 QT_QPA_PLATFORM=xcb venv/bin/python captura.py salida.png plano.dwg
# dentro: win.grab()  →  trae el arbol de widgets CON el FBO del visor
```

`win.grab()` bajo `xcb` con GL real sí incluye el viewport, y sale a 2× (2954×1856)
por el device pixel ratio. Después se reescala a 1600 de ancho y se guarda JPEG
progresivo q88. El script de captura vive en el scratchpad de la sesión; si hace
falta de nuevo, lo esencial es esas dos líneas.

**Las cuatro vigentes las capturó Marco el 2026-08-07**, todas del
`corpus-dwg` y todas medidas antes de escribir el pie (los conteos del copy son
reales, no estimados):

- `principal.jpeg` — hero: **0999_3.COBERTURAS.dwg** (4 228 entidades, 32 capas,
  r2013), el detalle del tijeral T-4 con nudos numerados y cotas. Reusada en «Lo
  que usas todos los días» **y dentro del banner OG**.
- `dwg-colega.jpeg` — **casa.dwg** (200 entidades, 11 capas, **r2018**): planta
  de vivienda con mobiliario, cotas y nombres de ambiente. Va en la sección de
  DWG a propósito: es r2018, o sea la prueba del bullet «Lee DWG hasta AutoCAD
  2018». Si se cambia, cambiar también ese pie.
- `planos-grandes.jpeg` — **0904_PLANTA Y PERFIL TRAZO LCCE SEDAPAR.dwg**
  (10 847 entidades, 45 capas, r2007): el plano que motivó el parche
  Reed-Solomon de LibreDWG. El `alt` cita las 10 847 — verificado.
- `comandos.jpeg` — **0333_Planos estructuras iglesia de yanaquihua.dwg**
  (6 231 entidades, **200 capas**, r2013).

⚠️ **Dos pendientes conocidos de estas cuatro**, ambos decisión de Marco:
la interfaz sale **en inglés** (menús, `type a command`, `Layers/Properties`,
`GRID/ORTHO/POLAR`) en un sitio en español; y la de la sección de la línea de
comandos muestra el prompt **en reposo**, sin ningún comando tipeado — la
anterior sí llevaba historial real (`Comando: LA`, `CIRCULO Especifique el
centro`), escrito con `QTest.keyClicks(win.command_line.input, ...)`, apuntando
al `input` interno y no al contenedor.

OG banner: `tools/gen-images.py` lo repinta, no lo rehace — ver abajo.

## Iconos — `tools/gen-images.py`

**La fuente de verdad es `resources/ingecad.svg` del repo del producto**, no una
copia acá. `python3 tools/gen-images.py` rasteriza `logo.png` (256),
`logo-512.png`, `favicon-16/32.png` y `apple-touch-icon.png` (180) con Inkscape,
y **repinta solo el parche del icono en el banner OG**: rellena el rectángulo del
mosaico con el propio degradado del banner (una rampa vertical, se muestrea de
las dos esquinas) y pega el icono nuevo en el mismo sitio y tamaño. La
tipografía del banner se compuso a mano y no vale la pena re-derivar sus
métricas: así el resto del diseño aprobado no se toca. Coordenadas medidas del
archivo aprobado: el mosaico ocupa x 76..171, y 98..189, o sea un render de
106 px en (69, 91).

## Decisiones (no revertir sin discutir)

- Sin frameworks, sin trackers, sin cookies banner.
- Descarga: **AppImage** (Linux x86_64) + código fuente. Windows se anuncia
  como «en camino» y **no** se promete: solo Linux está probado.
- **Español neutro, sin voseo.** El copy usa tuteo: «escribe L y dibuja»,
  «abres», «tienes», «puedes». Es una corrección explícita de Marco.
- **El titular es «con el espíritu del CAD clásico»**, no «que abre el DWG del
  colega»: la propuesta de valor se cuenta desde el parecido con los CAD que el
  usuario ya conoce, no desde la anécdota del archivo que le mandan. En la misma
  línea, la sección de DWG dice «abre tus archivos sin conversores» (LibreDWG
  dentro) y la de fidelidad «tu plano lo abre cualquier CAD» (r2000 → AutoCAD,
  BricsCAD, ZWCAD), no «le devuelves el plano sano».
- **La topografía (puntos con cota, cuadro de coordenadas, perfiles) NO se
  promete**: es v0.2 y hay un FAQ que lo dice explícitamente. La regla es que
  el sitio solo afirme lo que la app hace hoy — el `README.md` del producto,
  sección «Status», es la fuente de verdad para el copy.
- Iterar local con `python3 -m http.server 8765`; revisar con Chromium headless
  (`--screenshot`) antes de publicar; publicar con `npx wrangler deploy`.

## Contacto

Ing. Marco Sumari · ing.sumari@gmail.com · WhatsApp +51 998 839 090
