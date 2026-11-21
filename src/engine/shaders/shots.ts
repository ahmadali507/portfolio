// Motion graphics over a project's real screenshots. Needs HOLO_GLSL (via SCENES_GLSL) before it.
//
// The shots live in one atlas texture, one 1024 x 512 cell per shot, stacked top to bottom.
// Each shot plays for SHOT_D seconds:
//   reveal  the new shot wipes in through staggered slices, with an accent glint on the front
//   scan    a soft beam passes down the screen
//   focus   corner brackets close on the region that matters; the cursor glides there and clicks
//   lift    a magnified loupe of that region rises onto the top layer, tied back by connector lines
// Layers: the browser window sits on layer 1, so it floats above the card; the loupe, brackets and
// cursor sit on layer 2. Texture reads happen in uniform control flow so mipmap selection holds.

export const SHOTS_GLSL = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uShotN;   // shots in the atlas, 1 to 3
uniform float uReady;   // 0 until the atlas has loaded, eases to 1
uniform vec4 uCell[3];  // where each shot sits in its cell: x, y, w, h as fractions of the cell
uniform vec4 uFocus[3]; // the focus region of each shot: x, y, w, h as fractions of the shot, y down

const float SHOT_D = 4.6;
const vec2 SHOT_C = vec2(0.8, 0.575);
const float SHOT_BAR = 0.042;

int shotIndex(float k) { return int(clamp(k, 0.0, 2.0)); }

// Half size of the image area for shot k, fitted to the stage.
vec2 shotHalf(int k) {
  vec4 cell = uCell[k];
  float aspect = 2.0 * cell.z / max(cell.w, 1e-3);
  // As large as the face allows: the title keeps the bottom strip, the window takes the rest.
  float hgt = 0.68;
  float wid = hgt * aspect;
  if (wid > 1.5) { wid = 1.5; hgt = wid / aspect; }
  return vec2(wid, hgt) * 0.5;
}

// q is the position in the shot, 0..1, y down.
vec3 shotTexel(int k, vec2 q) {
  vec4 cell = uCell[k];
  q = clamp(q, 0.002, 0.998);
  float v = (float(k) + cell.y + q.y * cell.w) / max(uShotN, 1.0);
  return texture(uAtlas, vec2(cell.x + q.x * cell.z, 1.0 - v)).rgb;
}

// Slow push toward the focus region: zoom z and the center that keeps the view inside the shot.
vec2 pushCenter(int k, float z) {
  vec4 f = uFocus[k];
  vec2 fc = f.xy + f.zw * 0.5;
  return vec2(0.5) + clamp(fc - 0.5, -1.0, 1.0) * (0.5 - 0.5 / z);
}

void runShots(float time) {
  backdrop(time);
  float n = max(uShotN, 1.0);
  float t = mod(time, n * SHOT_D);
  float kf = floor(t / SHOT_D);
  int k = shotIndex(kf);
  int kp = shotIndex(mod(kf + n - 1.0, n));
  float u = t - kf * SHOT_D;

  // ---- window: the frame eases from the previous shot's shape to this one's ----
  vec2 hf = mix(shotHalf(kp), shotHalf(k), eInOut(u / 0.9));
  vec2 c = SHOT_C;
  vec2 wc = c + vec2(0.0, SHOT_BAR * 0.5);
  vec2 wh = hf + vec2(0.006, SHOT_BAR * 0.5 + 0.006);
  panel(1, wc, wh, 0.02, cPanel, 1.0);
  vec2 tl = wc + vec2(-wh.x, wh.y);
  float barY = tl.y - SHOT_BAR * 0.5 - 0.004;
  for (int i = 0; i < 3; i++) disc(1, vec2(tl.x + 0.026 + float(i) * 0.019, barY), 0.0052, mix(cMute, cAcc, float(i == 2) * 0.6), 1.0);
  box(1, vec2(wc.x, barY), vec2(min(0.17, wh.x * 0.35), 0.0085), 0.0085, mix(cPanel, cMute, 0.22), 1.0);

  // ---- focus geometry, needed before the image for the spotlight ----
  float z = 1.0 + 0.065 * eInOut(u / SHOT_D);
  vec2 kc = pushCenter(k, z);
  vec4 f = uFocus[k];
  vec2 fq0 = 0.5 + (f.xy + f.zw * 0.5 - kc) * z;
  vec2 fC = c + vec2((fq0.x - 0.5) * 2.0 * hf.x, (0.5 - fq0.y) * 2.0 * hf.y);
  vec2 fH = f.zw * z * hf;
  float lk = beat(u, 2.05, 3.9, 0.5);

  // ---- the screenshot ----
  vec2 p = at(1);
  vec2 q0 = vec2((p.x - c.x) / (2.0 * hf.x) + 0.5, 0.5 - (p.y - c.y) / (2.0 * hf.y));
  vec3 cur = shotTexel(k, kc + (q0 - 0.5) / z);
  float zp = 1.065;
  vec3 prv = shotTexel(kp, pushCenter(kp, zp) + (q0 - 0.5) / zp);
  // Reveal: seven slices, each wiping down a little after its left neighbour.
  float slice = floor(clamp(q0.x, 0.0, 0.999) * 7.0);
  float rv = eOut((u - 0.05 - slice * 0.05) / 0.42) * 1.04;
  float front = step(q0.y, rv);
  vec3 col = mix(prv, cur, n > 1.5 ? front : 1.0);
  col += cAcc * exp(-pow((q0.y - rv) * 70.0, 2.0)) * step(rv, 1.0) * step(0.0, u - 0.05) * (n > 1.5 ? 1.0 : 0.0);
  // Before the atlas arrives: a quiet skeleton with a travelling shimmer.
  float shimmer = exp(-pow((q0.x - fract(time * 0.45) * 1.6 + 0.3) * 5.0, 2.0)) * 0.06;
  col = mix(mix(cPanel, cMute, 0.12) + shimmer, col, uReady);
  // Scan beam.
  float sb = (u - 0.95) / 0.85;
  col += cAcc * exp(-pow((q0.y - sb) * 34.0, 2.0)) * step(0.0, sb) * step(sb, 1.0) * 0.32;
  // Spotlight: while the loupe is up, the rest of the screen dims a little.
  float inFocus = aa(sdBox(p, fC, fH, 0.006));
  col = mix(col, col * 0.5, lk * (1.0 - inFocus) * 0.7);
  put(1, aa(sdBox(p, c, hf, 0.006)), col);

  // ---- progress dots under the window ----
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    if (fi >= n) break;
    float on = float(i == k);
    vec2 dc = vec2(c.x + (fi - (n - 1.0) * 0.5) * 0.05, c.y - hf.y - 0.03);
    box(1, dc, vec2(mix(0.006, 0.018, on), 0.0038), 0.0038, cMute, 1.0);
    float fill = on * clamp(u / SHOT_D, 0.0, 1.0);
    box(1, dc - vec2(0.018 * (1.0 - fill), 0.0), vec2(0.018 * fill, 0.0038), 0.0038, cAcc, on);
  }

  // ---- focus brackets ----
  float bk = beat(u, 1.45, 3.95, 0.35);
  vec2 bh = fH + 0.006 + 0.03 * (1.0 - eOut((u - 1.45) / 0.45));
  vec2 lp = at(2) - fC;
  float bd = sdBox(at(2), fC, bh, 0.008);
  float corner = step(bh.x - 0.032, abs(lp.x)) * step(bh.y - 0.032, abs(lp.y));
  put(2, stroke(bd, 0.0024) * corner * bk, cAcc);
  put(1, stroke(sdBox(at(1), fC, fH, 0.006), 0.0012) * bk * 0.55, cAcc);

  // ---- cursor: glides in, clicks on the focus, then rests beside it ----
  float fk = float(k);
  vec2 from = vec2(1.28 - 0.1 * fk, 0.3 + 0.05 * fk);
  vec2 cp = mix(from, fC + vec2(0.012, -0.012), eInOut((u - 0.85) / 0.75));
  float rp = (u - 1.7) / 0.6;
  ring(1, fC, 0.012 + 0.07 * eOut(rp), 0.0024, cAcc, (1.0 - clamp(rp, 0.0, 1.0)) * step(0.0, rp));

  // ---- loupe: the focus region, magnified, lifts onto the top layer ----
  // At least a third bigger than the region, but never more than about a third of the window.
  vec2 lH = fH * 1.55;
  lH *= min(1.0, min(0.3 / max(lH.x, 1e-3), 0.19 / max(lH.y, 1e-3)));
  float side = fC.x < 0.8 ? 1.0 : -1.0;
  vec2 lT = vec2(fC.x + side * (fH.x + lH.x) * 0.45, fC.y + 0.07);
  lT = clamp(lT, vec2(lH.x + 0.04, 0.25 + lH.y), vec2(1.55 - lH.x, 0.95 - lH.y));
  vec2 lc = mix(fC, lT, eBack(lk));
  vec2 lh = mix(fH, lH, eOut(lk));
  vec2 p2 = at(2);
  vec2 ll = (p2 - lc) / max(lh, vec2(1e-3));
  vec3 lcol = shotTexel(k, f.xy + vec2(ll.x * 0.5 + 0.5, 0.5 - ll.y * 0.5) * f.zw);
  for (int i = 0; i < 4; i++) {
    vec2 sg = vec2(i == 0 || i == 2 ? -1.0 : 1.0, i < 2 ? -1.0 : 1.0);
    line(1, fC + fH * sg, lc + lh * sg, 0.0007, cAcc, lk * 0.55);
  }
  panel(2, lc, lh + 0.005, 0.014, cPanel, lk);
  put(2, aa(sdBox(p2, lc, lh, 0.01)) * lk, mix(cPanel, lcol, uReady));
  put(2, stroke(sdBox(p2, lc, lh, 0.01), 0.0016) * lk, mix(cAcc, vec3(1.0), 0.35));
  glow(2, lc + vec2(0.0, lh.y), lh.x * 0.6, cAcc, lk * 0.25);

  cursor(2, cp, vec3(0.98), beat(u, 0.55, 4.15, 0.3));
}
`;
