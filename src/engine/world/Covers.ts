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
  local.y += uBend * (1.0 - across * across) * uSize.y * 0.06;

  // Perspective tilt toward the pointer, in pixels, around the plate center.
  vec2 aim = (uPointer - 0.5) * uHover * uTilt;
  float z = local.x * aim.x - local.y * aim.y;
  float persp = 1400.0;
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
uniform vec3 uLight;
uniform vec3 uShade;
uniform vec3 uInk;
uniform vec3 uAccent;

varying vec2 vUv;
varying float vShade;

float field(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  float h = pattern(uPattern, p, uSeed);
  // Hover ripple from the last press inside the cover.
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
  vec2 e = 1.5 / uSize;
  float h = field(vUv);
  float hx = field(vUv + vec2(e.x, 0.0)) - h;
  float hy = field(vUv + vec2(0.0, e.y)) - h;
  vec3 n = normalize(vec3(-hx * uSize.x * 0.05, -hy * uSize.y * 0.05, 1.0));
  vec3 key = normalize(vec3(-0.5, 0.6, 0.65));
  float lambert = dot(n, key) * 0.5 + 0.5;
  vec3 col = mix(uShade, uLight, clamp(lambert * 0.9 + h * 0.15, 0.0, 1.0));

  // Contour lines every 0.08 of height, antialiased with screen derivatives.
  float level = h / 0.08;
  float w = fwidth(level);
  float line = 1.0 - smoothstep(0.0, w * 1.2, abs(fract(level - 0.5) - 0.5));
  col = mix(col, uInk, line * 0.42);

  // Near the pointer, the contours take the accent.
  vec2 dp = (vUv - uPointer) * vec2(uSize.x / uSize.y, 1.0);
  float near = exp(-dot(dp, dp) * 30.0) * uHover;
  col = mix(col, uAccent, line * near);

  // A little light falloff across the tilt sells the depth.
  col *= 1.0 - vShade * 0.05;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

interface Plate {
  el: HTMLElement;
  mesh: Mesh;
  material: ShaderMaterial;
  /** Document-space rectangle, measured on mount and resize only. */
  top: number;
  left: number;
  width: number;
  height: number;
  hover: number;
  hoverTarget: number;
  pointer: Vector2;
  pointerTarget: Vector2;
  bend: number;
  listeners: Array<[string, EventListener]>;
}

/**
 * Project covers as WebGL planes, drawn in a second pass with an orthographic camera in CSS
 * pixels. The DOM decides layout; this layer only follows cached rectangles and the scroll value.
 */
export class Covers implements WorldPart {
  private readonly ctx: EngineContext;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000);
  private readonly geometry = new PlaneGeometry(1, 1, 32, 24);
  private plates: Plate[] = [];
  private height = 1;
  private lastScroll = -1;
  private tier: Tier;
  private time = 0;
  private readonly colors = {
    light: new Color('#dcdedb'),
    shade: new Color('#b4b8b5'),
    ink: new Color('#4f5456'),
    accent: new Color('#e2401c'),
  };

  constructor(ctx: EngineContext, tier: Tier) {
    this.ctx = ctx;
    this.tier = tier;
  }

  setTier(tier: Tier): void {
    this.tier = tier;
  }

  resize(width: number, height: number): void {
    this.height = height;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
    this.measure();
  }

  private measure(): void {
    const sy = window.scrollY;
    const sx = window.scrollX;
    for (const p of this.plates) {
      const frame = p.el.querySelector<HTMLElement>('.frame') ?? p.el;
      const r = frame.getBoundingClientRect();
      p.top = r.top + sy;
      p.left = r.left + sx;
      p.width = r.width;
      p.height = r.height;
      const u = p.material.uniforms;
      (u.uSize!.value as Vector2).set(Math.max(1, r.width), Math.max(1, r.height));
    }
    this.lastScroll = -1;
  }

  mount(doc: Document): void {
    this.unmount();
    const els = Array.from(doc.querySelectorAll<HTMLElement>('[data-plate]'));
    for (const el of els) this.plates.push(this.createPlate(el));
    this.measure();
    if (this.plates.length) doc.documentElement.dataset.plates = 'live';
    this.ctx.invalidate();
  }

  private createPlate(el: HTMLElement): Plate {
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPattern: { value: Number(el.dataset.pattern ?? 0) },
        uSeed: { value: Number(el.dataset.seed ?? 0) },
        uSize: { value: new Vector2(1, 1) },
        uPointer: { value: new Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uBend: { value: 0 },
        uTilt: { value: 0.11 },
        uRipple: { value: new Vector3(0.5, 0.5, -10) },
        uTime: { value: 0 },
        uLight: { value: this.colors.light },
        uShade: { value: this.colors.shade },
        uInk: { value: this.colors.ink },
        uAccent: { value: this.colors.accent },
      },
    });
    const mesh = new Mesh(this.geometry, material);
    // Placement and visibility are computed from DOM rectangles below, not from geometry bounds.
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    const plate: Plate = {
      el,
      mesh,
      material,
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      hover: 0,
      hoverTarget: 0,
      pointer: material.uniforms.uPointer!.value as Vector2,
      pointerTarget: new Vector2(0.5, 0.5),
      bend: 0,
      listeners: [],
    };

    // DOM events, not per-frame reads: the frame loop only consumes the stored targets.
    // Uses the cached document-space rectangle, so pointer events never force a layout read.
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
      const rip = material.uniforms.uRipple!.value as Vector3;
      rip.set(plate.pointerTarget.x, plate.pointerTarget.y, this.time);
      this.ctx.invalidate();
    };
    plate.listeners.push(['pointerenter', enter], ['pointermove', move], ['pointerleave', leave], ['pointerdown', down]);
    for (const [type, fn] of plate.listeners) el.addEventListener(type, fn, { passive: true });
    return plate;
  }

  unmount(): void {
    for (const p of this.plates) {
      for (const [type, fn] of p.listeners) p.el.removeEventListener(type, fn);
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
    const bendTarget = rm || this.tier === 2 ? 0 : clamp(input.velocity * 0.012, -0.9, 0.9);

    for (let i = 0; i < this.plates.length; i++) {
      const p = this.plates[i]!;
      const u = p.material.uniforms;
      // Visibility from the cached rectangle against the viewport.
      const y = p.top - input.scroll;
      const visible = y + p.height > -50 && y < this.height + 50 && p.width > 0;
      p.mesh.visible = visible;
      if (!visible) continue;
      p.mesh.position.set(p.left + p.width / 2, -(y + p.height / 2), 0);

      const ht = rm ? 0 : p.hoverTarget;
      p.hover = rm ? ht : damp(p.hover, ht, 7, dt);
      p.pointer.x = rm ? p.pointerTarget.x : damp(p.pointer.x, p.pointerTarget.x, 9, dt);
      p.pointer.y = rm ? p.pointerTarget.y : damp(p.pointer.y, p.pointerTarget.y, 9, dt);
      p.bend = damp(p.bend, bendTarget, 5, dt);
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
    // Covers sit in front of the field in screen space, so the field's depth must not hide them.
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.unmount();
    this.geometry.dispose();
  }
}
