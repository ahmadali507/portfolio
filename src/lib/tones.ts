// Card finishes for the featured projects. Shared by the 3D cards, the WebGL plates,
// and the SVG fallbacks, so a project looks the same wherever it appears.
// `base` is the card body; `line` is the contour ink drawn on it. Chosen to read on a dark ground.

export interface Tone {
  name: 'porcelain' | 'vermilion' | 'graphite' | 'pearl' | 'obsidian';
  base: string;
  line: string;
}

export const TONES: readonly Tone[] = [
  { name: 'porcelain', base: '#f2f2f0', line: '#8a8f8d' },
  { name: 'vermilion', base: '#e2401c', line: '#f7b9a8' },
  { name: 'graphite', base: '#2e3133', line: '#8e9396' },
  { name: 'pearl', base: '#c9ccc9', line: '#7f8482' },
  { name: 'obsidian', base: '#16181a', line: '#7d8285' },
];

export const toneFor = (index: number): Tone => TONES[index % TONES.length]!;
