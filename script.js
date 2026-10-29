/* IngeCAD — landing interactions (same pattern as ingetrazo.com):
   live figures and the latest release from the GitHub API, the
   announcement bar, the hero download button for the visitor's system,
   mobile menu, scroll reveal, lightbox, install tabs and copy buttons. */
(function () {
  'use strict';

  /* Reveal animations only when this script runs: without JS nothing hides. */
  document.documentElement.classList.add('js');

  /* ── Cifras en vivo (franja bajo la portada) ────────────────────────── */
  function setStat(name, n, round) {
    var el = document.querySelector('[data-stat="' + name + '"]');
    if (!el || !n) return;
    if (round) n = Math.floor(n / round) * round;
    el.textContent = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (round ? '+' : '');
  }
  fetch('https://api.github.com/repos/ingelibre/ingecad')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (repo) { if (repo) setStat('stars', repo.stargazers_count); })
    .catch(function () {});

  /* ── Aviso de nueva versión ─────────────────────────────────────────── */
  function avisoCerrado() {
    try { return localStorage.getItem('aviso-cerrado'); } catch (e) { return null; }
  }
  function ocultarAviso() {
    var bar = document.getElementById('announce');
    if (bar) bar.hidden = true;
  }
  var announce = document.getElementById('announce');
  if (announce) {
    var avEl = document.getElementById('announce-version');
    if (avEl && avisoCerrado() === avEl.textContent) ocultarAviso();
    announce.querySelector('.announce-close').addEventListener('click', function () {
      try { localStorage.setItem('aviso-cerrado', avEl ? avEl.textContent : ''); } catch (e) {}
      ocultarAviso();
    });
  }

  /* ── Versión, fecha, descargas y archivos desde GitHub Releases ────── */
  /* One request brings the latest release and the downloads of all. */
  fetch('https://api.github.com/repos/ingelibre/ingecad/releases?per_page=100')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (list) {
      if (!list || !list.length) return;
      var total = 0;
      list.forEach(function (x) {
        (x.assets || []).forEach(function (a) { total += a.download_count || 0; });
      });
      setStat('downloads', total, total >= 1000 ? 100 : 0);

      var rel = list.filter(function (x) { return !x.draft && !x.prerelease; })[0];
      if (!rel || !rel.tag_name) return;
      var v = rel.tag_name.replace(/^v/, '');
      var av = document.getElementById('announce-version');
      if (av) av.textContent = 'v' + v;
      /* the bar announces a release for 60 days, and not one already dismissed */
      if (rel.published_at && Date.now() - new Date(rel.published_at) > 60 * 864e5) ocultarAviso();
      else if (avisoCerrado() === 'v' + v) ocultarAviso();
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
        var box = codeId ? document.getElementById(codeId) : null;
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
        } else if (/^ingecad-setup-v.*\.exe$/.test(a.name)) {
          updateCard('dl-win-setup', 'menú Inicio · abre .dwg', a);
        } else if (/-windows-x64\.zip$/.test(a.name)) {
          updateCard('dl-win-zip', 'sin instalar', a);
        } else if (/\.snap$/.test(a.name)) {
          updateCard('dl-snap', 'archivo .snap', a, 'dl-code-snap',
            'sudo snap install --dangerous ' + a.name + '\ningecad',
            'sudo snap install --dangerous ' + a.name + ' && ingecad');
        } else if (/\.tar\.gz$/.test(a.name)) {
          var dir = a.name.replace(/-linux-[^-]+\.tar\.gz$/, '');
          updateCard('dl-tarball', 'sin FUSE', a, 'dl-code-tarball',
            'tar -xzf ' + a.name + '\n' + dir + '/ingecad',
            'tar -xzf ' + a.name + ' && ' + dir + '/ingecad');
        }
        /* The Flatpak card keeps its .flatpakref: it installs from our
           repository, which is what makes updates arrive on their own. */
      });
    })
    .catch(function () { /* fallback: valores estáticos del HTML */ });

  /* ── Portada: el botón descarga directo para el sistema del visitante ─ */
  var hbtn = document.getElementById('hero-dl');
  if (hbtn) {
    var ua = navigator.userAgent;
    var pick = /Windows/.test(ua) ? ['dl-win-setup', 'Descargar para Windows']
      : /Linux|X11/.test(ua) && !/Android/.test(ua) ? ['dl-flatpak', 'Descargar para Linux (Flatpak)']
      : null;                          /* Mac, phones: the button goes to all the options */
    var card = pick && document.getElementById(pick[0]);
    if (card) {
      hbtn.textContent = pick[1];
      var ico = card.querySelector('svg');
      if (ico) hbtn.insertBefore(ico.cloneNode(true), hbtn.firstChild);
      /* the link is read on click: the GitHub API updates it later */
      hbtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = card.href;
        thanks();
      });
    }
  }

  /* ── Tras descargar: gracias y una invitación a apoyar ─────────────── */
  var thanksShown = false;
  function thanks() {
    if (thanksShown) return;
    thanksShown = true;
    var box = document.createElement('div');
    box.className = 'dl-thanks';
    box.setAttribute('role', 'status');
    var txt = document.createElement('div');
    var h = document.createElement('strong'); h.textContent = '¡Gracias por descargar IngeCAD!';
    var p = document.createElement('span');
    p.textContent = 'Es libre y lo hace una persona. Si te ahorra horas, puedes apoyarlo.';
    txt.appendChild(h); txt.appendChild(p);
    var a = document.createElement('a');
    a.className = 'btn btn-heart btn-sm'; a.href = '/apoyar'; a.textContent = 'Apoyar';
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'dl-thanks-close'; x.setAttribute('aria-label', 'Cerrar');
    x.textContent = '×';
    x.addEventListener('click', function () { box.classList.remove('show'); });
    box.appendChild(txt); box.appendChild(a); box.appendChild(x);
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('show'); }, 600);
  }
  document.querySelectorAll('a.dl-card').forEach(function (c) {
    c.addEventListener('click', thanks);
  });

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
    var lbCap = document.createElement('p');
    lbCap.className = 'lightbox-caption';
    lightbox.appendChild(lbCap);
    var close = function () {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
    };
    document.querySelectorAll('img.zoomable').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lbCap.textContent = img.getAttribute('data-caption') || img.alt || '';
        lbCap.hidden = !lbCap.textContent;
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

  /* ── «Cómo instalar»: cerrado de entrada; cada pestaña despliega su
     panel y un segundo clic en la misma lo vuelve a plegar. ─────────── */
  document.querySelectorAll('.dl-howto').forEach(function (box) {
    var tabs = box.querySelectorAll('.dl-tab');
    var foot = box.querySelector('.dl-howto-foot');
    /* without JS every panel stays open; with it they start folded */
    box.querySelectorAll('.dl-panel').forEach(function (p) { p.hidden = true; });
    if (foot) foot.hidden = true;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.classList.contains('is-active') ? null : tab.getAttribute('data-tab');
        tabs.forEach(function (t) {
          var on = t.getAttribute('data-tab') === name;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        box.querySelectorAll('.dl-panel').forEach(function (p) {
          p.hidden = p.getAttribute('data-panel') !== name;
        });
        if (foot) foot.hidden = !name;
        box.classList.toggle('is-open', !!name);
      });
    });
  });

  /* ── Copiar comandos de instalación y datos de aporte ───────────────── */
  document.querySelectorAll('.dl-code-copy, .aporte-copiar').forEach(function (btn) {
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
