// The one loop. Owns Lenis, the single gsap.ticker callback, and ScrollTrigger.
// The 3D engine, when it runs, subscribes a frame function here instead of adding its own loop.
// ARCHITECTURE.md section 2: Lenis step, then scroll state, then subscribers (engine renders last).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { motion, type PageKind } from './state';
import { mountScenes } from './scenes';

gsap.registerPlugin(ScrollTrigger);

export type FrameFn = (time: number, deltaMs: number) => void;

export interface MotionCore {
  readonly lenis: Lenis;
  addFrame(fn: FrameFn): void;
  removeFrame(fn: FrameFn): void;
  scrollTo(target: number | HTMLElement, immediate?: boolean): void;
}

let core: MotionCore | null = null;
let ctx: gsap.Context | null = null;
const frames: FrameFn[] = [];

function readPage(): void {
  const root = document.documentElement;
  motion.page = (root.dataset.page ?? 'home') as PageKind;
  motion.focus = Number(document.body.dataset.focus ?? -1);
  motion.hero = 0;
  motion.exit = 0;
  motion.workIn = 0;
  motion.workPos = 0;
  motion.workOut = 0;
  motion.heroCovered = motion.page !== 'home';
  motion.hover = -1;
  motion.mountedAt = gsap.ticker.time;
}

function mount(): void {
  readPage();
  ctx?.revert();
  ctx = gsap.context(() => mountScenes(document, core!));
  // Fonts change line heights; measure triggers after they settle.
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export function initCore(): MotionCore {
  if (core) return core;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.reduced = reduce.matches;
  reduce.addEventListener('change', () => {
    motion.reduced = reduce.matches;
    mount();
  });

  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.09,
    smoothWheel: true,
    syncTouch: false,
    respectReducedMotion: true,
    anchors: false,
  });
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time, deltaMs) => {
    lenis.raf(time * 1000);
    motion.scroll = lenis.scroll;
    motion.velocity = motion.reduced ? 0 : lenis.velocity;
    for (let i = 0; i < frames.length; i++) frames[i]!(time, deltaMs);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') lenis.stop();
    else lenis.start();
  });

  document.addEventListener('astro:before-swap', () => {
    ctx?.revert();
    ctx = null;
    lenis.stop();
  });
  document.addEventListener('astro:page-load', () => {
    lenis.resize();
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    lenis.start();
    mount();
  });

  core = {
    lenis,
    addFrame: (fn) => {
      if (!frames.includes(fn)) frames.push(fn);
    },
    removeFrame: (fn) => {
      const i = frames.indexOf(fn);
      if (i >= 0) frames.splice(i, 1);
    },
    scrollTo: (target, immediate = false) =>
      lenis.scrollTo(target, { immediate: immediate || motion.reduced, force: true, duration: 1.4 }),
  };
  mount();
  return core;
}
