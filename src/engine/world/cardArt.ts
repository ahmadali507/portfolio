import {
  CanvasTexture,
  Color,
  LinearMipmapLinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';
import { SCENES_GLSL } from '../shaders/scenes';

export interface CardData {
  slug: string;
  title: string;
  kind: string;
  index: number;
  pattern: number;
  seed: number;
  base: string;
  line: string;
  accent: string;
}

const fragmentShader = /* glsl */ `
${SCENES_GLSL}

uniform float uScene;
uniform float uSeed;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform sampler2D uLabel;
varying vec2 vUv;

void main() {
  vec2 p = vec2(vUv.x * 1.6, vUv.y);
  // The motion graphic plays in the upper four fifths; the name sits in a strip below it.
  vec2 q = (p - vec2(0.16, 0.2)) / 0.8;
  vec3 col = uBase;
  if (q.y > 0.0) col = scene(uScene, q, uTime, uBase, uInk, uAccent, uSeed);
  col = mix(col, uInk, gFill(abs(p.y - 0.2) - 0.0012) * 0.35 * step(0.07, p.x) * step(p.x, 1.53));
  col = mix(col, uInk, texture2D(uLabel, vUv).a);
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

/** The card's name and number, drawn once with the site fonts. White on transparent; the shader inks it. */
function drawLabel(d: CardData, width: number, height: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  if (g) {
    const u = height / 640;
    g.fillStyle = '#fff';
    g.textBaseline = 'middle';
    g.font = `700 ${64 * u}px 'Familjen Grotesk', sans-serif`;
    g.fillText(d.title, 46 * u, height - 62 * u);
    g.font = `400 ${22 * u}px 'Commit Mono', monospace`;
    g.textAlign = 'right';
    g.fillText(`${String(d.index + 1).padStart(2, '0')}  ${d.kind.toUpperCase()}`, width - 46 * u, height - 60 * u);
  }
  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  return tex;
}

/**
 * One card face: a live motion graphic rendered into a texture each frame it is on screen.
 * Rendering stays on the GPU (one small full-screen pass), so nothing is uploaded per frame.
 */
export class CardArt {
  readonly target: WebGLRenderTarget;
  private readonly material: ShaderMaterial;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly geometry = new PlaneGeometry(1, 1);
  private readonly label: CanvasTexture;

  constructor(renderer: WebGLRenderer, d: CardData, width: number, height: number) {
    // Mipmaps keep fine strokes smooth when a card is small or seen at an angle.
    this.target = new WebGLRenderTarget(width, height, {
      depthBuffer: false,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
    });
    this.target.texture.colorSpace = SRGBColorSpace;
    this.target.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    this.label = drawLabel(d, width, height);
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uScene: { value: d.pattern },
        uSeed: { value: d.seed },
        uTime: { value: 0 },
        uBase: { value: new Color(d.base) },
        uInk: { value: new Color(d.line) },
        uAccent: { value: new Color(d.accent) },
        uLabel: { value: this.label },
      },
    });
    this.scene.add(new Mesh(this.geometry, this.material));
  }

  render(renderer: WebGLRenderer, time: number): void {
    this.material.uniforms.uTime!.value = time;
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(previous);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.label.dispose();
    this.target.dispose();
  }
}
