/* Opens prototype "Open full screen" links in an in-page modal instead of a new tab. */
(function () {
  const css = `
    .pm-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(10,14,24,.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: grid; place-items: center; padding: 24px; opacity: 0; transition: opacity .25s ease; }
    .pm-overlay.pm-on { opacity: 1; }
    .pm-box { width: min(1440px, 100%); height: min(92vh, 100%); background: #fff; border-radius: 14px; overflow: hidden; display: grid; grid-template-rows: auto minmax(0,1fr); box-shadow: 0 40px 100px -20px rgba(0,0,0,.6); transform: translateY(12px) scale(.985); transition: transform .3s cubic-bezier(.2,.7,.2,1); }
    .pm-on .pm-box { transform: none; }
    .pm-bar { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #f4f4f2; border-bottom: 1px solid #e3e3e0; font: 500 14px/1.3 system-ui, sans-serif; color: #171717; }
    .pm-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pm-seg { display: flex; border: 1px solid #cfcfcb; border-radius: 100px; overflow: hidden; }
    .pm-seg button { background: none; border: 0; padding: 6px 14px; font: inherit; font-size: 13px; cursor: pointer; color: #444; }
    .pm-seg button[aria-pressed="true"] { background: #171717; color: #fff; }
    .pm-bar a { color: #171717; font-size: 13px; white-space: nowrap; }
    .pm-close { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #cfcfcb; background: #fff; cursor: pointer; font-size: 18px; line-height: 1; color: #171717; }
    .pm-close:hover, .pm-seg button:hover { border-color: #171717; }
    .pm-stage { background: #e9e9e6; display: grid; place-items: center; overflow: auto; }
    .pm-stage iframe { width: 100%; height: 100%; border: 0; background: #fff; display: block; }
    .pm-stage.pm-mobile iframe { width: 390px; height: min(844px, calc(100% - 32px)); border-radius: 28px; border: 8px solid #171717; box-sizing: content-box; }
    .pm-stage.pm-doc { display: block; padding: 24px; text-align: center; }
    .pm-stage.pm-doc canvas { display: block; margin: 0 auto 16px; background: #fff; box-shadow: 0 10px 30px -12px rgba(0,0,0,.35); max-width: 100%; height: auto; }
    .pm-msg { font: 15px/1.5 system-ui, sans-serif; color: #444; margin-top: 40px; } .pm-msg a { color: #171717; }
    body.pm-lock { overflow: hidden; }
    @media (max-width: 700px) { .pm-overlay { padding: 0; } .pm-box { height: 100%; border-radius: 0; } .pm-seg { display: none; } }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  let overlay, lastFocus;
  async function renderPdf(href, stage) {
    stage.innerHTML = '<p class="pm-msg">Loading CV…</p>';
    stage.classList.add('pm-doc');
    try {
      const lib = await import(new URL('assets/pdfjs/pdf.min.js', document.baseURI).href);
      lib.GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.js', document.baseURI).href;
      const data = await (await fetch(href)).arrayBuffer();
      const pdf = await Promise.race([lib.getDocument({ data, disableFontFace: false, useSystemFonts: true }).promise, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 10000))]);
      stage.innerHTML = '';
      const w = Math.min(stage.clientWidth - 48, 900), dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: (w / base.width) * dpr });
        const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
        c.style.width = w + 'px'; c.setAttribute('aria-label', 'CV page ' + n);
        stage.appendChild(c);
        await Promise.race([page.render({ canvasContext: c.getContext('2d'), viewport: vp, intent: 'print' }).promise, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 25000))]);
      }
    } catch (err) {
      stage.innerHTML = '<p class="pm-msg">The CV preview could not load here. <a href="' + href + '" download>Download the PDF</a> instead.</p>';
    }
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove('pm-on'); document.body.classList.remove('pm-lock');
    const o = overlay; overlay = null; setTimeout(() => o.remove(), 250);
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab' && overlay) {
      const f = [...overlay.querySelectorAll('button, a[href], iframe')]; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function open(href, title, isDoc) {
    lastFocus = document.activeElement;
    overlay = document.createElement('div'); overlay.className = 'pm-overlay';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', title);
    overlay.innerHTML = `<div class="pm-box"><div class="pm-bar"><span class="pm-title"></span><div class="pm-seg" role="group" aria-label="Device"><button type="button" aria-pressed="true" data-d="desk">Desktop</button><button type="button" aria-pressed="false" data-d="mob">Mobile</button></div><a target="_blank" rel="noopener">Open in new tab ↗</a><button type="button" class="pm-close" aria-label="Close">×</button></div><div class="pm-stage"><iframe></iframe></div></div>`;
    overlay.querySelector('.pm-title').textContent = title;
    overlay.querySelector('.pm-bar a').href = href;
    const fr = overlay.querySelector('iframe'); fr.src = href; fr.title = title;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.pm-close').addEventListener('click', close);
    overlay.querySelectorAll('.pm-seg button').forEach((b) => b.addEventListener('click', () => {
      overlay.querySelectorAll('.pm-seg button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      overlay.querySelector('.pm-stage').classList.toggle('pm-mobile', b.dataset.d === 'mob');
    }));
    if (isDoc) { renderPdf(href, overlay.querySelector('.pm-stage')); overlay.querySelector('.pm-seg').style.display = 'none'; const d = document.createElement('a'); d.href = href; d.setAttribute('download', ''); d.textContent = 'Download ↓'; overlay.querySelector('.pm-bar a').before(d); }
    document.body.appendChild(overlay); document.body.classList.add('pm-lock');
    requestAnimationFrame(() => overlay && overlay.classList.add('pm-on'));
    overlay.querySelector('.pm-close').focus();
    document.addEventListener('keydown', onKey);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    if (a.closest('.pm-overlay')) {
      const h = a.getAttribute('href');
      if (!/\.pdf(\?|#|$)/i.test(h)) return;
      e.preventDefault(); e.stopPropagation();
      fetch(h).then((r) => r.blob()).then((b) => {
        const u = URL.createObjectURL(new Blob([b], { type: 'application/pdf' }));
        if (a.hasAttribute('download')) { const d = document.createElement('a'); d.href = u; d.download = 'Yogesh_Malik_CV.pdf'; document.body.appendChild(d); d.click(); d.remove(); }
        else if (!window.open(u, '_blank')) location.href = u;
        setTimeout(() => URL.revokeObjectURL(u), 60000);
      }).catch(() => { window.open(h, '_blank'); });
      return;
    }
    const href = a.getAttribute('href');
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (/\.pdf(\?|#|$)/i.test(href) && !/^https?:/.test(href)) { e.preventDefault(); e.stopPropagation(); open(href, 'Yogesh Malik · CV', true); return; }
    if (!/^prototypes\//.test(href)) return;
    e.preventDefault(); e.stopPropagation();
    const head = a.closest('.app-section, .app-frame, figure, section');
    const h = head && head.querySelector('h3, h4');
    const label = (h ? h.textContent.trim() : (a.closest('.app-bar')?.querySelector('span')?.textContent || 'Prototype')).replace(/\s+/g, ' ');
    open(href, label);
  }, true);
})();
