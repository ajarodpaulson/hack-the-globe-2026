/**
 * Point-in-polygon for GeoJSON geometries.
 * Uses ray-casting algorithm; handles Polygon and MultiPolygon with holes.
 * point is [longitude, latitude] (GeoJSON order).
 */
export function pointInFeature(
  point: [number, number],
  geometry: GeoJSON.Geometry,
): boolean {
  if (geometry.type === 'Polygon') {
    return pointInRings(point, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((rings) => pointInRings(point, rings));
  }
  return false;
}

function pointInRings(point: [number, number], rings: number[][][]): boolean {
  const [outer, ...holes] = rings;
  if (!pointInRing(point, outer)) return false;
  return !holes.some((hole) => pointInRing(point, hole));
}

function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Build a bounding-box lookup for each feature to speed up point-in-polygon.
 * Returns an array of { feature, bbox } sorted for fast elimination.
 */
export type FeatureWithBbox = {
  dauid: string;
  geometry: GeoJSON.Geometry;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function buildFeatureBboxIndex(
  features: GeoJSON.Feature[],
  uidProp: string,
): FeatureWithBbox[] {
  return features.map((f) => {
    const coords = flatCoords(f.geometry);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return { dauid: f.properties?.[uidProp] as string, geometry: f.geometry, minX, minY, maxX, maxY };
  });
}

function flatCoords(geometry: GeoJSON.Geometry): number[][] {
  if (geometry.type === 'Polygon') return geometry.coordinates.flat();
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat(2);
  return [];
}

/**
 * Find the DAUID for a given [lng, lat] point using the bbox index.
 */
export function findDauid(
  point: [number, number],
  index: FeatureWithBbox[],
): string | null {
  const [x, y] = point;
  for (const feat of index) {
    if (x < feat.minX || x > feat.maxX || y < feat.minY || y > feat.maxY) continue;
    if (pointInFeature(point, feat.geometry)) return feat.dauid;
  }
  return null;
}
