import {
  CanvasTexture,
  GLSL3,
  LinearMipmapLinearFilter,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { SCENES_GLSL } from '../shaders/scenes';
import { PALETTE_GLSL, paletteUniforms, type Palette } from './palette';

export interface CardData {
  slug: string;
  title: string;
  index: number;
  seed: number;
  palette: Palette;
}

/**
 * Card faces in three depth layers, written in one pass to three color attachments:
 *   0 ground (opaque, sRGB)  1 surfaces (premultiplied, linear)  2 lift (premultiplied, linear)
 * Showcase maps layer 0 onto the card and floats layers 1 and 2 above it on their own planes.
 */
const fragmentShader = /* glsl */ `
precision highp float;
layout(location = 0) out vec4 oGround;
layout(location = 1) out vec4 oSurface;
layout(location = 2) out vec4 oLift;

${SCENES_GLSL}
${PALETTE_GLSL}

uniform float uTime;
uniform float uSeed;
uniform sampler2D uLabel;
in vec2 vUv;

void main() {
  gP = vec2(vUv.x * 1.6, vUv.y);
  gPar = vec2(0.0);
  gL0 = vec4(0.0);
  gL1 = vec4(0.0);
  gL2 = vec4(0.0);
  usePalette();
  runScene(mod(uTime + uSeed * 10.0, 10.0));
  // The project's name floats on the top layer, so it has the most depth when the layers part.
  float lab = texture(uLabel, vUv).a;
  put(2, lab, mix(cInk, cBg, 0.0));
  // Attachment 0 is SRGB8_ALPHA8, so the hardware encodes on write: output stays linear.
  oGround = vec4(gL0.rgb, 1.0);
  oSurface = gL1;
  oLift = gL2;
}
`;

const vertexShader = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

/** Name and kind along the bottom of the card, drawn once with the site fonts. */
function drawLabel(d: CardData, width: number, height: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  if (g) {
    const u = height / 640;
    g.fillStyle = '#fff';
    g.textBaseline = 'middle';
    g.font = `700 ${58 * u}px 'Familjen Grotesk', sans-serif`;
    g.fillText(d.title, 50 * u, height - 64 * u);
    g.font = `400 ${21 * u}px 'Commit Mono', monospace`;
    g.textAlign = 'right';
    g.fillText(`${String(d.index + 1).padStart(2, '0')}  ${d.palette.kind.toUpperCase()}`, width - 50 * u, height - 62 * u);
  }
  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  return tex;
}

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
      count: 3,
      depthBuffer: false,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
    });
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    this.target.textures.forEach((tex, i) => {
      tex.colorSpace = i === 0 ? SRGBColorSpace : NoColorSpace;
      tex.anisotropy = aniso;
    });
    this.label = drawLabel(d, width, height);
    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader,
      defines: { SCENE: d.palette.scene },
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: d.seed },
        uLabel: { value: this.label },
        ...paletteUniforms(d.palette),
      },
    });
    this.scene.add(new Mesh(this.geometry, this.material));
  }

  /** Layer textures: 0 ground, 1 surfaces, 2 lift. */
  layer(i: 0 | 1 | 2): Texture {
    return this.target.textures[i]!;
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
