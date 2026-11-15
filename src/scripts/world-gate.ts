// Capability gate and lazy loader for the 3D bundle (ARCHITECTURE.md sections 4 and 5).
// This file is in the initial bundle, so it stays tiny and imports nothing from three.
// Runs once per session: Astro bundles it as a module script, and the router does not re-run it.

interface NetworkInformationLike {
  saveData?: boolean;
}

function capable(): boolean {
  const params = new URLSearchParams(location.search);
  if (params.get('world') === 'off') return false;
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (conn?.saveData) return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function start(host: HTMLElement): void {
  if (!capable()) {
    host.dataset.state = 'poster';
    return;
  }
  host.dataset.state = 'loading';
  import('../engine/boot')
    .then((m) => m.boot(host))
    .catch((err: unknown) => {
      host.dataset.state = 'poster';
      console.warn('[world] bundle failed to load, showing the static poster.', err);
    });
}

function schedule(): void {
  const host = document.getElementById('world');
  if (!host) return;
  const run = () => start(host);
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 600);
}

// After first paint and the load event, never in the critical path.
if (document.readyState === 'complete') schedule();
else window.addEventListener('load', schedule, { once: true });
