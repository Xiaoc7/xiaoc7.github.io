(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const themeButton = document.querySelector('#theme-toggle');
  const updateThemeLabel = () => themeButton.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) { /* Storage may be unavailable. */ }
    updateThemeLabel();
  });
  document.querySelector('#year').textContent = new Date().getFullYear();

  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  function closeMenu(returnFocus = false) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Content remains visible without JavaScript or IntersectionObserver support.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    root.classList.add('js-reveal');
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -18px 0px' });
    document.querySelectorAll('.reveal').forEach(el => reveals.observe(el));
  }
  const links = [...document.querySelectorAll('.main-nav .nav-link')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let scrollQueued = false;
  function updateNav() {
    let current = null;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= innerHeight * 0.4) current = section.id; });
    links.forEach(link => {
      const active = link.hash === '#' + current;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { requestAnimationFrame(updateNav); scrollQueued = true; } }, { passive: true });
  updateNav();

  const copyButton = document.querySelector('.copy-email');
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText('xiaocao@std.uestc.edu.cn');
      copyButton.innerHTML = 'COPIED <span aria-hidden="true">✓</span>';
      status.textContent = 'Email address copied to clipboard.';
      setTimeout(() => { copyButton.innerHTML = 'COPY EMAIL <span aria-hidden="true">＋</span>'; }, 2200);
    } catch (_) {
      status.textContent = 'Select the email address to copy it, or use the email link.';
      copyButton.textContent = 'SELECT EMAIL TO COPY';
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email-link'));
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
    }
  });

  // Load the existing visitor globe only when requested, keeping the main page independent of it.
  document.querySelector('.visitor-details').addEventListener('toggle', event => {
    const placeholder = document.querySelector('#visitor-script');
    if (!event.target.open || !placeholder) return;
    const script = document.createElement('script');
    script.id = 'mmvst_globe';
    script.src = placeholder.dataset.src;
    script.async = true;
    const status = document.querySelector('#visitor-status');
    status.textContent = 'Loading visitor globe…';
    script.onload = () => { status.textContent = ''; };
    script.onerror = () => { status.textContent = 'The visitor globe is temporarily unavailable.'; };
    placeholder.replaceWith(script);
  });

  // An original parametric point sculpture. No graphics library or external model required.
  const canvas = document.querySelector('#point-cloud');
  const ctx = canvas.getContext('2d');
  const motionButton = document.querySelector('#motion-toggle');
  if (!ctx) { motionButton.hidden = true; return; }
  let width = 0, height = 0, frame = null, visible = true;
  let paused = reducedMotion.matches, phase = .55, lastTime = 0;
  let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;
  const points = [];
  for (let u = 0; u < 160; u++) {
    const a = u / 160 * Math.PI * 2;
    for (let v = 0; v < 52; v++) {
      const b = v / 52 * Math.PI * 2;
      const radius = .35 * (1 + .13 * Math.cos(a * 3));
      const ring = 1 + radius * Math.cos(b);
      points.push({ x: ring * Math.cos(a), y: ring * Math.sin(a), z: radius * Math.sin(b) + .17 * Math.sin(a * 3), a, b });
    }
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (paused || !visible) draw();
  }
  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const dark = root.dataset.theme === 'dark';
    const scale = Math.min(width * .29, height * .30);
    const ax = .83 + easedY * .28;
    const ay = -.34 + easedX * .36;
    const az = -.38;
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    const cp = Math.cos(phase * .16), sp = Math.sin(phase * .16);
    const projected = points.map(p => {
      const breathe = 1 + .025 * Math.sin(p.a * 3 + phase * 2);
      let x = (p.x * cp - p.y * sp) * breathe;
      let y = (p.x * sp + p.y * cp) * breathe;
      let z = p.z;
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      [x, y] = [x * cz - y * sz, x * sz + y * cz];
      const perspective = 3.8 / (3.8 - z);
      return {x: width * .51 + x * scale * perspective, y: height * .44 + y * scale * perspective, z, accent: Math.sin(p.a + p.b * .65) > .65};
    }).sort((a, b) => a.z - b.z);
    for (const p of projected) {
      const depth = (p.z + 1.5) / 3;
      ctx.fillStyle = p.accent ? (dark ? `rgba(197,218,140,${.3 + depth * .65})` : `rgba(127,148,69,${.25 + depth * .65})`) : (dark ? `rgba(179,205,163,${.18 + depth * .7})` : `rgba(31,65,46,${.18 + depth * .74})`);
      ctx.beginPath();ctx.arc(p.x, p.y, (.55 + depth * .68) * Math.min(width / 500, 1.2), 0, Math.PI * 2);ctx.fill();
    }
  }
  function tick(time) {
    frame = null;
    const delta = Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    phase += delta * .28;
    easedX += (pointerX - easedX) * .045;
    easedY += (pointerY - easedY) * .045;
    draw();
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function syncAnimation() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Play sculpture animation' : 'Pause sculpture animation');
    motionButton.innerHTML = paused ? 'PLAY <span aria-hidden="true">▷</span>' : 'PAUSE <span aria-hidden="true">Ⅱ</span>';
    if (!paused && visible && !document.hidden) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
    else draw();
  }
  canvas.addEventListener('pointermove', event => {
    if (paused || event.pointerType === 'touch') return;
    const bounds = canvas.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  });
  canvas.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
  motionButton.addEventListener('click', () => { paused = !paused; syncAnimation(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncAnimation(); });
  document.addEventListener('visibilitychange', syncAnimation);
  new MutationObserver(() => { if (paused || !visible) draw(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }).observe(canvas);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  resize();syncAnimation();
})();
