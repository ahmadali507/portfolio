import {
  Color,
  LinearMipmapLinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';
import { PATTERNS_GLSL } from '../shaders/patterns';

/** Renders a card face once into a texture: relief shading, contour lines, and a fine inset rule. */
const fragmentShader = /* glsl */ `
${PATTERNS_GLSL}

uniform float uPattern;
uniform float uSeed;
uniform vec3 uBase;
uniform vec3 uLine;
uniform vec2 uAspect;
varying vec2 vUv;

void main() {
  vec2 p = (vUv * 2.0 - 1.0);
  float h = pattern(uPattern, p, uSeed);
  vec2 e = vec2(0.004, 0.0);
  float hx = pattern(uPattern, p + e.xy, uSeed) - h;
  float hy = pattern(uPattern, p + e.yx, uSeed) - h;
  vec3 n = normalize(vec3(-hx * 18.0, -hy * 18.0, 1.0));
  float light = dot(n, normalize(vec3(-0.4, 0.5, 0.8))) * 0.5 + 0.5;

  vec3 col = uBase * mix(0.9, 1.06, light);

  float level = h / 0.07;
  float w = fwidth(level);
  float line = 1.0 - smoothstep(0.0, w * 1.3, abs(fract(level - 0.5) - 0.5));
  // Where contours crowd closer than a few pixels, fade them out instead of letting them alias.
  line *= 1.0 - smoothstep(0.18, 0.45, w);
  col = mix(col, uLine, line * 0.85);

  // Inset rule: a hairline frame a little inside the card edge.
  vec2 q = abs(vUv - 0.5) * uAspect;
  vec2 lim = 0.5 * uAspect - 0.055;
  float frame = max(q.x - lim.x, q.y - lim.y);
  float rule = 1.0 - smoothstep(0.0, 0.004, abs(frame));
  col = mix(col, uLine, rule * 0.7);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

export function renderCardArt(
  renderer: WebGLRenderer,
  pattern: number,
  seed: number,
  base: string,
  line: string,
  width = 1024,
  height = 640,
): WebGLRenderTarget {
  // Mipmaps keep the fine contours smooth when a card is small or seen at an angle.
  const target = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
  });
  // Stored as sRGB so the 8-bit target keeps precision in the darks; sampling decodes it.
  target.texture.colorSpace = SRGBColorSpace;
  target.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPattern: { value: pattern },
      uSeed: { value: seed },
      uBase: { value: new Color(base) },
      uLine: { value: new Color(line) },
      uAspect: { value: new Vector2(width / height, 1) },
    },
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(1, 1);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(previous);

  geometry.dispose();
  material.dispose();
  return target;
}
