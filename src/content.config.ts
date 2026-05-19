import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const walks = defineCollection({
  loader: glob({ pattern: "**/walk.md", base: "content/walks" }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    structure: z.enum(["linear", "branching", "geo-anchored"]),
    started_at: z.coerce.date(),
    ended_at: z.coerce.date(),
    summary: z.string().max(200),
    tags: z.array(z.string()).default([]),
    curated: z.boolean().default(false),
    curated_at: z.coerce.date().nullable().default(null),
    license: z.string().default("CC-BY-NC-SA-4.0"),
    ipfs_cid: z.string().nullable().default(null),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/page-*.md", base: "content/walks" }),
  schema: z.object({
    id: z.string(),
    image: z.string(),
    image_cid: z.string().nullable().default(null),
    coords: z.tuple([z.number(), z.number()]).optional(),
    captured_at: z.coerce.date(),
    next: z.string().optional(),
    links: z.array(z.string()).optional(),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: "*.md", base: "content/people" }),
  schema: z.object({
    handle: z.string(),
    link: z.string().url(),
  }),
});

export const collections = { walks, pages, people };
