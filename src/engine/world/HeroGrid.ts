import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three';

/**
 * The ground of the home hero: a grid of square cells with hairline borders, drawn as one
 * full-screen quad behind the floating object. A flash spreads from the centre when the page
 * opens, cells light at random and fade, a few of them in the accent, and the cell under the
 * pointer lights and fades behind it. The grid is anchored to the page, so it scrolls away with
 * the hero and fades out above the hero's bottom edge.
 *
 * It costs one draw call and no geometry. Everything is computed per pixel from a handful of
 * uniforms; nothing is allocated per frame.
 */

const TRAIL = 16;

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform float uScroll;
uniform float uCell;
uniform float uIntro;
uniform float uStill;
uniform float uFade;
uniform float uBottom;
uniform vec3 uAccent;
uniform vec3 uTrail[${TRAIL}];

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  // Page position in device pixels, measured from the top of the hero.
  vec2 pt = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y + uScroll);
  vec2 id = floor(pt / uCell);
  vec2 fr = pt - id * uCell;
  float line = 1.0 - smoothstep(0.0, uDpr, min(uCell - fr.x, uCell - fr.y));

  // The opening flash, spreading from the centre cell outward.
  vec2 cells = ceil(uRes / uCell);
  float dc = length(id + 0.5 - cells * 0.5) / (length(cells) * 0.5);
  float ti = uIntro - dc * 1.2;
  float fade = max(0.0, 1.0 - ti / 1.5);
  float wave = step(0.0, ti) * fade * fade;
  float seen = smoothstep(0.0, 0.15, ti);

  // Each cell flashes on its own long period, then fades.
  float period = 70.0 + hash(id + 3.1) * 100.0;
  float tl = mod(uTime + hash(id + 7.7) * period, period);
  float ff = max(0.0, 1.0 - tl / 1.5);
  float flash = ff * ff * step(1.6, uIntro) * (1.0 - uStill);
  float tinted = step(0.72, hash(id + 11.3));

  // The cells the pointer has just crossed.
  float hover = 0.0;
  for (int i = 0; i < ${TRAIL}; i++) {
    vec3 t = uTrail[i];
    float same = step(abs(id.x - t.x) + abs(id.y - t.y), 0.5);
    hover = max(hover, same * clamp(1.0 - (uTime - t.z - 0.1) / 0.5, 0.0, 1.0));
  }

  float fill = 0.10 * wave + flash * mix(0.12, 0.42, tinted) + 0.2 * hover;
  vec3 color = mix(vec3(1.0), uAccent, tinted * step(0.004, flash) * (1.0 - step(0.02, hover)));
  float alpha = fill * (1.0 - line) + (0.11 + 0.4 * wave) * line * seen;
  color = mix(color, vec3(1.0), line);

  float edge = 1.0 - smoothstep(uBottom - 280.0 * uDpr, uBottom - 20.0 * uDpr, pt.y);
  gl_FragColor = vec4(color, alpha * edge * uFade);
}
`;

export class HeroGrid {
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly uniforms = {
    uRes: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uCell: { value: 56 },
    uIntro: { value: 99 },
    uStill: { value: 0 },
    uFade: { value: 1 },
    uBottom: { value: 1e6 },
    uAccent: { value: new Vector3(0.298, 0.435, 1) },
    uTrail: { value: Array.from({ length: TRAIL }, () => new Vector3(-99, -99, -99)) },
  };
  private head = 0;
  private cell = 56;

  constructor(accent: string) {
    // The shader writes display values directly, so the accent is passed as it is written in CSS.
    const n = parseInt(accent.replace('#', ''), 16);
    this.uniforms.uAccent.value.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    const material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new Mesh(new PlaneGeometry(2, 2), material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -100;
    this.mesh.visible = false;
  }

  /** Sizes the cells: about 56 CSS pixels on wide screens, five across on a phone. */
  resize(width: number, height: number, dpr: number): void {
    this.cell = width <= 720 ? width / 5 : 56;
    this.uniforms.uRes.value.set(width * dpr, height * dpr);
    this.uniforms.uDpr.value = dpr;
    this.uniforms.uCell.value = this.cell * dpr;
  }

  /**
   * One frame. `x` and `y` are the pointer in CSS pixels from the top left of the viewport, or
   * negative when it is away. `intro` is seconds since the page opened; pass a large number and
   * `still` to hold the grid quiet under reduced motion.
   */
  update(time: number, scroll: number, heroHeight: number, fade: number, intro: number, still: boolean, x: number, y: number): void {
    const u = this.uniforms;
    const dpr = u.uDpr.value;
    u.uTime.value = time;
    u.uScroll.value = scroll * dpr;
    u.uBottom.value = heroHeight * dpr;
    u.uFade.value = fade;
    u.uIntro.value = intro;
    u.uStill.value = still ? 1 : 0;
    if (x < 0 || still) return;
    const cx = Math.floor(x / this.cell);
    const cy = Math.floor((y + scroll) / this.cell);
    let slot = u.uTrail.value[this.head]!;
    if (slot.x !== cx || slot.y !== cy) {
      this.head = (this.head + 1) % TRAIL;
      slot = u.uTrail.value[this.head]!;
      slot.x = cx;
      slot.y = cy;
    }
    slot.z = time;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
