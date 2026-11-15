// Motion graphics for project cards and plates. One small animated diagram per scene id, drawn with
// signed-distance shapes so it is sharp at any size. Each depicts what a kind of product does;
// none is a screenshot and none encodes a metric.
//   1 editor     two people typing in one document          (Shocodoc)
//   2 ask        a document is searched, an answer cites it (DocuChat AI)
//   3 languages  one source fans out into variants          (Xiomara)
//   4 call       a call is checked, then routed to a person (Voice Transfer System)
//   5 book       pages write themselves and turn            (MagicalBook.Store)
//   6 product    a web app screen filling with content
//   7 phone      a mobile app list with a notification
//   8 pipeline   records flowing through stages
//   9 spikes     spike trains with a detection
// Space: p.x in 0..1.6, p.y in 0..1, y up. Colors: base (card), ink (linework), acc (the live element).

export const SCENES_GLSL = /* glsl */ `
float gH(float n) { return fract(sin(n * 91.345) * 47453.5453); }
float gBox(vec2 p, vec2 c, vec2 h, float r) {
  vec2 q = abs(p - c) - h + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float gCirc(vec2 p, vec2 c, float r) { return length(p - c) - r; }
float gSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
float gFill(float d) { return clamp(0.5 - d / max(fwidth(d), 1e-5), 0.0, 1.0); }
float gLine(float d, float w) { return gFill(abs(d) - w); }
// A row of text as a rounded bar that starts at x0 and is len long.
float gBar(vec2 p, float x0, float y, float len, float h) {
  return gFill(gBox(p, vec2(x0 + len * 0.5, y), vec2(max(len, 0.0) * 0.5, h), h)) * step(0.004, len);
}

vec3 scEditor(vec2 p, float t, vec3 base, vec3 ink, vec3 acc) {
  vec3 c = base;
  for (int i = 0; i < 3; i++) c = mix(c, ink, gFill(gCirc(p, vec2(0.14 + float(i) * 0.055, 0.87), 0.013)) * 0.35);
  c = mix(c, ink, gFill(gCirc(p, vec2(1.36, 0.87), 0.032)) * 0.85);
  c = mix(c, acc, gFill(gCirc(p, vec2(1.44, 0.87), 0.032)));
  float cyc = mod(t * 0.22, 1.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float y = 0.72 - fi * 0.098;
    float full = 0.5 + 0.6 * gH(fi + 3.0);
    float prog = clamp(cyc * 8.0 - fi, 0.0, 1.0);
    float len = full * prog;
    c = mix(c, ink, gBar(p, 0.14, y, len, 0.017) * 0.6);
    float typing = step(0.001, prog) * step(prog, 0.999);
    c = mix(c, acc, gFill(gBox(p, vec2(0.14 + len + 0.016, y), vec2(0.005, 0.034), 0.0)) * typing);
  }
  // The second person: a selection sliding along a line, with their caret.
  float s = 0.5 + 0.5 * sin(t * 1.1);
  float sy = 0.72 - 0.098;
  c = mix(c, acc, gFill(gBox(p, vec2(0.36 + s * 0.26, sy), vec2(0.13, 0.032), 0.008)) * 0.3 * step(0.2, cyc));
  c = mix(c, ink, gFill(gBox(p, vec2(0.495 + s * 0.26, sy), vec2(0.004, 0.04), 0.0)) * step(0.2, cyc));
  return c;
}

vec3 scAsk(vec2 p, float t, vec3 base, vec3 ink, vec3 acc) {
  vec3 c = base;
  float ph = mod(t * 0.2, 1.0);
  // The document being read.
  c = mix(c, ink, gLine(gBox(p, vec2(0.42, 0.5), vec2(0.28, 0.38), 0.03), 0.003) * 0.7);
  float found = step(0.42, ph);
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float y = 0.78 - fi * 0.09;
    float len = 0.3 + 0.16 * gH(fi + 11.0);
    float hit = (i == 3) ? found : 0.0;
    c = mix(c, mix(ink, acc, hit), gBar(p, 0.2, y, len, 0.014) * mix(0.4, 1.0, hit));
  }
  float scan = 0.84 - min(ph / 0.42, 1.0) * 0.36;
  c = mix(c, acc, gFill(gBox(p, vec2(0.42, scan), vec2(0.26, 0.003), 0.0)) * (1.0 - found));
  // The question, then the answer that points back at the passage.
  float q = smoothstep(0.04, 0.1, ph);
  c = mix(c, ink, gFill(gBox(p, vec2(1.26, 0.76 - (1.0 - q) * 0.04), vec2(0.2, 0.055), 0.05)) * 0.9 * q);
  float a = smoothstep(0.42, 0.5, ph);
  vec2 ac = vec2(1.16, 0.46 - (1.0 - a) * 0.04);
  c = mix(c, ink, gLine(gBox(p, ac, vec2(0.28, 0.13), 0.05), 0.003) * a);
  float typed = smoothstep(0.55, 0.9, ph);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float bounce = 0.012 * sin(t * 7.0 - fi * 0.9);
    c = mix(c, ink, gFill(gCirc(p, ac + vec2(-0.05 + fi * 0.05, bounce), 0.013)) * a * (1.0 - step(0.55, ph)));
    c = mix(c, ink, gBar(p, ac.x - 0.21, ac.y + 0.05 - fi * 0.05, (0.4 - fi * 0.08) * clamp(typed * 3.0 - fi, 0.0, 1.0), 0.012) * 0.6 * step(0.55, ph));
  }
  c = mix(c, acc, gFill(gSeg(p, vec2(0.66, 0.51), vec2(ac.x - 0.28, ac.y)) - 0.003) * a * 0.9);
  c = mix(c, acc, gFill(gCirc(p, vec2(0.66, 0.51), 0.012)) * a);
  return c;
}

vec3 scLanguages(vec2 p, float t, vec3 base, vec3 ink, vec3 acc) {
  vec3 c = base;
  vec2 o = vec2(0.8, 0.5);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 v = o + vec2((i < 2 ? -0.5 : 0.5), (mod(fi, 2.0) < 0.5 ? 0.27 : -0.27));
    c = mix(c, ink, gFill(gSeg(p, o, v) - 0.002) * 0.3);
    float k = fract(t * 0.32 + fi * 0.25);
    c = mix(c, acc, gFill(gCirc(p, mix(o, v, k), 0.014)) * smoothstep(0.0, 0.1, k) * smoothstep(1.0, 0.85, k));
    c = mix(c, base, gFill(gBox(p, v, vec2(0.19, 0.11), 0.025)));
    c = mix(c, ink, gLine(gBox(p, v, vec2(0.19, 0.11), 0.025), 0.003) * 0.7);
    // Each variant fills in after its pulse lands; one is set right to left.
    float w = smoothstep(0.85, 1.0, k) + step(k, 0.6);
    for (int j = 0; j < 3; j++) {
      float fj = float(j);
      float len = (0.26 - fj * 0.05 - 0.06 * gH(fi * 3.0 + fj)) * clamp(w, 0.0, 1.0);
      float x0 = (i == 1) ? v.x + 0.14 - len : v.x - 0.14;
      c = mix(c, ink, gBar(p, x0, v.y + 0.045 - fj * 0.045, len, 0.011) * 0.6);
    }
  }
  c = mix(c, base, gFill(gBox(p, o, vec2(0.2, 0.12), 0.03)));
  c = mix(c, acc, gLine(gBox(p, o, vec2(0.2, 0.12), 0.03), 0.004));
  for (int j = 0; j < 3; j++) c = mix(c, ink, gBar(p, o.x - 0.14, o.y + 0.05 - float(j) * 0.05, 0.28 - float(j) * 0.06, 0.013) * 0.85);
  return c;
}

vec3 scCall(vec2 p, float t, vec3 base, vec3 ink, vec3 acc) {
  vec3 c = base;
  vec2 a = vec2(0.24, 0.56), d = vec2(0.8, 0.56), ok = vec2(1.36, 0.74), no = vec2(1.36, 0.38);
  c = mix(c, ink, gFill(gSeg(p, a, d) - 0.002) * 0.45);
  c = mix(c, ink, gFill(gSeg(p, d, ok) - 0.002) * 0.45);
  float dash = step(0.5, fract(p.x * 22.0));
  c = mix(c, ink, gFill(gSeg(p, d, no) - 0.002) * 0.25 * dash);
  // The check in the middle listens, with rings going out.
  for (int i = 0; i < 2; i++) {
    float k = fract(t * 0.5 + float(i) * 0.5);
    c = mix(c, acc, gLine(gCirc(p, d, 0.09 + k * 0.12), 0.002) * (1.0 - k) * 0.8);
  }
  c = mix(c, base, gFill(gCirc(p, d, 0.09)));
  c = mix(c, ink, gLine(gCirc(p, d, 0.09), 0.003));
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float h = 0.012 + 0.04 * abs(sin(t * 5.0 + fi * 1.7));
    c = mix(c, ink, gFill(gBox(p, d + vec2(-0.048 + fi * 0.024, 0.0), vec2(0.006, h), 0.006)));
  }
  c = mix(c, ink, gLine(gCirc(p, a, 0.055), 0.003));
  c = mix(c, ink, gFill(gCirc(p, a, 0.02)));
  c = mix(c, ink, gFill(gCirc(p, ok, 0.06)));
  c = mix(c, ink, gLine(gBox(p, no, vec2(0.055, 0.045), 0.012), 0.003) * 0.4);
  // The call itself travels in, waits at the check, then goes to the person.
  float k = fract(t * 0.24);
  vec2 pos = k < 0.4 ? mix(a, d, k / 0.4) : (k < 0.6 ? d : mix(d, ok, (k - 0.6) / 0.4));
  c = mix(c, acc, gFill(gCirc(p, pos, 0.022)) * step(0.02, k) * (k < 0.4 || k > 0.6 ? 1.0 : 0.0));
  // Voice along the bottom.
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    float h = 0.008 + 0.05 * abs(sin(fi * 0.9 + t * 3.0) * sin(fi * 0.31 - t * 1.3));
    c = mix(c, ink, gFill(gBox(p, vec2(0.2 + fi * 0.052, 0.14), vec2(0.008, h), 0.008)) * 0.5);
  }
  return c;
}

vec3 scBook(vec2 p, float t, vec3 base, vec3 ink, vec3 acc) {
  vec3 c = base;
  float cyc = mod(t * 0.18, 1.0);
  for (int s = 0; s < 2; s++) {
    float sx = (s == 0) ? -1.0 : 1.0;
    vec2 pc = vec2(0.8 + sx * 0.31, 0.5);
    c = mix(c, ink, gLine(gBox(p, pc, vec2(0.3, 0.36), 0.02), 0.003) * 0.75);
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float prog = clamp(cyc * 12.0 - fi - float(s) * 5.0, 0.0, 1.0);
      float y = (s == 0 ? 0.74 : 0.44) - fi * 0.075;
      c = mix(c, ink, gBar(p, pc.x - 0.23, y, (0.4 + 0.06 * gH(fi + float(s) * 7.0)) * prog, 0.012) * 0.55);
    }
  }
  // A picture on the right page: a sun over a hill.
  vec2 pic = vec2(1.11, 0.68);
  c = mix(c, ink, gLine(gBox(p, pic, vec2(0.23, 0.13), 0.015), 0.002) * 0.5);
  c = mix(c, acc, gFill(gCirc(p, pic + vec2(0.08, 0.02 + 0.03 * sin(t * 0.8)), 0.045)));
  c = mix(c, ink, gFill(max(gCirc(p, pic + vec2(-0.05, -0.3), 0.26), gBox(p, pic, vec2(0.23, 0.13), 0.015))) * 0.5);
  // The page turns at the end of each cycle.
  float turn = smoothstep(0.86, 1.0, cyc);
  float w = cos(turn * 3.14159);
  float on = step(0.86, cyc);
  c = mix(c, base, gFill(gBox(p, vec2(0.8 + w * 0.3, 0.5), vec2(abs(w) * 0.3, 0.36 + (1.0 - abs(w)) * 0.03), 0.02)) * on);
  c = mix(c, ink, gLine(gBox(p, vec2(0.8 + w * 0.3, 0.5), vec2(abs(w) * 0.3, 0.36 + (1.0 - abs(w)) * 0.03), 0.02), 0.003) * on);
  c = mix(c, ink, gFill(gBox(p, vec2(0.8, 0.5), vec2(0.004, 0.37), 0.0)));
  return c;
}

vec3 scProduct(vec2 p, float t, vec3 base, vec3 ink, vec3 acc, float seed) {
  vec3 c = base;
  c = mix(c, ink, gFill(gBox(p, vec2(0.36, 0.5), vec2(0.0015, 0.42), 0.0)) * 0.4);
  float sel = floor(mod(t * 0.45 + seed * 5.0, 4.0));
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float on = 1.0 - step(0.5, abs(fi - sel));
    c = mix(c, mix(ink, acc, on), gBar(p, 0.13, 0.76 - fi * 0.1, 0.15, 0.014) * mix(0.4, 1.0, on));
  }
  float cyc = fract(t * 0.45 + seed * 5.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 cc = vec2(0.62 + mod(fi, 3.0) * 0.33, 0.67 - floor(fi / 3.0) * 0.36);
    float inn = smoothstep(0.0, 0.25, cyc - fi * 0.06);
    c = mix(c, ink, gLine(gBox(p, cc - vec2(0.0, (1.0 - inn) * 0.03), vec2(0.14, 0.14), 0.02), 0.003) * 0.65 * inn);
    c = mix(c, ink, gBar(p, cc.x - 0.1, cc.y + 0.07, 0.12 * inn, 0.011) * 0.6);
    c = mix(c, ink, gBar(p, cc.x - 0.1, cc.y + 0.02, (0.2 - 0.06 * gH(fi + seed * 9.0)) * inn, 0.009) * 0.35);
    c = mix(c, acc, gFill(gCirc(p, cc + vec2(0.09, -0.08), 0.014)) * inn * step(0.5, gH(fi + sel + seed)));
  }
  return c;
}

vec3 scPhone(vec2 p, float t, vec3 base, vec3 ink, vec3 acc, float seed) {
  vec3 c = base;
  vec2 o = vec2(0.8, 0.5);
  float body = gBox(p, o, vec2(0.23, 0.43), 0.05);
  c = mix(c, ink, gLine(body, 0.004));
  float inside = gFill(gBox(p, o, vec2(0.2, 0.36), 0.02));
  float sc = mod(t * 0.12 + seed, 0.2);
  for (int i = 0; i < 7; i++) {
    float y = 0.98 - float(i) * 0.2 + sc * 1.0 - 0.2;
    c = mix(c, ink, gLine(gBox(p, vec2(o.x, y), vec2(0.17, 0.075), 0.02), 0.0025) * 0.55 * inside);
    c = mix(c, ink, gFill(gCirc(p, vec2(o.x - 0.11, y), 0.03)) * 0.5 * inside);
    c = mix(c, ink, gBar(p, o.x - 0.06, y + 0.018, 0.17, 0.01) * 0.6 * inside);
    c = mix(c, ink, gBar(p, o.x - 0.06, y - 0.022, 0.1, 0.008) * 0.3 * inside);
  }
  c = mix(c, ink, gFill(gBox(p, vec2(o.x, 0.89), vec2(0.05, 0.008), 0.008)));
  // A notification drops in, rests, and leaves.
  float k = fract(t * 0.3 + seed);
  float drop = smoothstep(0.0, 0.12, k) * smoothstep(0.75, 0.62, k);
  vec2 n = vec2(o.x + 0.34, 0.74 - (1.0 - drop) * 0.06);
  c = mix(c, base, gFill(gBox(p, n, vec2(0.22, 0.06), 0.03)) * drop);
  c = mix(c, acc, gLine(gBox(p, n, vec2(0.22, 0.06), 0.03), 0.004) * drop);
  c = mix(c, acc, gFill(gCirc(p, n - vec2(0.16, 0.0), 0.02)) * drop);
  c = mix(c, ink, gBar(p, n.x - 0.11, n.y, 0.26, 0.011) * 0.8 * drop);
  return c;
}

vec3 scPipeline(vec2 p, float t, vec3 base, vec3 ink, vec3 acc, float seed) {
  vec3 c = base;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 n = vec2(0.26 + fi * 0.36, 0.52);
    if (i < 3) {
      c = mix(c, ink, gFill(gSeg(p, n + vec2(0.11, 0.0), n + vec2(0.25, 0.0)) - 0.002) * 0.45);
      for (int j = 0; j < 3; j++) {
        float k = fract(t * 0.5 + float(j) * 0.33 + fi * 0.21 + seed);
        c = mix(c, acc, gFill(gBox(p, n + vec2(0.11 + k * 0.14, 0.0), vec2(0.012, 0.012), 0.003)));
      }
    }
    c = mix(c, base, gFill(gBox(p, n, vec2(0.11, 0.15), 0.02)));
    c = mix(c, ink, gLine(gBox(p, n, vec2(0.11, 0.15), 0.02), 0.003) * 0.8);
    for (int j = 0; j < 4; j++) {
      float fj = float(j);
      float len = 0.05 + 0.1 * abs(sin(t * (0.8 + fi * 0.3) + fj * 1.9 + fi));
      c = mix(c, ink, gBar(p, n.x - 0.075, n.y + 0.085 - fj * 0.055, len, 0.01) * 0.55);
    }
  }
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    float h = 0.01 + 0.05 * gH(floor(fi + t * 2.0));
    c = mix(c, ink, gFill(gBox(p, vec2(0.18 + fi * 0.05, 0.16), vec2(0.008, h), 0.004)) * 0.35);
  }
  return c;
}

vec3 scSpikes(vec2 p, float t, vec3 base, vec3 ink, vec3 acc) {
  vec3 c = base;
  for (int r = 0; r < 6; r++) {
    float fr = float(r);
    float y = 0.82 - fr * 0.1;
    c = mix(c, ink, gFill(gBox(p, vec2(0.8, y - 0.03), vec2(0.66, 0.0012), 0.0)) * 0.25);
    float x = p.x * 26.0 + t * (2.0 + fr * 0.35);
    float cell = floor(x);
    float fire = step(0.72, gH(cell * 1.31 + fr * 17.0));
    float d = max(abs(fract(x) - 0.5) / 26.0 - 0.003, abs(p.y - y) - 0.03);
    float inx = step(0.14, p.x) * step(p.x, 1.46);
    float alarm = step(0.985, gH(cell * 0.77 + 5.0)) * step(1.5, fr) * step(fr, 3.5);
    c = mix(c, mix(ink, acc, alarm), gFill(d) * fire * inx * mix(0.7, 1.0, alarm));
  }
  // The running state under the trains, and a marker where a detection fires.
  float s = 0.17 + 0.05 * sin(p.x * 5.0 + t * 1.4) * sin(p.x * 2.1 - t * 0.6);
  c = mix(c, ink, gFill(abs(p.y - s) - 0.003) * 0.6 * step(0.14, p.x) * step(p.x, 1.46));
  return c;
}

vec3 scene(float fid, vec2 p, float t, vec3 base, vec3 ink, vec3 acc, float seed) {
  int id = int(fid + 0.5);
  if (id == 1) return scEditor(p, t, base, ink, acc);
  if (id == 2) return scAsk(p, t, base, ink, acc);
  if (id == 3) return scLanguages(p, t, base, ink, acc);
  if (id == 4) return scCall(p, t, base, ink, acc);
  if (id == 5) return scBook(p, t, base, ink, acc);
  if (id == 7) return scPhone(p, t, base, ink, acc, seed);
  if (id == 8) return scPipeline(p, t, base, ink, acc, seed);
  if (id == 9) return scSpikes(p, t, base, ink, acc);
  return scProduct(p, t, base, ink, acc, seed);
}
`;
