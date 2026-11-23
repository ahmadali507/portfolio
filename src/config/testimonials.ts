// Reviews on the home page. Nothing here is invented.
//
// The first card is the client story published on the OnePercent Technologies site (name, role,
// figure, and quote as shown there, read on 2026-11-23). The other cards are lines from the same
// client's recorded endorsement (Drive: OnePercent folder, Testimonials), transcribed from the
// automatic captions and corrected only where a word was plainly misheard. Those lines must be
// checked against the recording before launch; see docs/CONTENT.md, row "Endorsement".
//
// The second story on the agency site is left out on purpose: its project falls under the content
// rule in CLAUDE.md (rule 1), and it has no quote.

export interface Review {
  /** The large word or figure at the top of the card. */
  stat: string;
  /** One short line under it. */
  cap: string;
  text: string;
  name: string;
  role: string;
}

const SAMUEL = { name: 'Samuel Rosario', role: 'Upwork client since 2014' } as const;

export const REVIEWS: readonly Review[] = [
  {
    stat: '1%',
    cap: 'of the 70+ contractors hired in 14 years',
    text: 'We have invested over $100,000 developing projects with more than 70 different contractors, and we believe Ahmad ranks in our 1%.',
    ...SAMUEL,
  },
  { stat: 'Knowledge', cap: 'Reason one of five', text: "He's very knowledgeable about modern technology.", ...SAMUEL },
  {
    stat: 'Honesty',
    cap: 'Reason two of five',
    text: "When he doesn't have the answer, he lets you know, but he goes out there to find it.",
    ...SAMUEL,
  },
  { stat: 'Learning', cap: 'Reason three of five', text: "He's constantly in learning mode.", ...SAMUEL },
  { stat: 'Available', cap: 'Reason four of five', text: "He's always available. He's always there for us.", ...SAMUEL },
  {
    stat: 'Work ethic',
    cap: 'Reason five of five',
    text: "His work ethic is unparalleled. He's into accomplishing the work objective, regardless of money.",
    ...SAMUEL,
  },
  {
    stat: 'Tech lead',
    cap: 'In closing',
    text: 'We deeply appreciate his work. I plan on keeping him as our tech lead for years to come.',
    ...SAMUEL,
  },
];

/** True until Ahmad has checked the video lines against the recording. Shows one flag in the section. */
export const REVIEWS_UNVERIFIED = true;

/**
 * Written reviews from the Upwork profile go here, word for word, and join the same carousel.
 * Empty on purpose: Upwork blocks automated reading of the profile, and a review is never
 * written from memory.
 */
export const UPWORK_REVIEWS: readonly Review[] = [];
