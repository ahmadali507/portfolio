// Page choreography. Every beat is tied to scroll or pointer intent, scrubbed or triggered once,
// and runs inside the gsap.context created in core.ts, so navigation reverts it cleanly.
// Content is visible by default in CSS; this file only adds motion on top. Under reduced motion
// nothing here runs except state that the 3D engine needs.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from './state';
import type { MotionCore } from './core';
import { mountChem } from './chem';

const EXPO = 'expo.out';

export function mountScenes(doc: Document, core: MotionCore): void {
  heroScene(doc);
  mountChem(doc, core);
  if (motion.reduced) return;
  revealLines(doc);
  rise(doc);
  statement(doc);
  workGallery(doc);
  horizontal(doc);
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

// ---------- Practice: a sticky track that scrolls sideways ----------
function horizontal(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((section) => {
    const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
    if (!track) return;
    section.classList.add('is-horizontal');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    // CSS sticky holds the frame; the section is made tall enough to scroll the full track.
    const size = () => {
      section.style.height = `${distance() + window.innerHeight}px`;
    };
    size();
    ScrollTrigger.addEventListener('refreshInit', size);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
    const bar = section.querySelector<HTMLElement>('[data-hscroll-bar]');
    if (bar) {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true } },
      );
    }
  });
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
