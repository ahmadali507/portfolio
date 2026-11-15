// Single source for identity, contact, and launch switches.
// Facts here must match docs/CONTENT.md. `npm run prelaunch` fails while any
// `placeholder: true`, the surname placeholder, or DRAFT_PREVIEW = true remains.

/** Replace with the real surname. This is the only place it is set. */
export const SURNAME = '[Surname]';

export const FIRST_NAME = 'Ahmad';
export const FULL_NAME = `${FIRST_NAME} ${SURNAME}`;

/**
 * While true, every project in the collection renders, including entries that are
 * not yet approved in docs/CONTENT.md. Local drafts only. Must be false at launch,
 * after which a project renders only when `public: true` and its CONTENT.md row is approved.
 */
export const DRAFT_PREVIEW = true;

export const SITE = {
  /** Production origin. Placeholder until a domain is chosen. */
  url: { value: 'https://ahmad.example', placeholder: true },
  title: `${FULL_NAME}, software engineer`,
  description:
    'Ahmad is a software engineer in Islamabad who ships AI systems into production for paying clients. Co-founder of OnePercent Technologies.',
  locale: 'en',
} as const;

export const PERSON = {
  role: 'Software engineer',
  location: 'Islamabad, Pakistan',
  education: 'BS Software Engineering, NUST Islamabad, class of 2026',
  company: 'OnePercent Technologies',
  companyLine:
    'Co-founder of OnePercent Technologies, an AI and software agency serving clients in the US, UK, and Middle East.',
  companyRole: 'Leads AI automation and SaaS development.',
  freelance: 'Top Rated on Upwork, with 38+ clients. Started there as a freelancer before co-founding the agency.',
  positioning: 'I ship AI systems into production for paying clients.',
  direction: 'Moving toward deep learning engineering, on foundations in ML mathematics and formal methods.',
} as const;

export interface ContactHandle {
  label: string;
  handle: string;
  href: string;
  placeholder: boolean;
}

/** Contact handles. Every value is a placeholder until docs/CONTENT.md approves it. */
export const CONTACT: readonly ContactHandle[] = [
  { label: 'Email', handle: 'hello@ahmad.example', href: 'mailto:hello@ahmad.example', placeholder: true },
  { label: 'GitHub', handle: 'github.com/ahmad-handle', href: '#', placeholder: true },
  { label: 'LinkedIn', handle: 'linkedin.com/in/ahmad-handle', href: '#', placeholder: true },
  { label: 'Upwork', handle: 'upwork.com/freelancers/ahmad-handle', href: '#', placeholder: true },
];

export const NAV = [
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
