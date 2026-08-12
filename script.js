/* IngeCAD — landing interactions (espejo del patrón de ingepresupuestos.com):
   versión desde GitHub Releases, menú móvil, scroll reveal, lightbox, copiar. */
(function () {
  'use strict';

  /* ── Versión + fecha desde GitHub Releases ─────────────────────────── */
  fetch('https://api.github.com/repos/ingelibre/ingecad/releases/latest')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rel) {
      if (!rel || !rel.tag_name) return;
      var v = rel.tag_name.replace(/^v/, '');
      var el = document.getElementById('latest-version');
      if (el) el.textContent = 'v' + v;
      var dv = document.getElementById('dl-version');
      if (dv) dv.textContent = v;
      if (rel.published_at) {
        var d = new Date(rel.published_at);
        var dd = document.getElementById('dl-date');
        if (dd) dd.textContent = d.toLocaleDateString('es-PE',
          { year: 'numeric', month: 'long' });
      }
      /* URL exacta de cada artefacto del release, su tamaño real, y el
         comando copiable con el nombre exacto del archivo. */
      function updateCard(cardId, label, a, codeId, lines, copyCmd) {
        var btn = document.getElementById(cardId);
        if (btn) {
          btn.href = a.browser_download_url;
          var size = btn.querySelector('span');
          if (size && a.size) {
            size.textContent = label + ' · ' +
              Math.round(a.size / 1048576) + ' MB';
          }
        }
        var box = document.getElementById(codeId);
        if (box) {
          var code = box.querySelector('code');
          var copy = box.querySelector('.dl-code-copy');
          if (code) code.textContent = lines;
          if (copy) copy.setAttribute('data-copy', copyCmd);
        }
      }
      (rel.assets || []).forEach(function (a) {
        if (/\.AppImage$/.test(a.name)) {
          updateCard('dl-appimage', 'no instala nada', a, 'dl-code-appimage',
            'chmod +x ' + a.name + '\n./' + a.name,
            'chmod +x ' + a.name + ' && ./' + a.name);
        } else if (/\.tar\.gz$/.test(a.name)) {
          var dir = a.name.replace(/-linux-[^-]+\.tar\.gz$/, '');
          updateCard('dl-tarball', 'sin FUSE', a, 'dl-code-tarball',
            'tar -xzf ' + a.name + '\n' + dir + '/ingecad',
            'tar -xzf ' + a.name + ' && ' + dir + '/ingecad');
        }
      });
    })
    .catch(function () { /* fallback: valores estáticos del HTML */ });

  /* ── Menú móvil ─────────────────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* ── Scroll reveal ──────────────────────────────────────────────────── */
  var revealed = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── Lightbox ───────────────────────────────────────────────────────── */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var close = function () {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
    };
    document.querySelectorAll('img.zoomable').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target !== lbImg) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ── Copiar comandos de instalación ─────────────────────────────────── */
  document.querySelectorAll('.dl-code-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = '¡Copiado!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copiar';
          btn.classList.remove('copied');
        }, 2200);
      });
    });
  });
})();
