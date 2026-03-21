import { GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { FsaAggregate } from '@/lib/types';
import type { LayerOptions } from './index';
import { FSA_TO_NEIGHBORHOOD } from '@/lib/fsa-to-neighborhood';

/**
 * Heat color ramp — RGBA.
 *
 * Zero-count neighbourhoods are fully transparent so the base map shows
 * through completely. Non-zero areas scale from faint teal to opaque red.
 * A gamma curve (^0.55) compresses the range so sparse areas are still
 * visible while the DTES hotspot clearly dominates.
 */
function toHeatColor(count: number, max: number): [number, number, number, number] {
  if (count === 0) return [0, 0, 0, 0];
  const t = Math.pow(count / max, 0.55);
  return [
    Math.round( 65 + t * 190),   // R: 65 → 255
    Math.round(182 - t * 113),   // G: 182 → 69
    Math.round(196 - t * 196),   // B: 196 → 0
    Math.round( 90 + t * 140),   // A: 90 → 230  (never fully opaque — map always readable)
  ];
}

/** Roll FSA counts up to neighbourhood totals. */
function toNeighbourhoodCounts(data: FsaAggregate[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { fsa, count } of data) {
    const hood = FSA_TO_NEIGHBORHOOD[fsa];
    if (!hood) continue;
    counts.set(hood, (counts.get(hood) ?? 0) + count);
  }
  return counts;
}

/**
 * Density heat map using the same real Vancouver neighbourhood boundaries
 * as the choropleth, styled as a continuous heat ramp instead of districts.
 *
 * Using real geographic boundaries is the only correct way to visualize
 * density on a city map — overlay grids (GridLayer, HeatmapLayer) impose
 * artificial geometry that ignores streets, blocks, and actual urban form.
 *
 * Visual differences from the choropleth:
 *  - No borders between neighbourhoods → reads as a smooth gradient
 *  - Zero-count areas fully transparent → base map unobstructed
 *  - Gamma-curved alpha → sparse areas visible, hot spots stand out
 */
export function buildHeatmapLayer(data: FsaAggregate[], options: LayerOptions) {
  const { neighborhoodGeoJson, onHover } = options;
  if (!neighborhoodGeoJson) return [];

  const countByHood = toNeighbourhoodCounts(data);
  const maxCount = Math.max(...countByHood.values(), 1);

  return [
    new GeoJsonLayer({
      id: 'heatmap',
      data: neighborhoodGeoJson,
      pickable: true,
      stroked: false,   // no borders — cleaner gradient read
      filled: true,
      getFillColor: (f: GeoJSON.Feature) => {
        const name = f.properties?.name as string | undefined;
        return toHeatColor(name ? (countByHood.get(name) ?? 0) : 0, maxCount);
      },
      updateTriggers: { getFillColor: [data] },
      onHover: (info: PickingInfo<GeoJSON.Feature>) => {
        if (!onHover) return;
        const { object, x, y } = info;
        if (!object) { onHover(null); return; }
        const name = object.properties?.name as string | undefined;
        if (!name) { onHover(null); return; }
        onHover({ fsa: name, count: countByHood.get(name) ?? 0, x, y });
      },
    }),
  ];
}
