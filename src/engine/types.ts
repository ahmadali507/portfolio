import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/** Read-only per-frame input. One object, mutated in place by the Engine each tick. */
export interface FrameInput {
  /** Seconds since the previous tick, clamped. */
  dt: number;
  /** Seconds since the Engine started. */
  time: number;
  /** Current Lenis (or native) scroll offset in CSS pixels. */
  scroll: number;
  /** Lenis scroll velocity in CSS pixels per frame. Zero without Lenis or under reduced motion. */
  velocity: number;
  /** Pointer in normalized device coordinates, -1 to 1. */
  pointerX: number;
  pointerY: number;
  /** True when the pointer moved since the previous tick. */
  pointerMoved: boolean;
  /** True for one tick after a touch tap; pointerX and pointerY hold its position. */
  tapped: boolean;
  /** False when the pointer left the window. */
  pointerInside: boolean;
  /** Viewport size in CSS pixels. */
  width: number;
  height: number;
  reducedMotion: boolean;
}

/** Quality tier. 1 is full, 2 drops secondary detail. Tier 3 means the poster, so no world runs. */
export type Tier = 1 | 2;

export interface EngineContext {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  /** Ask for a render on the next tick, for state that changes outside update(). */
  invalidate(): void;
  /** Programmatic scroll that goes through Lenis when it is running. */
  scrollTo(target: number | HTMLElement, immediate?: boolean): void;
}

/** A scene part the Engine composes. Plain class, no Astro imports. */
export interface WorldPart {
  /** Damp state toward targets. Return true when anything visible changed. */
  update(input: FrameInput): boolean;
  /** Called from the single resize path. */
  resize(width: number, height: number): void;
  /** Bind to the current page DOM. Runs on astro:page-load. */
  mount(doc: Document): void;
  /** Release page bindings. Runs on astro:before-swap. */
  unmount(): void;
  setTier(tier: Tier): void;
  /** Optional second pass drawn after the main scene without clearing (DOM-mapped planes). */
  renderOverlay?(renderer: WebGLRenderer): void;
  /** Free GPU resources. */
  dispose(): void;
}
