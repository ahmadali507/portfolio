// GLSL twin of src/lib/patterns.ts. Same ids, same math. Keep both in step.
// Domain p in [-1, 1]^2, output roughly 0..1.

export const PATTERNS_GLSL = /* glsl */ `
float pHash(vec2 p) {
  return fract(sin(p.x * 127.1 + p.y * 311.7) * 43758.5453);
}

float pNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = pHash(i);
  float b = pHash(i + vec2(1.0, 0.0));
  float c = pHash(i + vec2(0.0, 1.0));
  float d = pHash(i + vec2(1.0, 1.0));
  return a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y;
}

float pFbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * pNoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amp *= 0.5;
  }
  return v;
}

float pRing(vec2 p, vec2 c, float freq, float fall) {
  float r = length(p - c);
  return cos(r * freq) * exp(-r * fall);
}

float pattern(float fid, vec2 p, float seed) {
  int id = int(fid + 0.5);
  float x = p.x;
  float z = p.y;
  if (id == 1) {
    float a = sin(7.0 * x + 3.2 * z + seed * 6.0);
    float b = sin(7.0 * x - 3.2 * z);
    float join = smoothstep(-0.9, 0.4, -abs(x));
    return 0.5 + 0.22 * (a + b) * (0.45 + 0.55 * join);
  }
  if (id == 2) {
    vec2 c = vec2(-0.15, 0.05);
    float r2 = dot(p - c, p - c);
    return 0.36 + 0.3 * pRing(p, c, 15.0, 1.8) + 0.55 * exp(-r2 * 26.0);
  }
  if (id == 3) {
    float s = pRing(p, vec2(-0.55, -0.3), 13.0, 1.4) + pRing(p, vec2(0.5, -0.25), 11.0, 1.4) + pRing(p, vec2(0.05, 0.55), 12.0, 1.4);
    return 0.5 + 0.2 * s;
  }
  if (id == 4) {
    float center = x < 0.25 ? -0.2 + 0.18 * sin(3.0 * x) : 0.28 + 0.12 * sin(3.0 * x);
    float band = exp(-(z - center) * (z - center) * 22.0);
    float carrier = 0.5 + 0.5 * sin(24.0 * x) * sin(5.0 * x + 1.3);
    return 0.25 + 0.6 * band * carrier;
  }
  if (id == 5) {
    float dome = exp(-(x * x * 1.6 + z * z * 2.4)) + 0.25 * pFbm(vec2(x * 2.0 + 3.0, z * 2.0));
    return floor(dome * 7.0) / 7.0;
  }
  if (id == 6) {
    float v = pFbm(vec2(x * 1.8 + seed * 13.0, z * 1.8 - seed * 7.0));
    return floor(v * 9.0) / 9.0;
  }
  if (id == 7) {
    float v = pFbm(vec2(x * 1.2 + seed * 5.0, z * 3.5));
    return 0.15 + 0.85 * smoothstep(0.3, 0.75, v);
  }
  if (id == 8) {
    float gx = abs(sin((x + seed) * 9.0));
    float gz = abs(sin((z - seed) * 6.0));
    return 0.3 + 0.5 * min(gx, gz) * (0.6 + 0.4 * pFbm(vec2(x * 2.0, z * 2.0)));
  }
  float big = sin(1.7 * x + 0.9 * z) * cos(1.2 * z - 0.5 * x);
  float ridge = sin(6.0 * x + 2.5 * z) * 0.18;
  return 0.5 + 0.3 * big + ridge * (0.5 + 0.5 * sin(2.0 * z));
}
`;
