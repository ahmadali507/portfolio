// The reviews carousel on the home page. The current card sits in the centre; the track slides to
// bring the next one in. It advances by itself while it is on screen and the reader is not using
// it, and stops for good once the reader takes over with the buttons. Under reduced motion it
// never moves by itself. Without this script the cards are a plain row that scrolls sideways.

import { motion } from './state';

const EVERY = 4200; // milliseconds a card stays in the centre

let stop: (() => void) | null = null;

export function mountCarousel(doc: Document): void {
  stop?.();
  stop = null;
  const root = doc.querySelector<HTMLElement>('[data-carousel]');
  const track = root?.querySelector<HTMLElement>('[data-car-track]');
  if (!root || !track) return;
  const cards = Array.from(track.children) as HTMLElement[];
  if (cards.length === 0) return;
  const count = root.querySelector<HTMLElement>('[data-car-count]');
  const prev = root.querySelector<HTMLButtonElement>('[data-car-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-car-next]');

  let index = 0;
  let timer = 0;
  let visible = false;
  let hands = false; // the reader has used the buttons

  const show = (): void => {
    const card = cards[index]!;
    track.style.transform = `translate3d(${-(card.offsetLeft + card.offsetWidth / 2)}px, 0, 0)`;
    for (let i = 0; i < cards.length; i++) {
      const on = i === index;
      cards[i]!.toggleAttribute('data-on', on);
      cards[i]!.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (count) count.textContent = String(index + 1).padStart(2, '0');
  };
  const go = (step: number): void => {
    index = (index + step + cards.length) % cards.length;
    show();
  };
  const pause = (): void => {
    window.clearInterval(timer);
    timer = 0;
  };
  const play = (): void => {
    pause();
    if (motion.reduced || hands || !visible || doc.hidden) return;
    timer = window.setInterval(() => go(1), EVERY);
  };
  const take = (step: number): void => {
    hands = true;
    pause();
    go(step);
  };

  const onPrev = (): void => take(-1);
  const onNext = (): void => take(1);
  const onVisibility = (): void => play();
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? false;
    play();
  });
  const ro = new ResizeObserver(show);

  root.dataset.live = '';
  show();
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  root.addEventListener('pointerenter', pause);
  root.addEventListener('pointerleave', play);
  doc.addEventListener('visibilitychange', onVisibility);
  io.observe(root);
  ro.observe(root);

  stop = () => {
    pause();
    io.disconnect();
    ro.disconnect();
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
    root.removeEventListener('pointerenter', pause);
    root.removeEventListener('pointerleave', play);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
  doc.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
