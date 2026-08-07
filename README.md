# ingecad.org

Landing page de **IngeCAD** — CAD 2D libre para Linux, con DWG de fábrica.

HTML + CSS + JS vanilla, sin build step. Se sirve como assets estáticos de un
Cloudflare Worker.

```sh
python3 -m http.server 8765     # iterar en http://localhost:8765
npx wrangler deploy             # publicar (el git push NO publica)
```

Ver `COMO-PUBLICAR.md` para el despliegue y `CLAUDE.md` para las convenciones
(paleta, capturas, qué se promete y qué no).

Producto: [github.com/ingelibre/ingecad](https://github.com/ingelibre/ingecad) ·
GPL-3.0 · © 2026 Marco Sumari Tellez
