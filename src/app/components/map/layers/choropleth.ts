import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { FsaAggregate } from '@/lib/types';
import type { LayerOptions } from './index';
import { FSA_TO_NEIGHBORHOOD } from '@/lib/fsa-to-neighborhood';

// Interpolates from transparent (no data) to warm red (max).
// Zero-count neighbourhoods are fully transparent so the base map shows through.
function countToColor(count: number, max: number): [number, number, number, number] {
  if (count === 0) return [0, 0, 0, 0];
  const t = count / max;
  return [
    Math.round(65  + t * 190),
    Math.round(182 - t * 113),
    Math.round(196 - t * 196),
    200,
  ];
}

/**
 * Roll FSA-level counts up to Vancouver neighbourhood counts.
 * Multiple FSAs can map to the same neighbourhood; their counts are summed.
 */
function toNeighbourhoodCounts(data: FsaAggregate[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { fsa, count } of data) {
    const hood = FSA_TO_NEIGHBORHOOD[fsa];
    if (!hood) continue;
    counts.set(hood, (counts.get(hood) ?? 0) + count);
  }
  return counts;
}

type LabelPoint = { name: string; lon: number; lat: number };

export function buildChoroplethLayer(data: FsaAggregate[], options: LayerOptions) {
  const { neighborhoodGeoJson, onHover } = options;

  // GeoJSON not yet loaded — return empty, will re-render once loaded
  if (!neighborhoodGeoJson) return [];

  const countByHood = toNeighbourhoodCounts(data);
  const maxCount = Math.max(...countByHood.values(), 1);

  // Extract label positions from geo_point_2d centroids embedded in the GeoJSON
  const labelPoints: LabelPoint[] = neighborhoodGeoJson.features
    .map((f) => {
      const name = f.properties?.name as string | undefined;
      const pt = f.properties?.geo_point_2d as { lon: number; lat: number } | undefined;
      if (!name || !pt) return null;
      return { name, lon: pt.lon, lat: pt.lat };
    })
    .filter((p): p is LabelPoint => p !== null);

  return [
    new GeoJsonLayer({
      id: 'choropleth',
      data: neighborhoodGeoJson,
      pickable: true,
      stroked: true,
      filled: true,
      getFillColor: (f: GeoJSON.Feature) => {
        const name = f.properties?.name as string | undefined;
        const count = name ? (countByHood.get(name) ?? 0) : 0;
        return countToColor(count, maxCount);
      },
      getLineColor: [255, 255, 255, 60],
      lineWidthMinPixels: 1,
      updateTriggers: {
        getFillColor: [data],
      },
      onHover: (info: PickingInfo<GeoJSON.Feature>) => {
        if (!onHover) return;
        const { object, x, y } = info;
        if (!object) { onHover(null); return; }
        const name = object.properties?.name as string | undefined;
        if (!name) { onHover(null); return; }
        const count = countByHood.get(name) ?? 0;
        onHover({ fsa: name, count, x, y });
      },
    }),

    new TextLayer<LabelPoint>({
      id: 'choropleth-labels',
      data: labelPoints,
      getPosition: (d) => [d.lon, d.lat],
      getText: (d) => d.name,
      getSize: 12,
      getColor: [255, 255, 255, 220],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      // Thin dark outline makes text readable over both light fills and the dark map
      outlineWidth: 2,
      outlineColor: [0, 0, 0, 180],
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 600,
      sizeScale: 1,
    }),
  ];
}
