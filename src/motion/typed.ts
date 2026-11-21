// The typed line in the home hero: each role types in letter by letter, holds, is marked like a
// selection in an editor, clears, and the next one types in. The list of roles under it marks the
// current one and fills a hairline for as long as it is on screen.
//
// Every letter span is built once at mount; the frame function only reveals and hides them, so it
// allocates nothing. It runs on the shared gsap.ticker loop and keeps its own clock, which stops
// while the hero is off screen or the tab is hidden. Under reduced motion it does not mount, and
// the server-rendered first role stays as plain text.

import { ROLES } from '@/config/site';
import type { MotionCore } from './core';
import { motion } from './state';

const START = 1.1; // seconds before the first letter, after the name has risen in
const TYPE = 0.058; // seconds per letter
const HOLD = 2.3; // seconds a finished role stays
const SELECT = 0.45; // seconds it stays marked before it clears
const GAP = 0.32; // seconds of empty line, caret blinking, before the next role

const enum Phase {
  Wait,
  Type,
  Hold,
  Select,
  Gap,
}

let stop: (() => void) | null = null;

export function mountTyped(doc: Document, core: MotionCore): void {
  stop?.();
  stop = null;
  if (motion.reduced) return;
  const host = doc.querySelector<HTMLElement>('[data-typed]');
  const text = host?.querySelector<HTMLElement>('[data-typed-text]');
  if (!host || !text) return;
  const items = Array.from(doc.querySelectorAll<HTMLElement>('[data-roles] [data-role]'));

  // Build every role once: a hidden group of letter spans per role.
  text.textContent = '';
  const groups: HTMLElement[] = [];
  const letters: HTMLElement[][] = [];
  const dwell: string[] = [];
  for (const r of ROLES) {
    const line = `${r.a} ${r.role}`;
    const g = doc.createElement('span');
    g.hidden = true;
    const ls: HTMLElement[] = [];
    // Letters sit inside a no-wrap span per word, so a long role breaks between words only.
    const words = line.split(' ');
    for (let w = 0; w < words.length; w++) {
      const word = doc.createElement('span');
      word.className = 'tw-word';
      for (const c of words[w]!) {
        const s = doc.createElement('span');
        s.className = 'tw';
        s.textContent = c;
        s.hidden = true;
        word.appendChild(s);
        ls.push(s);
      }
      g.appendChild(word);
      if (w < words.length - 1) {
        const space = doc.createElement('span');
        space.className = 'tw';
        space.textContent = ' ';
        space.hidden = true;
        g.appendChild(space);
        ls.push(space);
      }
    }
    text.appendChild(g);
    groups.push(g);
    letters.push(ls);
    dwell.push(`${(line.length * TYPE + HOLD).toFixed(2)}s`);
  }

  let visible = true;
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
  });
  io.observe(host);

  let clock = 0;
  let phase = Phase.Wait;
  let since = 0;
  let k = 0;
  let shown = 0;

  const setActive = (i: number): void => {
    for (let j = 0; j < items.length; j++) {
      const it = items[j]!;
      if (j === i) {
        it.style.setProperty('--role-dwell', dwell[i]!);
        it.dataset.active = '';
      } else if (it.dataset.active !== undefined) {
        delete it.dataset.active;
      }
    }
  };

  const enter = (p: Phase): void => {
    phase = p;
    since = clock;
  };

  const frame = (_time: number, deltaMs: number): void => {
    if (!visible || doc.hidden || motion.reduced) return;
    clock += Math.min(deltaMs, 100) / 1000;
    const t = clock - since;
    const ls = letters[k]!;
    switch (phase) {
      case Phase.Wait:
        if (t >= START) {
          groups[k]!.hidden = false;
          setActive(k);
          host.dataset.busy = '';
          enter(Phase.Type);
        }
        break;
      case Phase.Type: {
        const want = Math.min(ls.length, Math.floor(t / TYPE) + 1);
        while (shown < want) ls[shown++]!.hidden = false;
        if (shown === ls.length) {
          delete host.dataset.busy;
          enter(Phase.Hold);
        }
        break;
      }
      case Phase.Hold:
        if (t >= HOLD) {
          host.dataset.selected = '';
          enter(Phase.Select);
        }
        break;
      case Phase.Select:
        if (t >= SELECT) {
          delete host.dataset.selected;
          groups[k]!.hidden = true;
          for (let i = 0; i < ls.length; i++) ls[i]!.hidden = true;
          shown = 0;
          enter(Phase.Gap);
        }
        break;
      case Phase.Gap:
        if (t >= GAP) {
          k = (k + 1) % groups.length;
          groups[k]!.hidden = false;
          setActive(k);
          host.dataset.busy = '';
          enter(Phase.Type);
        }
        break;
    }
  };
  core.addFrame(frame);

  stop = () => {
    core.removeFrame(frame);
    io.disconnect();
  };
  doc.addEventListener('astro:before-swap', () => stop?.(), { once: true });
}
