// The reviews carousel on the home page: cards on an arc. Each card is placed by its distance
// from the current one (CSS reads --d and --a), so the current card faces the reader and the
// others lean in from the sides. The ring turns by itself while it is on screen and the reader is
// not using it, and stops for good once the reader takes over. A side card can be clicked to
// bring it forward. Under reduced motion it never moves by itself. Without this script the cards
// are a plain row that scrolls sideways.

import { motion } from './state';

const EVERY = 3800; // milliseconds a card stays in front
const REACH = 2; // cards shown on each side of the current one

let stop: (() => void) | null = null;

export function mountCarousel(doc: Document): void {
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
  const places = new Array<number>(n).fill(0);

  let index = 0;
  let timer = 0;
  let visible = false;
  let hands = false; // the reader has taken over

  const show = (first: boolean): void => {
    for (let i = 0; i < n; i++) {
      // Distance around the ring, wrapped to the nearest side.
      let d = (((i - index) % n) + n) % n;
      if (d > n / 2) d -= n;
      const card = cards[i]!;
      // A card that wraps from one end of the ring to the other moves without a transition;
      // it is hidden at both ends, so the jump is never seen.
      const jump = !first && Math.abs(d - places[i]!) > 1.5;
      card.toggleAttribute('data-jump', jump);
      card.style.setProperty('--d', String(d));
      card.style.setProperty('--a', String(Math.abs(d)));
      card.toggleAttribute('data-on', d === 0);
      card.toggleAttribute('data-far', Math.abs(d) > REACH);
      card.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      places[i] = d;
    }
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  };
  const go = (to: number): void => {
    index = ((to % n) + n) % n;
    show(false);
  };
  const pause = (): void => {
    window.clearInterval(timer);
    timer = 0;
  };
  const play = (): void => {
    pause();
    if (motion.reduced || hands || !visible || doc.hidden || n < 2) return;
    timer = window.setInterval(() => go(index + 1), EVERY);
  };
  const take = (to: number): void => {
    hands = true;
    pause();
    go(to);
  };

  const onPrev = (): void => take(index - 1);
  const onNext = (): void => take(index + 1);
  const onCard = (event: Event): void => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-car-track] > *');
    const i = card ? cards.indexOf(card) : -1;
    if (i >= 0 && i !== index) take(i);
  };
  const onVisibility = (): void => play();
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? false;
    play();
  });

  root.dataset.live = '';
  show(true);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  track.addEventListener('click', onCard);
  root.addEventListener('pointerenter', pause);
  root.addEventListener('pointerleave', play);
  doc.addEventListener('visibilitychange', onVisibility);
  io.observe(root);

  stop = () => {
    pause();
    io.disconnect();
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    track.removeEventListener('click', onCard);
    root.removeEventListener('pointerenter', pause);
    root.removeEventListener('pointerleave', play);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
  doc.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
