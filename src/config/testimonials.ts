// Testimonials on the home page. Nothing here is written by Ahmad or invented: the endorsement is
// a client's recorded video, transcribed from the automatic captions on the file in the OnePercent
// Drive folder (Testimonials / AHMAD ENDORSEMENT.mp4). The captions were corrected only where the
// word was plainly misheard ("upward" for Upwork, "Amad" for Ahmad, "on parallel" for
// unparalleled, "take leads" for tech lead). Every line must be checked against the recording
// before launch; see docs/CONTENT.md, row "Endorsement".

export const ENDORSEMENT = {
  /** Shown as the client's name. Surname and company are not approved yet. */
  name: 'Samuel',
  role: 'Upwork client',
  /** Self-hosted file. The section shows a visible placeholder until it exists in public/. */
  video: '/media/samuel-endorsement.mp4',
  pull: 'We believe Ahmad ranks in our 1%.',
  context:
    'We have been Upwork clients for 14 years. We have invested over $100,000 developing projects with more than 70 different contractors.',
  reasons: [
    { title: 'Knowledgeable', text: "He's very knowledgeable about modern technology." },
    { title: 'Honest', text: "When he doesn't have the answer, he lets you know, but he goes out there to find it." },
    { title: 'Always learning', text: "He's constantly in learning mode." },
    { title: 'Available', text: "He's always available. He's always there for us." },
    {
      title: 'Work ethic',
      text: "Most important above everything else: his work ethic is unparalleled. He's into accomplishing the work objective, regardless of money. A quality any client values.",
    },
  ],
  close: 'We deeply appreciate his work. I plan on keeping him as our tech lead for years to come.',
  /** True until Ahmad has checked the wording against the recording and approved the name. */
  placeholder: true,
} as const;

/**
 * Written reviews from the Upwork profile. Empty on purpose: the review text is not in the Drive
 * folder or the Notion knowledge base, and a review is never written from memory. Add each one as
 * { text, client, project } exactly as it appears on Upwork.
 */
export const UPWORK_REVIEWS: ReadonlyArray<{ text: string; client: string; project: string }> = [];
