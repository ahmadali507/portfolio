import { SRGBColorSpace, TextureLoader, Vector4, type Texture } from 'three';
import { atlasFor, shotsFor } from '../../lib/shots';

interface Entry {
  texture: Texture;
  refs: number;
  ready: boolean;
}

const cache = new Map<string, Entry>();
const loader = new TextureLoader();

/** True when the project has screenshots, so its graphic plays over them. */
export function hasShots(slug: string): boolean {
  return shotsFor(slug).length > 0;
}

/** The project's atlas, shared by every card and cover that shows it. Pair with releaseAtlas. */
export function acquireAtlas(slug: string): Texture {
  let entry = cache.get(slug);
  if (!entry) {
    const created: Entry = { texture: null as unknown as Texture, refs: 0, ready: false };
    created.texture = loader.load(atlasFor(slug), () => {
      created.ready = true;
    });
    created.texture.colorSpace = SRGBColorSpace;
    created.texture.anisotropy = 8;
    cache.set(slug, created);
    entry = created;
  }
  entry.refs++;
  return entry.texture;
}

export function atlasReady(slug: string): boolean {
  return cache.get(slug)?.ready ?? false;
}

export function releaseAtlas(slug: string): void {
  const entry = cache.get(slug);
  if (!entry) return;
  entry.refs--;
  if (entry.refs <= 0) {
    entry.texture.dispose();
    cache.delete(slug);
  }
}

/** Uniforms for SHOTS_GLSL. The texture is acquired here; release it when the material goes. */
export function shotUniforms(slug: string): Record<string, { value: unknown }> {
  const shots = shotsFor(slug);
  const cell: Vector4[] = [];
  const focus: Vector4[] = [];
  for (let i = 0; i < 3; i++) {
    const s = shots[Math.min(i, shots.length - 1)]!;
    cell.push(new Vector4(...s.cell));
    focus.push(new Vector4(...s.focus));
  }
  return {
    uAtlas: { value: acquireAtlas(slug) },
    uShotN: { value: shots.length },
    uReady: { value: 0 },
    uCell: { value: cell },
    uFocus: { value: focus },
  };
}
