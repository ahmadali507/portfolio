// Card finishes for the featured projects. Shared by the 3D cards, the WebGL plates,
// and the SVG fallbacks, so a project looks the same wherever it appears.
// `base` is the card body, `line` the linework drawn on it, `accent` the one live element.

export interface Tone {
  name: 'porcelain' | 'vermilion' | 'graphite' | 'pearl' | 'obsidian';
  base: string;
  line: string;
  accent: string;
}

export const TONES: readonly Tone[] = [
  { name: 'porcelain', base: '#f2f2f0', line: '#1b1d1e', accent: '#e2401c' },
  { name: 'vermilion', base: '#e2401c', line: '#fff4ef', accent: '#16181a' },
  { name: 'graphite', base: '#25282a', line: '#ededeb', accent: '#e2401c' },
  { name: 'pearl', base: '#c9ccc9', line: '#1b1d1e', accent: '#d43a18' },
  { name: 'obsidian', base: '#121416', line: '#ededeb', accent: '#e2401c' },
];

export const toneFor = (index: number): Tone => TONES[index % TONES.length]!;
