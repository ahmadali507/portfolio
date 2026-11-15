// Generative relief patterns. One height function per pattern id, domain x, z in [-1, 1], output ~0..1.
// The GLSL twin lives in src/engine/shaders/patterns.ts. Keep both in step: same ids, same math.
// Used at build time to draw the SVG fallback covers and the static poster.

export const PATTERN_COUNT = 9;

/** 0 is the home field. 1 to 5 belong to the featured projects. 6 to 8 are seeded variants. */
export const PATTERN_NAMES = [
  'swell',
  'merge',
  'query',
  'sources',
  'waveform',
  'strata',
  'terrace',
  'drift',
  'lattice',
] as const;

const fract = (v: number) => v - Math.floor(v);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number): number {
  let v = 0;
  let amp = 0.5;
  for (let i = 0; i < 4; i++) {
    v += amp * noise(x, y);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.2;
    amp *= 0.5;
  }
  return v;
}

const ring = (x: number, z: number, cx: number, cz: number, freq: number, fall: number) => {
  const r = Math.hypot(x - cx, z - cz);
  return Math.cos(r * freq) * Math.exp(-r * fall);
};

export function height(id: number, x: number, z: number, seed = 0): number {
  switch (id) {
    case 1: {
      // merge: two wave trains cross and settle into one lattice toward the center.
      const a = Math.sin(7 * x + 3.2 * z + seed * 6);
      const b = Math.sin(7 * x - 3.2 * z);
      const join = smooth(-0.9, 0.4, -Math.abs(x));
      return 0.5 + 0.22 * (a + b) * (0.45 + 0.55 * join);
    }
    case 2: {
      // query: one sharp peak with rings that fade outward.
      const r2 = (x + 0.15) ** 2 + (z - 0.05) ** 2;
      return 0.36 + 0.3 * ring(x, z, -0.15, 0.05, 15, 1.8) + 0.55 * Math.exp(-r2 * 26);
    }
    case 3: {
      // sources: three origins whose ripples overlap.
      const s = ring(x, z, -0.55, -0.3, 13, 1.4) + ring(x, z, 0.5, -0.25, 11, 1.4) + ring(x, z, 0.05, 0.55, 12, 1.4);
      return 0.5 + 0.2 * s;
    }
    case 4: {
      // waveform: a band that carries a signal across, then steps to a new line.
      const center = x < 0.25 ? -0.2 + 0.18 * Math.sin(3 * x) : 0.28 + 0.12 * Math.sin(3 * x);
      const band = Math.exp(-((z - center) ** 2) * 22);
      const carrier = 0.5 + 0.5 * Math.sin(24 * x) * Math.sin(5 * x + 1.3);
      return 0.25 + 0.6 * band * carrier;
    }
    case 5: {
      // strata: a soft dome cut into flat terraces, like stacked pages.
      const dome = Math.exp(-(x * x * 1.6 + z * z * 2.4)) + 0.25 * fbm(x * 2 + 3, z * 2);
      return Math.floor(dome * 7) / 7;
    }
    case 6: {
      const v = fbm(x * 1.8 + seed * 13, z * 1.8 - seed * 7);
      return Math.floor(v * 9) / 9;
    }
    case 7: {
      const v = fbm(x * 1.2 + seed * 5, z * 3.5);
      return 0.15 + 0.85 * smooth(0.3, 0.75, v);
    }
    case 8: {
      const gx = Math.abs(Math.sin((x + seed) * 9));
      const gz = Math.abs(Math.sin((z - seed) * 6));
      return 0.3 + 0.5 * Math.min(gx, gz) * (0.6 + 0.4 * fbm(x * 2, z * 2));
    }
    default: {
      // swell: long calm dunes with a finer ridge running across them.
      const big = Math.sin(1.7 * x + 0.9 * z) * Math.cos(1.2 * z - 0.5 * x);
      const ridge = Math.sin(6 * x + 2.5 * z) * 0.18;
      return 0.5 + 0.3 * big + ridge * (0.5 + 0.5 * Math.sin(2 * z));
    }
  }
}

/**
 * SVG fallback: the pattern drawn as stacked, displaced horizontal lines, nearer lines hiding
 * farther ones. Used for covers without WebGL and for the static poster.
 */
export function reliefSvgPaths(
  id: number,
  seed: number,
  width: number,
  heightPx: number,
  lines = 26,
  samples = 72,
): { d: string; fill: string }[] {
  const out: { d: string; fill: string }[] = [];
  const top = heightPx * 0.16;
  const span = heightPx * 0.78;
  const amp = heightPx * 0.16;
  for (let i = 0; i < lines; i++) {
    const t = i / (lines - 1);
    const z = -1 + 2 * t;
    const baseY = top + t * span;
    let d = '';
    for (let s = 0; s <= samples; s++) {
      const u = s / samples;
      const x = -1 + 2 * u;
      const y = baseY - height(id, x, z, seed) * amp;
      d += `${s ? 'L' : 'M'}${(u * width).toFixed(1)} ${y.toFixed(1)}`;
    }
    out.push({ d, fill: `${d}L${width} ${heightPx}L0 ${heightPx}Z` });
  }
  return out;
}
