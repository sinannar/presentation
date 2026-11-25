import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { imageIssues } from './lib/content-image';

const common = {
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  sourceRefs: z.array(z.string()).default([]),
  speakerNotes: z.object({
    talkingPoints: z.array(z.string()).default([]),
    technicalDetails: z.array(z.string()).default([]),
    transition: z.string().default(''),
  }).default({ talkingPoints: [], technicalDetails: [], transition: '' }),
  reveals: z.array(z.string()).default([]),
  image: z.object({
    src: z.string(),
    alt: z.string(),
    credit: z.string(),
    sourceUrl: z.string(),
    licenseUrl: z.string(),
  }).superRefine((image, context) => {
    for (const issue of imageIssues(image)) {
      context.addIssue({ code: 'custom', path: [issue.field], message: issue.message });
    }
  }).optional(),
};

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    ...common,
    order: z.number().int().nonnegative().default(0),
    takeaway: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    ...common,
    published: z.coerce.date(),
    status: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.url({ protocol: /^https?$/ }) })).default([]),
  }),
});

export const collections = { docs, news };
