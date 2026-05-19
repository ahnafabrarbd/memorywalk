/**
 * Shared indexer logic for generating walk index data.
 * Used by the Astro endpoint pages.
 */
import { getCollection } from "astro:content";

export interface WalkIndexEntry {
  author: string;
  slug: string;
  title: string;
  structure: string;
  started_at: string;
  ended_at: string;
  summary: string;
  tags: string[];
  curated: boolean;
  curated_at: string | null;
  page_count: number;
  pages: {
    id: string;
    image: string;
    coords: [number, number] | null;
    captured_at: string;
  }[];
}

export async function buildWalkIndex(): Promise<WalkIndexEntry[]> {
  const walks = await getCollection("walks");
  const pages = await getCollection("pages");

  return walks.map((w) => {
    const parts = w.id.split("/");
    const author = parts[0];
    const slug = parts[1];

    const walkPages = pages
      .filter((p) => p.id.startsWith(`${author}/${slug}/`))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => ({
        id: p.data.id,
        image: p.data.image,
        coords: p.data.coords ?? null,
        captured_at: p.data.captured_at.toISOString(),
      }));

    return {
      author,
      slug,
      title: w.data.title,
      structure: w.data.structure,
      started_at: w.data.started_at.toISOString(),
      ended_at: w.data.ended_at.toISOString(),
      summary: w.data.summary,
      tags: w.data.tags,
      curated: w.data.curated,
      curated_at: w.data.curated_at?.toISOString() ?? null,
      page_count: walkPages.length,
      pages: walkPages,
    };
  });
}
