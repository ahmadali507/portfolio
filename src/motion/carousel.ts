// The reviews carousel on the home page: cards on an arc that drift slowly and continuously to
// the right. The ring's position is a number that moves a little every frame; each card is placed
// by its distance from the front (CSS reads --d and --a), so cards glide in from the left, pass the
// front, and fade out on the right. A card wraps from one end to the other only while it is fully
// faded, so nothing ever jumps or is skipped.
//
// The drift eases to a stop while the pointer is over the carousel and eases back when it leaves.
// The buttons and a click on a side card glide the ring one card, then the drift resumes. It runs
// on the shared frame loop and only while the carousel is on screen. Under reduced motion there
// is no drift and the buttons move one card at a time. Without this script the cards are a plain
// row that scrolls sideways.

import type { MotionCore } from './core';
import { motion } from './state';

const SPEED = 1 / 7; // cards per second: one card reaches the front every seven seconds
const REACH = 2.6; // cards beyond this distance from the front are faded out and not clickable

let stop: (() => void) | null = null;

export function mountCarousel(doc: Document, core: MotionCore): void {
  stop?.();
  stop = null;
  const root = doc.querySelector<HTMLElement>('[data-carousel]');
  const track = root?.querySelector<HTMLElement>('[data-car-track]');
  if (!root || !track) return;
  const cards = Array.from(track.children) as HTMLElement[];
  const n = cards.length;
  if (n === 0) return;
  const count = root.querySelector<HTMLElement>('[data-car-count]');
  const prev = root.querySelector<HTMLButtonElement>('[data-car-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-car-next]');

  // pos: which card is at the front, as a continuous number. It falls over time, so the cards'
  // distances grow and they travel to the right.
  let pos = 0;
  let speed = motion.reduced ? 0 : SPEED; // current drift, eased toward its goal
  let hover = false;
  let visible = false;
  let glide: number | null = null; // a target position the buttons asked for
  let front = -1;

  const wrap = (v: number): number => ((v % n) + n) % n;

  const place = (): void => {
    for (let i = 0; i < n; i++) {
      // Distance of card i from the front, wrapped to the nearer side: -n/2 .. n/2.
      let d = wrap(i - pos);
      if (d > n / 2) d -= n;
      const a = Math.abs(d);
      const card = cards[i]!;
      card.style.setProperty('--d', d.toFixed(4));
      card.style.setProperty('--a', a.toFixed(4));
      card.style.setProperty('--z', String(Math.round(100 - a * 10)));
      card.toggleAttribute('data-far', a > REACH);
    }
    const f = wrap(Math.round(pos));
    if (f !== front) {
      front = f;
      for (let i = 0; i < n; i++) {
        cards[i]!.toggleAttribute('data-on', i === f);
        cards[i]!.setAttribute('aria-hidden', i === f ? 'false' : 'true');
      }
      if (count) count.textContent = String(f + 1).padStart(2, '0');
    }
  };

  const goTo = (target: number): void => {
    if (motion.reduced) {
      pos = target;
      glide = null;
      place();
      return;
    }
    glide = target;
  };

  const frame = (_time: number, deltaMs: number): void => {
    if (!visible || doc.hidden) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    if (glide !== null) {
      const k = 1 - Math.exp(-dt * 5);
      pos += (glide - pos) * k;
      if (Math.abs(glide - pos) < 0.002) {
        pos = glide;
        glide = null;
      }
    } else {
      const goal = motion.reduced || hover ? 0 : SPEED;
      speed += (goal - speed) * (1 - Math.exp(-dt * 2.5));
      if (speed < 0.0005 && goal === 0) return;
      pos -= speed * dt;
    }
    place();
  };

  const onPrev = (): void => goTo(Math.round(pos) + 1);
  const onNext = (): void => goTo(Math.round(pos) - 1);
  const onCard = (event: Event): void => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-car-track] > *');
    const i = card ? cards.indexOf(card) : -1;
    if (i < 0 || i === front) return;
    let d = wrap(i - pos);
    if (d > n / 2) d -= n;
    goTo(Math.round(pos + d));
  };
  const onEnter = (): void => {
    hover = true;
  };
  const onLeave = (): void => {
    hover = false;
  };
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? false;
  });

  root.dataset.live = '';
  place();
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  track.addEventListener('click', onCard);
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  io.observe(root);
  core.addFrame(frame);

  stop = () => {
    core.removeFrame(frame);
    io.disconnect();
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    track.removeEventListener('click', onCard);
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
  };
  doc.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
