(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  const MUHURAT = Date.UTC(2026, 11, 19, 7, 15); // 19 Dec 2026, 12:45 IST
  const MAPS = 'https://maps.app.goo.gl/Foc7Q7ufQh1FTCvj7';

  const DEVA_DIGITS = '०१२३४५६७८९';
  const lang = () => document.documentElement.lang;
  const digits = (s) => (lang() === 'mr' ? String(s).replace(/\d/g, (d) => DEVA_DIGITS[d]) : String(s));

  /* ── language ─────────────────────────────────────────── */
  function setLang(l) {
    document.documentElement.lang = l;
    localStorage.setItem('lang', l);
    $$('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === l)));
    $$('[data-ph-en]').forEach((el) => (el.placeholder = el.dataset[l === 'mr' ? 'phMr' : 'phEn']));
    document.title = l === 'mr' ? 'उत्कर्ष ❀ श्रद्धा · शुभविवाह · १९ डिसेंबर २०२६' : 'Utkarsh & Shradha · 19 December 2026';
    tick();
  }
  $$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.setLang)));

  /* ── akshata & petals (one canvas for every particle) ─── */
  const fx = (() => {
    const canvas = $('#akshata');
    const ctx = canvas.getContext('2d');
    const RICE = ['#FFF6D6', '#FBE7A1', '#F6D35B', '#EDBE3E', '#C8102E', '#D93A4A', '#FFF6D6'];
    const PETAL = ['#F48C06', '#FFB000', '#F9A11B', '#E86A00', '#FFC62B'];
    const ps = [];
    let W = 0, H = 0, running = false;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener('resize', resize);
    resize();

    const pick = (a) => a[(Math.random() * a.length) | 0];
    function spawn(kind, x, y, vx, vy, extra = {}) {
      ps.push({
        kind, x, y, vx, vy,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * (kind === 'rice' ? 0.5 : 0.12),
        s: 0.8 + Math.random() * 0.7, c: pick(kind === 'rice' ? RICE : PETAL),
        sway: Math.random() * 6.28, life: 0, max: kind === 'rice' ? 260 : 700, ...extra,
      });
    }
    // phones get fewer grains: same shower, half the per-frame work
    const scale = (n) => Math.round(n * (W < 600 ? 0.6 : 1));
    function burst(x, y, n = 90, power = 1) {
      if (reduced) return;
      n = scale(n);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85;
        const v = (3.5 + Math.random() * 7.5) * power;
        spawn(Math.random() < 0.15 ? 'petal' : 'rice', x, y, Math.cos(a) * v, Math.sin(a) * v);
      }
      start();
    }
    function rain(n = 200, spreadMs = 1200) {
      if (reduced) return;
      n = scale(n);
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          spawn(Math.random() < 0.2 ? 'petal' : 'rice', Math.random() * W, -10, (Math.random() - 0.5) * 2, 2 + Math.random() * 4);
          start();
        }, Math.random() * spreadMs);
      }
    }
    function drift() {
      if (reduced) return;
      spawn('petal', Math.random() * W, -14, (Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.7, { max: 1400, s: 1 + Math.random() * 0.8 });
      start();
    }
    function start() { if (!running) { running = true; requestAnimationFrame(step); } }
    function step() {
      ctx.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life++;
        if (p.kind === 'rice') { p.vy += 0.2; p.vx *= 0.99; }
        else { p.vy = Math.min(p.vy + 0.04, 1.5); p.vx *= 0.97; p.x += Math.sin(p.life / 28 + p.sway) * 0.7; }
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y > H + 30 || p.life > p.max) { ps.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.max - p.life) / 40);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        if (p.kind === 'rice') {
          ctx.ellipse(0, 0, 3.3 * p.s, 1.45 * p.s, 0, 0, Math.PI * 2);
        } else {
          const s = p.s;
          ctx.moveTo(0, -6 * s);
          ctx.quadraticCurveTo(5.5 * s, -1 * s, 0, 7 * s);
          ctx.quadraticCurveTo(-5.5 * s, -1 * s, 0, -6 * s);
        }
        ctx.fill();
        ctx.restore();
      }
      if (ps.length) requestAnimationFrame(step);
      else running = false;
    }
    return { burst, rain, drift };
  })();

  /* ── temple bell (synthesised; plays only after a tap) ── */
  let audio;
  function bell(strikes = 3) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const master = audio.createGain();
      master.gain.value = 0.2;
      master.connect(audio.destination);
      // a bronze bell's partials are inharmonic — that's what makes it sound like metal, not a synth
      const partials = [[1, 1, 3.4], [2.02, 0.55, 2.4], [2.76, 0.35, 1.8], [3.93, 0.25, 1.3], [5.4, 0.14, 0.9], [6.8, 0.08, 0.6]];
      for (let k = 0; k < strikes; k++) {
        const t = audio.currentTime + k * 0.48;
        const amp = 1 - k * 0.22;
        partials.forEach(([ratio, a, d]) => {
          const o = audio.createOscillator();
          const g = audio.createGain();
          o.frequency.value = 587 * ratio;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(a * amp, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(g).connect(master);
          o.start(t);
          o.stop(t + d + 0.05);
        });
      }
    } catch { /* no audio — the ritual still completes visually */ }
  }

  /* ── marigold toran ───────────────────────────────────── */
  function buildToran() {
    const el = $('#toran');
    const w = el.clientWidth;
    const small = w < 600;
    const fs = small ? 16 : 22;
    const gap = small ? 30 : 42;
    const n = Math.floor(w / gap);
    const frag = document.createDocumentFragment();

    const band = document.createElement('div');
    band.className = 'toran-band';
    for (let i = 0; i < Math.ceil(w / (fs - 5)) + 2; i++) band.append(flower(i % 3 ? 'o' : 'y'));
    frag.append(band);

    for (let i = 0; i < n; i++) {
      const edge = Math.min(i, n - 1 - i);
      // heavy garlands at the edges (like the card), a short jhalar across the middle
      const len = edge === 0 ? 16 : edge === 1 ? 12 : edge === 2 ? 8 : i % 2 ? 3 : 5;
      const s = document.createElement('div');
      s.className = 'strand';
      s.style.left = `${(w - (n - 1) * gap) / 2 + i * gap - fs / 2}px`;
      s.style.setProperty('--dur', `${3 + Math.random() * 2.5}s`);
      s.style.setProperty('--delay', `${-Math.random() * 4}s`);
      const color = i % 2 ? 'y' : 'o';
      for (let k = 0; k < len; k++) s.append(flower(color));
      const leaves = document.createElement('div');
      leaves.className = 'leaves';
      s.append(leaves);
      frag.append(s);
    }
    el.replaceChildren(frag);
  }
  function flower(c) {
    const f = document.createElement('span');
    f.className = `mg ${c}`;
    f.style.setProperty('--rot', `${(Math.random() * 20) | 0}deg`);
    return f;
  }

  /* ── mandala ──────────────────────────────────────────── */
  function buildMandala() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-200 -200 400 400');
    const rings = [[18, 8, 14], [38, 12, 18], [62, 16, 22], [90, 24, 24], [120, 32, 26], [152, 48, 24], [182, 64, 14]];
    rings.forEach(([r, n, len], k) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'ring');
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('r', r);
      g.append(ring);
      for (let i = 0; i < n; i++) {
        const w = len * 0.42;
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', `M0 ${-r} Q ${w} ${-r - len / 2} 0 ${-r - len} Q ${-w} ${-r - len / 2} 0 ${-r} Z`);
        p.setAttribute('transform', `rotate(${(360 / n) * i + (k % 2 ? 180 / n : 0)})`);
        if (k % 2) p.setAttribute('class', 'fill');
        g.append(p);
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', 1.4);
        dot.setAttribute('cy', -r - len - 3);
        dot.setAttribute('transform', `rotate(${(360 / n) * (i + 0.5)})`);
        g.append(dot);
      }
      svg.append(g);
    });
    $('#mandala').append(svg);
  }

  /* ── antarpat: mangalashtak → शुभमंगल सावधान → the cloth falls ── */
  const ap = $('#antarpat');
  function reveal(l, instant = false) {
    setLang(l);
    const finish = () => {
      ap.classList.add('gone');
      document.body.classList.remove('locked');
      // the lift button just vanished; hand keyboard focus to the page instead of <body>
      if (!instant) $('#topbar a')?.focus({ preventScroll: true });
    };
    if (instant) {
      document.body.classList.add('revealed');
      finish();
      return;
    }
    const chant = $('#ap-chant');
    ap.classList.add('chanting');
    chant.textContent = '॥ कुर्यात सदा मंगलम् ॥';
    chant.classList.add('show');

    setTimeout(() => {
      chant.classList.remove('show');
      setTimeout(() => {
        chant.textContent = 'शुभमंगल सावधान!';
        chant.classList.add('show', 'big');
        bell();
        fx.burst(innerWidth * 0.15, innerHeight, 70, 1.3);
        fx.burst(innerWidth * 0.85, innerHeight, 70, 1.3);
      }, 250);
    }, reduced ? 300 : 1300);

    setTimeout(() => {
      ap.classList.add('drop');
      document.body.classList.add('revealed');
      fx.rain(260, 1600);
      setTimeout(finish, reduced ? 700 : 1300);
    }, reduced ? 1200 : 2700);
  }
  $$('[data-lift]').forEach((b) => b.addEventListener('click', () => reveal(b.dataset.lift), { once: true }));

  /* ── hero ─────────────────────────────────────────────── */
  $$('.split').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.setProperty('--i', i);
      s.setAttribute('aria-hidden', 'true');
      el.append(s);
    });
  });

  let heroVisible = true;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe($('.hero'));
  // ambient petals only over the hero, and sparser on phones where they'd sit on top of text
  setInterval(() => {
    if (heroVisible && !document.hidden && document.body.classList.contains('revealed')) fx.drift();
  }, innerWidth < 600 ? 1600 : 1000);

  /* ── tap the hero photo to throw akshata ──────────────── */
  $$('[data-akshata]').forEach((zone) =>
    zone.addEventListener('pointerdown', (e) => fx.burst(e.clientX, e.clientY, 60, 0.9))
  );

  /* ── countdown ────────────────────────────────────────── */
  const nums = Object.fromEntries($$('#countdown [data-u]').map((n) => [n.dataset.u, n]));
  function tick() {
    const left = MUHURAT - Date.now();
    if (left <= 0) {
      $('#countdown').hidden = true;
      $('#married').hidden = false;
      return;
    }
    const s = Math.floor(left / 1000);
    const parts = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
    for (const [u, v] of Object.entries(parts)) {
      const text = digits(u === 'd' ? v : String(v).padStart(2, '0'));
      if (nums[u].textContent !== text) nums[u].textContent = text;
    }
  }
  setInterval(tick, 1000);

  /* ── calendar ─────────────────────────────────────────── */
  $('#gcal').href = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Utkarsh & Shradha — Wedding (शुभविवाह)',
    dates: '20261219T071500Z/20261219T091500Z',
    details: `Shubh muhurat 12:45 PM.\nDirections: ${MAPS}`,
    location: 'Shri Beereshwar Bhavan, Examba, Chikodi, Dist. Belgaum',
  });

  /* ── horizontal gallery, driven by vertical scroll ────── */
  const gallery = $('#moments');
  const pin = $('.gallery-pin', gallery);
  const track = $('#track');
  const bar = $('#progress');
  let dist = 0;
  function sizeGallery() {
    if (reduced) { gallery.classList.add('static'); return; }
    dist = Math.max(0, track.scrollWidth - pin.clientWidth);
    gallery.style.height = `${pin.offsetHeight + dist}px`;
  }
  function moveGallery() {
    if (reduced) return;
    const span = gallery.offsetHeight - pin.offsetHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -gallery.getBoundingClientRect().top / span)) : 0;
    track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    bar.style.transform = `scaleX(${p})`;
  }

  /* ── parallax band ────────────────────────────────────── */
  const band = $('.band');
  const bandImg = $('.band-img');
  function moveBand() {
    if (reduced) return;
    const r = band.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1…1 through the viewport
    bandImg.style.transform = `translate3d(0, ${p * -9}%, 0)`;
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { moveGallery(); moveBand(); ticking = false; });
  }, { passive: true });

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildToran(); sizeGallery(); moveGallery(); }, 150);
  });

  /* ── lightbox ─────────────────────────────────────────── */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const frames = $$('.frame');
  let current = 0;
  function show(i) {
    current = (i + frames.length) % frames.length;
    const img = $('img', frames[current]);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
  }
  frames.forEach((f, i) => f.addEventListener('click', () => { show(i); lb.showModal(); }));
  $('.lb-close', lb).addEventListener('click', () => lb.close());
  $('.lb-prev', lb).addEventListener('click', () => show(current - 1));
  $('.lb-next', lb).addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ── scroll reveals ───────────────────────────────────── */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ── boot ─────────────────────────────────────────────── */
  buildToran();
  buildMandala();
  setLang(lang());
  // ?skip opens straight to the site (handy for sharing a deep link or re-checking layout)
  if (params.has('skip')) reveal(params.get('lang') || localStorage.getItem('lang') || 'en', true);
  // wait for fonts + images so the gallery track has its real width
  addEventListener('load', () => { sizeGallery(); moveGallery(); moveBand(); });
  sizeGallery();
})();
