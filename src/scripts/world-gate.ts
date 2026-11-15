// Lazy loader for motion and 3D (ARCHITECTURE.md sections 4 and 5).
// This file is in the initial bundle, so it stays tiny and imports nothing heavy.
// 1. After load and idle, the motion core (Lenis, the one ticker, ScrollTrigger) loads for everyone.
// 2. If the capability gate passes, the 3D engine loads and subscribes to that same loop.

interface NetworkInformationLike {
  saveData?: boolean;
}

function webglCapable(): boolean {
  const params = new URLSearchParams(location.search);
  if (params.get('world') === 'off') return false;
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (conn?.saveData) return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

async function start(): Promise<void> {
  const host = document.getElementById('world');
  const { initCore } = await import('../motion/core');
  const core = initCore();
  if (!host) return;
  if (!webglCapable()) {
    host.dataset.state = 'poster';
    return;
  }
  host.dataset.state = 'loading';
  try {
    const { boot } = await import('../engine/boot');
    await boot(host, core);
  } catch (err) {
    host.dataset.state = 'poster';
    console.warn('[world] bundle failed to load, showing the static poster.', err);
  }
}

function schedule(): void {
  const run = () => void start();
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1800 });
  else setTimeout(run, 400);
}

if (document.readyState === 'complete') schedule();
else window.addEventListener('load', schedule, { once: true });
