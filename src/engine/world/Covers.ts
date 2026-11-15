import {
  Color,
  MathUtils,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  type WebGLRenderer,
} from 'three';
import { PATTERNS_GLSL } from '../shaders/patterns';
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

const fragmentShader = /* glsl */ `
${PATTERNS_GLSL}

uniform float uPattern;
uniform float uSeed;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uHover;
uniform vec3 uRipple;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uLine;
uniform vec3 uAccent;
uniform float uRadius;
uniform float uAlpha;
uniform float uDim;
uniform float uCut;
uniform vec2 uView;

varying vec2 vUv;
varying float vShade;

float field(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  float h = pattern(uPattern, p, uSeed);
  float age = uTime - uRipple.z;
  if (age > 0.0 && age < 2.0) {
    vec2 d = (uv - uRipple.xy) * vec2(uSize.x / uSize.y, 1.0);
    float r = length(d);
    float front = age * 0.7;
    h += sin((r - front) * 40.0) * exp(-pow((r - front) * 9.0, 2.0)) * exp(-age * 2.0) * 0.12;
  }
  return h;
}

void main() {
  // Rounded corners, matching the CSS radius of the frame.
  vec2 px = (vUv - 0.5) * uSize;
  vec2 q = abs(px) - (uSize * 0.5 - uRadius);
  float dist = length(max(q, 0.0)) - uRadius;
  float mask = 1.0 - smoothstep(-1.0, 0.5, dist);
  if (mask <= 0.0) discard;
  // A card stacked over this one hides everything below its top edge (CSS px from the top).
  float yTop = uView.y - gl_FragCoord.y / uView.x;
  if (yTop > uCut) discard;

  vec2 e = 1.5 / uSize;
  float h = field(vUv);
  float hx = field(vUv + vec2(e.x, 0.0)) - h;
  float hy = field(vUv + vec2(0.0, e.y)) - h;
  vec3 n = normalize(vec3(-hx * uSize.x * 0.05, -hy * uSize.y * 0.05, 1.0));
  float light = dot(n, normalize(vec3(-0.45, 0.55, 0.7))) * 0.5 + 0.5;
  vec3 col = uBase * mix(0.88, 1.08, light);

  float level = h / 0.07;
  float w = fwidth(level);
  float line = 1.0 - smoothstep(0.0, w * 1.2, abs(fract(level - 0.5) - 0.5));
  // Where contours crowd closer than a few pixels, fade them out instead of letting them alias.
  line *= 1.0 - smoothstep(0.18, 0.45, w);
  col = mix(col, uLine, line * 0.8);

  vec2 dp = (vUv - uPointer) * vec2(uSize.x / uSize.y, 1.0);
  float near = exp(-dot(dp, dp) * 24.0) * uHover;
  col = mix(col, uAccent, line * near);

  // Gloss: a soft diagonal sheen that slides with the pointer, plus a fixed top-left glaze.
  vec2 dir = normalize(vec2(1.0, 0.55));
  float band = dot(vUv - mix(vec2(0.2, 0.8), uPointer, uHover), dir);
  float sheen = exp(-band * band * 38.0) * (0.06 + 0.1 * uHover);
  float glaze = smoothstep(1.2, 0.0, length(vUv - vec2(0.0, 1.0))) * 0.05;
  col += vec3(sheen + glaze);
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
  /** Measured every frame when the plate lives in a moving container (sticky, scaled, following). */
  track: boolean;
  /** Stacking cards: this card's shade overlay, and the next card whose top edge hides this plate. */
  shade: HTMLElement | null;
  cutEl: HTMLElement | null;
  top: number;
  left: number;
  width: number;
  height: number;
  hover: number;
  hoverTarget: number;
  pointer: Vector2;
  pointerTarget: Vector2;
  bend: number;
  key: string;
  listeners: Array<[string, EventListener]>;
}

/**
 * Project covers as WebGL planes in a second, orthographic pass in CSS pixels. Static plates use
 * rectangles cached on mount and resize; tracked plates read their rectangle each frame
 * (ARCHITECTURE.md section 8 allows this for at most a handful of plates in moving containers).
 */
export class Covers implements WorldPart {
  private readonly ctx: EngineContext;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000);
  private readonly geometry = new PlaneGeometry(1, 1, 32, 24);
  private readonly accent = new Color('#e2401c');
  /** x: device pixel ratio, y: viewport height in CSS px. Shared by every plate. */
  private readonly view = new Vector2(1, 1);
  private plates: Plate[] = [];
  private height = 1;
  private lastScroll = -1;
  private tier: Tier;
  private time = 0;

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
    (p.material.uniforms.uSize!.value as Vector2).set(Math.max(1, r.width), Math.max(1, r.height));
  }

  mount(doc: Document): void {
    this.unmount();
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[data-plate]'))) this.plates.push(this.createPlate(el));
    for (const p of this.plates) this.measure(p, window.scrollY);
    if (this.plates.length) doc.documentElement.dataset.plates = 'live';
    this.ctx.invalidate();
  }

  private syncData(p: Plate): void {
    const d = p.el.dataset;
    const key = `${d.pattern}|${d.seed}|${d.base}|${d.line}`;
    if (key === p.key) return;
    p.key = key;
    const u = p.material.uniforms;
    u.uPattern!.value = Number(d.pattern ?? 0);
    u.uSeed!.value = Number(d.seed ?? 0);
    (u.uBase!.value as Color).set(d.base ?? '#e1e2df');
    (u.uLine!.value as Color).set(d.line ?? '#8f9492');
  }

  private createPlate(el: HTMLElement): Plate {
    const frame = el.querySelector<HTMLElement>('.frame') ?? el;
    const host = el.closest<HTMLElement>('[data-plate-host]') ?? el;
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uPattern: { value: 0 },
        uSeed: { value: 0 },
        uSize: { value: new Vector2(1, 1) },
        uPointer: { value: new Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uBend: { value: 0 },
        uTilt: { value: 0.1 },
        uRipple: { value: new Vector3(0.5, 0.5, -10) },
        uTime: { value: 0 },
        uBase: { value: new Color() },
        uLine: { value: new Color() },
        uAccent: { value: this.accent },
        uRadius: { value: parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 0 },
        uAlpha: { value: 1 },
        uDim: { value: 0 },
        uCut: { value: 1e6 },
        uView: { value: this.view },
      },
    });
    const mesh = new Mesh(this.geometry, material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    const plate: Plate = {
      el,
      frame,
      host,
      mesh,
      material,
      track: el.hasAttribute('data-plate-track'),
      shade: el.closest('[data-stack-card]')?.querySelector<HTMLElement>('[data-stack-shade]') ?? null,
      cutEl:
        (el.closest('[data-stack-card]')?.nextElementSibling as HTMLElement | null)?.querySelector<HTMLElement>(
          '[data-stack-inner]',
        ) ?? null,
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      hover: 0,
      hoverTarget: el.hasAttribute('data-peek') ? 0.6 : 0,
      pointer: material.uniforms.uPointer!.value as Vector2,
      pointerTarget: new Vector2(0.5, 0.5),
      bend: 0,
      key: '',
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
    const down: EventListener = (e) => {
      toUv(e as PointerEvent);
      (material.uniforms.uRipple!.value as Vector3).set(plate.pointerTarget.x, plate.pointerTarget.y, this.time);
      this.ctx.invalidate();
    };
    plate.listeners.push(['pointerenter', enter], ['pointermove', move], ['pointerleave', leave], ['pointerdown', down]);
    for (const [type, fn] of plate.listeners) host.addEventListener(type, fn, { passive: true });
    return plate;
  }

  unmount(): void {
    for (const p of this.plates) {
      for (const [type, fn] of p.listeners) p.host.removeEventListener(type, fn);
      this.scene.remove(p.mesh);
      p.material.dispose();
    }
    this.plates = [];
    delete document.documentElement.dataset.plates;
  }

  update(input: FrameInput): boolean {
    if (!this.plates.length) return false;
    const dt = input.dt;
    const rm = input.reducedMotion;
    this.time = input.time;
    let active = input.scroll !== this.lastScroll;
    this.lastScroll = input.scroll;
    const bendTarget = rm || this.tier === 2 ? 0 : clamp(input.velocity * 0.01, -0.8, 0.8);

    for (let i = 0; i < this.plates.length; i++) {
      const p = this.plates[i]!;
      const u = p.material.uniforms;
      if (p.track) {
        // Sticky, scaled, or pointer-following containers: follow the real box this frame.
        const pt = p.top;
        const pl = p.left;
        const pw = p.width;
        const pa = u.uAlpha!.value as number;
        this.measure(p, input.scroll);
        this.syncData(p);
        const o = p.el.style.opacity;
        u.uAlpha!.value = o === '' ? 1 : Number(o);
        if (pt !== p.top || pl !== p.left || pw !== p.width || pa !== u.uAlpha!.value) active = true;
        const so = p.shade?.style.opacity;
        u.uDim!.value = so ? Number(so) : 0;
        u.uCut!.value = p.cutEl ? p.cutEl.getBoundingClientRect().top : 1e6;
      }
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
      u.uBend!.value = p.bend;
      u.uTime!.value = input.time;

      if (
        Math.abs(p.hover - ht) > 1e-3 ||
        Math.abs(p.bend - bendTarget) > 1e-3 ||
        Math.abs(p.pointer.x - p.pointerTarget.x) > 1e-3 ||
        Math.abs(p.pointer.y - p.pointerTarget.y) > 1e-3 ||
        input.time - (u.uRipple!.value as Vector3).z < 2
      ) {
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
