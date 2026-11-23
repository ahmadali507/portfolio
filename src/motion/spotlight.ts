// The spotlight on project screenshots (components/Spotlight.astro). Each screen rests in shadow;
// a light glides to the part that matters, names it, holds, closes, and opens on the next screen.
//
// While the pointer is over a spotlight, the light follows the pointer and the screen never
// changes: a change that is due waits until the pointer leaves, and one that was already closing
// is called back. Changes also wait while the spotlight is off screen, while the tab is hidden,
// and, in the home gallery, while its project is not the one in front.
//
// The light is three CSS custom properties (--sx, --sy, --sr) written on the shared frame loop,
// only for spotlights on screen and only while they are still moving. Under reduced motion the
// light sits still on the first screen's key area and nothing changes by itself.

import type { MotionCore } from './core';
import { motion } from './state';

interface Shot {
  src: string;
  w: number;
  h: number;
  focus: [number, number, number, number];
  label: string;
  alt: string;
}

interface Light {
  x: number;
  y: number;
  r: number;
}

interface Spot {
  el: HTMLElement;
  shots: Shot[];
  base: HTMLImageElement;
  lit: HTMLImageElement;
  chip: HTMLElement;
  num: HTMLElement;
  txt: HTMLElement;
  dots: HTMLElement[];
  item: HTMLElement | null;
  k: number;
  over: boolean;
  closing: boolean;
  visible: boolean;
  px: number;
  py: number;
  W: number;
  H: number;
  cur: Light;
  goal: Light;
  moving: boolean;
  timer: number;
}

const HOLD = 3800; // ms a screen stays before the light moves on
const CLOSE = 520; // ms the light takes to close before the screen changes
const RETRY = 900; // ms to wait before trying again when a change is not allowed yet

let stop: (() => void) | null = null;

// Where the focus box lands when the shot is drawn with object-fit: cover, anchored top center.
function focusBox(s: Spot): { x: number; y: number; w: number; h: number } {
  const shot = s.shots[s.k]!;
  const scale = Math.max(s.W / shot.w, s.H / shot.h);
  const w = shot.w * scale;
  const f = shot.focus;
  return { x: (s.W - w) / 2 + f[0] * w, y: f[1] * shot.h * scale, w: f[2] * w, h: f[3] * shot.h * scale };
}

function aim(s: Spot, snap: boolean): void {
  const g = s.goal;
  if (s.over && !motion.reduced) {
    g.x = s.px;
    g.y = s.py;
    g.r = s.W * 0.17;
  } else {
    const b = focusBox(s);
    g.x = b.x + b.w / 2;
    g.y = Math.min(b.y + b.h / 2, s.H - 8);
    g.r = s.closing ? 0 : Math.max(s.W * 0.12, Math.min(s.W * 0.3, Math.max(b.w, b.h) * 0.62));
  }
  if (snap || motion.reduced) {
    s.cur.x = g.x;
    s.cur.y = g.y;
    s.cur.r = g.r;
  }
  s.moving = true;
}

function paint(s: Spot): void {
  const c = s.cur;
  s.el.style.setProperty('--sx', `${c.x.toFixed(1)}px`);
  s.el.style.setProperty('--sy', `${c.y.toFixed(1)}px`);
  s.el.style.setProperty('--sr', `${Math.max(0, c.r).toFixed(1)}px`);
  // The label sits above the light if it fits, else below it, else just inside its top edge.
  const show = !s.over && !s.closing && c.r > 20;
  s.el.toggleAttribute('data-label', show);
  if (!show) return;
  const above = c.y - c.r - 12;
  const below = c.y + c.r + 12;
  let y: number;
  let shift: string;
  if (above >= 34) {
    y = above;
    shift = '-100%';
  } else if (below <= s.H - 40) {
    y = below;
    shift = '0';
  } else {
    y = Math.max(12, c.y - c.r + 14);
    shift = '0';
  }
  const x = Math.min(s.W - 80, Math.max(80, c.x));
  s.chip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, ${shift})`;
}

function setShot(s: Spot, k: number): void {
  s.k = k;
  const shot = s.shots[k]!;
  s.base.src = shot.src;
  s.lit.src = shot.src;
  s.lit.alt = shot.alt;
  s.num.textContent = String(k + 1).padStart(2, '0');
  s.txt.textContent = shot.label;
  for (let i = 0; i < s.dots.length; i++) s.dots[i]!.classList.toggle('on', i === k);
  // Fetch the screen after this one now, so the next change does not wait on the network.
  const next = s.shots[(k + 1) % s.shots.length];
  if (next && next !== shot) new Image().src = next.src;
}

/** A change is allowed only when nobody is looking at this screen closely. */
function mayChange(s: Spot, doc: Document): boolean {
  if (s.over || !s.visible || doc.hidden) return false;
  if (s.item && s.item.dataset.state !== 'active') return false;
  return true;
}

function schedule(s: Spot, doc: Document, ms: number): void {
  window.clearTimeout(s.timer);
  s.timer = window.setTimeout(() => {
    if (!mayChange(s, doc)) {
      schedule(s, doc, RETRY);
      return;
    }
    s.closing = true;
    aim(s, false);
    s.timer = window.setTimeout(() => {
      s.closing = false;
      // The pointer arrived while the light was closing: stay on this screen.
      if (!mayChange(s, doc)) {
        aim(s, false);
        schedule(s, doc, HOLD);
        return;
      }
      setShot(s, (s.k + 1) % s.shots.length);
      aim(s, false);
      schedule(s, doc, HOLD);
    }, CLOSE);
  }, ms);
}

export function mountSpotlights(doc: Document, core: MotionCore): void {
  stop?.();
  stop = null;
  const els = Array.from(doc.querySelectorAll<HTMLElement>('[data-spot]'));
  if (els.length === 0) return;

  const spots: Spot[] = [];
  const offs: Array<() => void> = [];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const s = spots.find((x) => x.el === e.target);
      if (s) s.visible = e.isIntersecting;
    }
  });
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const s = spots.find((x) => x.el === e.target);
      if (!s) continue;
      s.W = s.el.clientWidth;
      s.H = s.el.clientHeight;
      aim(s, true);
      paint(s);
    }
  });

  els.forEach((el, i) => {
    let shots: Shot[];
    try {
      shots = JSON.parse(el.dataset.shots ?? '[]') as Shot[];
    } catch {
      return;
    }
    const base = el.querySelector<HTMLImageElement>('.spot-base');
    const lit = el.querySelector<HTMLImageElement>('.spot-lit');
    const chip = el.querySelector<HTMLElement>('.spot-chip');
    if (!shots.length || !base || !lit || !chip) return;
    const s: Spot = {
      el,
      shots,
      base,
      lit,
      chip,
      num: chip.querySelector('b') ?? chip,
      txt: chip.querySelector('span') ?? chip,
      dots: Array.from(el.querySelectorAll<HTMLElement>('.spot-dots i')),
      item: el.closest<HTMLElement>('[data-work-item]'),
      k: 0,
      over: false,
      closing: false,
      visible: false,
      px: 0,
      py: 0,
      W: el.clientWidth || 1,
      H: el.clientHeight || 1,
      cur: { x: 0, y: 0, r: 0 },
      goal: { x: 0, y: 0, r: 0 },
      moving: true,
      timer: 0,
    };
    spots.push(s);
    el.dataset.live = '';
    aim(s, true);
    // Open from nothing on the first screen, so the light arrives instead of appearing.
    if (!motion.reduced) s.cur.r = 0;
    paint(s);

    const onMove = (e: PointerEvent): void => {
      const b = el.getBoundingClientRect();
      s.over = true;
      s.px = e.clientX - b.left;
      s.py = e.clientY - b.top;
      aim(s, false);
    };
    const onLeave = (): void => {
      s.over = false;
      aim(s, false);
      // A full hold on the screen the reader was looking at, before the light moves on.
      if (!motion.reduced && s.shots.length > 1) schedule(s, doc, HOLD);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    offs.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.clearTimeout(s.timer);
    });
    io.observe(el);
    ro.observe(el);
    // Cards keep their own rhythm, offset so they never change together.
    if (!motion.reduced && shots.length > 1) schedule(s, doc, HOLD + i * 700);
  });

  const frame = (_time: number, deltaMs: number): void => {
    const k = 1 - Math.exp(-(Math.min(deltaMs, 50) / 1000) * 4.2);
    const kOver = 1 - Math.exp(-(Math.min(deltaMs, 50) / 1000) * 9);
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i]!;
      if (!s.visible || !s.moving) continue;
      const f = s.over ? kOver : k;
      const c = s.cur;
      const g = s.goal;
      c.x += (g.x - c.x) * f;
      c.y += (g.y - c.y) * f;
      c.r += (g.r - c.r) * f;
      if (Math.abs(g.x - c.x) + Math.abs(g.y - c.y) + Math.abs(g.r - c.r) < 0.3) {
        c.x = g.x;
        c.y = g.y;
        c.r = g.r;
        s.moving = false;
      }
      paint(s);
    }
  };
  core.addFrame(frame);

  stop = () => {
    core.removeFrame(frame);
    io.disconnect();
    ro.disconnect();
    for (const off of offs) off();
  };
  doc.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
