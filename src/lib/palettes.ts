// Per-project palettes and scene ids for the motion graphics. Colors are taken from each product's
// own interface (Drive screenshots, read 2026-11-19), then adjusted to sit on the site's dark ground.
// Indigo and violet primaries are swapped for blue or amber, per DESIGN.md bans.
// Shared by the 3D card faces, the WebGL plates, and the SVG fallbacks.

export interface Palette {
  /** Scene id in src/engine/shaders/scenes.ts. */
  scene: number;
  /** Two-word kind printed on the card. */
  kind: string;
  bg: string;
  bg2: string;
  panel: string;
  ink: string;
  mute: string;
  acc: string;
  acc2: string;
}

const P = (
  scene: number,
  kind: string,
  bg: string,
  bg2: string,
  panel: string,
  ink: string,
  mute: string,
  acc: string,
  acc2: string,
): Palette => ({ scene, kind, bg, bg2, panel, ink, mute, acc, acc2 });

export const PALETTES: Record<string, Palette> = {
  'magicalbook-store': P(1, 'AI storybooks', '#f6f0e6', '#e9dfcf', '#fffaf2', '#1f2430', '#8a8478', '#f2994a', '#2f9e74'),
  vakse: P(2, 'Procurement', '#0b1622', '#06101a', '#13263a', '#e8eef5', '#6f8399', '#34d399', '#4ea1ff'),
  codesmash: P(3, 'Coding battles', '#0a0a0a', '#000000', '#141416', '#ededed', '#5b5b63', '#3b82f6', '#22c55e'),
  shocodoc: P(4, 'Live documents', '#0b1120', '#060a14', '#111a2e', '#e2e8f0', '#5b6b86', '#3b82f6', '#93c5fd'),
  menumatch: P(5, 'QR menus', '#f4f5f7', '#e6e8ec', '#ffffff', '#111827', '#9aa3b2', '#3b82f6', '#f59e0b'),
  taxlens: P(6, 'Civic data', '#0a1f17', '#051209', '#123224', '#e6f2ec', '#5f8a75', '#22c55e', '#facc15'),
  prepify: P(7, 'Mock interviews', '#0a0b1e', '#05061a', '#141833', '#e2e8f0', '#5d6790', '#60a5fa', '#f59e0b'),
  echosign: P(8, 'Sign to speech', '#ffffff', '#eef1f4', '#f3f4f6', '#111111', '#9ca3af', '#2ee39a', '#111111'),
  searchx: P(9, 'Search engine', '#0d1117', '#06090e', '#161b22', '#e6edf3', '#5b6573', '#58a6ff', '#f0883e'),
  'scrape-stripe': P(10, 'Data pipeline', '#0a1020', '#050812', '#121a33', '#e2e8f0', '#5a6782', '#4285f4', '#34d399'),
  hundredpov: P(11, 'Live streams', '#0f0f12', '#08080a', '#1c1c21', '#f5f5f5', '#62626b', '#f5b60a', '#e53935'),
  waynaa: P(12, 'Local discovery', '#0e1a24', '#07111a', '#13263a', '#e6eef5', '#56708a', '#ff7a59', '#ffd166'),
  xiomara: P(13, 'Content platform', '#16120e', '#0c0906', '#241d16', '#f5ede4', '#7c6d5e', '#e2401c', '#f2c14e'),
  orderlyflow: P(14, 'Mobile app', '#101418', '#080b0e', '#1a2026', '#e9eef2', '#5d6872', '#2dd4bf', '#f59e0b'),
};

const FALLBACK: Palette = P(14, 'Project', '#101418', '#080b0e', '#1a2026', '#e9eef2', '#5d6872', '#2dd4bf', '#f59e0b');

export const paletteFor = (slug: string): Palette => PALETTES[slug] ?? FALLBACK;
