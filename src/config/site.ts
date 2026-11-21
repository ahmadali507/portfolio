// Single source for identity, contact, and launch switches.
// Facts here must match docs/CONTENT.md. `npm run prelaunch` fails while any
// `placeholder: true`, the surname placeholder, or DRAFT_PREVIEW = true remains.

/** The surname, supplied by Ahmad on 2026-11-21. This is the only place it is set. */
export const SURNAME = 'Ali';

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
    'Ahmad is a software engineer and co-founder in Islamabad. He builds SaaS products, mobile apps, AI systems, and automation, and ships them for clients in the US, UK, and Middle East.',
  locale: 'en',
} as const;

export const PERSON = {
  role: 'Software engineer and co-founder',
  location: 'Islamabad, Pakistan',
  education: 'BS Software Engineering, NUST Islamabad, class of 2026',
  company: 'OnePercent Technologies',
  companyLine:
    'Co-founder of OnePercent Technologies, an AI and software agency serving clients in the US, UK, and Middle East.',
  companyRole: 'Leads AI automation and SaaS development.',
  freelance: 'Top Rated on Upwork, with 38+ clients. Started there as a freelancer before co-founding the agency.',
  positioning: 'I build software products end to end and ship them for paying clients.',
  direction: 'Moving toward deep learning engineering, on foundations in ML mathematics and formal methods.',
} as const;

/**
 * The roles the home hero types out, in order, each after its adverb. Roles supplied by Ahmad on
 * 2026-11-21; the last two come from the Builds row in docs/CONTENT.md. The order matches the 3D
 * objects in engine/world/HeroField.ts.
 */
export const ROLES = [
  { adv: 'Thoughtfully', role: 'Software Engineer' },
  { adv: 'Practically', role: 'AI & LLM Engineer' },
  { adv: 'Fluently', role: 'Web & Mobile App Developer' },
  { adv: 'Reliably', role: 'Cloud Solutions Architect' },
  { adv: 'Thoroughly', role: 'Full-Stack SaaS Developer' },
  { adv: 'Quietly', role: 'Automation Engineer' },
] as const;

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
