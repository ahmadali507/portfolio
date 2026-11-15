// Chemistry in the heading: the letters of a [data-chem] title fill with a sequence of procedural
// phenomena (foam, crystals, ink, corrosion, ...) that grow through the word as reaction fronts,
// one replacing the next. The text stays real DOM text. A canvas sits over it with
// `mix-blend-mode: darken` inside an isolated, opaque wrapper: each pixel becomes the darker of
// page and canvas. The canvas never goes darker than the ground, so the ground is untouched and
// the effect shows only inside the light letters, with no text duplicated in WebGL.
// Every phenomenon keeps most of each letter light, so the name stays readable throughout.
// One small raw WebGL2 context per page, paused off screen, absent under reduced motion.

import type { MotionCore } from './core';
import { motion } from './state';

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform float uTime;
uniform float uAspect;
in vec2 vUv;
out vec4 frag;

const int STYLES = 12;
const vec3 AMBER = vec3(0.86, 0.5, 0.2);
const vec3 RUST = vec3(0.78, 0.25, 0.1);

float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 h2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1, 0)), u.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vn(p); p = p * 2.02 + 11.3; a *= 0.5; }
  return v;
}
// Voronoi: x = distance to nearest point, y = distance to the cell border, z = cell id.
vec3 voro(vec2 p, float jitter, float t) {
  vec2 n = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = h2(n + g);
    o = 0.5 + jitter * 0.5 * sin(t + 6.2831 * o);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; id = h1(n + g); } else if (d < d2) { d2 = d; }
  }
  return vec3(d1, d2 - d1, id);
}

// Each style returns the color multiplied into the letters (1 = untouched) in rgb.
vec3 style(int id, vec2 p, float t) {
  vec3 one = vec3(1.0);
  if (id == 0) {
    // Foam: bubbles with dark rims and a bright core, crowding in a drifting band.
    vec3 v = voro(p * 9.0 + vec2(t * 0.3, 0.0), 1.0, t * 1.5);
    float band = smoothstep(0.35, 0.6, fbm(p * 2.0 + vec2(t * 0.25, 0.0)));
    float rim = smoothstep(0.1, 0.0, v.y);
    float body = smoothstep(0.55, 0.1, v.x);
    vec3 c = mix(one, mix(vec3(0.72), AMBER, step(0.8, v.z)), body * 0.5);
    c = mix(c, vec3(0.2), rim * 0.8);
    return mix(one, c, band);
  }
  if (id == 1) {
    // Turing pattern: the stripes and spots of a reaction-diffusion system.
    vec2 w = p * 5.0 + 1.6 * vec2(fbm(p * 2.0 + t * 0.12), fbm(p * 2.0 + 7.0 - t * 0.12));
    float s = sin(w.x * 3.0) * sin(w.y * 3.0) + 0.6 * sin((w.x + w.y) * 2.2 + t * 0.6);
    return mix(one, vec3(0.16), smoothstep(-0.08, 0.08, s) * 0.9);
  }
  if (id == 2) {
    // Ink in water: dark plumes that fold over themselves.
    vec2 q = p * 2.4;
    q += 1.3 * vec2(fbm(q + t * 0.2), fbm(q + 5.2 - t * 0.17));
    q += 0.9 * vec2(fbm(q * 1.7 - t * 0.1), fbm(q * 1.7 + 3.1));
    float m = smoothstep(0.5, 0.74, fbm(q));
    return mix(one, vec3(0.1, 0.11, 0.13), m * 0.9);
  }
  if (id == 3) {
    // Crystallisation: facets with hairline seams that advance from the left.
    vec3 v = voro(p * 6.5, 0.9, 0.0);
    float grown = smoothstep(0.0, 0.25, fract(t * 0.16) * 2.4 - p.x * 0.6 - v.z * 0.5);
    vec3 c = mix(one, vec3(0.62 + 0.38 * v.z), 0.75);
    c = mix(c, vec3(0.12), smoothstep(0.035, 0.0, v.y));
    return mix(one, c, grown);
  }
  if (id == 4) {
    // Boiling: bubbles rise, swell, and burst.
    vec2 q = vec2(p.x * 7.0, p.y * 7.0 - t * 1.6);
    vec3 v = voro(q, 0.8, t * 2.0);
    float r = 0.22 + 0.2 * v.z * (0.6 + 0.4 * sin(t * 3.0 + v.z * 30.0));
    float ring = smoothstep(0.035, 0.0, abs(v.x - r));
    return mix(one, vec3(0.15), ring * 0.9);
  }
  if (id == 5) {
    // Oxidation: rust blooming from specks, warm and grainy.
    float g = fbm(p * 5.0 + 3.0);
    float bloom = smoothstep(0.62 - 0.22 * (0.5 + 0.5 * sin(t * 0.5)), 0.75, g + 0.25 * fbm(p * 22.0));
    vec3 c = mix(AMBER, RUST, fbm(p * 14.0));
    return mix(one, c * (0.75 + 0.25 * vn(p * 60.0)), bloom);
  }
  if (id == 6) {
    // Acid etch: the letters are eaten into holes that open and heal.
    float e = fbm(p * 4.0 + vec2(0.0, t * 0.15)) + 0.15 * vn(p * 30.0);
    float lvl = 0.37 + 0.05 * sin(t * 0.7);
    float hole = smoothstep(lvl, lvl - 0.03, e);
    float edge = smoothstep(0.05, 0.0, abs(e - lvl));
    return mix(mix(one, AMBER, edge * 0.8), vec3(0.0), hole);
  }
  if (id == 7) {
    // Ferrofluid: ridged spikes that lean with a slow field.
    vec2 q = p * 5.0 + vec2(sin(t * 0.3), cos(t * 0.23));
    float r = 1.0 - abs(vn(q) * 2.0 - 1.0);
    r *= 1.0 - abs(vn(q * 2.1 + 4.0) * 2.0 - 1.0);
    return mix(one, vec3(0.1), smoothstep(0.38, 0.7, r));
  }
  if (id == 8) {
    // Smoke: soft grey veils drawn upward.
    vec2 q = vec2(p.x * 2.2, p.y * 1.5 - t * 0.35);
    q.x += 0.5 * fbm(q * 1.4 + t * 0.1);
    float m = smoothstep(0.35, 0.8, fbm(q * 1.6));
    return mix(one, vec3(0.38, 0.39, 0.4), m * 0.85);
  }
  if (id == 9) {
    // Cells dividing: soft bodies that merge and split.
    float f = 0.0;
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      vec2 c = vec2(0.5 + 0.5 * sin(t * (0.2 + fi * 0.03) + fi * 2.1), 0.5 + 0.42 * cos(t * (0.26 + fi * 0.025) + fi * 1.3));
      c.x *= uAspect;
      f += 0.012 / (dot(p - c, p - c) + 0.004);
    }
    float body = smoothstep(0.95, 1.1, f);
    float wall = smoothstep(0.14, 0.0, abs(f - 1.02));
    float core = smoothstep(2.2, 3.2, f);
    vec3 cc = mix(mix(one, vec3(0.62, 0.64, 0.62), body), AMBER, core * 0.8);
    return mix(cc, vec3(0.14), wall * 0.9);
  }
  if (id == 10) {
    // Mercury: heavy drops running down and pooling.
    float col = floor(p.x * 16.0);
    float sp = 0.25 + 0.5 * h1(vec2(col, 3.0));
    float y = fract(p.y * 0.8 + t * sp + h1(vec2(col, 9.0)));
    float w = abs(fract(p.x * 16.0) - 0.5);
    float drop = smoothstep(0.34, 0.2, w + (1.0 - y) * 0.5) * smoothstep(0.0, 0.1, y);
    float shine = smoothstep(0.1, 0.0, abs(w - 0.12)) * drop;
    return mix(mix(one, vec3(0.22, 0.23, 0.25), drop), one, shine * 0.8);
  }
  // Frost: feathered needles creeping across.
  vec2 q = p * vec2(7.0, 7.0);
  float a = fbm(q * 0.6) * 6.2831;
  float needles = abs(sin(dot(q, vec2(cos(a), sin(a))) * 6.0)) * fbm(q * 2.0 + 2.0);
  float grow = smoothstep(0.1, 0.5, 0.5 + 0.5 * sin(t * 0.4) + fbm(p * 3.0) - 0.6);
  return mix(one, vec3(0.3, 0.34, 0.38), smoothstep(0.25, 0.5, needles) * grow * 0.9);
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float beat = uTime / 3.6;
  int cur = int(mod(floor(beat), float(STYLES)));
  int nxt = int(mod(floor(beat) + 1.0, float(STYLES)));
  float f = fract(beat);
  vec3 col = style(cur, p, uTime);
  // The next reaction spreads through the word from seeds, with a bright front.
  float k = (f - 0.58) / 0.42;
  if (k > 0.0) {
    float seed = fbm(p * 3.0 + float(nxt) * 7.0) * 0.8 + vUv.x * 0.25;
    float w = smoothstep(0.0, 0.06, k * 1.25 - seed);
    float front = smoothstep(0.08, 0.0, abs(k * 1.25 - seed - 0.03));
    col = mix(col, style(nxt, p, uTime), w);
    col = mix(col, AMBER, front * 0.7);
  }
  // Never darker than the page ground (#0a0b0c), so darken blending leaves the ground alone.
  frag = vec4(max(col, vec3(0.0392, 0.0431, 0.0471)), 1.0);
}`;

let cleanup: (() => void) | null = null;

export function mountChem(doc: Document, core: MotionCore): void {
  cleanup?.();
  cleanup = null;
  if (motion.reduced || new URLSearchParams(location.search).get('world') === 'off') return;
  const host = doc.querySelector<HTMLElement>('[data-chem]');
  if (!host) return;
  const canvas = doc.createElement('canvas');
  canvas.className = 'chem-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
  if (!gl) return;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[chem] shader failed', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uAspect = gl.getUniformLocation(prog, 'uAspect');
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  host.appendChild(canvas);
  host.dataset.chemLive = '';

  let w = 1;
  let h = 1;
  let pending = true;
  let visible = true;
  const ro = new ResizeObserver((entries) => {
    const r = entries[entries.length - 1]?.contentRect;
    if (!r) return;
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    pending = true;
  });
  ro.observe(host);
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
  });
  io.observe(host);

  const start = performance.now() / 1000;
  let skip = false;
  const frame = (): void => {
    if (!visible || motion.reduced || (motion.page === 'home' && motion.heroCovered)) return;
    // Half rate is plenty for slow phenomena, and it halves the cost.
    skip = !skip;
    if (skip && !pending) return;
    if (pending) {
      pending = false;
      const dpr = Math.min(window.devicePixelRatio || 1, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uAspect, w / h);
    }
    // The first phenomenon starts after the name has finished rising in.
    gl.uniform1f(uTime, Math.max(0, performance.now() / 1000 - start - 1.2) + 2.2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  core.addFrame(frame);

  cleanup = () => {
    core.removeFrame(frame);
    ro.disconnect();
    io.disconnect();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
  };
}

export function unmountChem(): void {
  cleanup?.();
  cleanup = null;
}
