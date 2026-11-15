import { Engine } from './Engine';
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
export async function boot(host: HTMLElement): Promise<void> {
  if (engine) return;
  try {
    engine = new Engine(host);
    const parts = await loadParts(engine);
    for (const part of parts) engine.add(part);

    document.addEventListener('astro:before-swap', () => engine?.unmount());
    document.addEventListener('astro:page-load', () => engine?.mount(document));

    engine.mount(document);
    engine.start();

    const e = engine;
    window.__world = { info: () => e.readInfo(), engine: e };

    if (import.meta.env.DEV) {
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
  const { RequestPath } = await import('./world/RequestPath');
  return [new RequestPath(e)];
}
