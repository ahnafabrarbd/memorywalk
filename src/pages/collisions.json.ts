import { buildWalkIndex } from "../lib/indexer/index";
import { computeGeoCollisions, type PagePoint } from "../lib/collisions/index";

export async function GET() {
  const index = await buildWalkIndex();

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

  const geoCollisions = computeGeoCollisions(points);

  const result = {
    geographic: geoCollisions,
    temporal: [], // Phase 8
    semantic: [], // Phase 8
  };

  return new Response(JSON.stringify(result, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
