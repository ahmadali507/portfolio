// Build-time project helpers. Runs in Node during `astro build`, never in the browser.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { DRAFT_PREVIEW } from '@/config/site';
import { toneFor, TONES, type Tone } from './tones';

export type Project = CollectionEntry<'projects'>;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Reads the "Candidate projects" table in docs/CONTENT.md, the only source of approval.
 * A project is approved when its last column starts with "Approved".
 */
function readApprovals(): Set<string> {
  const approved = new Set<string>();
  let text: string;
  try {
    text = readFileSync(join(process.cwd(), 'docs', 'CONTENT.md'), 'utf8');
  } catch {
    return approved;
  }
  const section = text.split('## Candidate projects')[1]?.split('\n## ')[0] ?? '';
  for (const line of section.split('\n')) {
    if (!line.startsWith('|') || /^\|\s*-/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim());
    const name = cells[1] ?? '';
    const approval = cells[5] ?? '';
    if (/^approved\b/i.test(approval)) approved.add(normalize(name.split(/[:(]/)[0] ?? name));
  }
  return approved;
}

const approvals = readApprovals();

export const isApproved = (p: Project): boolean => approvals.has(normalize(p.data.title));

/** CLAUDE.md content rule 5, with the local draft switch from src/config/site.ts. */
export const isVisible = (p: Project): boolean => DRAFT_PREVIEW || (p.data.public && isApproved(p));

const byOrder = (a: Project, b: Project) => a.data.order - b.data.order;

export async function visibleProjects(): Promise<{ featured: Project[]; others: Project[]; all: Project[] }> {
  const entries = (await getCollection('projects')).filter(isVisible);
  const featured = entries.filter((p) => p.data.featured).sort(byOrder);
  const others = entries.filter((p) => !p.data.featured).sort(byOrder);
  return { featured, others, all: [...featured, ...others] };
}

/** True when any field on the entry still holds dummy data. */
export const hasPlaceholders = (p: Project): boolean => {
  const d = p.data;
  return (
    d.placeholder ||
    d.media.placeholder ||
    d.links.some((l) => l.placeholder) ||
    [d.summary, d.status, d.role, d.year, d.stack, d.problem, d.outcome].some((f) => f.placeholder)
  );
};

export const STATUS_LABEL = {
  'in-progress': 'In progress',
  shipped: 'Shipped',
  archived: 'Archived',
  proposal: 'Proposal',
} as const;

/**
 * Generative cover pattern per project, shared by the WebGL field, the WebGL covers, and the
 * SVG fallback (src/lib/patterns.ts). Visual identity only; it makes no claim about the project.
 */
const PATTERN_BY_SLUG: Record<string, number> = {
  shocodoc: 1,
  'docuchat-ai': 2,
  xiomara: 3,
  'voice-transfer-system': 4,
  'magicalbook-store': 5,
  prepify: 6,
  'scrape-stripe': 8,
  cricping: 7,
  'ai-interviewer': 7,
  eapo: 7,
  orderlyflow: 7,
  'spiking-mamba': 9,
};

/** Two or three words for the card's corner label, taken from the one-line summaries. */
const KIND_BY_SLUG: Record<string, string> = {
  shocodoc: 'Collaborative editor',
  'docuchat-ai': 'Document Q&A',
  xiomara: 'Content platform',
  'voice-transfer-system': 'Call routing',
  'magicalbook-store': 'Storybooks',
};

export const kindFor = (p: Project): string => KIND_BY_SLUG[p.id] ?? 'Project';

export const patternFor = (p: Project): number => {
  const fixed = PATTERN_BY_SLUG[p.id];
  if (fixed !== undefined) return fixed;
  return 6;
};

/** Stable 0..1 seed per project, so variants of a shared pattern differ. */
export const seedFor = (p: Project): number => {
  let h = 2166136261;
  for (const ch of p.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return (h % 1000) / 1000;
};


/** Card finish: featured projects take the fixed sequence; the rest alternate the light finishes. */
export const toneForProject = (p: Project, featured: Project[]): Tone => {
  const i = featured.findIndex((f) => f.id === p.id);
  if (i >= 0) return toneFor(i);
  return seedFor(p) > 0.5 ? TONES[1]! : TONES[4]!;
};

export { toneFor };
