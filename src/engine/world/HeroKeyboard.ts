import {
  BufferAttribute,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  Vector4,
  type BufferGeometry,
  type Material,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * The stage under the home hero: a full-size keyboard, built key by key, that the name floats above.
 * When the typed line strikes a letter, the matching key goes down and springs back; capitals hold
 * shift, the ampersand is shift and 7, and the clear is delete. The floating objects cast soft
 * shadows on it, and it falls off into the page colour at its edges like a desk under a lamp.
 *
 * Every key is merged into one geometry and every legend into another, so the whole keyboard is
 * three draw calls. Key presses are a time per key in a uniform array; the vertex shader moves the
 * key, so a stroke costs one array write and no buffer upload. Units are key widths; the owner
 * scales the root to fit the screen.
 */

type Key = [label: string, width: number, char?: string];

const ROWS: Key[][] = [
  [['`', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['delete', 2, '\b']],
  [['tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
  [['caps', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ["'", 1], ['return', 2.25]],
  [['shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['shift', 2.75]],
  [['ctrl', 1.25], ['alt', 1.25], ['cmd', 1.25], ['', 6.25, ' '], ['cmd', 1.25], ['alt', 1.25], ['fn', 1.25], ['ctrl', 1.25]],
];
/** Shifted characters the roles use, as the key they sit on. */
const SHIFTED: Record<string, string> = { '&': '7' };

/** Keyboard width and depth in key units, and the height of a key top above the root. */
export const KB_WIDTH = 15;
export const KB_DEPTH = 5;
export const KEY_TOP = 0.58;
const MAX_KEYS = 64;
const ATLAS = 8; // cells per side
const CELL = 128; // pixels per cell

const KEY = new Color('#111315');
const MOD = new Color('#181b1e');
const ACCENT = new Color('#b02e0e');
const LEGEND = new Color('#4f5458');
const LEGEND_MOD = new Color('#3c4044');
const LEGEND_ACCENT = new Color('#2a0c04');

const VERT_HEAD = /* glsl */ `
varying vec2 vKb;
#ifdef KB_KEYS
attribute float aKey;
uniform float uTime;
uniform float uTravel;
uniform vec4 uPress[${MAX_KEYS / 4}];
#endif
`;
const VERT_BODY = /* glsl */ `
#ifdef KB_KEYS
{
  int k = int(aKey + 0.5);
  float d = uTime - uPress[k >> 2][k & 3];
  float down = smoothstep(0.0, 0.035, d) * (1.0 - smoothstep(0.08, 0.3, d));
  transformed.y -= uTravel * down;
}
#endif
vKb = transformed.xz;
`;
const FRAG_HEAD = /* glsl */ `
varying vec2 vKb;
uniform vec4 uShadow[6];
uniform vec4 uPool;
uniform vec3 uBg;
uniform float uShow;
uniform vec2 uCut;
`;
const FRAG_BODY = /* glsl */ `
{
  float shade = 1.0;
  for (int i = 0; i < 6; i++) {
    vec2 d = (vKb - uShadow[i].xy) / uShadow[i].z;
    shade -= uShadow[i].w * exp(-dot(d, d));
  }
  vec2 q = (vKb - uPool.xy) / uPool.zw;
  float vis = exp(-dot(q, q) * dot(q, q)) * uShow * smoothstep(uCut.x, uCut.x + uCut.y, gl_FragCoord.y);
  gl_FragColor.rgb *= max(shade, 0.0);
  #ifdef KB_ALPHA
  gl_FragColor.a *= vis;
  #else
  gl_FragColor.rgb = mix(uBg, gl_FragColor.rgb, vis);
  #endif
}
`;

export class HeroKeyboard {
  readonly root = new Group();
  readonly uniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0.17 },
    uPress: { value: Array.from({ length: MAX_KEYS / 4 }, () => new Vector4(-99, -99, -99, -99)) },
    /** Per floating object: keyboard-local x, z, radius, strength. */
    uShadow: { value: Array.from({ length: 6 }, () => new Vector4(0, 0, 1, 0)) },
    /** Centre and radii of the lit area; outside it the keyboard falls off into the page colour. */
    uPool: { value: new Vector4(0, 0.4, 8.6, 4.4) },
    uBg: { value: new Vector3(10 / 255, 11 / 255, 12 / 255) },
    uShow: { value: 0 },
    /** Drawing-buffer row (from the bottom) where the next section starts, and the fade height above it. */
    uCut: { value: new Vector2(-1e4, 1) },
  };
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly atlas: CanvasTexture;
  /** Key index for each character the typed line can strike. */
  private readonly keyOf = new Map<string, number>();
  private shift = -1;

  constructor(seg: number, anisotropy: number) {
    const keys: BufferGeometry[] = [];
    const legends: BufferGeometry[] = [];
    const labels: string[] = [];
    let k = 0;
    for (let r = 0; r < ROWS.length; r++) {
      const z = r - (ROWS.length - 1) / 2;
      let x = -KB_WIDTH / 2;
      for (const [label, w, ch] of ROWS[r]!) {
        const cx = x + w / 2;
        x += w;
        const mod = label.length > 1 || label === '';
        const accent = label === 'return';
        const cap = new RoundedBoxGeometry(w - 0.12, 0.36, 0.86, seg, 0.09);
        cap.translate(cx, KEY_TOP - 0.18, z);
        this.paint(cap, accent ? ACCENT : mod ? MOD : KEY, k);
        keys.push(cap);

        if (label) {
          let cell = labels.indexOf(label);
          if (cell < 0) cell = labels.push(label) - 1;
          const q = new PlaneGeometry(0.62, 0.62);
          q.rotateX(-Math.PI / 2);
          // Words sit to the left on wide keys, as on a real board; single characters sit centred.
          q.translate(mod && w > 1.3 ? x - w + 0.5 : cx, KEY_TOP + 0.004, z);
          const uv = q.getAttribute('uv') as BufferAttribute;
          const col = cell % ATLAS;
          const row = Math.floor(cell / ATLAS);
          for (let i = 0; i < uv.count; i++) {
            uv.setXY(i, (col + uv.getX(i)) / ATLAS, 1 - (row + 1 - uv.getY(i)) / ATLAS);
          }
          this.paint(q, accent ? LEGEND_ACCENT : mod ? LEGEND_MOD : LEGEND, k);
          legends.push(q);
        }

        const c = ch ?? (label.length === 1 ? label.toLowerCase() : '');
        if (c && !this.keyOf.has(c)) this.keyOf.set(c, k);
        if (label === 'shift' && this.shift < 0) this.shift = k;
        k++;
      }
    }

    const keyGeo = this.geo(mergeGeometries(keys)!);
    const legendGeo = this.geo(mergeGeometries(legends)!);
    for (const g of keys) g.dispose();
    for (const g of legends) g.dispose();

    const plate = this.geo(new RoundedBoxGeometry(KB_WIDTH + 0.5, 0.34, KB_DEPTH + 0.5, seg, 0.16));
    plate.translate(0, KEY_TOP - 0.36 - 0.2, 0);

    this.atlas = new CanvasTexture(document.createElement('canvas'));
    this.atlas.colorSpace = SRGBColorSpace;
    this.atlas.anisotropy = anisotropy;
    void this.drawAtlas(labels);

    const keyMat = this.patch(
      new MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, envMapIntensity: 0.6, clearcoat: 0.2, clearcoatRoughness: 0.4 }),
      'keys',
    );
    const legendMat = this.patch(
      new MeshBasicMaterial({ vertexColors: true, map: this.atlas, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
      'legends',
    );
    const plateMat = this.patch(
      new MeshPhysicalMaterial({ color: '#1d2023', metalness: 0.85, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
      'plate',
    );
    const legendMesh = new Mesh(legendGeo, legendMat);
    legendMesh.renderOrder = 1;
    this.root.add(new Mesh(plate, plateMat), new Mesh(keyGeo, keyMat), legendMesh);
  }

  /** Strikes the key for a character at a time in seconds. Capitals and shifted symbols hold shift. */
  strike(c: string, time: number): void {
    const lower = c.toLowerCase();
    const base = SHIFTED[c];
    const k = this.keyOf.get(base ?? lower);
    if (k === undefined) return;
    this.press(k, time);
    if ((base || (c !== lower && c.length === 1)) && this.shift >= 0) this.press(this.shift, time);
  }

  /** Lets every key rest at once (reduced motion, leaving the page). */
  release(): void {
    for (const v of this.uniforms.uPress.value) v.set(-99, -99, -99, -99);
  }

  dispose(): void {
    this.root.removeFromParent();
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.atlas.dispose();
    this.geometries.length = 0;
    this.materials.length = 0;
  }

  private press(k: number, time: number): void {
    this.uniforms.uPress.value[k >> 2]!.setComponent(k & 3, time);
  }

  private paint(g: BufferGeometry, c: Color, key: number): void {
    const n = g.getAttribute('position').count;
    const color = new Float32Array(n * 3);
    const id = new Float32Array(n).fill(key);
    for (let i = 0; i < n; i++) color.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new BufferAttribute(color, 3));
    g.setAttribute('aKey', new BufferAttribute(id, 1));
  }

  private geo<T extends BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private patch<T extends Material>(m: T, kind: 'keys' | 'legends' | 'plate'): T {
    const u = this.uniforms;
    const defines = (kind === 'plate' ? '' : '#define KB_KEYS\n') + (kind === 'legends' ? '#define KB_ALPHA\n' : '');
    m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader =
        defines + VERT_HEAD + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
      shader.fragmentShader =
        defines +
        FRAG_HEAD +
        shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${FRAG_BODY}`);
    };
    m.customProgramCacheKey = () => `hero-kb-${kind}`;
    this.materials.push(m);
    return m;
  }

  private async drawAtlas(labels: string[]): Promise<void> {
    const canvas = this.atlas.image as HTMLCanvasElement;
    canvas.width = canvas.height = ATLAS * CELL;
    const g = canvas.getContext('2d');
    if (!g) return;
    const family = '"Commit Mono", ui-monospace, monospace';
    try {
      await document.fonts.load(`500 64px ${family}`);
    } catch {
      // The fallback face draws the same legends.
    }
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]!;
      const word = label.length > 1;
      g.font = `500 ${word ? 26 : 62}px ${family}`;
      g.textAlign = word ? 'left' : 'center';
      const x = (i % ATLAS) * CELL;
      const y = Math.floor(i / ATLAS) * CELL;
      g.fillText(label, word ? x + 14 : x + CELL / 2, y + CELL / 2);
    }
    this.atlas.needsUpdate = true;
  }
}
