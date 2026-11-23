import data from '../data/shots.json';

/** One prepared screenshot (see scripts/project-shots.mjs). */
export interface Shot {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Where the shot sits inside its atlas cell: x, y, w, h as fractions of the cell. */
  cell: [number, number, number, number];
  /** The region the motion graphic lifts out: x, y, w, h as fractions of the shot, y down. */
  focus: [number, number, number, number];
}

const SHOTS = data as unknown as Record<string, Shot[]>;

export function shotsFor(slug: string): Shot[] {
  return SHOTS[slug] ?? [];
}

export function atlasFor(slug: string): string {
  return `/projects/${slug}/atlas.webp`;
}

/** A short name for what each screenshot shows, read out by the spotlight label. Same order as shots.json. */
const LABELS: Record<string, readonly string[]> = {
  'magicalbook-store': ['The cover', 'The reader', 'Art styles'],
  codesmash: ['The battle', 'The lobby', 'Results'],
  shocodoc: ['Live comments', 'Your documents'],
  menumatch: ['The dashboard', 'Menu builder', 'Themes'],
  prepify: ['Start here', 'Interviews', 'Progress'],
  echosign: ['Start here', 'Sign to text', 'Text to voice'],
  hundredpov: ['Live now', 'Streams', 'Match lobby'],
};

export function labelFor(slug: string, index: number): string {
  return LABELS[slug]?.[index] ?? 'Detail';
}
