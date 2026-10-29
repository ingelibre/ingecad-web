// Página de complementos: dibuja las tarjetas de la comunidad desde el
// catalog.json del repositorio del catálogo
// (github.com/ingelibre/ingecad-extensions). Aprobar una ficha allí
// actualiza esta página sin publicar nada: el JSON se lee en cada visita.
// Todo lo que viene del catálogo se escribe con textContent — una ficha
// nunca puede inyectar HTML. Sin catálogo (sin red, o vacío) la página
// sigue sirviendo: los complementos incluidos están en el HTML.

(function () {
  'use strict';

  const grid = document.getElementById('ext-grid');
  if (!grid) return;

  const CATALOG = 'https://raw.githubusercontent.com/ingelibre/ingecad-extensions/main/catalog.json';
  const SHOTS = 'https://raw.githubusercontent.com/ingelibre/ingecad-extensions/main/screenshots/';
  const lang = 'es';

  const ui = {
    download: 'Descargar', code: 'Ver código', reviewed: 'Revisado',
    community: 'Comunidad', by: 'por', tested: 'Probado con IngeCAD',
    count: (n, t) => n === t ? `${t} complementos` : `${n} de ${t} complementos`,
    one: '1 complemento', none: 'Ningún complemento coincide con la búsqueda.',
    all: 'Todos', updated: 'actualizado',
    more: (n) => `Ver más (${n})`,
    tags: {
      topography: 'Topografía', civil: 'Ingeniería civil',
      architecture: 'Arquitectura', structures: 'Estructuras', gis: 'SIG',
      'import-export': 'Importar/exportar', drawing: 'Dibujo',
      annotation: 'Anotación', productivity: 'Productividad',
      education: 'Educación', other: 'Otros',
    },
  };

  const q = document.getElementById('ext-q');
  const onlyReviewed = document.getElementById('ext-reviewed');
  const tagBox = document.getElementById('ext-tags');
  const count = document.getElementById('ext-count');
  const sortBy = document.getElementById('ext-sort');
  const more = document.getElementById('ext-more');
  const tools = document.getElementById('ext-tools');
  const empty = document.getElementById('ext-empty');
  const offline = document.getElementById('ext-offline');
  const PAGE = 12;
  let limit = PAGE;
  let all = [];
  let tag = '';

  // Spanish, else English, else Portuguese.
  function pick(texts) {
    if (!texts || typeof texts !== 'object') return '';
    return texts[lang] || texts.es || texts.en || texts.pt || '';
  }

  function safeUrl(u) {
    return typeof u === 'string' && u.startsWith('https://') ? u : null;
  }

  function el(tagName, cls, text) {
    const n = document.createElement(tagName);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // «2026-10-15T15:48Z» (catalog.py, UTC) → «15 oct 2026».
  function day(stamp) {
    const d = typeof stamp === 'string' ? new Date(stamp) : null;
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function card(x) {
    const c = el('article', 'ext-card');
    const shot = el('div', 'ext-shot');
    if (typeof x.screenshot === 'string' && /^[a-z0-9_.-]+$/.test(x.screenshot)) {
      const img = document.createElement('img');
      img.src = SHOTS + x.screenshot;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 600;
      img.height = 375;
      shot.appendChild(img);
    } else {
      shot.classList.add('ext-shot-none');
      shot.appendChild(el('span', '', (pick(x.name) || '?').charAt(0).toUpperCase()));
    }
    c.appendChild(shot);

    const body = el('div', 'ext-body');
    const top = el('div', 'ext-top');
    top.appendChild(el('h3', '', pick(x.name)));
    top.appendChild(el('span', x.reviewed ? 'ext-badge ext-badge-ok' : 'ext-badge',
      x.reviewed ? ui.reviewed : ui.community));
    body.appendChild(top);
    body.appendChild(el('p', 'ext-author', `${ui.by} ${x.author || ''}`));
    body.appendChild(el('p', 'ext-summary', pick(x.summary)));

    const tags = el('div', 'ext-card-tags');
    (x.tags || []).forEach((t) => tags.appendChild(el('span', '', ui.tags[t] || t)));
    body.appendChild(tags);

    body.appendChild(el('p', 'ext-meta',
      `v${x.version} · ${x.license} · ${ui.tested} ${x.ingecad}`
      + (day(x.updated_at) ? ` · ${ui.updated} ${day(x.updated_at)}` : '')));

    const links = el('div', 'ext-links');
    const dl = safeUrl(x.download);
    if (dl) {
      const a = el('a', 'btn btn-primary btn-sm', ui.download);
      a.href = dl;
      a.rel = 'nofollow noopener';
      if (typeof x.sha256 === 'string') a.title = 'SHA-256: ' + x.sha256;
      links.appendChild(a);
    }
    const repo = safeUrl(x.repository);
    if (repo) {
      const a = el('a', 'ext-code', ui.code + ' →');
      a.href = repo;
      a.target = '_blank';
      a.rel = 'noopener nofollow';
      links.appendChild(a);
    }
    body.appendChild(links);
    c.appendChild(body);
    return c;
  }

  // The catalog's own order is «reviewed first, then by name»; the other
  // two sort a copy. An entry without dates (never merged) goes last.
  function sorted(list) {
    const mode = sortBy ? sortBy.value : '';
    if (mode === 'recent') {
      return [...list].sort((a, b) =>
        String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
    }
    if (mode === 'name') {
      return [...list].sort((a, b) =>
        pick(a.name).localeCompare(pick(b.name), lang, { sensitivity: 'base' }));
    }
    return list;
  }

  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function haystack(x) {
    const parts = [x.id, x.author];
    ['name', 'summary'].forEach((k) => {
      if (x[k] && typeof x[k] === 'object') parts.push(...Object.values(x[k]));
    });
    (x.tags || []).forEach((t) => parts.push(t, ui.tags[t] || ''));
    return fold(parts.join(' '));
  }

  function render() {
    const words = fold(q.value || '').split(/\s+/).filter(Boolean);
    const shown = all.filter((x) =>
      (!onlyReviewed.checked || x.reviewed) &&
      (!tag || (x.tags || []).includes(tag)) &&
      words.every((w) => x._h.includes(w)));
    grid.replaceChildren(...sorted(shown).slice(0, limit).map(card));
    const left = shown.length - limit;
    more.hidden = left <= 0;
    more.textContent = ui.more(left);
    if (!shown.length) count.textContent = ui.none;
    else count.textContent = all.length === 1 ? ui.one : ui.count(shown.length, all.length);
  }

  function chips() {
    const used = new Set();
    all.forEach((x) => (x.tags || []).forEach((t) => used.add(t)));
    const make = (value, label) => {
      const b = el('button', 'ext-chip', label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tag === value));
      b.addEventListener('click', () => {
        tag = value;
        tagBox.querySelectorAll('.ext-chip').forEach((o) =>
          o.setAttribute('aria-pressed', String(o === b)));
        refilter();
      });
      return b;
    };
    tagBox.replaceChildren(make('', ui.all),
      ...[...used].sort((a, b) => (ui.tags[a] || a).localeCompare(ui.tags[b] || b))
        .map((t) => make(t, ui.tags[t] || t)));
  }

  function show(state) {
    // state: 'list' | 'empty' | 'offline'
    tools.hidden = state !== 'list';
    tagBox.hidden = state !== 'list';
    count.hidden = state !== 'list';
    empty.hidden = state !== 'empty';
    offline.hidden = state !== 'offline';
    if (state !== 'list') { grid.replaceChildren(); more.hidden = true; }
  }

  const refilter = () => { limit = PAGE; render(); };
  q.addEventListener('input', refilter);
  onlyReviewed.addEventListener('change', refilter);
  sortBy.addEventListener('change', refilter);
  more.addEventListener('click', () => { limit += PAGE; render(); });

  fetch(CATALOG, { headers: { Accept: 'application/json' }, cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      if (!data || data.format !== 1) throw new Error('format');
      all = (data.extensions || []).filter((x) => x && typeof x === 'object');
      if (!all.length) { show('empty'); return; }
      all.forEach((x) => { x._h = haystack(x); });
      show('list');
      chips();
      render();
    })
    .catch(() => { show('offline'); });
})();
