import { getCollection } from "astro:content";
import { buildWalkIndex } from "../lib/indexer/index";
import {
  computeGeoCollisions,
  computeTemporalCollisions,
  computeSemanticCollisions,
  type PagePoint,
  type WalkData,
} from "../lib/collisions/index";

export async function GET() {
  const index = await buildWalkIndex();
  const allPages = await getCollection("pages");

  // Build geo/temporal points
  const points: PagePoint[] = [];
  for (const walk of index) {
    for (const page of walk.pages) {
      if (page.coords) {
        points.push({
          walkAuthor: walk.author,
          walkSlug: walk.slug,
          walkTitle: walk.title,
          pageId: page.id,
          coords: page.coords,
          captured_at: page.captured_at,
        });
      }
    }
  }

  // Build semantic walk data (concatenated page bodies)
  const walkDataList: WalkData[] = index.map((walk) => {
    const walkPages = allPages.filter((p) =>
      p.id.startsWith(`${walk.author}/${walk.slug}/`),
    );
    const body = walkPages.map((p) => p.body ?? "").join(" ");
    return {
      author: walk.author,
      slug: walk.slug,
      title: walk.title,
      tags: walk.tags,
      body,
    };
  });

  const result = {
    geographic: computeGeoCollisions(points),
    temporal: computeTemporalCollisions(points),
    semantic: computeSemanticCollisions(walkDataList),
  };

  return new Response(JSON.stringify(result, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
