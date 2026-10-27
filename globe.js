/* =========================================================
   Interactive 3D globe (home page hero)
   A sphere wrapped in one 2:1 (equirectangular) photo grid. Drag sideways to
   spin it, with a little inertia; it drifts slowly on its own while idle.
   It only turns left/right: the texture's top and bottom rows get pinched into
   wedges at the poles, so the tilt is fixed to keep them out of view. Until WebGL
   and the texture are ready — or if WebGL isn't available — the static globe
   image inside the container stays visible.
   ========================================================= */
import * as THREE from 'three';

const container = document.getElementById('globe3d');
// JPG copy of photogrid_globe_thinnerlines.png (fully opaque, so no alpha is lost): ~1.5 MB instead of 14 MB
const TEXTURE_URL = 'assets/photogrid_globe_thinnerlines.jpg';

const AUTO_SPIN = 0.0025;        // radians per frame while idle
const DRAG_SPEED = 0.008;        // radians per pixel dragged
const FRICTION = 0.94;           // how quickly a flick slows down
const TILT = 0.15;               // fixed forward lean, just enough to read as a sphere

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

if (container && hasWebGL()) init();

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // fov 30 at z 4.2 frames a radius-1 sphere with a small margin
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.z = 4.2;

  // soft overall light plus a key light from the top left, for some roundness
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(-3, 2.5, 4);
  scene.add(key);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 64),
    new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 })
  );
  globe.rotation.x = TILT;
  scene.add(globe);

  new THREE.TextureLoader().load(TEXTURE_URL, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    globe.material.map = texture;
    globe.material.needsUpdate = true;

    container.appendChild(renderer.domElement);
    container.classList.add('is-ready');   // fades the canvas in over the fallback image
    resize();
    start();
  });

  /* ---------- Sizing ---------- */
  function resize() {
    const size = container.clientWidth;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);

  /* ---------- Drag to spin ----------
     The canvas uses touch-action: pan-y, so on phones a vertical swipe still
     scrolls the page and only a sideways drag spins the globe. */
  let dragging = false;
  let lastX = 0;
  let velX = 0;                     // spin speed around the vertical axis

  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    velX = 0;
    canvas.setPointerCapture(e.pointerId);
    container.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velX = (e.clientX - lastX) * DRAG_SPEED;
    lastX = e.clientX;
    globe.rotation.y += velX;
  });
  const endDrag = () => {
    dragging = false;
    container.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* ---------- Render loop ----------
     Paused while the globe is scrolled out of view. */
  let running = false;
  let visible = true;

  function frame() {
    if (!running) return;
    if (!dragging) {
      velX *= FRICTION;
      // drift resumes once a flick has mostly died down
      const idle = Math.abs(velX) < AUTO_SPIN && !reduceMotion ? AUTO_SPIN : 0;
      globe.rotation.y += velX + idle;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible) return;
    running = true;
    requestAnimationFrame(frame);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else running = false;
  }).observe(container);
}
