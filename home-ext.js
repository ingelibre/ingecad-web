// Home page: up to four community plugins, read live from the catalog that
// /extensiones shows, each card linking to that page. The three bundled
// plugins are static HTML; without JavaScript or a catalog only they show.
(function () {
  'use strict';
  const box = document.getElementById('home-ext-grid');
  if (!box) return;
  const CATALOG = 'https://raw.githubusercontent.com/ingelibre/ingecad-extensions/main/catalog.json';
  const SHOW = 4;

  function pick(texts) {
    if (!texts || typeof texts !== 'object') return '';
    return texts.es || texts.en || texts.pt || '';
  }
  function el(tagName, cls, text) {
    const n = document.createElement(tagName);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function card(x) {
    const a = el('a', 'ext-card home-ext-card');
    a.href = '/extensiones';
    const shot = el('div', 'ext-shot');
    if (typeof x.screenshot === 'string' && /^[a-z0-9_.-]+$/.test(x.screenshot)) {
      const img = document.createElement('img');
      img.src = 'https://raw.githubusercontent.com/ingelibre/ingecad-extensions/main/screenshots/' + x.screenshot;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 600;
      img.height = 375;
      shot.appendChild(img);
    } else {
      shot.classList.add('ext-shot-none');
      shot.appendChild(el('span', '', (pick(x.name) || '?').charAt(0).toUpperCase()));
    }
    a.appendChild(shot);
    const body = el('div', 'ext-body');
    body.appendChild(el('h3', '', pick(x.name)));
    body.appendChild(el('p', 'ext-author', 'por ' + (x.author || '')));
    body.appendChild(el('p', 'ext-summary home-ext-summary', pick(x.summary)));
    a.appendChild(body);
    return a;
  }

  fetch(CATALOG, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data) => {
      const all = (data && Array.isArray(data.extensions)) ? data.extensions : [];
      // Those with a picture first, in a fresh order each visit.
      all.map((x) => [Math.random() - (x.screenshot ? 1 : 0), x])
        .sort((p, q) => p[0] - q[0])
        .slice(0, SHOW)
        .forEach((p) => box.appendChild(card(p[1])));
    })
    .catch(() => {});
})();
