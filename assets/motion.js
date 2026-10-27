/* Creative motion layer: progressive enhancement, safe to remove. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const css = `
    .mx-in { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: var(--mx-d, 0s); }
    .mx-in.mx-on { opacity: 1; transform: none; }
    .mx-line { display: inline-block; overflow: hidden; vertical-align: top; }
    .mx-line > span { display: inline-block; transform: translateY(105%); transition: transform 1s cubic-bezier(.2,.7,.2,1); transition-delay: var(--mx-d, 0s); }
    .mx-ready .mx-line > span { transform: none; }
    .mx-cursor { position: fixed; left: 0; top: 0; z-index: 9999; pointer-events: none; width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%; display: grid; place-items: center; text-align: center; font: 600 12px/1.2 inherit; letter-spacing: .04em; text-transform: uppercase; background: var(--color-accent, #fff); color: var(--color-bg, #000); transform: scale(0); transition: transform .35s cubic-bezier(.2,.7,.2,1); }
    .mx-cursor.mx-show { transform: scale(1); }
    .mx-hover-cards .portfolio-card, .mx-hover-cards .case-study-card, .mx-hover-cards .app-frame { cursor: none; }
    body.mx-leave { opacity: 0; transition: opacity .25s ease; }
    body.mx-enter { animation: mxFade .5s ease both; }
    @keyframes mxFade { from { opacity: 0; } to { opacity: 1; } }
    .mx-spot { background-image: radial-gradient(600px circle at var(--mx-x, 50%) var(--mx-y, 50%), var(--color-accent-dim, rgba(255,255,255,.06)), transparent 60%) !important; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  if (!reduce) document.body.classList.add('mx-enter');

  /* Headline line reveal */
  const h1 = document.querySelector('.hero h1, .case-header h1, .page-header h1');
  if (h1 && !reduce) {
    const words = []; let d = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const o = document.createElement('span'); o.className = 'mx-line';
            const i = document.createElement('span'); i.textContent = w; i.style.setProperty('--mx-d', (d += 0.045) + 's');
            o.appendChild(i); frag.appendChild(o); words.push(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.matches('svg, br')) walk(n);
      });
    };
    walk(h1);
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('mx-ready')));
    setTimeout(() => document.documentElement.classList.add('mx-ready'), 600);
  }

  /* Scroll reveal with stagger */
  if (!reduce && 'IntersectionObserver' in window) {
    const sel = ['.case-section > *', '.card', '.portfolio-card', '.app-frame', '.screen-head', '.screen-notes > div', '.tldr > div', '.flow > div', '.snapshot > div', '.next-project > *', 'section > h2', '.process-section [class*="step"]', '.testimonials-section [class*="card"]'].join(',');
    const els = [...document.querySelectorAll(sel)].filter((el) => !el.closest('.hero, .case-header, .page-header, nav'));
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('mx-on'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => {
      const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => els.includes(c)) : [];
      el.style.setProperty('--mx-d', Math.min(sibs.indexOf(el), 5) * 0.08 + 's');
      el.classList.add('mx-in'); io.observe(el);
    });
  }

  /* Count-up for impact numbers */
  const nums = document.querySelectorAll('.metric-mini-value, .metric-value, .stat-value, .impact-value, .snapshot dd');
  const cio = 'IntersectionObserver' in window && !reduce ? new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, m = el.textContent.trim().match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
    if (!m || el.textContent.length > 12) return;
    const end = parseFloat(m[2].replace(',', '')), dec = (m[2].split('.')[1] || '').length, t0 = performance.now();
    const tick = (t) => { const p = Math.min((t - t0) / 1200, 1), v = end * (1 - Math.pow(1 - p, 3)); el.textContent = m[1] + v.toFixed(dec) + m[3]; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 }) : null;
  if (cio) nums.forEach((n) => cio.observe(n));

  /* Cursor badge over work cards and live prototypes */
  if (fine && !reduce) {
    const targets = document.querySelectorAll('.portfolio-card, .case-study-card, .app-frame');
    if (targets.length) {
      const c = document.createElement('div'); c.className = 'mx-cursor'; document.body.appendChild(c);
      document.documentElement.classList.add('mx-hover-cards');
      let x = 0, y = 0, cx = 0, cy = 0;
      addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
      (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; c.style.left = cx + 'px'; c.style.top = cy + 'px'; requestAnimationFrame(loop); })();
      targets.forEach((t) => {
        const label = t.classList.contains('app-frame') ? 'Explore<br>live' : 'View<br>case';
        t.addEventListener('mouseenter', () => { c.innerHTML = label; c.classList.add('mx-show'); });
        t.addEventListener('mouseleave', () => c.classList.remove('mx-show'));
      });
      document.querySelectorAll('.app-frame iframe').forEach((f) => { f.addEventListener('mouseenter', () => c.classList.remove('mx-show')); });
    }
  }

  /* Spotlight that follows the pointer on cards */
  if (fine) document.querySelectorAll('.card, .tldr > div').forEach((el) => {
    el.classList.add('mx-spot');
    el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx-x', e.clientX - r.left + 'px'); el.style.setProperty('--mx-y', e.clientY - r.top + 'px'); });
  });

  /* Magnetic primary buttons */
  if (fine && !reduce) document.querySelectorAll('.btn-primary').forEach((b) => {
    b.style.transition = (b.style.transition ? b.style.transition + ',' : '') + 'transform .3s cubic-bezier(.2,.7,.2,1)';
    b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });

  /* Soft page transitions between internal pages */
  if (!reduce) document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute('href'); if (!/\.html(\?|#|$)/.test(href) || /^https?:/.test(href)) return;
    e.preventDefault(); document.body.classList.add('mx-leave'); setTimeout(() => { location.href = href; }, 220);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('mx-leave'); });
})();

/* Whole card is a link to its case study */
(function () {
  const cards = document.querySelectorAll('.portfolio-card, .case-study-card');
  cards.forEach((card) => {
    const link = card.querySelector('a.portfolio-card-link, a.case-study-link, a[href*="case-study-"]');
    if (!link) return;
    card.style.cursor = matchMedia('(pointer: fine)').matches ? 'none' : 'pointer';
    card.setAttribute('role', 'link'); card.tabIndex = card.tabIndex >= 0 ? card.tabIndex : 0;
    card.setAttribute('aria-label', (card.querySelector('h3')?.textContent || 'Case study') + ': view case study');
    const go = (e) => { if (e.target.closest('a, button, input, select, textarea') && e.target.closest('a, button, input, select, textarea') !== card) return; if (e.metaKey || e.ctrlKey) { window.open(link.href, '_blank'); return; } link.click(); };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === card) go(e); });
  });
})();
