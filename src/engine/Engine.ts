import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { gsap } from 'gsap';
import Lenis from 'lenis';
import { Quality } from './Quality';
import type { EngineContext, FrameInput, WorldPart } from './types';

/** Clear color matches --color-bg so the canvas and the page read as one surface. */
const CLEAR = '#e3e4e2';
/** A second context loss inside this window keeps the poster for the rest of the session. */
const LOSS_WINDOW_MS = 60_000;
const MAX_DT = 1 / 15;

export interface EngineInfo {
  calls: number;
  triangles: number;
  pixelRatio: number;
  tier: number;
  medianMs: number;
  frames: number;
  renders: number;
  geometries: number;
  textures: number;
}

/**
 * The single Engine. Owns the renderer, scene, camera, the one gsap.ticker loop with Lenis
 * inside it, the one resize path, visibility, context loss, and disposal.
 * Created once per session (module singleton in boot.ts), never per page.
 */
export class Engine implements EngineContext {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly lenis: Lenis | null;
  readonly quality: Quality;
  readonly info: EngineInfo = {
    calls: 0,
    triangles: 0,
    pixelRatio: 1,
    tier: 1,
    medianMs: 0,
    frames: 0,
    renders: 0,
    geometries: 0,
    textures: 0,
  };

  private readonly host: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly input: FrameInput;
  private parts: WorldPart[] = [];
  private running = false;
  private hidden = false;
  private offscreen = false;
  private dirty = true;
  private firstFrameShown = false;
  private failed = false;
  private lastLoss = 0;
  private pendingResize = true;
  private nextWidth: number;
  private nextHeight: number;
  private lastRenderTime = -1;
  private readonly motionQuery: MediaQueryList;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private readonly tickFn: (time: number, deltaMs: number) => void;
  /** Registered once so removal works; never recreated per frame. */
  private readonly handlers: Array<[EventTarget, string, EventListener]> = [];

  constructor(host: HTMLElement) {
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.tabIndex = -1;

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.quality = new Quality(window.devicePixelRatio || 1, coarse);

    this.renderer = Engine.createRenderer(this.canvas, this.quality.pixelRatio);
    this.renderer.setClearColor(new Color(CLEAR), 1);

    this.nextWidth = host.clientWidth || window.innerWidth;
    this.nextHeight = host.clientHeight || window.innerHeight;
    this.camera = new PerspectiveCamera(32, this.nextWidth / this.nextHeight, 0.1, 400);

    this.input = {
      dt: 0,
      time: 0,
      scroll: window.scrollY,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      pointerMoved: false,
      tapped: false,
      pointerInside: false,
      width: this.nextWidth,
      height: this.nextHeight,
      reducedMotion: this.motionQuery.matches,
    };

    // Lenis runs inside the one ticker (autoRaf: false). It honors reduced motion itself.
    this.lenis = new Lenis({
      autoRaf: false,
      lerp: 0.11,
      smoothWheel: true,
      syncTouch: false,
      respectReducedMotion: true,
      anchors: false,
    });

    this.tickFn = (time, deltaMs) => this.tick(time, deltaMs);

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      this.nextWidth = Math.max(1, Math.round(entry.contentRect.width));
      this.nextHeight = Math.max(1, Math.round(entry.contentRect.height));
      this.pendingResize = true;
    });

    this.intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) this.offscreen = !entry.isIntersecting;
    });

    this.listen(this.canvas, 'webglcontextlost', (e) => this.onContextLost(e));
    this.listen(this.canvas, 'webglcontextrestored', () => this.onContextRestored());
    this.listen(document, 'visibilitychange', () => this.onVisibility());
    this.listen(window, 'pointermove', (e) => this.onPointer(e as PointerEvent));
    this.listen(window, 'pointerdown', (e) => this.onPointerDown(e as PointerEvent));
    this.listen(document.documentElement, 'pointerleave', () => {
      this.input.pointerInside = false;
      this.input.pointerMoved = true;
    });
    this.listen(this.motionQuery, 'change', () => {
      this.input.reducedMotion = this.motionQuery.matches;
      this.dirty = true;
    });

    host.appendChild(this.canvas);
  }

  /** The renderer factory. The only place a renderer is created (ARCHITECTURE.md section 6). */
  private static createRenderer(canvas: HTMLCanvasElement, pixelRatio: number): WebGLRenderer {
    const renderer = new WebGLRenderer({
      canvas,
      antialias: pixelRatio < 2,
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setPixelRatio(pixelRatio);
    // Two passes per frame (field, then covers): counters are reset once per frame by the Engine.
    renderer.info.autoReset = false;
    return renderer;
  }

  add(part: WorldPart): void {
    this.parts.push(part);
    part.resize(this.nextWidth, this.nextHeight);
    this.dirty = true;
  }

  start(): void {
    if (this.running || this.failed) return;
    this.running = true;
    this.resizeObserver.observe(this.host);
    this.intersectionObserver.observe(this.host);
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(this.tickFn);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    gsap.ticker.remove(this.tickFn);
  }

  invalidate(): void {
    this.dirty = true;
  }

  scrollTo(target: number | HTMLElement, immediate = false): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, { immediate: immediate || this.input.reducedMotion, force: true });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: immediate ? 'instant' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: immediate ? 'instant' : 'smooth' });
    }
  }

  mount(doc: Document): void {
    // The router replaced the document body: resync Lenis to the native position and new height.
    if (this.lenis) {
      this.lenis.resize();
      this.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      this.lenis.start();
    }
    for (const part of this.parts) part.mount(doc);
    this.pendingResize = true;
    this.dirty = true;
  }

  unmount(): void {
    for (const part of this.parts) part.unmount();
    this.lenis?.stop();
  }

  // ---------- the frame ----------

  private tick(time: number, deltaMs: number): void {
    if (this.failed) return;
    try {
      const input = this.input;
      input.dt = Math.min(deltaMs / 1000, MAX_DT);
      input.time = time;

      // 1. Lenis step.
      if (this.lenis && !this.hidden) this.lenis.raf(time * 1000);

      if (this.hidden) return;

      // 2. Read scroll and pointer (values only, no layout reads).
      input.scroll = this.lenis ? this.lenis.scroll : window.scrollY;
      input.velocity = this.lenis && !input.reducedMotion ? this.lenis.velocity : 0;

      // 3. The one resize path.
      if (this.pendingResize) this.applyResize();
      if (this.quality.changed) this.applyQuality();

      // 4. Damp state toward targets, update uniforms and camera.
      let changed = this.dirty;
      for (let i = 0; i < this.parts.length; i++) {
        const part = this.parts[i];
        if (part && part.update(input)) changed = true;
      }
      input.pointerMoved = false;
      input.tapped = false;
      this.info.frames++;

      // 5. Render only when something changed and the canvas is on screen.
      if (!changed || this.offscreen) {
        this.lastRenderTime = -1;
        return;
      }
      this.renderer.info.reset();
      this.renderer.render(this.scene, this.camera);
      this.renderer.autoClear = false;
      for (let i = 0; i < this.parts.length; i++) this.parts[i]?.renderOverlay?.(this.renderer);
      this.renderer.autoClear = true;
      this.dirty = false;
      this.info.renders++;
      this.info.calls = this.renderer.info.render.calls;
      this.info.triangles = this.renderer.info.render.triangles;

      // Adaptive quality samples only consecutive rendered frames, so idle time is not counted.
      if (this.lastRenderTime >= 0) this.quality.sample((time - this.lastRenderTime) * 1000);
      this.lastRenderTime = time;

      if (!this.firstFrameShown) {
        this.firstFrameShown = true;
        this.host.dataset.state = 'live';
      }
    } catch (err) {
      this.fail(err);
    }
  }

  private applyResize(): void {
    this.pendingResize = false;
    const w = this.nextWidth;
    const h = this.nextHeight;
    this.input.width = w;
    this.input.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.lenis?.resize();
    for (const part of this.parts) part.resize(w, h);
    this.dirty = true;
  }

  private applyQuality(): void {
    this.quality.changed = false;
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setSize(this.input.width, this.input.height, false);
    for (const part of this.parts) part.setTier(this.quality.tier);
    // Parts that depend on the drawing-buffer size re-measure through the one resize path.
    this.pendingResize = true;
    this.info.pixelRatio = this.quality.pixelRatio;
    this.info.tier = this.quality.tier;
    this.dirty = true;
  }

  /** Live counters for the stats overlay and the measurement script. */
  readInfo(): EngineInfo {
    const i = this.info;
    i.pixelRatio = this.renderer.getPixelRatio();
    i.tier = this.quality.tier;
    i.medianMs = this.quality.medianMs;
    i.geometries = this.renderer.info.memory.geometries;
    i.textures = this.renderer.info.memory.textures;
    return i;
  }

  // ---------- events ----------

  private listen(target: EventTarget, type: string, fn: EventListener): void {
    target.addEventListener(type, fn, { passive: type !== 'webglcontextlost' });
    this.handlers.push([target, type, fn]);
  }

  private setPointer(e: PointerEvent): void {
    const w = this.input.width || 1;
    const h = this.input.height || 1;
    this.input.pointerX = (e.clientX / w) * 2 - 1;
    this.input.pointerY = -(e.clientY / h) * 2 + 1;
  }

  private onPointer(e: PointerEvent): void {
    if (e.pointerType === 'touch') return;
    this.setPointer(e);
    this.input.pointerInside = true;
    this.input.pointerMoved = true;
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType !== 'touch') return;
    this.setPointer(e);
    this.input.tapped = true;
  }

  private onVisibility(): void {
    this.hidden = document.visibilityState === 'hidden';
    if (this.hidden) {
      this.lenis?.stop();
    } else {
      this.lenis?.start();
      this.lastRenderTime = -1;
      this.dirty = true;
    }
  }

  private onContextLost(e: Event): void {
    e.preventDefault();
    this.stop();
    this.host.dataset.state = 'poster';
    const now = performance.now();
    const repeated = this.lastLoss > 0 && now - this.lastLoss < LOSS_WINDOW_MS;
    this.lastLoss = now;
    if (repeated) this.fail(new Error('WebGL context lost twice; staying on the poster.'));
  }

  private onContextRestored(): void {
    if (this.failed) return;
    // three re-initializes its GL state on restore; geometry and programs upload again on the next render.
    this.firstFrameShown = false;
    this.lastRenderTime = -1;
    this.dirty = true;
    this.start();
  }

  /** Any init or frame error: stop, restore the poster, log once. The page keeps working. */
  fail(err: unknown): void {
    if (this.failed) return;
    this.failed = true;
    this.stop();
    this.host.dataset.state = 'poster';
    console.warn('[world] stopped, showing the static poster.', err);
    this.dispose();
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    for (const [target, type, fn] of this.handlers) target.removeEventListener(type, fn);
    this.handlers.length = 0;
    for (const part of this.parts) part.dispose();
    this.parts = [];
    this.lenis?.destroy();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
