import {
  BoxGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Plane,
  Ray,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { PATTERNS_GLSL } from '../shaders/patterns';
import type { EngineContext, FrameInput, Tier, WorldPart } from '../types';

const { damp, clamp, smoothstep } = MathUtils;

/** Field size in world units. The grid is centered on the origin. */
const WIDTH = 26;
const DEPTH = 16;
const GRID: Record<Tier, [number, number]> = { 1: [80, 50], 2: [56, 36] };
const RIPPLES = 6;
const RIPPLE_LIFE = 2.4;
const RIPPLE_STEP = 0.35;
const PLANE_Y = 0.7;

const BG = '#e3e4e2';
const LIGHT = '#eeefed';
const SHADE = '#b9bdba';
const DEEP = '#8a8f8d';
const MAX_H = 4.2;
const ACCENT = '#e2401c';

const vertexShader = /* glsl */ `
${PATTERNS_GLSL}

attribute vec2 aCell;

uniform float uFrom;
uniform float uTo;
uniform float uSeedFrom;
uniform float uSeedTo;
uniform float uMix;
uniform float uAmp;
uniform float uTime;
uniform vec4 uRipples[${RIPPLES}];
uniform vec3 uPointer;

varying vec3 vNormal;
varying float vLocalY;
varying float vHot;
varying float vTop;
varying float vEdge;
varying float vDist;
varying float vHeight;

void main() {
  float h0 = pattern(uFrom, aCell, uSeedFrom);
  float h1 = pattern(uTo, aCell, uSeedTo);
  float h = mix(h0, h1, uMix);

  vec3 base = instanceMatrix[3].xyz;

  float rip = 0.0;
  for (int i = 0; i < ${RIPPLES}; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w > 0.0 && age > 0.0 && age < ${RIPPLE_LIFE.toFixed(1)}) {
      float d = distance(base.xz, r.xy);
      float front = age * 5.5;
      float env = exp(-pow((d - front) * 1.4, 2.0));
      rip += sin((d - front) * 4.5) * env * r.w * exp(-age * 1.6);
    }
  }

  float dp = distance(base.xz, uPointer.xy);
  float press = exp(-dp * dp * 2.6) * uPointer.z;

  float height = max(0.05, (0.1 + h * 3.6 + rip * 0.9 + press * 1.3) * uAmp);

  vec3 pos = position;
  pos.y *= height;
  vec4 world = instanceMatrix * vec4(pos, 1.0);
  vec4 mv = modelViewMatrix * world;

  vNormal = normal;
  vLocalY = pos.y;
  vHot = press;
  vTop = step(0.5, normal.y);
  vEdge = max(abs(aCell.x), abs(aCell.y));
  vDist = -mv.z;
  vHeight = height;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uLight;
uniform vec3 uShade;
uniform vec3 uDeep;
uniform vec3 uAccent;
uniform float uFade;
uniform float uMaxH;
uniform vec2 uFog;
uniform vec2 uRes;
uniform vec4 uZone;
uniform float uStageBottom;

varying vec3 vNormal;
varying float vLocalY;
varying float vHot;
varying float vTop;
varying float vEdge;
varying float vDist;
varying float vHeight;

void main() {
  vec3 n = normalize(vNormal);
  vec3 key = normalize(vec3(-0.6, 0.75, 0.45));
  float lambert = max(dot(n, key), 0.0);
  float hn = clamp(vHeight / uMaxH, 0.0, 1.0);

  vec3 col;
  if (vTop > 0.5) {
    // Tops read as a height map: higher pins catch more light.
    col = mix(uShade, uLight, 0.2 + 0.8 * hn);
  } else {
    // Sides: key light plus occlusion toward the base of each pin.
    float along = clamp(vLocalY / max(vHeight, 0.001), 0.0, 1.0);
    col = mix(uDeep, uShade, lambert * 0.85 + 0.15) * mix(0.8, 1.0, along);
  }

  col = mix(col, uAccent, smoothstep(0.3, 0.7, vHot) * vTop);

  float fog = smoothstep(uFog.x, uFog.y, vDist);
  float edge = smoothstep(0.8, 1.0, vEdge);
  col = mix(col, uBg, clamp(max(max(fog, edge), uFade), 0.0, 1.0));

  // Text zone: the field gives way under measured text so contrast never depends on the scene.
  vec2 s = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  float zx = smoothstep(uZone.x - 0.07, uZone.x, s.x) * (1.0 - smoothstep(uZone.z, uZone.z + 0.09, s.x));
  float zy = smoothstep(uZone.y - 0.06, uZone.y, s.y) * (1.0 - smoothstep(uZone.w, uZone.w + 0.07, s.y));
  col = mix(col, uBg, zx * zy * 0.95);
  // Below the page's stage band the field gives way to the page.
  col = mix(col, uBg, smoothstep(uStageBottom - 0.1, uStageBottom + 0.02, s.y));

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * The kinetic field: one InstancedMesh of pins, heights from GPU pattern functions.
 * All per-frame work damps a few numbers and writes uniforms. No allocation in update().
 */
export class Field implements WorldPart {
  private readonly ctx: EngineContext;
  private mesh: InstancedMesh | null = null;
  private readonly geometry: BoxGeometry;
  private readonly material: ShaderMaterial;
  private tier: Tier;

  // Uniform-backed state
  private readonly ripples: Vector4[] = [];
  private rippleCursor = 0;
  private readonly pointerUniform = new Vector3();

  // Damped state
  private mix = 1;
  private amp = 1;
  private press = 0;
  private camX = 0;
  private camY = 9.5;
  private camZ = 15.5;
  private lookY = 0;
  private lookZ = 1.5;
  private parX = 0;
  private parY = 0;
  private fade = 0;

  // Inputs gathered from the page
  private heroHeight = 800;
  private firstMount = true;
  private aspect = 1;
  private pageLong = true;
  private home = true;
  /** Union of [data-world-zone] rectangles in document space; x0, y0, x1, y1 in CSS px. */
  private readonly zone = new Vector4(0, 0, 0, 0);
  private viewW = 1;
  /** Bottom of the [data-world-stage] element in document space, CSS px. */
  private stageBottom = 1e6;
  private viewH = 1;

  // Pointer on the plane
  private readonly ray = new Ray();
  private readonly plane = new Plane(new Vector3(0, 1, 0), -PLANE_Y);
  private readonly hit = new Vector3();
  private readonly lastImpulse = new Vector2(1e6, 1e6);
  private readonly ndc = new Vector3();
  private hasHit = false;
  private lastRippleTime = -10;

  // Damping helper state. stepFn is bound once in the constructor, never per frame.
  private moving = false;
  private rm = false;
  private dt = 0;
  private readonly stepFn: (cur: number, target: number, lambda: number) => number;

  constructor(ctx: EngineContext, tier: Tier) {
    this.ctx = ctx;
    this.tier = tier;
    this.stepFn = (cur, target, lambda) => this.dampStep(cur, target, lambda);
    this.geometry = new BoxGeometry(1, 1, 1);
    this.geometry.translate(0, 0.5, 0);
    for (let i = 0; i < RIPPLES; i++) this.ripples.push(new Vector4(0, 0, -100, 0));

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uFrom: { value: 0 },
        uTo: { value: 0 },
        uSeedFrom: { value: 0 },
        uSeedTo: { value: 0 },
        uMix: { value: 1 },
        uAmp: { value: 1 },
        uTime: { value: 0 },
        uRipples: { value: this.ripples },
        uPointer: { value: this.pointerUniform },
        uBg: { value: new Color(BG) },
        uLight: { value: new Color(LIGHT) },
        uShade: { value: new Color(SHADE) },
        uDeep: { value: new Color(DEEP) },
        uMaxH: { value: MAX_H },
        uRes: { value: new Vector2(1, 1) },
        uZone: { value: new Vector4(0, 0, 0, 0) },
        uStageBottom: { value: 2 },
        uAccent: { value: new Color(ACCENT) },
        uFade: { value: 0 },
        uFog: { value: new Vector2(15, 36) },
      },
    });
    this.build();
  }

  /** (Re)builds the instanced grid for the current tier. Not called per frame. */
  private build(): void {
    if (this.mesh) {
      this.ctx.scene.remove(this.mesh);
      this.mesh.dispose();
    }
    const [cols, rows] = GRID[this.tier];
    const count = cols * rows;
    const pitchX = WIDTH / cols;
    const pitchZ = DEPTH / rows;
    const foot = Math.min(pitchX, pitchZ) * 0.8;
    const mesh = new InstancedMesh(this.geometry, this.material, count);
    const cells = new Float32Array(count * 2);
    const m = new Matrix4();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols;
        const v = (r + 0.5) / rows;
        m.makeScale(foot, 1, foot);
        m.setPosition((u - 0.5) * WIDTH, 0, (v - 0.5) * DEPTH);
        mesh.setMatrixAt(i, m);
        cells[i * 2] = u * 2 - 1;
        cells[i * 2 + 1] = v * 2 - 1;
        i++;
      }
    }
    this.geometry.setAttribute('aCell', new InstancedBufferAttribute(cells, 2));
    mesh.instanceMatrix.needsUpdate = true;
    // Heights change in the shader, so the CPU bounds are not exact. The field is always in view.
    mesh.frustumCulled = false;
    this.mesh = mesh;
    this.ctx.scene.add(mesh);
    this.ctx.invalidate();
  }

  setTier(tier: Tier): void {
    if (tier === this.tier) return;
    this.tier = tier;
    this.build();
  }

  resize(width: number, height: number): void {
    this.aspect = width / Math.max(1, height);
    this.viewW = width;
    this.viewH = height;
    const pr = this.ctx.renderer.getPixelRatio();
    (this.material.uniforms.uRes!.value as Vector2).set(width * pr, height * pr);
    this.heroHeight = this.measureHero();
    this.measureZone();
    this.measureStage();
  }

  private measureStage(): void {
    const el = document.querySelector<HTMLElement>('[data-world-stage]');
    this.stageBottom = el ? el.getBoundingClientRect().bottom + window.scrollY : 1e6;
  }

  private measureZone(): void {
    const els = document.querySelectorAll<HTMLElement>('[data-world-zone]');
    if (!els.length) {
      this.zone.set(0, 0, 0, 0);
      return;
    }
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const sy = window.scrollY;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      x0 = Math.min(x0, r.left);
      y0 = Math.min(y0, r.top + sy);
      x1 = Math.max(x1, r.right);
      y1 = Math.max(y1, r.bottom + sy);
    });
    this.zone.set(x0, y0, x1, y1);
  }

  private measureHero(): number {
    const hero = document.querySelector<HTMLElement>('[data-world-anchor="hero"]');
    const h = hero ? hero.getBoundingClientRect().height : window.innerHeight * 0.9;
    return Math.max(200, h);
  }

  mount(doc: Document): void {
    const body = doc.body;
    const nextPattern = Number(body.dataset.pattern ?? 0);
    const nextSeed = Number(body.dataset.seed ?? 0);
    const u = this.material.uniforms;
    this.heroHeight = this.measureHero();
    this.measureZone();
    this.measureStage();
    this.pageLong = doc.documentElement.scrollHeight > window.innerHeight * 1.4;
    this.home = doc.documentElement.dataset.page === 'home';

    if (this.firstMount) {
      u.uFrom!.value = nextPattern;
      u.uTo!.value = nextPattern;
      u.uSeedFrom!.value = nextSeed;
      u.uSeedTo!.value = nextSeed;
      this.mix = 1;
      this.firstMount = false;
    } else if (u.uTo!.value !== nextPattern || u.uSeedTo!.value !== nextSeed) {
      // Morph from wherever the field is now toward the new page's relief.
      u.uFrom!.value = this.mix > 0.5 ? u.uTo!.value : u.uFrom!.value;
      u.uSeedFrom!.value = this.mix > 0.5 ? u.uSeedTo!.value : u.uSeedFrom!.value;
      u.uTo!.value = nextPattern;
      u.uSeedTo!.value = nextSeed;
      this.mix = 0;
      // Navigation is intent: one soft wave from the center carries the change.
      this.addRipple(0, 0, 0.7, -1);
    }
    this.ctx.invalidate();
  }

  unmount(): void {}

  private addRipple(x: number, z: number, strength: number, time: number): void {
    const r = this.ripples[this.rippleCursor];
    if (!r) return;
    r.set(x, z, time, strength);
    this.rippleCursor = (this.rippleCursor + 1) % RIPPLES;
    this.lastRippleTime = time;
  }

  /** Pointer to field plane, analytic. Writes into this.hit; no allocation. */
  private projectPointer(x: number, y: number): boolean {
    const cam = this.ctx.camera;
    this.ndc.set(x, y, 0.5).unproject(cam);
    this.ray.origin.copy(cam.position);
    this.ray.direction.copy(this.ndc).sub(cam.position).normalize();
    const mesh = this.mesh;
    if (!this.ray.intersectPlane(this.plane, this.hit) || !mesh) return false;
    this.hit.x -= mesh.position.x;
    this.hit.z -= mesh.position.z;
    return Math.abs(this.hit.x) < WIDTH / 2 && Math.abs(this.hit.z) < DEPTH / 2;
  }

  private dampStep(cur: number, target: number, lambda: number): number {
    const next = this.rm ? target : damp(cur, target, lambda, this.dt);
    if (Math.abs(next - target) > 1e-4) this.moving = true;
    return Math.abs(next - target) < 1e-5 ? target : next;
  }

  update(input: FrameInput): boolean {
    const dt = input.dt;
    const t = input.time;
    const u = this.material.uniforms;
    const rm = input.reducedMotion;
    const mesh = this.mesh;
    if (!mesh) return false;

    // Ripples that were queued before the clock was known (navigation) start now.
    for (let i = 0; i < RIPPLES; i++) {
      const r = this.ripples[i]!;
      if (r.z < 0 && r.z > -2 && r.w > 0) r.z = t;
    }

    // ---- scroll: flatten and fade the field below the hero ----
    const progress = this.pageLong ? clamp(input.scroll / this.heroHeight, 0, 1.5) : 0;
    const flat = smoothstep(progress, 0, 1);
    const ampTarget = 1 - 0.8 * flat;
    const fadeTarget = smoothstep(progress, 0.55, 1.15) * 0.82;

    // ---- pointer ----
    let pressTarget = 0;
    if (!rm && input.pointerInside) {
      if (input.pointerMoved && this.projectPointer(input.pointerX, input.pointerY)) {
        this.hasHit = true;
        this.pointerUniform.x = this.hit.x;
        this.pointerUniform.y = this.hit.z;
        const dx = this.hit.x - this.lastImpulse.x;
        const dz = this.hit.z - this.lastImpulse.y;
        if (dx * dx + dz * dz > RIPPLE_STEP * RIPPLE_STEP && t - this.lastRippleTime > 0.08) {
          this.addRipple(this.hit.x, this.hit.z, 0.55, t);
          this.lastImpulse.set(this.hit.x, this.hit.z);
        }
      } else if (input.pointerMoved) {
        this.hasHit = false;
      }
      if (this.hasHit) pressTarget = 1 - fadeTarget;
    }
    if (!rm && input.tapped && this.projectPointer(input.pointerX, input.pointerY)) {
      this.addRipple(this.hit.x, this.hit.z, 1, t);
    }

    // ---- camera rig ----
    const portrait = this.aspect < 1;
    const dist = portrait ? 1.55 : this.aspect < 1.45 ? 1.2 : 1;
    const camYTarget = (7.2 + 6 * flat) * dist;
    const camZTarget = (11.5 - 4 * flat) * dist;
    // Portrait pages other than home keep the field in the open band above the heading.
    const lookYTarget = portrait ? (this.home ? 3.4 : -3.2) : 1.4 - 1 * flat;
    const lookZTarget = -0.5 - 2 * flat;
    const parXTarget = rm || !input.pointerInside ? 0 : input.pointerX * 0.6;
    const parYTarget = rm || !input.pointerInside ? 0 : input.pointerY * 0.35;
    mesh.position.x = portrait ? 0 : this.aspect > 1.45 ? 3.2 : 1.5;

    this.moving = false;
    this.rm = rm;
    this.dt = dt;
    const step = this.stepFn;
    this.mix = step(this.mix, 1, 2.0);
    this.amp = step(this.amp, ampTarget, 6);
    this.fade = step(this.fade, fadeTarget, 6);
    this.press = step(this.press, pressTarget, 7);
    this.camY = step(this.camY, camYTarget, 4);
    this.camZ = step(this.camZ, camZTarget, 4);
    this.camX = step(this.camX, 0, 4);
    this.lookY = step(this.lookY, lookYTarget, 4);
    this.lookZ = step(this.lookZ, lookZTarget, 4);
    this.parX = step(this.parX, parXTarget, 3);
    this.parY = step(this.parY, parYTarget, 3);

    const cam = this.ctx.camera;
    cam.position.set(this.camX + this.parX, this.camY + this.parY, this.camZ);
    cam.lookAt(this.parX * 0.4, this.lookY, this.lookZ);

    const z = u.uZone!.value as Vector4;
    z.set(
      this.zone.x / this.viewW,
      (this.zone.y - input.scroll) / this.viewH,
      this.zone.z / this.viewW,
      (this.zone.w - input.scroll) / this.viewH,
    );
    u.uStageBottom!.value = (this.stageBottom - input.scroll) / this.viewH;
    u.uMix!.value = this.mix;
    u.uAmp!.value = this.amp;
    u.uFade!.value = this.fade;
    u.uTime!.value = t;
    this.pointerUniform.z = this.press;

    // Ripples alive keep the frame loop rendering; otherwise the field idles.
    let alive = false;
    for (let i = 0; i < RIPPLES; i++) {
      const r = this.ripples[i]!;
      if (r.w > 0 && t - r.z < RIPPLE_LIFE) alive = true;
    }
    return this.moving || alive || input.pointerMoved;
  }

  dispose(): void {
    if (this.mesh) {
      this.ctx.scene.remove(this.mesh);
      this.mesh.dispose();
      this.mesh = null;
    }
    this.geometry.dispose();
    this.material.dispose();
  }
}
