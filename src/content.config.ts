import { defineCollection, z } from 'astro:content';

const common = {
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  sourceRefs: z.array(z.string()).default([]),
};

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    ...common,
    order: z.number().int().nonnegative().default(0),
    takeaway: z.string().optional(),
  }),
});

const news = defineCollection({
  type: 'content',
  schema: z.object({
    ...common,
    published: z.coerce.date(),
    status: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  }),
});

export const collections = { docs, news };
