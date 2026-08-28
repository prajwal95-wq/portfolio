/* =========================================================
   Ultra-Dark Marvel Developer Portfolio — interactions
   Vanilla ES6+. Zero framework dependencies.
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   0. Utilities
--------------------------------------------------------- */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------
   1. Scroll-mapped background canvas (192 frames)
   Since bespoke frame images aren't bundled, renderFrame()
   procedurally composes a cinematic crimson star-field for
   each of the 192 frames, mapped to scroll position — the
   same architecture as an image-sequence scrubber.
--------------------------------------------------------- */
const TOTAL_FRAMES = 192;
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
let cw = 0, ch = 0, dpr = 1;

// Pre-seed a stable set of stars/particles reused across frames.
const STARS = Array.from({ length: 160 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.8 + 0.3,
  tw: Math.random() * Math.PI * 2,
  spd: Math.random() * 0.6 + 0.2,
}));

const EMBERS = Array.from({ length: 40 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 2.4 + 0.8,
  drift: Math.random() * 0.5 + 0.2,
  hueShift: Math.random(),
}));

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * renderFrame — draws a single frame of the sequence.
 * @param {number} frame  0..TOTAL_FRAMES-1
 */
function renderFrame(frame) {
  const t = frame / (TOTAL_FRAMES - 1); // 0..1 progress
  const time = performance.now() * 0.001;

  // Base cinematic gradient (deep black -> crimson glow that rises with scroll)
  const grad = ctx.createRadialGradient(
    cw * 0.5, ch * (0.9 - t * 0.5), 0,
    cw * 0.5, ch * (0.9 - t * 0.5), Math.max(cw, ch) * (0.7 + t * 0.4)
  );
  grad.addColorStop(0, `rgba(${40 + t * 60}, 6, 10, 1)`);
  grad.addColorStop(0.5, "rgba(18, 6, 8, 1)");
  grad.addColorStop(1, "#0a0404");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // Parallax star-field — density & brightness shift per frame
  for (const s of STARS) {
    const px = ((s.x + t * 0.05 * s.spd) % 1) * cw;
    const py = ((s.y + t * 0.12 * s.spd) % 1) * ch;
    const twinkle = 0.5 + 0.5 * Math.sin(time * s.spd * 2 + s.tw);
    ctx.beginPath();
    ctx.arc(px, py, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 224, ${0.15 + twinkle * 0.35})`;
    ctx.fill();
  }

  // Floating crimson embers that intensify toward mid-scroll
  const emberIntensity = Math.sin(t * Math.PI); // peak in the middle
  for (const e of EMBERS) {
    const px = ((e.x + time * 0.01 * e.drift) % 1) * cw;
    const py = ((e.y - time * 0.02 * e.drift) % 1 + 1) % 1 * ch;
    const glow = 0.2 + emberIntensity * 0.5;
    const rg = ctx.createRadialGradient(px, py, 0, px, py, e.r * 8);
    rg.addColorStop(0, `rgba(255, ${30 + e.hueShift * 40}, ${45 + e.hueShift * 20}, ${glow})`);
    rg.addColorStop(1, "rgba(255, 30, 45, 0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(px, py, e.r * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sweeping crimson light beam driven by scroll frame
  const beamX = lerp(-cw * 0.3, cw * 1.3, t);
  const beam = ctx.createLinearGradient(beamX - 200, 0, beamX + 200, ch);
  beam.addColorStop(0, "rgba(255, 30, 45, 0)");
  beam.addColorStop(0.5, `rgba(255, 30, 45, ${0.06 + emberIntensity * 0.05})`);
  beam.addColorStop(1, "rgba(255, 30, 45, 0)");
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, cw, ch);

  /* -------------------------------------------------------
     WATERMARK PATCH
     Smooth radial dark gradient patch at the bottom-right
     corner to seamlessly cover any background watermark.
  ------------------------------------------------------- */
  const patchW = 260;
  const patchH = 120;
  const originX = cw - patchW;
  const originY = ch - patchH;
  const patch = ctx.createRadialGradient(
    cw, ch, 0,
    cw, ch, Math.max(patchW, patchH) * 1.4
  );
  patch.addColorStop(0, "rgba(10, 4, 4, 1)");
  patch.addColorStop(0.6, "rgba(10, 4, 4, 0.9)");
  patch.addColorStop(1, "rgba(10, 4, 4, 0)");
  ctx.fillStyle = patch;
  ctx.fillRect(originX - 40, originY - 40, patchW + 80, patchH + 80);
}

let currentFrame = -1;
let targetFrame = 0;

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
}

function tick() {
  // Smoothly ease the displayed frame toward the scroll target.
  currentFrame = lerp(currentFrame < 0 ? targetFrame : currentFrame, targetFrame, 0.12);
  const frame = Math.round(currentFrame);
  renderFrame(frame);
  requestAnimationFrame(tick);
}

function updateTargetFrame() {
  targetFrame = Math.round(scrollProgress() * (TOTAL_FRAMES - 1));
}

/* ---------------------------------------------------------
   2. Scroll progress bar
--------------------------------------------------------- */
const progressBar = document.getElementById("progress-bar");
function updateProgressBar() {
  progressBar.style.width = (scrollProgress() * 100).toFixed(2) + "%";
}

/* ---------------------------------------------------------
   3. Navigation — active link on scroll + mobile toggle
--------------------------------------------------------- */
const navLinks = document.querySelectorAll("#nav-links a");
const sections = Array.from(navLinks).map((a) => document.querySelector(a.getAttribute("href")));
const navToggle = document.getElementById("nav-toggle");
const navList = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const open = navList.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
navList.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    navList.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

function updateActiveNav() {
  const y = window.scrollY + window.innerHeight * 0.35;
  let idx = 0;
  sections.forEach((sec, i) => {
    if (sec && sec.offsetTop <= y) idx = i;
  });
  navLinks.forEach((a, i) => a.classList.toggle("active", i === idx));
}

/* ---------------------------------------------------------
   4. Reveal on scroll (IntersectionObserver)
--------------------------------------------------------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  io.observe(el);
});

/* ---------------------------------------------------------
   5. Typewriter roles
--------------------------------------------------------- */
const roles = ["Full Stack Developer", "Web Developer", "AI & Creative Technologist"];
const typedEl = document.getElementById("typed-roles");
const caret = '<span class="type-caret">|</span>';
let roleIdx = 0, charIdx = 0, deleting = false;

function typeLoop() {
  if (prefersReduced) {
    typedEl.innerHTML = roles.join(' <span class="sep">•</span> ');
    return;
  }
  const word = roles[roleIdx];
  charIdx += deleting ? -1 : 1;
  typedEl.innerHTML = word.slice(0, charIdx) + caret;
  let delay = deleting ? 45 : 85;
  if (!deleting && charIdx === word.length) {
    delay = 1600;
    deleting = true;
  } else if (deleting && charIdx === 0) {
    deleting = false;
    roleIdx = (roleIdx + 1) % roles.length;
    delay = 350;
  }
  setTimeout(typeLoop, delay);
}

/* ---------------------------------------------------------
   6. Interactive Lanyard ID card — spring pendulum physics
--------------------------------------------------------- */
const card = document.getElementById("hanging-id-card");
const lanyard = document.getElementById("lanyard");
const strapLeft = document.getElementById("strap-left");
const strapRight = document.getElementById("strap-right");

const physics = {
  angle: 0,        // current swing angle (radians)
  vel: 0,          // angular velocity
  targetAngle: 0,  // rest / dragged target
  dragging: false,
  stiffness: 0.012, // spring constant (rubber-band)
  damping: 0.92,    // energy loss
  pointerX: 0,
};

let cardHalf = 105; // half of card width (~210/2)

function anchorPoint() {
  // Anchor near top-center of the lanyard container.
  const rect = lanyard.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + 6 };
}

function pointerDown(e) {
  physics.dragging = true;
  card.setPointerCapture?.(e.pointerId ?? 1);
  const hint = card.querySelector(".id-hint");
  if (hint) hint.style.opacity = "0";
}
function pointerMove(e) {
  if (!physics.dragging) return;
  const a = anchorPoint();
  const dx = (e.clientX ?? e.touches?.[0]?.clientX ?? a.x) - a.x;
  const dy = Math.max((e.clientY ?? e.touches?.[0]?.clientY ?? a.y) - a.y, 40);
  physics.targetAngle = clamp(Math.atan2(dx, dy), -1.1, 1.1);
}
function pointerUp() {
  physics.dragging = false;
  physics.targetAngle = 0; // spring back to rest
}

card.addEventListener("pointerdown", pointerDown);
window.addEventListener("pointermove", pointerMove);
window.addEventListener("pointerup", pointerUp);

// Subtle idle nudge from device / cursor for life-like sway
window.addEventListener("mousemove", (e) => {
  if (physics.dragging) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
  physics.targetAngle = nx * 0.12;
});

function updateLanyard() {
  // Spring toward target with damping (rubber-band feel).
  const springForce = (physics.targetAngle - physics.angle) * (physics.dragging ? 0.25 : physics.stiffness * 6);
  const gravity = -physics.angle * physics.stiffness; // pull toward vertical
  physics.vel += springForce + gravity;
  physics.vel *= physics.damping;
  physics.angle += physics.vel;

  const deg = physics.angle * (180 / Math.PI);
  card.style.transform = `rotate(${deg.toFixed(2)}deg)`;

  // Redraw the two lanyard straps from anchor to card top corners.
  drawStraps(deg);

  requestAnimationFrame(updateLanyard);
}

function drawStraps(deg) {
  // Card top-left / top-right positions relative to the 300x520 viewBox.
  const cardTop = 120; // matches CSS top
  const originYRatio = 0;
  const rad = deg * (Math.PI / 180);
  const cx = 150; // viewBox center x
  const pivotY = 6;

  // Card corners swing around the pivot.
  const armLen = cardTop - pivotY;
  const swingX = Math.sin(rad) * armLen;
  const swingY = Math.cos(rad) * armLen;
  const centerX = cx + swingX;
  const centerY = pivotY + swingY;

  const leftX = centerX - cardHalf * Math.cos(rad) * 0.42;
  const leftY = centerY - cardHalf * Math.sin(rad) * 0.42;
  const rightX = centerX + cardHalf * Math.cos(rad) * 0.42;
  const rightY = centerY + cardHalf * Math.sin(rad) * 0.42;

  strapLeft.setAttribute("d", `M ${cx} ${pivotY} Q ${(cx + leftX) / 2 - 8} ${(pivotY + leftY) / 2} ${leftX} ${leftY}`);
  strapRight.setAttribute("d", `M ${cx} ${pivotY} Q ${(cx + rightX) / 2 + 8} ${(pivotY + rightY) / 2} ${rightX} ${rightY}`);
}

/* ---------------------------------------------------------
   7. Footer year
--------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   8. Master scroll handler (throttled via rAF)
--------------------------------------------------------- */
let scrollQueued = false;
function onScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    updateTargetFrame();
    updateProgressBar();
    updateActiveNav();
    scrollQueued = false;
  });
}

/* ---------------------------------------------------------
   9. Boot
--------------------------------------------------------- */
function init() {
  resizeCanvas();
  updateTargetFrame();
  currentFrame = targetFrame;
  renderFrame(targetFrame);
  updateProgressBar();
  updateActiveNav();
  typeLoop();

  requestAnimationFrame(tick);
  requestAnimationFrame(updateLanyard);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    updateTargetFrame();
  });
}

document.addEventListener("DOMContentLoaded", init);
