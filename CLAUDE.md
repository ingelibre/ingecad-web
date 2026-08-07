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

- `principal.jpeg` — hero: plano catastral **6-cofopri-ojamoq.dwg** (planta,
  recuadros, cuadros de datos, administrador de capas). Reusada en «Lo que usas
  todos los días».
- `dwg-colega.jpeg` — **2-cerco-perimetrico.dwg**: elevaciones, secciones y
  sombreados de un cerco real.
- `planos-grandes.jpeg` — **5-sedapar.dwg**, el plano topográfico de 10 847
  entidades (el que motivó el parche Reed-Solomon de LibreDWG).
- `comandos.jpeg` — la ventana de comandos con historial real:
  `Comando: LA` / `Comando: C` / `CIRCULO Especifique el centro o [2P/3P]:`.
  Escrito con `QTest.keyClicks(win.command_line.input, ...)` — hay que apuntar
  al `input` interno, no al contenedor.

OG banner: compuesto con PIL (`web/images/og-banner.jpg`) desde el icono real y
un recorte del hero. Los hermanos lo hacen con `.cover-build/og.html` + Chromium
headless; acá con PIL directamente porque el diseño es más simple.

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
