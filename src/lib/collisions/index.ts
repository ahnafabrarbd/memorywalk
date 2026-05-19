/**
 * Collision computation. Run at build time over walks-index data.
 *
 * Phase 5: geographic collisions only (pages within 50m).
 * Phase 8: temporal + semantic collisions.
 */

export interface PagePoint {
  walkAuthor: string;
  walkSlug: string;
  walkTitle: string;
  pageId: string;
  coords: [number, number];
  captured_at: string;
}

export interface GeoCollision {
  type: "geographic";
  a: { walkAuthor: string; walkSlug: string; walkTitle: string; pageId: string };
  b: { walkAuthor: string; walkSlug: string; walkTitle: string; pageId: string };
  distance_m: number;
}

/**
 * Haversine distance in meters between two lat/lng points.
 */
function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute geographic collisions: pages from different walks within 50m.
 */
export function computeGeoCollisions(points: PagePoint[]): GeoCollision[] {
  const collisions: GeoCollision[] = [];
  const THRESHOLD = 50; // meters

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];

      // Skip pages from the same walk
      if (a.walkAuthor === b.walkAuthor && a.walkSlug === b.walkSlug) continue;

      const dist = haversine(
        a.coords[0],
        a.coords[1],
        b.coords[0],
        b.coords[1],
      );

      if (dist <= THRESHOLD) {
        collisions.push({
          type: "geographic",
          a: {
            walkAuthor: a.walkAuthor,
            walkSlug: a.walkSlug,
            walkTitle: a.walkTitle,
            pageId: a.pageId,
          },
          b: {
            walkAuthor: b.walkAuthor,
            walkSlug: b.walkSlug,
            walkTitle: b.walkTitle,
            pageId: b.pageId,
          },
          distance_m: Math.round(dist),
        });
      }
    }
  }

  return collisions;
}
