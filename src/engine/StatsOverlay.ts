import type { Engine } from './Engine';

/**
 * Dev-only overlay: frame interval, draw calls, triangles, pixel ratio, tier.
 * Imported only behind import.meta.env.DEV, so it never ships in a build.
 * Updates twice a second from a timer, outside the frame loop.
 */
export class StatsOverlay {
  private readonly el: HTMLElement;

  constructor(engine: Engine) {
    this.el = document.createElement('div');
    this.el.setAttribute('aria-hidden', 'true');
    this.el.style.cssText =
      'position:fixed;right:8px;bottom:8px;z-index:9999;padding:6px 8px;font:11px/1.35 ui-monospace,monospace;' +
      'background:#1b1d1e;color:#e3e4e2;pointer-events:none;white-space:pre;';
    document.documentElement.appendChild(this.el);
    let lastFrames = 0;
    let lastRenders = 0;
    let lastT = performance.now();
    window.setInterval(() => {
      const i = engine.readInfo();
      const now = performance.now();
      const secs = (now - lastT) / 1000;
      const fps = (i.frames - lastFrames) / secs;
      const rps = (i.renders - lastRenders) / secs;
      lastFrames = i.frames;
      lastRenders = i.renders;
      lastT = now;
      this.el.textContent =
        `tick ${fps.toFixed(0)}/s  render ${rps.toFixed(0)}/s\n` +
        `median ${i.medianMs.toFixed(1)} ms\n` +
        `calls ${i.calls}  tris ${i.triangles}\n` +
        `dpr ${i.pixelRatio}  tier ${i.tier}\n` +
        `geo ${i.geometries}  tex ${i.textures}`;
    }, 500);
  }
}
