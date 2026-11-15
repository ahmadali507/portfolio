import { Engine } from './Engine';
import type { MotionCore } from '../motion/core';
import type { WorldPart } from './types';

declare global {
  interface Window {
    /** Read-only counters for scripts/measure.mjs and the dev overlay. */
    __world?: { info: () => ReturnType<Engine['readInfo']>; engine: Engine };
  }
}

let engine: Engine | null = null;

/**
 * Creates the Engine once for the session and wires the router lifecycle.
 * ARCHITECTURE.md section 1: mount on astro:page-load, unmount on astro:before-swap.
 */
export async function boot(host: HTMLElement, core: MotionCore): Promise<void> {
  if (engine) return;
  try {
    engine = new Engine(host, core);
    const parts = await loadParts(engine);
    for (const part of parts) engine.add(part);

    document.addEventListener('astro:before-swap', () => engine?.unmount());
    document.addEventListener('astro:page-load', () => engine?.mount(document));

    engine.mount(document);
    engine.start();

    const e = engine;
    window.__world = { info: () => e.readInfo(), engine: e };

    // Hidden under automation (screenshots) unless ?stats is set.
    if (import.meta.env.DEV && (!navigator.webdriver || location.search.includes('stats'))) {
      const { StatsOverlay } = await import('./StatsOverlay');
      new StatsOverlay(e);
    }
  } catch (err) {
    if (engine) engine.fail(err);
    else {
      host.dataset.state = 'poster';
      console.warn('[world] could not start, showing the static poster.', err);
    }
  }
}

/** Scene parts. Kept in one place so the engine shell does not depend on any one world. */
async function loadParts(e: Engine): Promise<WorldPart[]> {
  const [{ Showcase }, { Covers }] = await Promise.all([import('./world/Showcase'), import('./world/Covers')]);
  // Tier 2 from the start on coarse pointers and small screens (ARCHITECTURE.md section 8).
  const weak = window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600;
  const tier = weak ? 2 : 1;
  if (weak) e.quality.tier = 2;
  return [new Showcase(e, tier), new Covers(e, tier)];
}
