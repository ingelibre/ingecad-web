# Cómo publicar ingecad.org

**El `git push` no publica nada.** El sitio se sirve desde un Cloudflare Worker
con assets estáticos, y se despliega a mano.

## Los dos pasos

```sh
git add . && git commit -m "..."
git push origin main        # solo guarda el historial
npx wrangler deploy         # ESTO es lo que publica
```

## Antes de desplegar

```sh
python3 -m http.server 8765
# y revisar en el navegador, o sin navegador:
chromium-browser --headless --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1400,7200 --screenshot=/tmp/site.png \
  --virtual-time-budget=9000 http://localhost:8765/
```

Comprobar además que no quede ninguna referencia local rota:

```sh
python3 -c "
import re, os
html = open('index.html').read()
refs = set(re.findall(r'(?:src|href)=\"([^\"]+)\"', html))
falta = [r for r in refs
         if not r.startswith(('http', '#', 'mailto:')) and not os.path.exists(r)]
print('faltan:', falta or 'ninguna')"
```

## La primera vez

El dominio `ingecad.org` tiene que existir como **zona** en la cuenta de
Cloudflare (comprado ahí mismo, ya lo está). Los custom domains se declaran en
`wrangler.jsonc` → `routes`, y Cloudflare crea los registros DNS solo.

Si `wrangler` pide autenticación: `npx wrangler login` (abre el navegador).
Las credenciales quedan en `~/.config/.wrangler/config/default.toml`.

## Ojo con la CSP

`_headers` lleva una **lista blanca**. Si se agrega un script o CSS externo
nuevo, hay que sumar su dominio ahí o el navegador lo bloquea sin avisar en la
página. Ya permitidos: Google Fonts, `api.github.com` y Cloudflare Insights.

## Qué toca actualizar en cada release del producto

Nada obligatorio: `script.js` lee la versión, la fecha y la URL del AppImage de
la GitHub Releases API, y reescribe el bloque copiable con el nombre real del
archivo. Los valores del HTML son solo el fallback por si la API no responde —
conviene refrescarlos de tanto en tanto (`id="latest-version"`, `id="dl-version"`,
`id="dl-date"` y el `<code>` de la descarga).
