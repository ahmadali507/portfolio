// Page choreography. Every beat is tied to scroll or pointer intent, scrubbed or triggered once,
// and runs inside the gsap.context created in core.ts, so navigation reverts it cleanly.
// Content is visible by default in CSS; this file only adds motion on top. Under reduced motion
// nothing here runs except state that the 3D engine needs.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from './state';
import type { MotionCore } from './core';
import { mountChem } from './chem';
import { mountTyped } from './typed';

const EXPO = 'expo.out';

export function mountScenes(doc: Document, core: MotionCore): void {
  heroScene(doc);
  mountChem(doc, core);
  mountTyped(doc, core);
  if (motion.reduced) return;
  revealLines(doc);
  rise(doc);
  statement(doc);
  workGallery(doc);
  drum(doc, core);
  magnetic(doc);
  peek(doc);
  anchors(doc, core);
}

// ---------- Home hero: an ordinary first screen. The deck hands over to the gallery below it ----------
function heroScene(doc: Document): void {
  const world = doc.getElementById('world');
  if (world) world.style.clipPath = '';
  const hero = doc.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => (motion.hero = self.progress),
  });
  if (motion.reduced) return;
  const cue = hero.querySelector<HTMLElement>('[data-hero-cue]');
  if (cue) {
    gsap.to(cue, { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '12% top', scrub: true } });
  }
}

// ---------- Headings: words rise out of a mask when they enter ----------
function revealLines(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const words = el.querySelectorAll<HTMLElement>('.rw > span');
    if (!words.length) return;
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, ease: EXPO, stagger: 0.045 }),
    });
  });
}

// ---------- Blocks: a short rise with fade when they enter ----------
function rise(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    gsap.set(el, { y: 48, opacity: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(el, { y: 0, opacity: 1, duration: 1.2, ease: EXPO, delay: Number(el.dataset.rise || 0) }),
    });
  });
}

// ---------- Statement: words light up as the reader scrolls through them ----------
function statement(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('[data-statement]').forEach((el) => {
    const words = el.querySelectorAll<HTMLElement>('.sw');
    gsap.fromTo(
      words,
      { opacity: 0.14 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 72%', end: 'bottom 48%', scrub: 0.4 },
      },
    );
  });
}

// ---------- Work: a pinned gallery. Scroll turns the 3D spiral; the DOM shows the project in front ----------
function workGallery(doc: Document): void {
  const section = doc.querySelector<HTMLElement>('[data-work]');
  if (!section) return;
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-work-item]'));
  const count = section.querySelector<HTMLElement>('[data-work-count]');
  const bar = section.querySelector<HTMLElement>('[data-work-bar]');
  const n = items.length;
  if (n < 2) return;
  section.dataset.live = '';
  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    for (let j = 0; j < n; j++) {
      const it = items[j]!;
      it.dataset.state = j === i ? 'active' : j < i ? 'past' : 'next';
      // Only the project in front is reachable by keyboard and assistive tech.
      it.inert = j !== i;
    }
    if (count) count.textContent = String(i + 1).padStart(2, '0');
    motion.hover = -1;
  };
  setActive(0);

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      // Dwell at each project: ease between whole positions so a card rests at the front.
      const x = self.progress * (n - 1);
      const f = x - Math.floor(x);
      const e = gsap.utils.clamp(0, 1, (f - 0.22) / 0.56);
      motion.workPos = Math.floor(x) + e * e * (3 - 2 * e);
      setActive(Math.round(x));
      if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
    },
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top top',
    onUpdate: (self) => (motion.workIn = self.progress),
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'bottom bottom',
    end: 'bottom top',
    onUpdate: (self) => (motion.workOut = self.progress),
  });
}

// ---------- Practice: a pinned drum. Scroll turns a five-sided prism, one practice per face ----------
// The section pins; scroll progress sets a target position that dwells on each face, and the frame
// loop damps the drum toward it. Faces turning away darken; the pointer tilts the whole drum. On
// the way in, the drum rises and stands up from a tipped-back pose.
let drumStop: (() => void) | null = null;

function drum(doc: Document, core: MotionCore): void {
  drumStop?.();
  drumStop = null;
  const section = doc.querySelector<HTMLElement>('[data-drum]');
  const ring = section?.querySelector<HTMLElement>('[data-drum-ring]');
  const stage = section?.querySelector<HTMLElement>('[data-drum-stage]');
  if (!section || !ring || !stage) return;
  const faces = Array.from(ring.querySelectorAll<HTMLElement>('[data-face]'));
  const ticks = Array.from(section.querySelectorAll<HTMLElement>('[data-drum-tick]'));
  const count = section.querySelector<HTMLElement>('[data-drum-count]');
  const n = faces.length;
  if (n < 2) return;
  section.dataset.live = '';
  const step = 360 / n;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let target = 0;
  let pos = 0;
  let enterT = 0;
  let enter = 0;
  let tiltX = 0;
  let tiltY = 0;
  let tiltXT = 0;
  let tiltYT = 0;
  let active = -1;
  let dirty = true;

  const setActive = (i: number): void => {
    if (i === active) return;
    active = i;
    for (let j = 0; j < n; j++) {
      // Only the face in front takes the pointer and the keyboard.
      faces[j]!.inert = j !== i;
      const t = ticks[j];
      if (t) {
        if (j === i) t.dataset.active = '';
        else delete t.dataset.active;
      }
    }
    if (count) count.textContent = String(i + 1).padStart(2, '0');
  };
  setActive(0);

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      // Dwell on each face: ease between whole positions so a face rests square to the reader.
      const x = self.progress * (n - 1);
      const f = x - Math.floor(x);
      const e = gsap.utils.clamp(0, 1, (f - 0.2) / 0.6);
      target = Math.floor(x) + e * e * (3 - 2 * e);
      dirty = true;
    },
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top top',
    onUpdate: (self) => {
      enterT = self.progress;
      dirty = true;
    },
  });

  const onMove = (e: PointerEvent): void => {
    const r = stage.getBoundingClientRect();
    tiltYT = ((e.clientX - r.left) / r.width - 0.5) * 10;
    tiltXT = -((e.clientY - r.top) / r.height - 0.5) * 7;
    dirty = true;
  };
  const onLeave = (): void => {
    tiltXT = 0;
    tiltYT = 0;
    dirty = true;
  };
  if (fine) {
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
  }

  const frame = (_time: number, deltaMs: number): void => {
    if (!dirty) return;
    const dt = Math.min(deltaMs, 64) / 1000;
    const k = 1 - Math.exp(-7 * dt);
    const kt = 1 - Math.exp(-4 * dt);
    pos += (target - pos) * k;
    enter += (enterT - enter) * k;
    tiltX += (tiltXT - tiltX) * kt;
    tiltY += (tiltYT - tiltY) * kt;
    const settled =
      Math.abs(target - pos) < 1e-4 &&
      Math.abs(enterT - enter) < 1e-4 &&
      Math.abs(tiltXT - tiltX) < 1e-3 &&
      Math.abs(tiltYT - tiltY) < 1e-3;
    if (settled) {
      pos = target;
      enter = enterT;
      dirty = false;
    }
    const ease = 1 - Math.pow(1 - enter, 3);
    ring.style.setProperty('--rot', `${(pos * step).toFixed(3)}deg`);
    ring.style.setProperty('--enter', ease.toFixed(4));
    ring.style.setProperty('--tx', `${tiltX.toFixed(3)}deg`);
    ring.style.setProperty('--ty', `${tiltY.toFixed(3)}deg`);
    // Distance around the prism, in faces: the last face sits next to the first.
    for (let i = 0; i < n; i++) {
      const d = Math.abs(i - pos);
      faces[i]!.style.setProperty('--a', Math.min(d, n - d).toFixed(3));
    }
    setActive(Math.min(n - 1, Math.max(0, Math.round(pos))));
  };
  core.addFrame(frame);

  drumStop = () => {
    core.removeFrame(frame);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerleave', onLeave);
  };
  doc.addEventListener('astro:before-swap', () => drumStop?.(), { once: true });
}

// ---------- Magnetic controls: pulled a little toward the pointer, damped back on leave ----------
function magnetic(doc: Document): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  doc.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic || 0.3);
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    let rect: DOMRect | null = null;
    el.addEventListener('pointerenter', () => {
      rect = el.getBoundingClientRect();
    });
    el.addEventListener('pointermove', (e) => {
      if (!rect) return;
      xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => {
      rect = null;
      xTo(0);
      yTo(0);
    });
  });
}

// ---------- Work index: a live preview card follows the pointer over the project rows ----------
function peek(doc: Document): void {
  const list = doc.querySelector<HTMLElement>('[data-peek-list]');
  const peekEl = doc.querySelector<HTMLElement>('[data-peek]');
  if (!list || !peekEl || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const xTo = gsap.quickTo(peekEl, 'x', { duration: 0.55, ease: 'power3' });
  const yTo = gsap.quickTo(peekEl, 'y', { duration: 0.55, ease: 'power3' });
  gsap.set(peekEl, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
  list.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
  list.querySelectorAll<HTMLElement>('[data-peek-row]').forEach((row) => {
    row.addEventListener('pointerenter', () => {
      peekEl.dataset.slug = row.dataset.slug ?? '';
      peekEl.dataset.pattern = row.dataset.pattern ?? '0';
      peekEl.dataset.seed = row.dataset.seed ?? '0';
      peekEl.dataset.base = row.dataset.base ?? '';
      peekEl.dataset.line = row.dataset.line ?? '';
      peekEl.dataset.accent = row.dataset.accent ?? '';
      gsap.to(peekEl, { scale: 1, opacity: 1, duration: 0.5, ease: EXPO });
    });
  });
  list.addEventListener('pointerleave', () => gsap.to(peekEl, { scale: 0.6, opacity: 0, duration: 0.4, ease: 'power3.out' }));
}

// ---------- In-page anchors go through Lenis for one smooth, interruptible glide ----------
function anchors(doc: Document, core: MotionCore): void {
  doc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not([href="#"])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = doc.querySelector<HTMLElement>(a.getAttribute('href') ?? '');
      if (!target) return;
      e.preventDefault();
      core.scrollTo(target);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}
