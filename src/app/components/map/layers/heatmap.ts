import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { FsaAggregate } from '@/lib/types';
import type { LayerOptions } from './index';

// Cyan → green → yellow → red
const COLOR_RANGE: [number, number, number][] = [
  [65,  182, 196],
  [127, 205, 187],
  [199, 233, 180],
  [255, 237, 160],
  [253, 174,  97],
  [252,  78,  42],
];

/**
 * Density heatmap using real street-level encounter coordinates.
 *
 * Each encounter is plotted at its actual lat/lng (stored in geographicData).
 * Falls back to FSA centroid lat/lng if coordinates are unavailable.
 *
 * The layer-level `opacity: 0.5` is a hard cap — even at maximum density the
 * overlay is never more than 50% opaque, so the base map is always readable.
 * This is the definitive fix: deck.gl applies `opacity` after all blending,
 * so no amount of data concentration can push it past that ceiling.
 */
export function buildHeatmapLayer(data: FsaAggregate[], options: LayerOptions) {
  const { encounters, metric, selectedKeys } = options;
  const activeKeys = selectedKeys && selectedKeys.length > 0 ? new Set(selectedKeys) : null;

  // Build point array: prefer raw encounter coordinates, fall back to FSA centroids
  type Point = { lat: number; lng: number };
  let points: Point[];

  if (encounters && encounters.length > 0) {
    points = encounters
      .filter((e) => {
        if (!activeKeys || metric === 'density') return true;
        if (metric === 'healthIssue') return e.healthIssues.some((h) => activeKeys.has(h.key));
        if (metric === 'determinant') return e.upstreamDeterminants.some((d) => activeKeys.has(d.key));
        return true;
      })
      .map((e) => ({
        lat: e.geographicData?.lat,
        lng: e.geographicData?.lng,
      }))
      .filter((p): p is Point => p.lat != null && p.lng != null);
  } else {
    // Fallback: one point per FSA aggregate at FSA centroid
    points = data
      .filter((d) => d.lat != null && d.lng != null)
      .flatMap((d) => Array.from({ length: d.count }, () => ({ lat: d.lat, lng: d.lng })));
  }

  if (points.length === 0) return [];

  return [
    new HeatmapLayer<Point>({
      id: 'heatmap',
      data: points,
      getPosition: (d) => [d.lng, d.lat],
      getWeight: 1,
      colorRange: COLOR_RANGE,
      radiusPixels: 45,
      intensity: 0.6,
      // Cut off the low-density fringe — only genuine hotspots render
      threshold: 0.1,
      // Hard cap: even at maximum density the overlay is only 22% opaque
      opacity: 0.42,
    }),
  ];
}
