// Holo primitives: the drawing kit for the project motion graphics.
//
// A scene draws into three depth layers:
//   0  ground: backdrop, grid, glow, shadows cast by layer 1
//   1  surfaces: app windows, panels, phones, documents
//   2  lift: cursors, toasts, chips, highlights that float above the UI
// In 3D (Showcase) each layer is its own texture on its own plane, stacked above the card, so the
// UI physically lifts off the card. In 2D (Covers) the layers are composited in one pass with a
// parallax offset per layer driven by the pointer. Either way the scene code is the same.
//
// Coordinates: p.x in 0..1.6, p.y in 0..1, y up. Colors come from a per-project palette.

export const HOLO_GLSL = /* glsl */ `
// ---------- frame state ----------
vec2 gP;        // fragment position in scene space
vec2 gPar;      // parallax offset per layer step (zero in layered 3D mode)
vec4 gL0;       // premultiplied layer colors
vec4 gL1;
vec4 gL2;
vec3 cBg;       // palette
vec3 cBg2;
vec3 cPanel;
vec3 cInk;
vec3 cMute;
vec3 cAcc;
vec3 cAcc2;

// ---------- math ----------
float hh(float n) { return fract(sin(n * 91.345) * 47453.5453); }
float hh2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hh2(i), hh2(i + vec2(1, 0)), u.x), mix(hh2(i + vec2(0, 1)), hh2(i + vec2(1, 1)), u.x), u.y);
}
float eOut(float t) { t = clamp(t, 0.0, 1.0); return 1.0 - pow(1.0 - t, 3.0); }
float eInOut(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float eBack(float t) { t = clamp(t, 0.0, 1.0); float c = 1.70158; return 1.0 + (c + 1.0) * pow(t - 1.0, 3.0) + c * pow(t - 1.0, 2.0); }
// Window of a beat: 0 before a, rises to 1 over [a, a+d], holds, falls over [b, b+d].
float beat(float t, float a, float b, float d) { return eOut((t - a) / d) * (1.0 - eInOut((t - b) / d)); }

// ---------- signed distances ----------
float sdBox(vec2 p, vec2 c, vec2 h, float r) {
  vec2 q = abs(p - c) - h + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdCirc(vec2 p, vec2 c, float r) { return length(p - c) - r; }
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
float aa(float d) { return clamp(0.5 - d / max(fwidth(d), 1e-5), 0.0, 1.0); }
float stroke(float d, float w) { return aa(abs(d) - w); }

// ---------- layers ----------
vec2 at(int l) { return gP - gPar * float(l); }
void put(int l, float a, vec3 c) {
  if (a <= 0.0) return;
  vec4 s = vec4(c * a, a);
  if (l == 0) gL0 = s + gL0 * (1.0 - a);
  else if (l == 1) gL1 = s + gL1 * (1.0 - a);
  else gL2 = s + gL2 * (1.0 - a);
}
// A soft shadow under something on layer l, cast onto the layer below and offset by height.
void shadow(int l, vec2 c, vec2 h, float r, float k) {
  if (l == 0) return;
  vec2 q = at(l - 1) - vec2(0.012, -0.02) * float(l);
  float d = sdBox(q, c, h, r);
  put(l - 1, (1.0 - smoothstep(-0.01, 0.06, d)) * 0.45 * k, vec3(0.0));
}

// ---------- primitives ----------
// Glass panel: body, a top sheen, and a hairline rim. Returns coverage for use as a clip.
float panel(int l, vec2 c, vec2 h, float r, vec3 fill, float k) {
  vec2 p = at(l);
  shadow(l, c, h, r, k);
  float d = sdBox(p, c, h, r);
  float m = aa(d) * k;
  float sheen = smoothstep(c.y - h.y, c.y + h.y, p.y) * 0.08;
  put(l, m, fill + sheen);
  put(l, stroke(d, 0.0016) * k * 0.6, mix(fill, vec3(1.0), 0.28));
  return m;
}
// A row of text as a pill bar.
void bar(int l, vec2 o, float len, float h, vec3 c, float k) {
  if (len <= 0.002) return;
  vec2 p = at(l);
  put(l, aa(sdBox(p, o + vec2(len * 0.5, 0.0), vec2(len * 0.5, h), h)) * k, c);
}
void disc(int l, vec2 c, float r, vec3 col, float k) { put(l, aa(sdCirc(at(l), c, r)) * k, col); }
void ring(int l, vec2 c, float r, float w, vec3 col, float k) { put(l, stroke(sdCirc(at(l), c, r), w) * k, col); }
void line(int l, vec2 a, vec2 b, float w, vec3 col, float k) { put(l, aa(sdSeg(at(l), a, b) - w) * k, col); }
void box(int l, vec2 c, vec2 h, float r, vec3 col, float k) { put(l, aa(sdBox(at(l), c, h, r)) * k, col); }
void outline(int l, vec2 c, vec2 h, float r, float w, vec3 col, float k) { put(l, stroke(sdBox(at(l), c, h, r), w) * k, col); }
// Mouse pointer arrow with its tip at c.
void cursor(int l, vec2 c, vec3 col, float k) {
  vec2 p = at(l) - c;
  vec2 q = vec2(p.x, -p.y) / 0.05;
  float tri = max(max(-q.x, -q.y), q.x * 0.82 + q.y * 0.52 - 0.62);
  float d = tri * 0.05;
  shadow(l, c + vec2(0.012, -0.02), vec2(0.012, 0.018), 0.01, k * 0.6);
  put(l, aa(d) * k, col);
  put(l, stroke(d, 0.002) * k, cBg);
}
// Glow: additive-looking soft light, used sparingly for the live element.
void glow(int l, vec2 c, float r, vec3 col, float k) {
  float d = length(at(l) - c);
  put(l, exp(-d * d / (r * r)) * 0.5 * k, col);
}
// Window chrome: three dots and a title bar line.
void chrome(int l, vec2 c, vec2 h, float k) {
  vec2 tl = c + vec2(-h.x, h.y);
  for (int i = 0; i < 3; i++) disc(l, tl + vec2(0.03 + float(i) * 0.022, -0.028), 0.0065, cMute, k);
  line(l, tl + vec2(0.0, -0.055), tl + vec2(h.x * 2.0, -0.055), 0.0008, cMute * 0.6, k * 0.6);
}
// Avatar: a circle with initials suggested by a bar.
void avatar(int l, vec2 c, float r, vec3 col, float k) {
  disc(l, c, r, col, k);
  disc(l, c + vec2(0.0, r * 0.25), r * 0.33, mix(col, vec3(1.0), 0.5), k);
}
// Chart bars rising from a baseline.
void bars(int l, vec2 o, float w, float hMax, int n, float t, float seed, vec3 col, float k) {
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    float fi = float(i);
    float h = hMax * (0.25 + 0.75 * hh(fi * 3.1 + seed)) * eOut(t * 1.4 - fi * 0.07);
    box(l, o + vec2(fi * w * 1.6, h * 0.5), vec2(w * 0.5, h * 0.5), w * 0.3, col, k);
  }
}

// ---------- backdrop ----------
void backdrop(float t) {
  vec2 p = at(0);
  vec3 c = mix(cBg2, cBg, smoothstep(0.0, 1.1, p.y + 0.15 * p.x));
  // A perspective floor grid that recedes toward a horizon.
  float hz = 0.38;
  if (p.y < hz) {
    float z = 0.08 / max(hz - p.y, 0.008);
    vec2 g = vec2((p.x - 0.8) * z, z + t * 0.12);
    vec2 f = abs(fract(g * 2.0) - 0.5) / max(fwidth(g * 2.0), 1e-4);
    float grid = 1.0 - min(min(f.x, f.y), 1.0);
    c = mix(c, cMute, grid * 0.16 * smoothstep(0.0, hz, p.y) );
  }
  // Light sweep.
  float sw = exp(-pow((p.x - 0.25 - fract(t * 0.07) * 2.2 + p.y * 0.6) * 3.0, 2.0)) * 0.05;
  c += sw;
  // Accent glow behind the stage.
  c += cAcc * exp(-dot(p - vec2(0.8, 0.55), p - vec2(0.8, 0.55)) * 3.2) * 0.12;
  gL0 = vec4(c, 1.0);
}

vec4 over(vec4 top, vec4 bottom) { return top + bottom * (1.0 - top.a); }
`;
