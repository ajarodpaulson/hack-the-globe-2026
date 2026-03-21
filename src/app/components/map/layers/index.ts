import type { Layer } from '@deck.gl/core';
import type { FsaAggregate, VisualizationType } from '@/lib/types';
import { buildHeatmapLayer } from './heatmap';
import { buildChoroplethLayer } from './choropleth';

export type HoverInfo = {
  fsa: string;
  count: number;
  x: number;
  y: number;
} | null;

export type LayerOptions = {
  onHover?: (info: HoverInfo) => void;
  /**
   * City of Vancouver local-area-boundary GeoJSON (opendata.vancouver.ca).
   * Required for choropleth; ignored by other layer types.
   * Each feature must have a `name` property matching the neighbourhood name.
   */
  neighborhoodGeoJson?: GeoJSON.FeatureCollection | null;
};

type LayerBuilder = (data: FsaAggregate[], options: LayerOptions) => Layer[];

/**
 * Registry: add a new visualization type by adding a file in this directory
 * and registering it here. Nothing else needs to change.
 */
export const LAYER_BUILDERS: Record<VisualizationType, LayerBuilder> = {
  heatmap: buildHeatmapLayer,
  choropleth: buildChoroplethLayer,
};
