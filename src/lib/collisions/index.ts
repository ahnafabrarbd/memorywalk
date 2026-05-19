/**
 * Collision computation. Run at build time over walks-index data.
 *
 * Three axes:
 * - Geographic: pages from different walks within 50m
 * - Temporal: geographic precondition + captured_at >24h apart (dashed line)
 * - Semantic: >=2 shared tags OR >=3 shared non-stopword content lemmas
 */

import { STOPWORDS } from "./stopwords";

export interface PagePoint {
  walkAuthor: string;
  walkSlug: string;
  walkTitle: string;
  pageId: string;
  coords: [number, number];
  captured_at: string;
}

export interface WalkData {
  author: string;
  slug: string;
  title: string;
  tags: string[];
  body: string; // concatenated page bodies
}

interface CollisionRef {
  walkAuthor: string;
  walkSlug: string;
  walkTitle: string;
  pageId: string;
}

export interface GeoCollision {
  type: "geographic";
  a: CollisionRef;
  b: CollisionRef;
  distance_m: number;
}

export interface TemporalCollision {
  type: "temporal";
  a: CollisionRef;
  b: CollisionRef;
  distance_m: number;
  time_apart_h: number;
}

export interface SemanticCollision {
  type: "semantic";
  a: { walkAuthor: string; walkSlug: string; walkTitle: string };
  b: { walkAuthor: string; walkSlug: string; walkTitle: string };
  shared_tags: string[];
  shared_words: string[];
}

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeGeoCollisions(points: PagePoint[]): GeoCollision[] {
  const collisions: GeoCollision[] = [];
  const THRESHOLD = 50;

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      if (a.walkAuthor === b.walkAuthor && a.walkSlug === b.walkSlug) continue;

      const dist = haversine(a.coords[0], a.coords[1], b.coords[0], b.coords[1]);
      if (dist <= THRESHOLD) {
        collisions.push({
          type: "geographic",
          a: { walkAuthor: a.walkAuthor, walkSlug: a.walkSlug, walkTitle: a.walkTitle, pageId: a.pageId },
          b: { walkAuthor: b.walkAuthor, walkSlug: b.walkSlug, walkTitle: b.walkTitle, pageId: b.pageId },
          distance_m: Math.round(dist),
        });
      }
    }
  }

  return collisions;
}

/**
 * Temporal collisions: geographic precondition (within 50m) + captured_at >24h apart.
 */
export function computeTemporalCollisions(points: PagePoint[]): TemporalCollision[] {
  const collisions: TemporalCollision[] = [];
  const GEO_THRESHOLD = 50;
  const TIME_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      if (a.walkAuthor === b.walkAuthor && a.walkSlug === b.walkSlug) continue;

      const dist = haversine(a.coords[0], a.coords[1], b.coords[0], b.coords[1]);
      if (dist > GEO_THRESHOLD) continue;

      const timeA = new Date(a.captured_at).getTime();
      const timeB = new Date(b.captured_at).getTime();
      const timeDiff = Math.abs(timeA - timeB);

      if (timeDiff > TIME_THRESHOLD_MS) {
        collisions.push({
          type: "temporal",
          a: { walkAuthor: a.walkAuthor, walkSlug: a.walkSlug, walkTitle: a.walkTitle, pageId: a.pageId },
          b: { walkAuthor: b.walkAuthor, walkSlug: b.walkSlug, walkTitle: b.walkTitle, pageId: b.pageId },
          distance_m: Math.round(dist),
          time_apart_h: Math.round(timeDiff / (60 * 60 * 1000)),
        });
      }
    }
  }

  return collisions;
}

/**
 * Tokenize text: lowercase, split on non-alpha, filter stopwords, deduplicate.
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Semantic collisions: walks sharing >=2 tags OR >=3 non-stopword content words.
 */
export function computeSemanticCollisions(walks: WalkData[]): SemanticCollision[] {
  const collisions: SemanticCollision[] = [];

  const walkTokens = walks.map((w) => ({
    walk: w,
    words: tokenize(w.body),
  }));

  for (let i = 0; i < walks.length; i++) {
    for (let j = i + 1; j < walks.length; j++) {
      const a = walks[i];
      const b = walks[j];

      // Shared tags
      const sharedTags = a.tags.filter((t) => b.tags.includes(t));

      // Shared content words
      const aWords = walkTokens[i].words;
      const bWords = walkTokens[j].words;
      const sharedWords: string[] = [];
      for (const word of aWords) {
        if (bWords.has(word)) sharedWords.push(word);
      }

      if (sharedTags.length >= 2 || sharedWords.length >= 3) {
        collisions.push({
          type: "semantic",
          a: { walkAuthor: a.author, walkSlug: a.slug, walkTitle: a.title },
          b: { walkAuthor: b.author, walkSlug: b.slug, walkTitle: b.title },
          shared_tags: sharedTags,
          shared_words: sharedWords.slice(0, 10), // cap for readability
        });
      }
    }
  }

  return collisions;
}
