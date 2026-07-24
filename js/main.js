/* ==========================================================================
   KHUSHI KUMARI — Portfolio Engine
   Three.js · 3D section reveals + word split for body text · Nav · Modal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThreeJSBackground();
  initScrollAnimations();
  initCard3DTilt();
  initNavScroll();
  initContactModal();
  initThemeToggle();
});

/* ==========================================================================
   1. THREE.JS BACKGROUND
   ========================================================================== */
function initThreeJSBackground() {
  const canvas = document.getElementById('canvas-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 22;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const starGroup = new THREE.Group();
  scene.add(starGroup);

  function makeStarGeo(pts) {
    const shape = new THREE.Shape();
    const N = pts * 2;
    for (let i = 0; i <= N; i++) {
      const angle = (i / N) * Math.PI * 2;
      const r = i % 2 === 0 ? 0.5 : 0.18;
      i === 0
        ? shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
        : shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    return new THREE.BufferGeometry().setFromPoints(shape.getPoints(32));
  }

  const geos   = [makeStarGeo(4), makeStarGeo(5), makeStarGeo(6)];
  const colors = [0xd4a574, 0x8b7355, 0xc9956a, 0xa0785a];
  const stars  = [];

  for (let i = 0; i < 30; i++) {
    const star = new THREE.LineLoop(
      geos[i % geos.length],
      new THREE.LineBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.22 + Math.random() * 0.3 })
    );
    const side = i % 2 === 0 ? 1 : -1;
    star.position.set(side * (9 + Math.random() * 14), (Math.random() - 0.5) * 32, (Math.random() - 0.5) * 10);
    const sc = 0.28 + Math.random() * 0.52;
    star.scale.setScalar(sc);
    star.userData = { rotZ: (Math.random() - 0.5) * 0.012, floatOff: Math.random() * Math.PI * 2, baseY: star.position.y, baseSc: sc };
    starGroup.add(star);
    stars.push(star);
  }

  function makeDust(n, spread, size, op) {
    const geo = new THREE.BufferGeometry();
    const p   = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) {
      p[i] = (Math.random() - 0.5) * spread;
      p[i+1] = (Math.random() - 0.5) * spread;
      p[i+2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd4a574, size, transparent: true, opacity: op }));
  }
  const d1 = makeDust(60, 55, 0.12, 0.2);
  const d2 = makeDust(28, 44, 0.22, 0.14);
  scene.add(d1, d2);

  let mx = 0, my = 0, tmx = 0, tmy = 0, scrollY = window.scrollY;
  window.addEventListener('mousemove', e => {
    tmx = (e.clientX / innerWidth  - 0.5) * 2;
    tmy = (e.clientY / innerHeight - 0.5) * 2;
  });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  (function animate() {
    requestAnimationFrame(animate);
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    starGroup.rotation.y = mx * 0.12 + scrollY * 0.0004;
    starGroup.rotation.x = my * 0.08;
    const t = Date.now() * 0.001;
    stars.forEach(s => {
      s.rotation.z += s.userData.rotZ;
      s.position.y  = s.userData.baseY + Math.sin(t + s.userData.floatOff) * 0.9;
      const sc = s.userData.baseSc + Math.sin(t * 60 * 0.0015) * 0.07;
      s.scale.setScalar(sc);
    });
    d1.rotation.y += 0.0004;
    d2.rotation.y -= 0.0003;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

/* ==========================================================================
   2. SCROLL ANIMATIONS
   
   TWO strategies:
   A) WORD SPLIT — for plain text elements (no gradient). Each word flies in
      from 3D depth with stagger. Replays every scroll revisit.
   B) BLOCK REVEAL — for gradient text / headings / cards. The whole element
      slides up from 3D perspective. Also replays every revisit.
   ========================================================================== */
function initScrollAnimations() {

  // --- A) Elements that get WORD-SPLIT (plain text, no gradient on parent) ---
  const WORD_SPLIT_SELECTORS = [
    '.education-detail',
    '.philosophy-text-single',
    '.project-description',
    '.landing-subheading',
    '.landing-preheading',
    '.quote-subtext',
  ];

  WORD_SPLIT_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      splitWords(el);
      el.classList.add('word-split');
    });
  });

  // --- B) Elements that animate as a WHOLE BLOCK (gradient text, headings, etc.) ---
  // They already have .reveal-on-scroll in HTML — just observe them.
  // Also add .block-reveal to key text headings that aren't already observed.
  const BLOCK_SELECTORS = [
    '.education-heading',
    '.section-heading',
    '.project-title',
    '.project-subtitle',
    '.quote-text',
  ];
  BLOCK_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('block-reveal');
    });
  });

  // --- Observe everything ---
  const allTargets = document.querySelectorAll('.word-split, .reveal-on-scroll, .block-reveal');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.classList.remove('animate');
        void target.offsetWidth; // force reflow → restarts keyframe
        target.classList.add('animate');
      } else {
        target.classList.remove('animate');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  allTargets.forEach(el => observer.observe(el));
}

/* Split plain-text element content into word <span>s with staggered delays.
   Inline elements (strong, em, b, i) are treated as single tokens so their
   own styling (e.g. gradient background-clip) is preserved. */
function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = 'true';
  let delay = 0;
  const STEP = 0.05;

  // Inline formatting tags we should NOT recurse into — treat as one token
  const INLINE_TAGS = new Set(['STRONG', 'EM', 'B', 'I', 'MARK', 'CODE']);
  // Tags we should completely skip
  const SKIP_TAGS   = new Set(['SCRIPT', 'STYLE', 'SPAN', 'A', 'BR']);

  function wrapAsWord(node) {
    const span = document.createElement('span');
    span.className = 'word';
    span.style.animationDelay = `${delay.toFixed(3)}s`;
    delay += STEP;
    node.parentNode.insertBefore(span, node);
    span.appendChild(node);
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = tok;
          span.style.animationDelay = `${delay.toFixed(3)}s`;
          delay += STEP;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.has(node.tagName)) return;
      if (INLINE_TAGS.has(node.tagName)) {
        // Wrap the whole element (e.g. <strong>) as a single .word
        wrapAsWord(node);
      } else {
        // Recurse into block/container elements
        Array.from(node.childNodes).forEach(walk);
      }
    }
  }

  Array.from(el.childNodes).forEach(walk);
}


/* ==========================================================================
   3. 3D CARD TILT — rise + glow on hover
   ========================================================================== */
function initCard3DTilt() {
  document.querySelectorAll('.editorial-project-item').forEach(card => {
    let raf = null, tX = 0, tY = 0, cX = 0, cY = 0;
    let tRise = 0, cRise = 0;   // vertical lift in px
    const lerp = (a, b, t) => a + (b - a) * t;

    function tick() {
      cX    = lerp(cX,    tX,    0.1);
      cY    = lerp(cY,    tY,    0.1);
      cRise = lerp(cRise, tRise, 0.1);

      card.style.transform =
        `perspective(1000px) rotateX(${cX}deg) rotateY(${cY}deg) translateY(${-cRise}px) translateZ(${cRise * 0.5}px)`;

      const stillMoving =
        Math.abs(cX - tX) > 0.01 ||
        Math.abs(cY - tY) > 0.01 ||
        Math.abs(cRise - tRise) > 0.1;

      if (stillMoving) {
        raf = requestAnimationFrame(tick);
      } else raf = null;
    }

    card.addEventListener('mouseenter', () => {
      card.classList.add('is-hovered');
      tRise = 14; // px rise
      if (!raf) raf = requestAnimationFrame(tick);
    });

    card.addEventListener('mousemove', e => {
      if (innerWidth < 768) return;
      const r = card.getBoundingClientRect();
      tX = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -5;
      tY = ((e.clientX - r.left - r.width /2) / (r.width /2)) *  6;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-hovered');
      tX = 0; tY = 0; tRise = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  });
}


/* ==========================================================================
   4. NAVIGATION
   ========================================================================== */
function initNavScroll() {
  const nav = document.getElementById('top-nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    highlightActive();
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const el = document.getElementById(link.dataset.target);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

  function highlightActive() {
    const ids = ['landing', 'about', 'projects', 'contact'];
    let current = 'landing';
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 150) current = id;
    });
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.target === current);
    });
  }
  highlightActive();
}

/* ==========================================================================
   5. CONTACT MODAL
   ========================================================================== */
function initContactModal() {
  const cta     = document.getElementById('open-contact-modal');
  const overlay = document.getElementById('modal-overlay');
  const close   = document.getElementById('close-modal-btn');
  if (!cta || !overlay || !close) return;

  const open = () => { overlay.classList.add('active');    document.body.style.overflow = 'hidden'; };
  const shut = () => { overlay.classList.remove('active'); document.body.style.overflow = ''; };

  cta.addEventListener('click', open);
  close.addEventListener('click', shut);
  overlay.addEventListener('click', e => { if (e.target === overlay) shut(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
}

/* ==========================================================================
   6. THEME TOGGLE
   ========================================================================== */
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const apply = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    btn.textContent = theme === 'dark' ? 'DARK' : 'CREAM';
    localStorage.setItem('khushi_theme', theme);
  };
  apply(localStorage.getItem('khushi_theme') === 'dark' ? 'dark' : 'light');
  btn.addEventListener('click', () => {
    apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}
