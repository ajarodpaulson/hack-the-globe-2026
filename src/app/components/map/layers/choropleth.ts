import { GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { FsaAggregate } from '@/lib/types';
import type { LayerOptions } from './index';
import { FSA_TO_NEIGHBORHOOD } from '@/lib/fsa-to-neighborhood';

// Interpolates from cool blue (no data) to warm red (max)
function countToColor(count: number, max: number): [number, number, number, number] {
  if (count === 0) return [20, 40, 70, 80];
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

export function buildChoroplethLayer(data: FsaAggregate[], options: LayerOptions) {
  const { neighborhoodGeoJson, onHover } = options;

  // GeoJSON not yet loaded — return empty, will re-render once loaded
  if (!neighborhoodGeoJson) return [];

  const countByHood = toNeighbourhoodCounts(data);
  const maxCount = Math.max(...countByHood.values(), 1);

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
        // Report the neighbourhood name as `fsa` field for the shared tooltip
        onHover({ fsa: name, count, x, y });
      },
    }),
  ];
}
