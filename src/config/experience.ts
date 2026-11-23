// The experience timeline on the home page, oldest first. Facts come from docs/CONTENT.md
// (rows "Experience" and "Freelance history"), which records their source: Ahmad's CV and his
// brief of 2026-11-23. A `placeholder: true` period shows a visible flag and fails prelaunch.
// Figures from the CV (percentages, delivery times, scores) are withheld until confirmed.

export interface Stint {
  id: string;
  /** Short label for the left column. */
  when: { value: string; flag: string | null };
  org: string;
  role: string;
  place: string;
  summary: string;
  points: ReadonlyArray<{ text: string; href?: string; link?: string }>;
  tools: readonly string[];
}

export const EXPERIENCE: readonly Stint[] = [
  {
    id: 'upwork',
    when: { value: 'First chapter, still open', flag: 'Start year' },
    org: 'Upwork',
    role: 'Freelance AI and full-stack engineer',
    place: 'Remote',
    summary:
      'Where it started. One client brief at a time, I scoped the work, built all of it, and shipped it alone. Top Rated status came from that record.',
    points: [
      { text: 'Delivered RAG chatbots, AI agents, and document question answering for clients with heavy compliance needs.' },
      { text: 'Shipped MVPs in MERN, Next.js, and React Native.' },
      {
        text: 'Built ingestion pipelines for PDF, DOCX, CSV, and web content, with backends that cite their sources and fall back when confidence is low.',
      },
      { text: 'Automated client workflows with n8n and deployed with Docker on AWS, Vercel, Render, and Fly.io.' },
    ],
    tools: ['LangChain', 'OpenAI API', 'Pinecone', 'FastAPI', 'Next.js', 'React Native', 'n8n', 'Docker'],
  },
  {
    id: 'doerz',
    when: { value: '14 months, 2024 to 2025', flag: 'Verify dates' },
    org: 'Doerz',
    role: 'AI Engineer and Full-Stack Developer Intern',
    place: 'Hybrid, Islamabad',
    summary:
      'Fourteen months inside a product team. I learned how AI services are built, deployed, and watched once real users depend on them.',
    points: [
      {
        text: 'Built AI backend services in Python and FastAPI: document ingestion and retrieval pipelines over structured and unstructured business data.',
      },
      { text: 'Integrated the OpenAI and Claude APIs for context-aware question answering, with LangChain and vector embeddings.' },
      {
        text: 'Deployed the services on AWS EC2 with Docker, added production logging for latency, token usage, and answers, and moved data access to GraphQL.',
      },
      { text: 'Built core features of a React Native app: API integration, state management, and content delivery.' },
    ],
    tools: ['Python', 'FastAPI', 'LangChain', 'OpenAI API', 'Claude API', 'AWS EC2', 'Docker', 'GraphQL', 'React Native'],
  },
  {
    id: 'onepercent',
    when: { value: 'After Doerz, to now', flag: 'Start date' },
    org: 'OnePercent Technologies',
    role: 'Co-founder',
    place: 'Remote',
    summary:
      'After Doerz I turned the freelance practice into a company. Upwork is still the front door: clients arrive there, and the agency carries the work from architecture to deployment.',
    points: [
      { text: 'Own architecture and client delivery end to end, for clients in the US, the UK, and the Middle East.' },
      {
        text: 'Built and shipped MagicalBook.Store, a personalized storybook product with automated generation and print-on-demand fulfillment.',
        href: '/work/magicalbook-store/',
        link: 'Read the case study',
      },
      {
        text: 'Architected a multi-tenant knowledge base on Next.js and PostgreSQL with pgvector. Hybrid keyword and vector search returns answers with their sources.',
      },
      { text: 'Designed multi-tenant dashboards that stream live analytics over server-sent events.' },
      { text: 'Directed Google Cloud access security with conditional role bindings on production client infrastructure.' },
    ],
    tools: ['Next.js', 'TypeScript', 'PostgreSQL', 'pgvector', 'Supabase', 'Google Cloud', 'AWS', 'Docker'],
  },
];
