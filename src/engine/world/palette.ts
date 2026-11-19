import { Color } from 'three';
import type { Palette } from '../../lib/palettes';

export type { Palette };

/** GLSL uniform declarations and the assignment into the drawing kit's palette globals. */
export const PALETTE_GLSL = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uBg2;
uniform vec3 uPanel;
uniform vec3 uInk;
uniform vec3 uMute;
uniform vec3 uAcc;
uniform vec3 uAcc2;
void usePalette() {
  cBg = uBg; cBg2 = uBg2; cPanel = uPanel; cInk = uInk; cMute = uMute; cAcc = uAcc; cAcc2 = uAcc2;
}
`;

const KEYS = ['bg', 'bg2', 'panel', 'ink', 'mute', 'acc', 'acc2'] as const;
const NAMES = ['uBg', 'uBg2', 'uPanel', 'uInk', 'uMute', 'uAcc', 'uAcc2'] as const;

export function paletteUniforms(p: Palette): Record<string, { value: Color }> {
  const out: Record<string, { value: Color }> = {};
  KEYS.forEach((k, i) => (out[NAMES[i]!] = { value: new Color(p[k]) }));
  return out;
}
