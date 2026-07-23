/* ==========================================================================
   KHUSHI KUMARI — DYNAMIC PORTFOLIO
   Three.js Small Sparkling 3D Star Background Engine & Dynamic Observer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThreeJSBackground();
  initDynamicScrollReveals();
  initProjectCarousel();
  initCard3DTilt();
  initContactModal();
  initThemeToggle();
  initFooterDate();
});

/* ==========================================================================
   1. THREE.JS ELEGANT SMALL 3D STAR BACKGROUND ENGINE
   ========================================================================== */
function initThreeJSBackground() {
  const canvas = document.getElementById('canvas-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const starGroup = new THREE.Group();
  scene.add(starGroup);

  // Helper to build 4-point or 5-point 3D Star Line Geometry
  function createStarGeometry(numPoints) {
    const shape = new THREE.Shape();
    const outerRadius = 0.5;
    const innerRadius = 0.18;
    const totalPoints = numPoints * 2;

    for (let i = 0; i <= totalPoints; i++) {
      const angle = (i / totalPoints) * Math.PI * 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }

    const points = shape.getPoints(30);
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  const starGeo4 = createStarGeometry(4);
  const starGeo5 = createStarGeometry(5);

  // Create 20 small, sparkling 3D stars distributed across the viewport margins
  const starCount = 20;
  const starMeshes = [];

  for (let i = 0; i < starCount; i++) {
    const isGold = i % 2 === 0;
    const geo = i % 2 === 0 ? starGeo4 : starGeo5;

    const material = new THREE.LineBasicMaterial({
      color: isGold ? 0xd4a574 : 0x8b7355,
      transparent: true,
      opacity: isGold ? 0.4 : 0.28,
      linewidth: 1.5
    });

    const starMesh = new THREE.LineLoop(geo, material);

    // Position stars on outer margins to avoid overlapping text
    const side = i % 2 === 0 ? 1 : -1;
    starMesh.position.x = side * (8 + Math.random() * 14);
    starMesh.position.y = (Math.random() - 0.5) * 28;
    starMesh.position.z = (Math.random() - 0.5) * 8;

    // Small varying sizes (scale between 0.3 and 0.7)
    const scale = 0.3 + Math.random() * 0.4;
    starMesh.scale.set(scale, scale, scale);

    starMesh.userData = {
      rotSpeedZ: (Math.random() - 0.5) * 0.008,
      twinkleSpeed: 0.002 + Math.random() * 0.003,
      initialY: starMesh.position.y,
      initialScale: scale
    };

    starGroup.add(starMesh);
    starMeshes.push(starMesh);
  }

  // Ambient Star Dust Particles
  const particleCount = 35;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePos[i] = (Math.random() - 0.5) * 45;
    particlePos[i + 1] = (Math.random() - 0.5) * 45;
    particlePos[i + 2] = (Math.random() - 0.5) * 15;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xd4a574,
    size: 0.15,
    transparent: true,
    opacity: 0.3
  });

  const particlePoints = new THREE.Points(particleGeo, particleMat);
  scene.add(particlePoints);

  // Mouse & Scroll Parallax
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    starGroup.rotation.y = mouseX * 0.1 + scrollY * 0.0003;
    starGroup.rotation.x = mouseY * 0.1;

    starMeshes.forEach(mesh => {
      mesh.rotation.z += mesh.userData.rotSpeedZ;
      mesh.position.y = mesh.userData.initialY + Math.sin(Date.now() * 0.001 + mesh.position.x) * 0.8;

      // Gentle scale twinkle
      const s = mesh.userData.initialScale + Math.sin(Date.now() * mesh.userData.twinkleSpeed) * 0.08;
      mesh.scale.set(s, s, s);
    });

    particlePoints.rotation.y += 0.0003;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ==========================================================================
   2. DYNAMIC SCROLL REVEALS (SCROLL UP & DOWN DIRECTIONS)
   ========================================================================== */
function initDynamicScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length === 0) return;

  let lastScrollY = window.scrollY;

  const observer = new IntersectionObserver((entries) => {
    const currentScrollY = window.scrollY;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.remove('scroll-out-up', 'scroll-out-down');
      } else {
        if (entry.boundingClientRect.top < 0) {
          entry.target.classList.add('scroll-out-up');
        } else {
          entry.target.classList.add('scroll-out-down');
        }
        entry.target.classList.remove('visible');
      }
    });

    lastScrollY = currentScrollY;
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -20px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   3. PROJECT CARD CAROUSEL CONTROLS
   ========================================================================== */
function initProjectCarousel() {
  const container = document.getElementById('carousel-container');
  const btnLeft = document.getElementById('carousel-prev');
  const btnRight = document.getElementById('carousel-next');

  if (!container || !btnLeft || !btnRight) return;

  const cardWidth = 488; // 460px card + 28px gap

  btnLeft.addEventListener('click', () => {
    container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });
}

/* ==========================================================================
   4. INTERACTIVE 3D CARD TILT EFFECT
   ========================================================================== */
function initCard3DTilt() {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 768) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg)';
    });
  });
}

/* ==========================================================================
   5. CONTACT MODAL & LIGHT/DARK THEME TOGGLE
   ========================================================================== */
function initContactModal() {
  const ctaBtn = document.getElementById('open-contact-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('close-modal-btn');

  if (!ctaBtn || !modalOverlay || !closeBtn) return;

  function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  ctaBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}

function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;

  const savedTheme = localStorage.getItem('khushi_portfolio_theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeBtn.textContent = '[MODE: DARK]';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeBtn.textContent = '[MODE: CREAM]';
  }

  themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeBtn.textContent = '[MODE: CREAM]';
      localStorage.setItem('khushi_portfolio_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeBtn.textContent = '[MODE: DARK]';
      localStorage.setItem('khushi_portfolio_theme', 'dark');
    }
  });
}

function initFooterDate() {
  const dateSpan = document.getElementById('footer-current-date');
  if (!dateSpan) return;

  const now = new Date();
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  dateSpan.textContent = now.toLocaleDateString('en-US', options);
}
