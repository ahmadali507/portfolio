// Liquid splash: the pointer leaves a fluid trail that inverts the page beneath it.
// A quarter-resolution mask is fed back each frame (diffuse, creep, decay) with the pointer's path
// stamped in, then thresholded at full resolution into gooey shapes. The canvas is blended with
// `mix-blend-mode: difference`, so type, cards, and header all flip inside the splash.
// Raw WebGL2 on its own small context: two draw calls a frame while a trail is alive, zero at rest.
// Off under reduced motion. Decorative: aria-hidden, pointer-events none.

import type { MotionCore } from './core';
import { motion } from './state';

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}`;

const SIM = `#version 300 es
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform float uAspect;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uStrength;
uniform float uDecay;
uniform float uTime;
in vec2 vUv;
out vec4 frag;
${NOISE}
void main() {
  // The liquid creeps: the previous mask is read through a slow, small flow field.
  vec2 flow = vec2(noise(vUv * 5.0 + uTime * 0.25), noise(vUv * 5.0 + 9.0 - uTime * 0.25)) - 0.5;
  vec2 uv = vUv + flow * 0.006;
  float c = texture(uPrev, uv).r;
  float n = texture(uPrev, uv + vec2(uTexel.x, 0.0)).r + texture(uPrev, uv - vec2(uTexel.x, 0.0)).r
          + texture(uPrev, uv + vec2(0.0, uTexel.y)).r + texture(uPrev, uv - vec2(0.0, uTexel.y)).r;
  float prev = max(mix(c, n * 0.25, 0.18) - uDecay, 0.0);

  // Stamp the pointer's path since the last frame as one soft capsule.
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 a = vec2(uA.x * uAspect, uA.y);
  vec2 b = vec2(uB.x * uAspect, uB.y);
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(pa - ba * h);
  float s = smoothstep(uRadius, uRadius * 0.2, d) * uStrength;

  frag = vec4(max(prev, s), 0.0, 0.0, 1.0);
}`;

const DRAW = `#version 300 es
precision highp float;
uniform sampler2D uMask;
uniform float uAspect;
uniform float uTime;
in vec2 vUv;
out vec4 frag;
${NOISE}
void main() {
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  // Wobble the edge so it reads as liquid, not as a blurred circle.
  float wob = (noise(q * 3.2 + uTime * 0.35) - 0.5) + (noise(q * 9.0 - uTime * 0.5) - 0.5) * 0.4;
  float m = texture(uMask, vUv).r;
  float a = smoothstep(0.485, 0.5, m + wob * 0.34 * smoothstep(0.08, 0.4, m));
  // Silk: soft folds inside the splash, so the inverted area has body.
  float fold = sin((q.x * 1.4 + q.y * 0.8 + noise(q * 1.8 + uTime * 0.1) * 1.6) * 13.0) * 0.5 + 0.5;
  float v = 1.0 - 0.07 * fold * fold;
  frag = vec4(vec3(v) * a, a);
}`;

const SCALE = 4;
const LIFE = 6;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
  return sh;
}

function program(gl: WebGL2RenderingContext, frag: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  return p;
}

export function initLiquid(canvas: HTMLCanvasElement, core: MotionCore): void {
  if (canvas.dataset.ready) return;
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl) return;
  canvas.dataset.ready = '1';

  const sim = program(gl, SIM);
  const draw = program(gl, DRAW);
  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const su = {
    prev: U(sim, 'uPrev'),
    texel: U(sim, 'uTexel'),
    aspect: U(sim, 'uAspect'),
    a: U(sim, 'uA'),
    b: U(sim, 'uB'),
    radius: U(sim, 'uRadius'),
    strength: U(sim, 'uStrength'),
    decay: U(sim, 'uDecay'),
    time: U(sim, 'uTime'),
  };
  const du = { mask: U(draw, 'uMask'), aspect: U(draw, 'uAspect'), time: U(draw, 'uTime') };

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const tex: WebGLTexture[] = [gl.createTexture()!, gl.createTexture()!];
  const fbo: WebGLFramebuffer[] = [gl.createFramebuffer()!, gl.createFramebuffer()!];
  let sw = 1;
  let sh = 1;
  let cur = 0;

  const allocate = (w: number, h: number): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(2, Math.round(w * dpr));
    canvas.height = Math.max(2, Math.round(h * dpr));
    sw = Math.max(2, Math.round(w / SCALE));
    sh = Math.max(2, Math.round(h / SCALE));
    for (let i = 0; i < 2; i++) {
      gl.bindTexture(gl.TEXTURE_2D, tex[i]!);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]!);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex[i]!, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let resizePending = true;
  new ResizeObserver((entries) => {
    const r = entries[entries.length - 1]?.contentRect;
    if (!r) return;
    vw = Math.max(1, r.width);
    vh = Math.max(1, r.height);
    resizePending = true;
  }).observe(canvas);

  // Pointer state. Events only store targets; the frame consumes them.
  let tx = 0.5;
  let ty = 0.5;
  let x = 0.5;
  let y = 0.5;
  let px = 0.5;
  let py = 0.5;
  let has = false;
  let lastInput = -100;
  let burst = 0;
  let dead = false;
  let wasAlive = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      tx = e.clientX / vw;
      ty = 1 - e.clientY / vh;
      if (!has) {
        x = px = tx;
        y = py = ty;
        has = true;
      }
      lastInput = performance.now() / 1000;
    },
    { passive: true },
  );
  // Touch gets one splash per tap; a press with the mouse adds a larger one.
  window.addEventListener(
    'pointerdown',
    (e) => {
      tx = e.clientX / vw;
      ty = 1 - e.clientY / vh;
      if (e.pointerType === 'touch' || !has) {
        x = px = tx;
        y = py = ty;
        has = true;
      }
      burst = 1;
      lastInput = performance.now() / 1000;
    },
    { passive: true },
  );
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    dead = true;
    canvas.style.display = 'none';
  });

  core.addFrame((time, deltaMs) => {
    if (dead || motion.reduced) return;
    const now = performance.now() / 1000;
    const alive = now - lastInput < LIFE;
    if (!alive) {
      if (wasAlive) {
        // Trail fully faded: clear once, then cost nothing until the pointer moves again.
        allocate(vw, vh);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        wasAlive = false;
      }
      return;
    }
    wasAlive = true;
    if (resizePending) {
      resizePending = false;
      allocate(vw, vh);
    }
    const dt = Math.min(deltaMs / 1000, 1 / 15);
    const k = 1 - Math.exp(-14 * dt);
    px = x;
    py = y;
    x += (tx - x) * k;
    y += (ty - y) * k;
    const aspect = vw / vh;
    const speed = Math.hypot((x - px) * aspect, y - py) / Math.max(dt, 1e-4);
    const radius = 0.1 + Math.min(speed * 0.05, 0.11) + burst * 0.12;
    const moving = speed > 0.02 || burst > 0;

    // Simulation step into the other buffer.
    const next = 1 - cur;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[next]!);
    gl.viewport(0, 0, sw, sh);
    gl.useProgram(sim);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex[cur]!);
    gl.uniform1i(su.prev, 0);
    gl.uniform2f(su.texel, 1 / sw, 1 / sh);
    gl.uniform1f(su.aspect, aspect);
    gl.uniform2f(su.a, px, py);
    gl.uniform2f(su.b, x, y);
    gl.uniform1f(su.radius, radius);
    gl.uniform1f(su.strength, moving ? 1 : 0);
    // 8-bit mask: the decay step must stay at or above one level, or the trail would never clear.
    gl.uniform1f(su.decay, Math.max(0.24 * dt, 1 / 255));
    gl.uniform1f(su.time, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cur = next;
    burst = 0;

    // Draw to the screen.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(draw);
    gl.bindTexture(gl.TEXTURE_2D, tex[cur]!);
    gl.uniform1i(du.mask, 0);
    gl.uniform1f(du.aspect, aspect);
    gl.uniform1f(du.time, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
}
