// The estimate calculator. The questions and the shape of the formula come from the estimate page
// of the OnePercent Technologies site (docs/CONTENT.md, row "Estimate"). The prices are Ahmad's
// own: about a quarter of the agency's, set on 2026-11-23. Timelines are unchanged. US dollars.

export interface Option {
  id: string;
  label: string;
  hint: string;
  price?: number;
}

export const TYPES: readonly Option[] = [
  { id: 'new', label: 'New build', hint: 'Starting from scratch', price: 1000 },
  { id: 'redesign', label: 'Redesign', hint: 'Rework an existing product', price: 600 },
  { id: 'extend', label: 'Add to existing', hint: 'New features on a live app', price: 400 },
];

export const PLATFORMS: readonly Option[] = [
  { id: 'web', label: 'Web app', hint: 'Runs in the browser, on any device' },
  { id: 'mobile', label: 'Mobile app', hint: 'iOS and Android, released to the stores', price: 600 },
  { id: 'backend', label: 'Backend or API', hint: 'Server, database and business logic', price: 750 },
];

/** Price per screen. */
export const DESIGN: readonly Option[] = [
  { id: 'design', label: 'Yes, design it', hint: 'UX, UI and a clickable prototype for every screen', price: 110 },
  { id: 'spec', label: 'No, build to spec', hint: 'You bring finished designs', price: 60 },
];

export const INTEGRATIONS: readonly Option[] = [
  { id: 'db', label: 'Database', hint: 'Supabase, Postgres or similar', price: 200 },
  { id: 'auth', label: 'Auth and accounts', hint: 'Sign-up, login, roles', price: 225 },
  { id: 'billing', label: 'Stripe billing', hint: 'Subscriptions and invoices', price: 350 },
  { id: 'connect', label: 'Stripe Connect', hint: 'Marketplace payouts', price: 700 },
  { id: 'email', label: 'Email and notifications', hint: 'Transactional email, push', price: 125 },
  { id: 'cms', label: 'CMS', hint: 'Content your team edits', price: 300 },
  { id: 'maps', label: 'Maps and location', hint: 'Search, routes, geofencing', price: 250 },
  { id: 'realtime', label: 'Realtime and chat', hint: 'Live updates, messaging', price: 450 },
  { id: 'analytics', label: 'Analytics', hint: 'Events, funnels, dashboards', price: 100 },
  { id: 'api', label: 'Other API', hint: 'Any third-party service', price: 225 },
];

export const AI: readonly Option[] = [
  { id: 'chat', label: 'AI chat or assistant', hint: 'Conversational help inside your product', price: 600 },
  { id: 'rag', label: 'Knowledge base search', hint: 'Answers from your own documents, with sources', price: 1000 },
  { id: 'agent', label: 'AI agent or automation', hint: 'Takes actions across your tools', price: 1100 },
  { id: 'vision', label: 'Vision and image AI', hint: 'Reads, sorts or generates images', price: 750 },
];

export const TIMELINES: readonly Option[] = [
  { id: 'standard', label: 'Standard', hint: 'A normal weekly cadence' },
  { id: 'rush', label: 'Rush, +30%', hint: 'A compressed schedule with extra people on it' },
];

export const SCREENS = { min: 6, max: 130, start: 15 } as const;
export const SCREEN_PRESETS = [
  { label: 'Landing page', value: 6 },
  { label: 'Small app', value: 15 },
  { label: 'Full product', value: 40 },
  { label: 'Platform', value: 90 },
] as const;

export interface Answers {
  type: string | null;
  platforms: string[];
  screens: number;
  design: string | null;
  integrations: string[];
  ai: string[];
  timeline: string;
}

export interface Estimate {
  low: number;
  high: number;
  weeksLow: number;
  weeksHigh: number;
}

const priceOf = (list: readonly Option[], id: string): number => list.find((o) => o.id === id)?.price ?? 0;
const sum = (list: readonly Option[], ids: readonly string[]): number => ids.reduce((t, id) => t + priceOf(list, id), 0);
const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

/** The price range and timeline for a set of answers, or null until a project type is chosen. */
export function estimate(a: Answers): Estimate | null {
  if (!a.type) return null;
  // Screens are built once per front end. A second front end adds half again.
  const fronts = a.platforms.filter((p) => p !== 'backend').length;
  const perScreen = priceOf(DESIGN, a.design ?? 'spec');
  const screens = fronts ? a.screens * perScreen * (1 + 0.5 * (fronts - 1)) : 0;
  const rush = a.timeline === 'rush';
  const base = priceOf(TYPES, a.type) + sum(PLATFORMS, a.platforms) + screens + sum(INTEGRATIONS, a.integrations) + sum(AI, a.ai);
  const total = base * (rush ? 1.3 : 1);
  // One week of work for every 875 dollars of scope, which keeps the agency's timelines.
  const weeks = base / 875 / (rush ? 1.45 : 1);
  return {
    low: roundTo(0.9 * total, 100),
    high: roundTo(1.25 * total, 100),
    weeksLow: Math.max(1, Math.round(0.85 * weeks)),
    weeksHigh: Math.max(2, Math.ceil(1.2 * weeks)),
  };
}

/** $1K, $2.5K, $450. */
export const money = (n: number): string => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : `$${n}`);

/** True when enough is answered to send: a project type, a platform, and the design question. */
export const canSend = (a: Answers): boolean => !!a.type && a.platforms.length > 0 && !!a.design;
