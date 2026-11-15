import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A project only renders publicly when `public` is true AND it is approved in docs/CONTENT.md.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    summary: z.string().min(1),
    role: z.string().min(1),
    stack: z.array(z.string().min(1)),
    year: z.number().int().min(2000).max(2100).optional(),
    status: z.enum(['draft', 'in-progress', 'shipped', 'archived', 'proposal']),
    public: z.boolean().default(false),
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.url(),
        }),
      )
      .default([]),
  }),
});

export const collections = { projects };
