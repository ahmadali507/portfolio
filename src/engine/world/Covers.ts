import {
  MathUtils,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  type WebGLRenderer,
} from 'three';
import { SCENES_GLSL } from '../shaders/scenes';
import { SHOTS_GLSL } from '../shaders/shots';
import { atlasReady, hasShots, releaseAtlas, shotUniforms } from './shotAtlas';
import { paletteFor } from '../../lib/palettes';
import { PALETTE_GLSL, paletteUniforms } from './palette';
import type { EngineContext, FrameInput, Tier, WorldPart } from '../types';

const { damp, clamp } = MathUtils;

const vertexShader = /* glsl */ `
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uHover;
uniform float uBend;
uniform float uTilt;

varying vec2 vUv;
varying float vShade;

void main() {
  vUv = uv;
  vec2 local = position.xy * uSize;

  // Elastic bend from scroll speed: the middle lags behind the edges.
  float across = position.x * 2.0;
  local.y += uBend * (1.0 - across * across) * uSize.y * 0.05;

  // Perspective tilt toward the pointer, in pixels, around the plate center.
  vec2 aim = (uPointer - 0.5) * uHover * uTilt;
  float z = local.x * aim.x - local.y * aim.y;
  float persp = 1600.0;
  local *= persp / (persp - z);
  vShade = clamp(z / (uSize.x * 0.12), -1.0, 1.0);

  vec3 center = modelMatrix[3].xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(center.xy + local, 0.0, 1.0);
}
`;

// The same motion graphic as the project's 3D card, composited in one pass: the three layers
// shift against each other with the pointer, so the plate reads as a shallow diorama.
const fragmentShader = /* glsl */ `
${SCENES_GLSL}
#ifdef SHOTS
${SHOTS_GLSL}
#endif
${PALETTE_GLSL}

uniform float uSeed;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
uniform float uRadius;
uniform float uAlpha;
uniform float uDim;
uniform float uCut;
uniform vec2 uView;

varying vec2 vUv;
varying float vShade;

void main() {
  vec2 px = (vUv - 0.5) * uSize;
  vec2 q = abs(px) - (uSize * 0.5 - uRadius);
  float dist = length(max(q, 0.0)) - uRadius;
  float mask = 1.0 - smoothstep(-1.0, 0.5, dist);
  if (mask <= 0.0) discard;
  float yTop = uView.y - gl_FragCoord.y / uView.x;
  if (yTop > uCut) discard;

  // Cards keep the bottom fifth for the title; plates show the stage above it, centered.
  float aspect = uSize.x / uSize.y;
#ifdef SHOTS
  // The browser window fills most of the plate; narrow plates zoom out so it never clips.
  float span = max(0.84, 1.54 / aspect);
  gP = vec2(0.8 + (vUv.x - 0.5) * aspect * span, 0.565 + (vUv.y - 0.5) * span);
#else
  gP = vec2(0.8 + (vUv.x - 0.5) * aspect * 0.82, 0.18 + vUv.y * 0.82);
#endif
  gPar = (uPointer - 0.5) * -0.035 * (0.35 + 0.65 * uHover);
  gL0 = vec4(0.0);
  gL1 = vec4(0.0);
  gL2 = vec4(0.0);
  usePalette();
#ifdef SHOTS
  runShots(uTime + uSeed * 10.0);
#else
  runScene(mod(uTime + uSeed * 10.0, 10.0));
#endif
  vec3 col = over(gL2, over(gL1, gL0)).rgb;

  // Gloss: a soft diagonal sheen that slides with the pointer.
  vec2 dir = normalize(vec2(1.0, 0.55));
  float band = dot(vUv - mix(vec2(0.2, 0.8), uPointer, uHover), dir);
  col += vec3(exp(-band * band * 38.0) * (0.03 + 0.06 * uHover));
  col *= 1.0 - vShade * 0.05;
  col = mix(col, vec3(0.004, 0.0045, 0.005), uDim);

  gl_FragColor = vec4(col, mask * uAlpha);
  #include <colorspace_fragment>
}
`;

interface Plate {
  el: HTMLElement;
  frame: HTMLElement;
  /** Element whose pointer events drive hover (the whole card or link around the plate). */
  host: HTMLElement;
  mesh: Mesh;
  material: ShaderMaterial;
  /** Measured every frame when the plate lives in a moving container (pointer-following preview). */
  track: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
  hover: number;
  hoverTarget: number;
  /** Shared with the material's uniforms; survives a material rebuild. */
  pointer: Vector2;
  size: Vector2;
  radius: number;
  pointerTarget: Vector2;
  bend: number;
  key: string;
  /** Project whose atlas the current material holds, or empty. */
  atlas: string;
  listeners: Array<[string, EventListener]>;
}

/**
 * Project covers as WebGL planes in a second, orthographic pass in CSS pixels. Static plates use
 * rectangles cached on mount and resize; tracked plates read their rectangle each frame.
 * Each plate compiles only its own scene; switching project (the work-index preview) swaps material.
 */
export class Covers implements WorldPart {
  private readonly ctx: EngineContext;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000);
  private readonly geometry = new PlaneGeometry(1, 1, 32, 24);
  /** x: device pixel ratio, y: viewport height in CSS px. Shared by every plate. */
  private readonly view = new Vector2(1, 1);
  private plates: Plate[] = [];
  private height = 1;
  private lastScroll = -1;
  private tier: Tier;

  constructor(ctx: EngineContext, tier: Tier) {
    this.ctx = ctx;
    this.tier = tier;
  }

  setTier(tier: Tier): void {
    this.tier = tier;
  }

  resize(width: number, height: number): void {
    this.height = height;
    this.view.set(this.ctx.renderer.getPixelRatio(), height);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
    for (const p of this.plates) this.measure(p, window.scrollY);
    this.lastScroll = -1;
  }

  private measure(p: Plate, scroll: number): void {
    const r = p.frame.getBoundingClientRect();
    p.top = r.top + scroll;
    p.left = r.left + window.scrollX;
    p.width = r.width;
    p.height = r.height;
    p.size.set(Math.max(1, r.width), Math.max(1, r.height));
  }

  mount(doc: Document): void {
    this.unmount();
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[data-plate]'))) this.plates.push(this.createPlate(el));
    for (const p of this.plates) this.measure(p, window.scrollY);
    if (this.plates.length) doc.documentElement.dataset.plates = 'live';
    this.ctx.invalidate();
  }

  private makeMaterial(p: Plate, slug: string, seed: number): ShaderMaterial {
    const pal = paletteFor(slug);
    const shots = hasShots(slug);
    p.atlas = shots ? slug : '';
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: shots ? { SCENE: 0, SHOTS: 1 } : { SCENE: pal.scene },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uSeed: { value: seed },
        uSize: { value: p.size },
        uPointer: { value: p.pointer },
        uHover: { value: 0 },
        uBend: { value: 0 },
        uTilt: { value: 0.1 },
        uTime: { value: 0 },
        uRadius: { value: p.radius },
        uAlpha: { value: 1 },
        uDim: { value: 0 },
        uCut: { value: 1e6 },
        uView: { value: this.view },
        ...paletteUniforms(pal),
        ...(shots ? shotUniforms(slug) : {}),
      },
    });
  }

  /** Rebuilds the material when the element now shows a different project. */
  private syncData(p: Plate): void {
    const d = p.el.dataset;
    const key = `${d.slug ?? ''}|${d.seed ?? ''}`;
    if (key === p.key) return;
    p.key = key;
    const old = p.material;
    const oldAtlas = p.atlas;
    p.material = this.makeMaterial(p, d.slug ?? '', Number(d.seed ?? 0));
    p.mesh.material = p.material;
    old.dispose();
    if (oldAtlas) releaseAtlas(oldAtlas);
  }

  private createPlate(el: HTMLElement): Plate {
    const frame = el.querySelector<HTMLElement>('.frame') ?? el;
    const host = el.closest<HTMLElement>('[data-plate-host]') ?? el;
    const placeholder = new ShaderMaterial();
    const mesh = new Mesh(this.geometry, placeholder);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    const plate: Plate = {
      el,
      frame,
      host,
      mesh,
      material: placeholder,
      track: el.hasAttribute('data-plate-track'),
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      hover: 0,
      hoverTarget: el.hasAttribute('data-peek') ? 0.6 : 0,
      pointer: new Vector2(0.5, 0.5),
      size: new Vector2(1, 1),
      radius: parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 0,
      pointerTarget: new Vector2(0.5, 0.5),
      bend: 0,
      key: '',
      atlas: '',
      listeners: [],
    };
    this.syncData(plate);
    if (el.hasAttribute('data-peek')) return plate;

    // DOM events only store targets; the frame loop consumes them.
    const toUv = (e: PointerEvent) => {
      const x = e.clientX + window.scrollX - plate.left;
      const y = e.clientY + window.scrollY - plate.top;
      plate.pointerTarget.set(clamp(x / plate.width, 0, 1), clamp(1 - y / plate.height, 0, 1));
    };
    const enter: EventListener = (e) => {
      plate.hoverTarget = 1;
      toUv(e as PointerEvent);
      this.ctx.invalidate();
    };
    const move: EventListener = (e) => {
      toUv(e as PointerEvent);
      this.ctx.invalidate();
    };
    const leave: EventListener = () => {
      plate.hoverTarget = 0;
      plate.pointerTarget.set(0.5, 0.5);
      this.ctx.invalidate();
    };
    plate.listeners.push(['pointerenter', enter], ['pointermove', move], ['pointerleave', leave]);
    for (const [type, fn] of plate.listeners) host.addEventListener(type, fn, { passive: true });
    return plate;
  }

  unmount(): void {
    for (const p of this.plates) {
      for (const [type, fn] of p.listeners) p.host.removeEventListener(type, fn);
      this.scene.remove(p.mesh);
      p.material.dispose();
      if (p.atlas) releaseAtlas(p.atlas);
    }
    this.plates = [];
    delete document.documentElement.dataset.plates;
  }

  update(input: FrameInput): boolean {
    if (!this.plates.length) return false;
    const dt = input.dt;
    const rm = input.reducedMotion;
    let active = input.scroll !== this.lastScroll;
    this.lastScroll = input.scroll;
    const bendTarget = rm || this.tier === 2 ? 0 : clamp(input.velocity * 0.01, -0.8, 0.8);

    for (let i = 0; i < this.plates.length; i++) {
      const p = this.plates[i]!;
      if (p.track) {
        // Pointer-following containers: follow the real box this frame.
        const pt = p.top;
        const pl = p.left;
        this.measure(p, input.scroll);
        this.syncData(p);
        const o = p.el.style.opacity;
        const alpha = o === '' ? 1 : Number(o);
        if (pt !== p.top || pl !== p.left || p.material.uniforms.uAlpha!.value !== alpha) active = true;
        p.material.uniforms.uAlpha!.value = alpha;
      }
      const u = p.material.uniforms;
      const y = p.top - input.scroll;
      const visible = y + p.height > -50 && y < this.height + 50 && p.width > 1 && u.uAlpha!.value > 0.001;
      p.mesh.visible = visible;
      if (!visible) continue;
      p.mesh.position.set(p.left + p.width / 2, -(y + p.height / 2), 0);

      const ht = rm ? 0 : p.hoverTarget;
      p.hover = rm ? ht : damp(p.hover, ht, 7, dt);
      p.pointer.x = rm ? p.pointerTarget.x : damp(p.pointer.x, p.pointerTarget.x, 9, dt);
      p.pointer.y = rm ? p.pointerTarget.y : damp(p.pointer.y, p.pointerTarget.y, 9, dt);
      p.bend = p.track ? 0 : damp(p.bend, bendTarget, 5, dt);
      u.uHover!.value = p.hover;
      if (p.atlas && atlasReady(p.atlas)) u.uReady!.value = rm ? 1 : damp(u.uReady!.value as number, 1, 4, dt);
      u.uBend!.value = p.bend;
      // The motion graphic plays while the plate is on screen; under reduced motion it holds a frame.
      if (!rm) {
        u.uTime!.value = input.time;
        active = true;
      }
    }
    return active;
  }

  renderOverlay(renderer: WebGLRenderer): void {
    if (!this.plates.length) return;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.unmount();
    this.geometry.dispose();
  }
}
