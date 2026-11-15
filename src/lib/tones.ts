// Card finishes for the featured projects. Shared by the 3D cards, the WebGL plates,
// and the SVG fallbacks, so a project looks the same wherever it appears.
// `base` is the card body; `line` is the contour ink drawn on it.

export interface Tone {
  name: 'obsidian' | 'porcelain' | 'vermilion' | 'graphite' | 'pearl';
  base: string;
  line: string;
  /** True when text on the card must be light. */
  dark: boolean;
}

export const TONES: readonly Tone[] = [
  { name: 'obsidian', base: '#141516', line: '#7d8285', dark: true },
  { name: 'porcelain', base: '#f6f6f4', line: '#a6aaa8', dark: false },
  { name: 'vermilion', base: '#e2401c', line: '#f7b9a8', dark: true },
  { name: 'graphite', base: '#2b2e30', line: '#8e9396', dark: true },
  { name: 'pearl', base: '#dcdedb', line: '#8f9492', dark: false },
];

export const toneFor = (index: number): Tone => TONES[index % TONES.length]!;
