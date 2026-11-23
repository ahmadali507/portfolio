// The trail: one thick line in the accent that runs down the home page, from under the header to
// the footer, and draws itself as the reader scrolls. Its tip sits a little below the middle of
// the screen and reaches the very end of the line when the page is scrolled to the bottom. It keeps to
// the page gutters, wobbling gently, and sweeps across the page at each section boundary, where
// there is only empty padding. So it never runs under a line of text.
//
// The path is built in real pixels from the measured layout, and built again whenever the
// layout is measured again. It is decoration: without this script there is no line, and under
// reduced motion the whole line is simply there.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from './state';

const NS = 'http://www.w3.org/2000/svg';
const TIP = 0.62; // where the tip sits, as a fraction of the viewport height
const CROSS = 100; // half the height of a crossing, in pixels
const STRIDE = 210; // distance between wobbles along an edge

let stop: (() => void) | null = null;

export function mountTrail(doc: Document): void {
  stop?.();
  stop = null;
  const wrap = doc.querySelector<HTMLElement>('[data-trail]');
  if (!wrap) return;

  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'trail');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = doc.createElementNS(NS, 'path');
  svg.appendChild(path);
  wrap.prepend(svg);

  let total = 0;
  let height = 0;
  // Lookup from a height on the page to the length of line drawn by then.
  let ys: number[] = [];
  let ls: number[] = [];
  const state = { len: 0 };

  const apply = (): void => {
    path.style.strokeDashoffset = String(Math.max(0, total - state.len));
  };

  const build = (): void => {
    const box = wrap.getBoundingClientRect();
    const width = wrap.clientWidth;
    height = wrap.clientHeight;
    if (!width || !height) return;

    // The gutter is the page container's own side padding plus whatever margin centres it.
    const page = wrap.querySelector<HTMLElement>('.page');
    const gutter = page
      ? Math.max(16, page.getBoundingClientRect().left - box.left + parseFloat(getComputedStyle(page).paddingLeft || '0'))
      : 16;
    const thick = Math.max(9, Math.min(34, gutter * 0.55));
    const left = Math.max(thick, gutter * 0.5);
    const right = width - left;
    const wobble = Math.min(gutter * 0.14, 10);
    const edge = (side: number): number => (side > 0 ? right : left);

    // Section tops, measured from the top of the wrapper. The line crosses at each one.
    const bounds = Array.from(wrap.children)
      .filter((el) => el.tagName === 'SECTION')
      .map((el) => el.getBoundingClientRect().top - box.top);

    const pts: Array<[number, number]> = [];
    let side = 1;
    let y = 0;
    let k = 0;
    pts.push([edge(side), 0]);
    const walk = (to: number): void => {
      while (y + STRIDE < to) {
        y += STRIDE;
        k++;
        pts.push([edge(side) + (k % 2 ? wobble : -wobble), y]);
      }
    };
    for (const b of bounds) {
      if (b - CROSS <= y + 20 || b + CROSS >= height - 60) continue;
      walk(b - CROSS - 40);
      y = b - CROSS;
      pts.push([edge(side), y]);
      side = -side;
      y = b + CROSS;
      pts.push([edge(side), y]);
    }
    walk(height - 120);
    // The line runs off the bottom of the page, into the footer.
    pts.push([edge(side), height]);

    // Each span is an S curve with vertical ends, so the line only ever travels downward.
    let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]!;
      const [x1, y1] = pts[i]!;
      const ym = ((y0 + y1) / 2).toFixed(1);
      d += ` C${x0.toFixed(1)} ${ym} ${x1.toFixed(1)} ${ym} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    path.setAttribute('d', d);
    path.setAttribute('stroke-width', thick.toFixed(1));

    total = path.getTotalLength();
    path.style.strokeDasharray = `${total} ${total}`;
    const steps = Math.max(32, Math.ceil(height / 24));
    ys = new Array<number>(steps + 1);
    ls = new Array<number>(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const l = (total * i) / steps;
      ys[i] = path.getPointAtLength(l).y;
      ls[i] = l;
    }
  };

  const lengthAt = (yy: number): number => {
    if (yy <= ys[0]!) return 0;
    let lo = 0;
    let hi = ys.length - 1;
    if (yy >= ys[hi]!) return total;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ys[mid]! <= yy) lo = mid;
      else hi = mid;
    }
    const span = ys[hi]! - ys[lo]! || 1;
    return ls[lo]! + ((yy - ys[lo]!) / span) * (ls[hi]! - ls[lo]!);
  };

  const follow = (): void => {
    if (!total) return;
    if (motion.reduced) {
      state.len = total;
      apply();
      return;
    }
    // Over the last screen of scroll the tip slides to the bottom of the screen, so the line
    // is complete when the page ends.
    const view = window.innerHeight;
    const room = document.documentElement.scrollHeight - view;
    const last = Math.min(1, Math.max(0, (window.scrollY - (room - view)) / Math.max(1, view)));
    const tip = view * (TIP + (1 - TIP) * last) - wrap.getBoundingClientRect().top;
    gsap.to(state, { len: lengthAt(tip), duration: 0.8, ease: 'power3.out', overwrite: true, onUpdate: apply });
  };

  build();
  follow();
  const trigger = ScrollTrigger.create({
    trigger: wrap,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: follow,
    onRefresh: () => {
      build();
      follow();
    },
  });

  stop = () => {
    trigger.kill();
    gsap.killTweensOf(state);
    svg.remove();
  };
  doc.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
