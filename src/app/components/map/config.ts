import type { MapMetric, VisualizationType } from '@/lib/types';

export type MetricConfig = {
  id: MapMetric;
  label: string;
};

export type MapStyleConfig = {
  id: string;
  label: string;
  url: string;
};

export type VizTypeConfig = {
  id: VisualizationType;
  label: string;
};

export const METRIC_CONFIGS: MetricConfig[] = [
  { id: 'density', label: 'Encounter Density' },
  { id: 'healthIssue', label: 'Health Issues' },
  { id: 'determinant', label: 'Upstream Determinants' },
];

export const MAP_STYLES: MapStyleConfig[] = [
  { id: 'dark',   label: 'Dark',   url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { id: 'street', label: 'Street', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  { id: 'light',  label: 'Light',  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
];

export const VIZ_TYPES: VizTypeConfig[] = [
  { id: 'da',           label: 'Census Areas' },
  { id: 'neighbourhood', label: 'Districts' },
  { id: 'bubble',       label: 'Bubble' },
];

export const DEFAULT_VIEW_STATE = {
  longitude: -123.12,
  latitude: 49.265,
  zoom: 11.5,
  pitch: 0,
  bearing: 0,
};
