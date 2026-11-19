// Project motion graphics. One scene per project, each a 10 second loop of that product's core
// flow, as documented in the Notion Projects Knowledgebase and seen in its Drive screenshots.
// Nothing is traced from a screenshot: no names, photos, logos, or numbers appear.
// Each material compiles only its own scene (#define SCENE n), so programs stay small.
// Drawing kit and layer model: ./holo.ts.

import { HOLO_GLSL } from './holo';

export const SCENES_GLSL = /* glsl */ `
${HOLO_GLSL}

// Shared helpers used by several scenes.
void codeLines(int l, vec2 o, int n, float prog, float seed, float k) {
  for (int i = 0; i < 9; i++) {
    if (i >= n) break;
    float fi = float(i);
    float y = o.y - fi * 0.045;
    float ind = step(0.45, hh(fi + seed)) * 0.03 + step(0.8, hh(fi * 2.3 + seed)) * 0.03;
    float p = clamp(prog * float(n) - fi, 0.0, 1.0);
    float a = 0.05 + 0.06 * hh(fi * 1.7 + seed);
    float b = 0.04 + 0.1 * hh(fi * 3.1 + seed);
    bar(l, vec2(o.x + ind, y), a * clamp(p * 2.0, 0.0, 1.0), 0.008, cAcc2, k);
    bar(l, vec2(o.x + ind + a + 0.012, y), b * clamp(p * 2.0 - 1.0, 0.0, 1.0), 0.008, mix(cInk, cMute, 0.35), k);
  }
}
float qr(vec2 p, vec2 c, float s, float seed) {
  vec2 q = (p - c) / s + 0.5;
  if (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) return 0.0;
  vec2 cell = floor(q * 21.0);
  float on = step(0.5, hh2(cell + seed));
  vec2 f = min(cell, 20.0 - cell);
  if ((cell.x < 7.0 || cell.x > 13.0) && (cell.y < 7.0 || cell.y > 13.0) && !(cell.x > 13.0 && cell.y > 13.0)) {
    vec2 m = mod(cell, 14.0);
    vec2 d = abs(m - 3.0);
    float r = max(d.x, d.y);
    on = (r == 3.0 || r <= 1.0) ? 1.0 : 0.0;
  }
  return on;
}
float arcMask(vec2 p, vec2 c, float r, float w, float frac) {
  vec2 d = p - c;
  float ang = fract(0.25 - atan(d.y, d.x) / 6.28318);
  return stroke(length(d) - r, w) * step(ang, frac);
}
void check(int l, vec2 c, float s, vec3 col, float k) {
  line(l, c + vec2(-s, 0.0), c + vec2(-s * 0.3, -s * 0.7), s * 0.18, col, k);
  line(l, c + vec2(-s * 0.3, -s * 0.7), c + vec2(s, s * 0.6), s * 0.18, col, k);
}

#if SCENE == 1
// MagicalBook.Store: a photo becomes a cast, the story writes itself, illustrations paint in, the book is ready.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.1, 9.3, 0.5);
  vec2 ph = vec2(0.33, 0.63 + 0.015 * sin(t * 1.3));
  panel(1, ph, vec2(0.15, 0.2), 0.022, cPanel, a);
  box(1, ph + vec2(0.0, 0.03), vec2(0.122, 0.135), 0.012, mix(cPanel, cMute, 0.3), a);
  disc(1, ph + vec2(0.0, 0.08), 0.045, cAcc2, a);
  box(1, ph + vec2(0.0, -0.035), vec2(0.075, 0.05), 0.05, cAcc2, a);
  bar(1, ph + vec2(-0.1, -0.158), 0.13, 0.007, cMute, a);
  float sc = beat(t, 0.6, 2.9, 0.3);
  float sy = ph.y + 0.16 - fract((t - 0.6) / 1.15) * 0.29;
  box(2, vec2(ph.x, sy), vec2(0.13, 0.004), 0.004, cAcc, sc);
  glow(2, vec2(ph.x, sy), 0.05, cAcc, sc * 0.7);
  float fl = beat(t, 2.0, 6.6, 0.4);
  for (int i = 0; i < 9; i++) {
    float k = fract(t * 0.55 + float(i) / 9.0);
    vec2 pos = mix(ph + vec2(0.15, 0.0), vec2(0.72, 0.62), k) + vec2(0.0, sin(k * 3.14159) * (0.05 + 0.04 * hh(float(i))));
    disc(2, pos, 0.007 + 0.004 * hh(float(i) + 5.0), cAcc, fl * sin(k * 3.14159));
  }
  vec2 bk = vec2(1.1, 0.61);
  float b = eOut((t - 1.4) / 0.8) * (1.0 - eInOut((t - 9.3) / 0.5));
  panel(1, bk - vec2(0.205, 0.0), vec2(0.2, 0.27), 0.012, cPanel, b);
  panel(1, bk + vec2(0.205, 0.0), vec2(0.2, 0.27), 0.012, cPanel, b);
  line(1, bk + vec2(0.0, 0.27), bk - vec2(0.0, 0.27), 0.002, cMute, b);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float p = clamp((t - 2.6) * 2.4 - fi, 0.0, 1.0);
    bar(1, bk + vec2(-0.37, 0.19 - fi * 0.052), (0.22 + 0.08 * hh(fi)) * p, 0.0065, mix(cInk, cMute, 0.4), b);
  }
  float il = clamp(eBack((t - 4.0) / 0.7), 0.0, 1.2) * b;
  vec2 pg = bk + vec2(0.205, 0.02);
  box(1, pg, vec2(0.17, 0.215), 0.01, mix(cPanel, cAcc, 0.22), min(il, 1.0));
  disc(1, pg + vec2(0.08, 0.12), 0.042 * il, cAcc, min(il, 1.0));
  box(1, pg + vec2(0.0, -0.15), vec2(0.17, 0.065), 0.01, cAcc2, min(il, 1.0));
  disc(1, pg + vec2(-0.05, -0.02 + 0.01 * sin(t * 3.0)), 0.03 * il, cInk, min(il, 1.0));
  box(1, pg + vec2(-0.05, -0.085 + 0.01 * sin(t * 3.0)), vec2(0.03, 0.04), 0.03, cInk, min(il, 1.0));
  float turn = smoothstep(7.0, 8.0, t);
  float w = cos(turn * 3.14159);
  float on = step(7.0, t) * step(t, 8.0);
  box(1, bk + vec2(w * 0.205, 0.0), vec2(abs(w) * 0.2, 0.27 + (1.0 - abs(w)) * 0.025), 0.012, cPanel, on * b);
  outline(1, bk + vec2(w * 0.205, 0.0), vec2(abs(w) * 0.2, 0.27 + (1.0 - abs(w)) * 0.025), 0.012, 0.0015, cMute, on * b);
  float pb = beat(t, 2.2, 9.1, 0.4);
  float pr = clamp((t - 2.4) / 5.2, 0.0, 1.0);
  panel(2, vec2(0.8, 0.285), vec2(0.4, 0.034), 0.034, cInk, pb);
  bar(2, vec2(0.43, 0.285), 0.62 * pr, 0.011, cAcc, pb);
  disc(2, vec2(1.13, 0.285), 0.016, mix(cMute, cAcc2, step(0.999, pr)), pb);
  float rb = clamp(eBack((t - 7.8) / 0.5), 0.0, 1.2) * (1.0 - eInOut((t - 9.2) / 0.4));
  panel(2, vec2(1.42, 0.87), vec2(0.085 * rb, 0.042 * rb), 0.04, cAcc2, min(rb, 1.0));
  check(2, vec2(1.42, 0.87), 0.018, cPanel, min(rb, 1.0));
}
#endif

#if SCENE == 2
// Vakse: an RFP goes out, vendor bids arrive, the best is chosen, approvals pass, payment clears.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 wc = vec2(0.8, 0.61);
  panel(1, wc, vec2(0.68, 0.35), 0.022, cPanel, a);
  chrome(1, wc, vec2(0.68, 0.35), a);
  for (int i = 0; i < 5; i++) bar(1, vec2(0.2, 0.84 - float(i) * 0.06), 0.1, 0.007, mix(cMute, cAcc, step(float(i), 0.5)), a * 0.9);
  line(1, vec2(0.36, 0.89), vec2(0.36, 0.28), 0.0008, cMute * 0.6, a);
  vec2 rf = vec2(0.56, 0.6);
  float r = beat(t, 0.3, 6.0, 0.5);
  panel(1, rf, vec2(0.16, 0.24), 0.016, mix(cPanel, cBg, 0.4), r);
  bar(1, rf + vec2(-0.12, 0.19), 0.12, 0.011, cInk, r);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float p = clamp((t - 0.6) * 3.0 - fi, 0.0, 1.0);
    box(1, rf + vec2(-0.12, 0.11 - fi * 0.06), vec2(0.008, 0.008), 0.003, cAcc2, r * p);
    bar(1, rf + vec2(-0.1, 0.11 - fi * 0.06), (0.12 + 0.06 * hh(fi)) * p, 0.007, cMute, r);
  }
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float in1 = clamp(eBack((t - 1.8 - fi * 0.35) / 0.6), 0.0, 1.15);
    float k = min(in1, 1.0) * (1.0 - eInOut((t - 6.2) / 0.5));
    vec2 c = vec2(1.08 + (1.0 - in1) * 0.5, 0.76 - fi * 0.155);
    float best = step(1.0, fi) * step(fi, 1.0) * smoothstep(3.6, 4.0, t);
    panel(2, c, vec2(0.2, 0.06), 0.014, mix(cPanel, cAcc, best * 0.18), k);
    avatar(2, c + vec2(-0.155, 0.0), 0.024, mix(cMute, cAcc2, 0.5 + 0.5 * hh(fi)), k);
    bar(2, c + vec2(-0.115, 0.018), 0.12, 0.007, cInk, k);
    bar(2, c + vec2(-0.115, -0.016), 0.06 + 0.14 * hh(fi + 4.0), 0.006, mix(cMute, cAcc, best), k);
    outline(2, c, vec2(0.2, 0.06), 0.014, 0.002, cAcc, k * best);
  }
  float po = beat(t, 6.0, 9.4, 0.5);
  vec2 pc = vec2(0.98, 0.6);
  panel(2, pc, vec2(0.3, 0.2), 0.02, cPanel, po);
  bar(2, pc + vec2(-0.25, 0.13), 0.16, 0.011, cInk, po);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 s = pc + vec2(-0.16 + fi * 0.16, 0.01);
    float done = smoothstep(6.6 + fi * 0.45, 6.8 + fi * 0.45, t);
    if (i < 2) line(2, s, s + vec2(0.16, 0.0), 0.003, mix(cMute, cAcc, smoothstep(6.8 + fi * 0.45, 7.2 + fi * 0.45, t)), po);
    disc(2, s, 0.03, mix(cMute * 0.5, cAcc, done), po);
    check(2, s, 0.012, cPanel, po * done);
  }
  float pay = smoothstep(8.0, 8.6, t);
  panel(2, pc + vec2(0.0, -0.13), vec2(0.2, 0.036), 0.036, mix(cBg, cAcc, pay), po);
  bar(2, pc + vec2(-0.13, -0.13), 0.2 * clamp((t - 8.0) * 2.0, 0.0, 1.0), 0.009, cPanel, po);
  for (int i = 0; i < 2; i++) ring(2, pc, 0.22 + fract(t * 0.8 + float(i) * 0.5) * 0.25, 0.002, cAcc, po * pay * (1.0 - fract(t * 0.8 + float(i) * 0.5)) * 0.6);
}
#endif

#if SCENE == 3
// Codesmash: two editors fill at once, a shared timer runs, tests flip green, a winner is crowned.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  for (int s = 0; s < 2; s++) {
    float fs = float(s);
    vec2 c = vec2(0.43 + fs * 0.74, 0.58);
    vec3 side = s == 0 ? cAcc : cAcc2;
    panel(1, c, vec2(0.34, 0.29), 0.018, cPanel, a);
    disc(1, c + vec2(-0.3, 0.25), 0.007, side, a);
    bar(1, c + vec2(-0.28, 0.25), 0.1, 0.006, cMute, a);
    for (int i = 0; i < 9; i++) bar(1, c + vec2(-0.31, 0.18 - float(i) * 0.045), 0.012, 0.005, cMute * 0.6, a);
    float speed = s == 0 ? 0.135 : 0.118;
    codeLines(1, c + vec2(-0.27, 0.18), 9, clamp((t - 0.5) * speed, 0.0, 1.0), 3.0 + fs * 7.0, a);
    float prog = clamp((t - 1.5) / (s == 0 ? 5.6 : 6.4), 0.0, 1.0);
    for (int i = 0; i < 6; i++) {
      float pass = step(float(i) + 1.0, prog * 6.0);
      disc(2, c + vec2(-0.22 + float(i) * 0.06, -0.33), 0.016, mix(vec3(0.75, 0.15, 0.15), cAcc2, pass), a);
    }
    float bl = step(0.5, fract(t * 1.6));
    box(2, c + vec2(-0.27 + 0.2 * hh(floor(t * 2.0) + fs), 0.18 - mod(floor(t * 1.4), 9.0) * 0.045), vec2(0.003, 0.016), 0.0, side, a * bl);
  }
  vec2 tc = vec2(0.8, 0.93);
  panel(2, tc, vec2(0.12, 0.042), 0.042, cPanel, a);
  ring(2, tc + vec2(-0.08, 0.0), 0.022, 0.002, cMute, a);
  put(2, arcMask(at(2), tc + vec2(-0.08, 0.0), 0.022, 0.004, 1.0 - fract(t / 10.0)) * a, cAcc);
  bar(2, tc + vec2(-0.045, 0.0), 0.13, 0.009, cInk, a);
  float win = clamp(eBack((t - 7.3) / 0.6), 0.0, 1.2) * (1.0 - eInOut((t - 9.2) / 0.4));
  vec2 wc = vec2(0.43, 0.6);
  glow(2, wc, 0.25, cAcc2, min(win, 1.0) * 0.8);
  panel(2, wc, vec2(0.15 * win, 0.07 * win), 0.03, cAcc2, min(win, 1.0));
  vec2 cr = wc + vec2(-0.09, 0.0);
  line(2, cr + vec2(-0.03, -0.02), cr + vec2(0.03, -0.02), 0.006, cPanel, min(win, 1.0));
  line(2, cr + vec2(-0.03, -0.02), cr + vec2(-0.03, 0.025), 0.006, cPanel, min(win, 1.0));
  line(2, cr + vec2(0.03, -0.02), cr + vec2(0.03, 0.025), 0.006, cPanel, min(win, 1.0));
  line(2, cr + vec2(-0.03, 0.025), cr + vec2(0.0, 0.0), 0.006, cPanel, min(win, 1.0));
  line(2, cr + vec2(0.03, 0.025), cr + vec2(0.0, 0.0), 0.006, cPanel, min(win, 1.0));
  bar(2, wc + vec2(-0.04, 0.012), 0.14, 0.01, cPanel, min(win, 1.0));
  bar(2, wc + vec2(-0.04, -0.02), 0.08, 0.008, cPanel, min(win, 1.0));
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float k = clamp((t - 7.3) / 1.6, 0.0, 1.0);
    vec2 dir = vec2(cos(fi * 2.4), sin(fi * 2.4)) * (0.1 + 0.2 * hh(fi));
    disc(2, wc + dir * eOut(k) + vec2(0.0, -k * k * 0.12), 0.006, mix(cAcc, cAcc2, hh(fi + 2.0)), (1.0 - k) * step(7.3, t));
  }
}
#endif

#if SCENE == 4
// Shocodoc: three people write in one document, a word is highlighted, a comment thread opens.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 dc = vec2(0.72, 0.6);
  panel(1, dc, vec2(0.52, 0.34), 0.02, cPanel, a);
  for (int i = 0; i < 9; i++) box(1, dc + vec2(0.06 + float(i) * 0.045, 0.29), vec2(0.014, 0.014), 0.004, mix(cBg, cMute, 0.35 + 0.4 * step(3.5, float(i)) * step(float(i), 3.5)), a);
  box(1, dc + vec2(-0.46, 0.29), vec2(0.014, 0.014), 0.004, vec3(0.8, 0.2, 0.2), a * 0.8);
  bar(1, dc + vec2(-0.4, 0.2), 0.36, 0.016, cAcc2, a);
  vec3 cols[3];
  cols[0] = cAcc; cols[1] = vec3(0.95, 0.45, 0.62); cols[2] = vec3(0.98, 0.78, 0.25);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float y = dc.y + 0.11 - fi * 0.06;
    int who = int(mod(fi, 3.0));
    float start = 0.4 + fi * 0.25;
    float full = 0.5 + 0.3 * hh(fi + 9.0);
    float p = clamp((t - start) / 3.2, 0.0, 1.0);
    bar(1, vec2(dc.x - 0.4, y), full * p, 0.009, mix(cInk, cMute, 0.35), a);
    if (p > 0.0 && p < 1.0) {
      vec3 cc = cols[who];
      box(2, vec2(dc.x - 0.4 + full * p + 0.008, y), vec2(0.003, 0.02), 0.0, cc, a);
      panel(2, vec2(dc.x - 0.4 + full * p + 0.04, y + 0.038), vec2(0.035, 0.014), 0.01, cc, a);
    }
  }
  float hl = smoothstep(4.0, 4.5, t) * (1.0 - eInOut((t - 9.0) / 0.4));
  box(1, vec2(dc.x - 0.18, dc.y + 0.05), vec2(0.09 * hl, 0.018), 0.004, cAcc, hl * 0.45);
  float cm = clamp(eBack((t - 4.6) / 0.6), 0.0, 1.15) * (1.0 - eInOut((t - 9.0) / 0.4));
  vec2 cc = vec2(1.36, 0.62 - (1.0 - min(cm, 1.0)) * 0.04);
  line(2, vec2(dc.x - 0.09, dc.y + 0.05), cc + vec2(-0.16, 0.08), 0.0018, cAcc, min(cm, 1.0));
  panel(2, cc, vec2(0.16, 0.16), 0.018, mix(cPanel, cBg, 0.2), min(cm, 1.0));
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float rp = smoothstep(5.0 + fi * 1.1, 5.4 + fi * 1.1, t);
    avatar(2, cc + vec2(-0.12, 0.1 - fi * 0.1), 0.02, cols[i + 1], min(cm, 1.0) * rp);
    bar(2, cc + vec2(-0.085, 0.112 - fi * 0.1), 0.18, 0.006, cInk, min(cm, 1.0) * rp);
    bar(2, cc + vec2(-0.085, 0.088 - fi * 0.1), 0.12, 0.005, cMute, min(cm, 1.0) * rp);
  }
  panel(2, cc + vec2(0.0, -0.12), vec2(0.13, 0.022), 0.022, cBg, min(cm, 1.0));
  disc(2, cc + vec2(0.105, -0.12), 0.012, cAcc, min(cm, 1.0));
  for (int i = 0; i < 3; i++) avatar(2, vec2(1.36 + float(i) * 0.04, 0.92), 0.022, cols[i], a);
}
#endif

#if SCENE == 5
// MenuMatch: a menu is built and reordered, a QR code resolves, a guest orders, the ticket moves to delivered.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 mc = vec2(0.38, 0.6);
  panel(1, mc, vec2(0.3, 0.33), 0.02, cPanel, a);
  box(1, mc + vec2(-0.25, 0.0), vec2(0.05, 0.33), 0.02, vec3(0.12), a);
  for (int i = 0; i < 4; i++) bar(1, mc + vec2(-0.28, 0.25 - float(i) * 0.05), 0.06, 0.006, mix(vec3(0.5), cAcc, step(float(i), 0.5)), a);
  float drag = smoothstep(1.2, 2.0, t) - smoothstep(2.6, 3.2, t);
  float slot = mix(0.0, 2.0, smoothstep(1.6, 2.6, t));
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float y = fi;
    if (i == 0) y = slot;
    else if (fi <= slot) y = fi - 1.0;
    vec2 rc = mc + vec2(0.06, 0.2 - y * 0.12);
    int l = (i == 0 && drag > 0.01) ? 2 : 1;
    panel(l, rc + vec2(drag * 0.02 * float(i == 0), 0.0), vec2(0.17, 0.045), 0.012, i == 0 ? mix(cPanel, cAcc, 0.12) : mix(cPanel, cBg, 0.6), a);
    box(l, rc + vec2(-0.13, 0.0), vec2(0.025, 0.025), 0.008, mix(cAcc2, cAcc, hh(fi)), a);
    bar(l, rc + vec2(-0.09, 0.012), 0.12, 0.007, cInk, a);
    bar(l, rc + vec2(-0.09, -0.014), 0.07, 0.005, cMute, a);
    bar(l, rc + vec2(0.1, 0.0), 0.04, 0.007, cAcc, a);
  }
  vec2 qc = vec2(0.86, 0.66);
  float q = beat(t, 3.0, 9.3, 0.5);
  panel(1, qc, vec2(0.11, 0.11), 0.014, cPanel, q);
  float reveal = clamp((t - 3.1) * 1.6, 0.0, 1.0);
  vec2 qq = (at(1) - qc) / 0.16 + 0.5;
  float rv = step(hh2(floor(qq * 21.0) + 3.0), reveal);
  put(1, qr(at(1), qc, 0.16, 7.0) * q * rv, cInk);
  float sy = qc.y + 0.08 - fract((t - 3.0) / 1.2) * 0.16;
  box(2, vec2(qc.x, sy), vec2(0.1, 0.003), 0.003, cAcc, beat(t, 3.2, 5.2, 0.3));
  vec2 ph = vec2(1.3, 0.58);
  float pp = beat(t, 4.6, 9.4, 0.5);
  panel(1, ph, vec2(0.13, 0.27), 0.04, vec3(0.08), pp);
  box(1, ph, vec2(0.115, 0.245), 0.03, cPanel, pp);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    bar(1, ph + vec2(-0.09, 0.17 - fi * 0.07), 0.13, 0.007, cInk, pp);
    float added = smoothstep(5.2 + fi * 0.3, 5.4 + fi * 0.3, t) * step(fi, 1.5);
    disc(1, ph + vec2(0.08, 0.17 - fi * 0.07), 0.014, mix(cMute, cAcc, added), pp);
  }
  float tk = clamp(eBack((t - 6.3) / 0.5), 0.0, 1.15) * (1.0 - eInOut((t - 9.2) / 0.4));
  vec2 tc = vec2(1.02, 0.36);
  panel(2, tc, vec2(0.2, 0.06), 0.03, cPanel, min(tk, 1.0));
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float st = clamp(floor((t - 6.6) / 0.75), 0.0, 2.0);
    float on = 1.0 - step(0.5, abs(fi - st));
    vec3 c = i == 0 ? cAcc : (i == 1 ? cAcc2 : vec3(0.13, 0.77, 0.37));
    panel(2, tc + vec2(-0.12 + fi * 0.12, 0.0), vec2(0.05, 0.022), 0.022, mix(mix(cPanel, cMute, 0.25), c, on), min(tk, 1.0));
  }
}
#endif

#if SCENE == 6
// TaxLens: a tax slip is uploaded, the scraper pulls government projects, the dashboard compares them.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  float up = eOut((t - 0.3) / 1.0) * (1.0 - eInOut((t - 3.0) / 0.6));
  vec2 sc = vec2(0.32, 0.5 + up * 0.12);
  panel(1, sc, vec2(0.11, 0.17), 0.012, vec3(0.94, 0.95, 0.92), up);
  for (int i = 0; i < 6; i++) bar(1, sc + vec2(-0.08, 0.12 - float(i) * 0.04), 0.06 + 0.08 * hh(float(i)), 0.006, vec3(0.35), up);
  box(1, sc + vec2(0.0, -0.13), vec2(0.08, 0.012), 0.004, cAcc, up);
  line(2, vec2(0.32, 0.8), vec2(0.32, 0.9), 0.004, cAcc, up);
  line(2, vec2(0.32, 0.9), vec2(0.29, 0.87), 0.004, cAcc, up);
  line(2, vec2(0.32, 0.9), vec2(0.35, 0.87), 0.004, cAcc, up);
  float sr = beat(t, 2.6, 9.3, 0.5);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 n = vec2(0.22, 0.86 - fi * 0.13);
    panel(1, n, vec2(0.075, 0.04), 0.01, cPanel, sr);
    bar(1, n + vec2(-0.05, 0.008), 0.07, 0.006, cInk, sr);
    bar(1, n + vec2(-0.05, -0.012), 0.045, 0.005, cMute, sr);
    for (int j = 0; j < 2; j++) {
      float k = fract(t * 0.7 + fi * 0.21 + float(j) * 0.5);
      vec2 pos = mix(n + vec2(0.08, 0.0), vec2(0.62, 0.6), eInOut(k));
      disc(2, pos, 0.006, cAcc, sr * sin(k * 3.14159));
    }
  }
  vec2 dc = vec2(1.02, 0.6);
  float d = beat(t, 3.2, 9.4, 0.5);
  panel(1, dc, vec2(0.42, 0.33), 0.02, cPanel, d);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    panel(1, dc + vec2(-0.28 + fi * 0.2, 0.24), vec2(0.085, 0.045), 0.012, mix(cPanel, cBg, 0.5), d);
    bar(1, dc + vec2(-0.34 + fi * 0.2, 0.25), 0.07 * eOut(t - 3.8 - fi * 0.2), 0.008, i == 0 ? cAcc : (i == 1 ? cAcc2 : cInk), d);
  }
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float g = eOut((t - 4.0 - fi * 0.12) / 0.9);
    float h1 = (0.08 + 0.14 * hh(fi)) * g;
    float h2 = h1 * (0.55 + 0.3 * hh(fi + 4.0));
    vec2 o = dc + vec2(-0.36 + fi * 0.085, -0.24);
    box(1, o + vec2(0.0, h1 * 0.5), vec2(0.016, h1 * 0.5), 0.004, cAcc, d);
    box(1, o + vec2(0.035, h2 * 0.5), vec2(0.016, h2 * 0.5), 0.004, cAcc2, d);
  }
  vec2 pc = dc + vec2(0.29, -0.06);
  float sw = eOut((t - 4.6) / 1.4);
  put(1, arcMask(at(1), pc, 0.08, 0.025, sw * 0.62) * d, cAcc);
  vec2 dq = at(1) - pc;
  float ang = fract(0.25 - atan(dq.y, dq.x) / 6.28318);
  put(1, stroke(length(dq) - 0.08, 0.025) * step(0.62, ang) * step(ang, sw) * d, cAcc2);
}
#endif

#if SCENE == 7
// Prepify: an interview is generated, answered, scored, and broken down into skills on a radar.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float lift = (i == 1) ? 0.03 : 0.0;
    float k = clamp(eBack((t - 0.2 - fi * 0.2) / 0.6), 0.0, 1.15) * (1.0 - eInOut((t - 4.0) / 0.6));
    vec2 c = vec2(0.36 + fi * 0.44, 0.62 + lift);
    int l = (i == 1) ? 2 : 1;
    panel(l, c, vec2(0.18, 0.22), 0.022, cPanel, min(k, 1.0));
    ring(l, c + vec2(0.0, 0.12), 0.04, 0.004, mix(cAcc, cAcc2, fi * 0.5), min(k, 1.0));
    disc(l, c + vec2(0.0, 0.12), 0.026, mix(cBg, cMute, 0.5), min(k, 1.0));
    bar(l, c + vec2(-0.12, 0.04), 0.2, 0.009, cInk, min(k, 1.0));
    bar(l, c + vec2(-0.12, 0.0), 0.15, 0.006, cMute, min(k, 1.0));
    box(l, c + vec2(-0.08, -0.07), vec2(0.045, 0.016), 0.016, mix(cPanel, cAcc, 0.35), min(k, 1.0));
    for (int j = 0; j < 3; j++) disc(l, c + vec2(-0.1 + float(j) * 0.05, -0.15), 0.016, mix(cBg, cMute, 0.6), min(k, 1.0));
    if (i == 1) glow(1, c, 0.25, cAcc, min(k, 1.0) * 0.4);
  }
  float q = beat(t, 4.2, 9.4, 0.5);
  vec2 sc = vec2(0.5, 0.6);
  panel(1, sc, vec2(0.26, 0.26), 0.022, cPanel, q);
  float score = eOut((t - 4.8) / 1.6);
  ring(1, sc + vec2(0.0, 0.03), 0.13, 0.012, mix(cBg, cMute, 0.4), q);
  put(1, arcMask(at(1), sc + vec2(0.0, 0.03), 0.13, 0.012, score * 0.78) * q, cAcc2);
  bar(1, sc + vec2(-0.05, 0.035), 0.1, 0.02, cInk, q);
  bar(1, sc + vec2(-0.12, -0.18), 0.24, 0.007, cMute, q);
  vec2 rc = vec2(1.14, 0.6);
  panel(1, rc, vec2(0.28, 0.28), 0.022, cPanel, q);
  vec2 p = at(1) - rc;
  for (int i = 0; i < 3; i++) {
    float r = 0.07 + float(i) * 0.07;
    float ang = atan(p.y, p.x);
    float poly = r * cos(3.14159 / 6.0) / cos(mod(ang + 3.14159 / 6.0, 3.14159 / 3.0) - 3.14159 / 6.0);
    put(1, stroke(length(p) - poly, 0.0012) * q, cMute);
  }
  float grow = eOut((t - 5.4) / 1.6);
  float ang = atan(p.y, p.x);
  float seg = floor((ang + 3.14159) / (3.14159 / 3.0));
  float rr = (0.09 + 0.11 * hh(seg + 2.0)) * grow;
  float rn = (0.09 + 0.11 * hh(mod(seg + 1.0, 6.0) + 2.0)) * grow;
  float f = fract((ang + 3.14159) / (3.14159 / 3.0));
  float edge = mix(rr, rn, f);
  put(1, (1.0 - smoothstep(edge - 0.003, edge + 0.003, length(p))) * q * 0.45, cAcc);
  put(1, stroke(length(p) - edge, 0.002) * q, cAcc);
}
#endif

#if SCENE == 8
// EchoSign: a hand gesture is captured, its points become a word, the word becomes speech.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 cam = vec2(0.38, 0.62);
  panel(1, cam, vec2(0.26, 0.28), 0.022, vec3(0.82, 0.84, 0.86), a);
  vec2 hc = cam + vec2(0.0, -0.04);
  float form = eOut((t - 0.4) / 1.2) * (1.0 - smoothstep(3.4, 4.2, t));
  box(1, hc, vec2(0.07, 0.08), 0.04, mix(vec3(0.82, 0.84, 0.86), cInk, 0.55), a * form);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float bend = (i == 3) ? 0.04 : 0.0;
    box(1, hc + vec2(-0.05 + fi * 0.034, 0.12 - bend * 0.5), vec2(0.013, 0.06 - bend), 0.013, mix(vec3(0.82, 0.84, 0.86), cInk, 0.55), a * form);
  }
  box(1, hc + vec2(0.09, 0.0), vec2(0.04, 0.012), 0.012, mix(vec3(0.82, 0.84, 0.86), cInk, 0.55), a * form);
  float pts = smoothstep(1.4, 1.8, t);
  for (int i = 0; i < 21; i++) {
    float fi = float(i);
    vec2 start = hc + vec2((hh(fi) - 0.5) * 0.16, (hh(fi + 9.0) - 0.4) * 0.26);
    vec2 end = vec2(0.92 + mod(fi, 7.0) * 0.035, 0.66 + floor(fi / 7.0) * 0.03 - 0.03);
    float k = eInOut((t - 3.4 - fi * 0.02) / 1.0);
    vec2 pos = mix(start, end, k);
    disc(2, pos, 0.007, cAcc, pts * (1.0 - smoothstep(5.0, 5.4, t)));
    if (i < 20 && k < 0.05) line(2, start, hc + vec2((hh(fi + 1.0) - 0.5) * 0.16, (hh(fi + 10.0) - 0.4) * 0.26), 0.0012, cAcc, pts * 0.5 * (1.0 - k * 20.0));
  }
  float tx = beat(t, 4.6, 9.4, 0.5);
  vec2 wc = vec2(1.1, 0.68);
  panel(1, wc, vec2(0.28, 0.08), 0.018, cPanel, tx);
  bar(1, wc + vec2(-0.2, 0.0), 0.28 * eOut((t - 5.0) / 0.6), 0.02, cInk, tx);
  float sp = beat(t, 5.8, 9.4, 0.4);
  vec2 wv = vec2(1.1, 0.42);
  panel(1, wv, vec2(0.28, 0.1), 0.018, cPanel, sp);
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    float h = 0.008 + 0.06 * abs(sin(fi * 0.8 + t * 6.0) * sin(fi * 0.27 - t * 1.7)) * smoothstep(6.0, 6.4, t);
    box(2, wv + vec2(-0.24 + fi * 0.019, 0.0), vec2(0.0055, h), 0.0055, cAcc, sp);
  }
  panel(2, vec2(1.46, 0.3), vec2(0.04, 0.04), 0.04, cAcc, a);
}
#endif

#if SCENE == 9
// SearchX: a query is typed, only the shards it needs light up, ranked results slide in with a timing.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 sb = vec2(0.8, 0.88);
  panel(2, sb, vec2(0.48, 0.05), 0.05, cPanel, a);
  ring(2, sb + vec2(-0.42, 0.005), 0.016, 0.003, cMute, a);
  line(2, sb + vec2(-0.408, -0.008), sb + vec2(-0.398, -0.018), 0.003, cMute, a);
  float typed = clamp((t - 0.4) / 1.4, 0.0, 1.0);
  bar(2, sb + vec2(-0.38, 0.0), 0.32 * typed, 0.011, cInk, a);
  box(2, sb + vec2(-0.37 + 0.32 * typed, 0.0), vec2(0.002, 0.02), 0.0, cAcc, a * step(0.5, fract(t * 1.8)));
  float g = beat(t, 1.8, 9.4, 0.4);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 c = vec2(0.14 + mod(fi, 8.0) * 0.055, 0.7 - floor(fi / 8.0) * 0.08);
    float hit = step(0.82, hh(fi + 3.0)) * smoothstep(2.0 + hh(fi) * 0.6, 2.3 + hh(fi) * 0.6, t);
    panel(1, c, vec2(0.02, 0.028), 0.006, mix(cPanel, cAcc, hit * 0.8), g);
    if (hit > 0.0) glow(2, c, 0.04, cAcc, hit * g * 0.6);
  }
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float k = clamp(eBack((t - 3.2 - fi * 0.25) / 0.6), 0.0, 1.15) * (1.0 - eInOut((t - 9.2) / 0.4));
    vec2 c = vec2(1.12 + (1.0 - min(k, 1.0)) * 0.3, 0.72 - fi * 0.13);
    panel(1, c, vec2(0.3, 0.055), 0.014, cPanel, min(k, 1.0));
    bar(1, c + vec2(-0.26, 0.018), 0.16, 0.008, cAcc, min(k, 1.0));
    bar(1, c + vec2(-0.26, -0.012), 0.3, 0.005, cMute, min(k, 1.0));
    disc(1, c + vec2(0.2, 0.018), 0.008, cAcc2, min(k, 1.0));
    bar(1, c + vec2(0.215, 0.018), 0.04, 0.005, cMute, min(k, 1.0));
    bar(1, c + vec2(-0.26, -0.036), 0.2 - fi * 0.04, 0.003, mix(cAcc, cMute, 0.5), min(k, 1.0));
  }
  float tm = clamp(eBack((t - 4.4) / 0.4), 0.0, 1.15) * (1.0 - eInOut((t - 9.2) / 0.4));
  panel(2, vec2(1.4, 0.88), vec2(0.07 * tm, 0.03), 0.03, cAcc2, min(tm, 1.0));
  bar(2, vec2(1.36, 0.88), 0.08, 0.008, cBg, min(tm, 1.0));
}
#endif

#if SCENE == 10
// Scrape-Stripe: the scheduler fires, a function syncs, layered warehouse tables fill, a chart rises.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 ck = vec2(0.24, 0.62);
  panel(1, ck, vec2(0.1, 0.1), 0.1, cPanel, a);
  ring(1, ck, 0.08, 0.003, cMute, a);
  float hand = t * 0.6;
  line(2, ck, ck + vec2(sin(hand), cos(hand)) * 0.06, 0.004, cAcc, a);
  line(2, ck, ck + vec2(sin(hand * 0.08), cos(hand * 0.08)) * 0.04, 0.005, cInk, a);
  float fire = fract(t / 2.5);
  ring(2, ck, 0.1 + fire * 0.12, 0.002, cAcc, a * (1.0 - fire));
  vec2 fn = vec2(0.56, 0.62);
  panel(1, fn, vec2(0.11, 0.08), 0.018, cPanel, a);
  line(1, fn + vec2(-0.05, 0.03), fn + vec2(-0.07, 0.0), 0.004, cAcc, a);
  line(1, fn + vec2(-0.07, 0.0), fn + vec2(-0.05, -0.03), 0.004, cAcc, a);
  line(1, fn + vec2(0.05, 0.03), fn + vec2(0.07, 0.0), 0.004, cAcc, a);
  line(1, fn + vec2(0.07, 0.0), fn + vec2(0.05, -0.03), 0.004, cAcc, a);
  bar(1, fn + vec2(-0.03, 0.0), 0.06, 0.006, cInk, a);
  for (int j = 0; j < 4; j++) {
    float k = fract(t * 0.5 + float(j) * 0.25);
    disc(2, mix(ck + vec2(0.1, 0.0), fn - vec2(0.11, 0.0), k), 0.006, cAcc, a * sin(k * 3.14159));
    disc(2, mix(fn + vec2(0.11, 0.0), vec2(0.86, 0.62), k), 0.006, cAcc2, a * sin(k * 3.14159));
  }
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 c = vec2(0.98 + fi * 0.025, 0.5 + fi * 0.09);
    float fill = eOut((t - 1.5 - fi * 0.6) / 1.2);
    panel(1, c, vec2(0.13, 0.055), 0.01, mix(cPanel, cBg, 0.3 - fi * 0.1), a);
    for (int r = 0; r < 4; r++) bar(1, c + vec2(-0.11, 0.03 - float(r) * 0.02), 0.2 * clamp(fill * 4.0 - float(r), 0.0, 1.0), 0.004, i == 2 ? cAcc2 : cMute, a);
  }
  vec2 ch = vec2(1.32, 0.42);
  float cc = beat(t, 3.6, 9.4, 0.4);
  panel(1, ch, vec2(0.18, 0.12), 0.016, cPanel, cc);
  float prev = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float y = 0.02 + 0.13 * (fi / 9.0) * (0.6 + 0.4 * hh(fi)) ;
    float g = eOut((t - 3.8 - fi * 0.12) / 0.5);
    if (i > 0) line(2, ch + vec2(-0.15 + (fi - 1.0) * 0.033, -0.09 + prev), ch + vec2(-0.15 + fi * 0.033, -0.09 + y), 0.003, cAcc2, cc * g);
    prev = y;
  }
}
#endif

#if SCENE == 11
// HundredPov: live stream cards slide into a row, live markers pulse in turn, a glow follows the active card.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  float act = mod(floor(t / 2.2), 3.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float k = clamp(eBack((t - 0.3 - fi * 0.3) / 0.7), 0.0, 1.15) * (1.0 - eInOut((t - 9.2) / 0.4));
    float on = 1.0 - step(0.5, abs(fi - act));
    vec2 c = vec2(0.34 + fi * 0.46, 0.6 + (1.0 - min(k, 1.0)) * -0.3 + on * 0.02);
    int l = on > 0.5 ? 2 : 1;
    if (on > 0.5) glow(1, c, 0.3, cAcc, min(k, 1.0) * 0.6);
    panel(l, c, vec2(0.2, 0.25), 0.02, cPanel, min(k, 1.0));
    box(l, c + vec2(0.0, 0.07), vec2(0.18, 0.15), 0.014, mix(cBg, cAcc, 0.12 + 0.1 * hh(fi)), min(k, 1.0));
    box(l, c + vec2(0.0, 0.02), vec2(0.18, 0.07), 0.0, mix(cBg, cAcc2, 0.08), min(k, 1.0) * 0.6);
    float pulse = 0.5 + 0.5 * sin(t * 6.0 + fi);
    panel(l, c + vec2(-0.13, 0.19), vec2(0.035, 0.016), 0.016, cAcc2, min(k, 1.0));
    disc(l, c + vec2(-0.15, 0.19), 0.005, vec3(1.0), min(k, 1.0) * (0.5 + 0.5 * pulse));
    panel(l, c + vec2(0.12, -0.05), vec2(0.045, 0.014), 0.014, vec3(0.02), min(k, 1.0));
    bar(l, c + vec2(0.09, -0.05), 0.05 + 0.01 * fract(t), 0.004, cInk, min(k, 1.0));
    avatar(l, c + vec2(-0.14, -0.13), 0.022, cAcc, min(k, 1.0));
    bar(l, c + vec2(-0.1, -0.12), 0.14, 0.007, cInk, min(k, 1.0));
    outline(l, c + vec2(0.0, -0.2), vec2(0.16, 0.022), 0.022, 0.0015, mix(cMute, cAcc, on), min(k, 1.0));
  }
}
#endif

#if SCENE == 12
// Waynaa: a city map, a radar from your position, pins drop on nearby places, a deal card opens.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 mc = vec2(0.8, 0.6);
  panel(1, mc, vec2(0.7, 0.36), 0.024, cPanel, a);
  vec2 p = at(1) - mc;
  float inside = aa(sdBox(at(1), mc, vec2(0.69, 0.35), 0.02));
  float roads = stroke(p.y - 0.1 * sin(p.x * 4.0), 0.006) + stroke(p.x + 0.2 + 0.05 * sin(p.y * 6.0), 0.005) + stroke(p.x - 0.35, 0.004) + stroke(p.y + 0.18, 0.004);
  put(1, min(roads, 1.0) * inside * a * 0.6, cMute);
  vec2 g = fract((p + 1.0) * 9.0);
  float blocks = step(0.15, g.x) * step(g.x, 0.85) * step(0.15, g.y) * step(g.y, 0.85) * step(0.55, hh2(floor((p + 1.0) * 9.0)));
  put(1, blocks * inside * a * 0.18, cInk);
  vec2 me = mc + vec2(-0.05, -0.02);
  for (int i = 0; i < 3; i++) {
    float k = fract(t * 0.35 + float(i) / 3.0);
    ring(2, me, k * 0.4, 0.002, cAcc, a * (1.0 - k) * 0.8);
  }
  disc(2, me, 0.016, cAcc2, a);
  ring(2, me, 0.022, 0.003, cPanel, a);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 pin = mc + vec2(-0.55 + hh(fi) * 1.1, -0.22 + hh(fi + 4.0) * 0.44);
    float d = clamp(eBack((t - 1.0 - fi * 0.35) / 0.5), 0.0, 1.2);
    vec2 top = pin + vec2(0.0, 0.035 + (1.0 - min(d, 1.0)) * 0.1);
    shadow(2, pin, vec2(0.012, 0.004), 0.004, min(d, 1.0));
    disc(2, top, 0.022 * min(d, 1.0), cAcc, min(d, 1.0) * (1.0 - eInOut((t - 9.2) / 0.4)));
    disc(2, top, 0.008 * min(d, 1.0), cPanel, min(d, 1.0) * (1.0 - eInOut((t - 9.2) / 0.4)));
    line(2, top - vec2(0.0, 0.018), pin, 0.004, cAcc, min(d, 1.0) * (1.0 - eInOut((t - 9.2) / 0.4)));
  }
  float dl = clamp(eBack((t - 4.2) / 0.6), 0.0, 1.15) * (1.0 - eInOut((t - 9.2) / 0.4));
  vec2 dc = vec2(1.2, 0.74 - (1.0 - min(dl, 1.0)) * 0.05);
  panel(2, dc, vec2(0.2, 0.1), 0.02, mix(cPanel, cBg, 0.2), min(dl, 1.0));
  box(2, dc + vec2(-0.13, 0.0), vec2(0.05, 0.07), 0.012, mix(cBg, cAcc, 0.4), min(dl, 1.0));
  bar(2, dc + vec2(-0.06, 0.04), 0.18, 0.009, cInk, min(dl, 1.0));
  bar(2, dc + vec2(-0.06, 0.01), 0.12, 0.006, cMute, min(dl, 1.0));
  panel(2, dc + vec2(0.02, -0.045), vec2(0.07, 0.022), 0.022, cAcc2, min(dl, 1.0));
}
#endif

#if SCENE == 13
// Xiomara: one draft fans out into several language versions, each filled in, one set right to left.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 o = vec2(0.8, 0.62);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 v = o + vec2(i < 2 ? -0.48 : 0.48, mod(fi, 2.0) < 0.5 ? 0.2 : -0.2);
    float k = eOut((t - 1.2 - fi * 0.3) / 0.8) * a;
    line(1, o, mix(o, v, k), 0.002, cMute, a * 0.6);
    float pk = fract(t * 0.3 + fi * 0.25);
    disc(2, mix(o, v, pk), 0.009, cAcc, k * sin(pk * 3.14159));
    panel(1, v, vec2(0.17 * k, 0.11 * k), 0.016, cPanel, k);
    for (int j = 0; j < 3; j++) {
      float fj = float(j);
      float len = (0.22 - fj * 0.04 - 0.04 * hh(fi * 3.0 + fj)) * eOut((t - 1.8 - fi * 0.3 - fj * 0.15) / 0.6);
      float x0 = (i == 1) ? v.x + 0.12 - len : v.x - 0.12;
      bar(1, vec2(x0, v.y + 0.05 - fj * 0.045), len, 0.009, mix(cInk, cMute, 0.3), k);
    }
    panel(2, v + vec2(0.14, 0.09), vec2(0.03, 0.016), 0.016, mix(cAcc, cAcc2, fi / 3.0), k);
  }
  panel(2, o, vec2(0.18, 0.12), 0.02, mix(cPanel, cAcc, 0.12), a);
  outline(2, o, vec2(0.18, 0.12), 0.02, 0.002, cAcc, a);
  for (int j = 0; j < 3; j++) bar(2, o + vec2(-0.13, 0.05 - float(j) * 0.05), 0.26 - float(j) * 0.06, 0.011, cInk, a);
  glow(1, o, 0.2, cAcc, a * 0.5);
}
#endif

#if SCENE == 14
// OrderlyFlow and fallback: a phone app list scrolls, a notification drops, a row opens into detail.
void runScene(float t) {
  backdrop(t);
  float a = beat(t, 0.0, 9.4, 0.5);
  vec2 o = vec2(0.62, 0.6);
  panel(1, o, vec2(0.19, 0.36), 0.05, vec3(0.04), a);
  box(1, o, vec2(0.17, 0.33), 0.035, cPanel, a);
  float inside = aa(sdBox(at(1), o, vec2(0.165, 0.31), 0.03));
  float sc = fract(t * 0.08) * 0.13;
  for (int i = 0; i < 7; i++) {
    float y = o.y + 0.22 - float(i) * 0.13 + sc;
    vec2 c = vec2(o.x, y);
    put(1, aa(sdBox(at(1), c, vec2(0.14, 0.05), 0.014)) * inside * a, mix(cPanel, cBg, 0.35));
    put(1, aa(sdCirc(at(1), c + vec2(-0.1, 0.0), 0.025)) * inside * a, mix(cAcc, cAcc2, hh(float(i))));
    put(1, aa(sdBox(at(1), c + vec2(0.02, 0.013), vec2(0.07, 0.007), 0.007)) * inside * a, cInk);
    put(1, aa(sdBox(at(1), c + vec2(0.0, -0.015), vec2(0.05, 0.005), 0.005)) * inside * a, cMute);
  }
  box(1, o + vec2(0.0, 0.33), vec2(0.04, 0.008), 0.008, vec3(0.04), a);
  float k = clamp(eBack((fract(t / 5.0) * 5.0 - 0.8) / 0.5), 0.0, 1.15) * (1.0 - eInOut((fract(t / 5.0) * 5.0 - 4.0) / 0.4));
  vec2 n = vec2(1.08, 0.78 - (1.0 - min(k, 1.0)) * 0.06);
  panel(2, n, vec2(0.25, 0.06), 0.03, cPanel, min(k, 1.0));
  disc(2, n - vec2(0.19, 0.0), 0.026, cAcc, min(k, 1.0));
  bar(2, n + vec2(-0.14, 0.015), 0.28, 0.009, cInk, min(k, 1.0));
  bar(2, n + vec2(-0.14, -0.015), 0.18, 0.006, cMute, min(k, 1.0));
  float d = beat(t, 2.5, 9.0, 0.6);
  vec2 dc = vec2(1.08, 0.46);
  panel(1, dc, vec2(0.25, 0.17), 0.022, cPanel, d);
  bars(1, dc + vec2(-0.2, -0.13), 0.022, 0.18, 8, (t - 2.6) * 0.8, 3.0, cAcc, d);
}
#endif
`;
