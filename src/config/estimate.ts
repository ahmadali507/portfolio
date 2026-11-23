// The estimate calculator. Questions, prices, and the formula are taken from the estimate page of
// the OnePercent Technologies site (docs/CONTENT.md, row "Estimate"), so both sites quote the same
// range for the same answers. Prices are in US dollars.

export interface Option {
  id: string;
  label: string;
  hint: string;
  price?: number;
}

export const TYPES: readonly Option[] = [
  { id: 'new', label: 'New build', hint: 'Starting from scratch', price: 4000 },
  { id: 'redesign', label: 'Redesign', hint: 'Rework an existing product', price: 2500 },
  { id: 'extend', label: 'Add to existing', hint: 'New features on a live app', price: 1500 },
];

export const PLATFORMS: readonly Option[] = [
  { id: 'web', label: 'Web app', hint: 'Runs in the browser, on any device' },
  { id: 'mobile', label: 'Mobile app', hint: 'iOS and Android, released to the stores', price: 2500 },
  { id: 'backend', label: 'Backend or API', hint: 'Server, database and business logic', price: 3000 },
];

/** Price per screen. */
export const DESIGN: readonly Option[] = [
  { id: 'design', label: 'Yes, design it', hint: 'UX, UI and a clickable prototype for every screen', price: 450 },
  { id: 'spec', label: 'No, build to spec', hint: 'You bring finished designs', price: 250 },
];

export const INTEGRATIONS: readonly Option[] = [
  { id: 'db', label: 'Database', hint: 'Supabase, Postgres or similar', price: 800 },
  { id: 'auth', label: 'Auth and accounts', hint: 'Sign-up, login, roles', price: 900 },
  { id: 'billing', label: 'Stripe billing', hint: 'Subscriptions and invoices', price: 1400 },
  { id: 'connect', label: 'Stripe Connect', hint: 'Marketplace payouts', price: 2800 },
  { id: 'email', label: 'Email and notifications', hint: 'Transactional email, push', price: 500 },
  { id: 'cms', label: 'CMS', hint: 'Content your team edits', price: 1200 },
  { id: 'maps', label: 'Maps and location', hint: 'Search, routes, geofencing', price: 1000 },
  { id: 'realtime', label: 'Realtime and chat', hint: 'Live updates, messaging', price: 1800 },
  { id: 'analytics', label: 'Analytics', hint: 'Events, funnels, dashboards', price: 400 },
  { id: 'api', label: 'Other API', hint: 'Any third-party service', price: 900 },
];

export const AI: readonly Option[] = [
  { id: 'chat', label: 'AI chat or assistant', hint: 'Conversational help inside your product', price: 2500 },
  { id: 'rag', label: 'Knowledge base search', hint: 'Answers from your own documents, with sources', price: 4000 },
  { id: 'agent', label: 'AI agent or automation', hint: 'Takes actions across your tools', price: 4500 },
  { id: 'vision', label: 'Vision and image AI', hint: 'Reads, sorts or generates images', price: 3000 },
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
  const weeks = base / 3500 / (rush ? 1.45 : 1);
  return {
    low: roundTo(0.9 * total, 500),
    high: roundTo(1.25 * total, 500),
    weeksLow: Math.max(1, Math.round(0.85 * weeks)),
    weeksHigh: Math.max(2, Math.ceil(1.2 * weeks)),
  };
}

/** $4K, $2.5K, $450. */
export const money = (n: number): string => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : `$${n}`);

/** True when enough is answered to send: a project type, a platform, and the design question. */
export const canSend = (a: Answers): boolean => !!a.type && a.platforms.length > 0 && !!a.design;
