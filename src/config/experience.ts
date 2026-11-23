// The experience line on the home page, oldest first. Facts come from docs/CONTENT.md (rows
// "Experience"), which records their source: Ahmad's CV and his brief of 2026-11-23. A period with
// a `flag` shows a visible marker and fails prelaunch until the date is confirmed.

export interface Stint {
  id: string;
  when: { value: string; flag: string | null };
  org: string;
  role: string;
  /** One or two short sentences. The page stays light on purpose. */
  summary: string;
}

export const EXPERIENCE: readonly Stint[] = [
  {
    id: 'upwork',
    when: { value: 'To now', flag: 'Start year' },
    org: 'Upwork',
    role: 'Freelance engineer',
    summary: 'Where it started. One brief at a time, shipped alone. Top Rated.',
  },
  {
    id: 'doerz',
    when: { value: '2024 to 2025', flag: 'Verify dates' },
    org: 'Doerz',
    role: 'AI and full-stack engineer',
    summary: 'Fourteen months inside a product team, building AI services real users depend on.',
  },
  {
    id: 'onepercent',
    when: { value: 'To now', flag: 'Start date' },
    org: 'OnePercent',
    role: 'Co-founder',
    summary: 'The freelance practice, turned into an agency. Clients in the US, the UK, and the Middle East.',
  },
];
