// Flat finish of a project, derived from its palette (src/lib/palettes.ts). Used where only two or
// three colors are needed: the SVG fallback covers and the CSS around them.
import { paletteFor } from './palettes';

export interface Tone {
  base: string;
  line: string;
  accent: string;
}

export const toneForSlug = (slug: string): Tone => {
  const p = paletteFor(slug);
  return { base: p.bg, line: p.mute, accent: p.acc };
};
