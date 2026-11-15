import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A project renders publicly only when `public` is true AND its row in docs/CONTENT.md is approved.
// While DRAFT_PREVIEW is true (src/config/site.ts) every entry renders, for local drafts only.
//
// Every field that holds dummy data is a `fact`: { value, placeholder }. `placeholder: true`
// renders a visible TODO tag and makes `npm run prelaunch` fail.

const fact = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    placeholder: z.boolean().default(false),
  });

const link = z.object({
  label: z.string().min(1),
  // '#' is allowed only as a placeholder target.
  url: z.union([z.url(), z.literal('#')]),
  placeholder: z.boolean().default(false),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z
    .object({
      title: z.string().min(1),
      summary: fact(z.string().min(1)),
      featured: z.boolean().default(false),
      /** Sort order inside its group, ascending. */
      order: z.number().int(),
      status: fact(z.enum(['in-progress', 'shipped', 'archived', 'proposal'])),
      role: fact(z.string().min(1)),
      year: fact(z.number().int().min(2000).max(2100)),
      stack: fact(z.array(z.string().min(1)).min(1)),
      problem: fact(z.string().min(1)),
      outcome: fact(z.string().min(1)),
      links: z.array(link).default([]),
      /** Project imagery is a generative cover rendered in WebGL (SVG without it); a placeholder until real media exists. */
      media: z.object({ placeholder: z.boolean().default(true) }).default({ placeholder: true }),
      public: z.boolean().default(false),
      /** True when the Markdown body is dummy narrative. */
      placeholder: z.boolean().default(false),
    })
    .strict(),
});

export const collections = { projects };
