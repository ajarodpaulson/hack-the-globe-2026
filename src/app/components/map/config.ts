import type { MapMetric, VisualizationType } from '@/lib/types';

export type KeyOption = { key: string; label: string };

export type MetricConfig = {
  id: MapMetric;
  label: string;
  keys?: KeyOption[];
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
  {
    id: 'healthIssue',
    label: 'Health Issues',
    keys: [
      { key: 'mental_health', label: 'Mental Health' },
      { key: 'substance_use', label: 'Substance Use' },
      { key: 'chronic_pain', label: 'Chronic Pain' },
      { key: 'diabetes', label: 'Diabetes' },
      { key: 'hypertension', label: 'Hypertension' },
      { key: 'respiratory', label: 'Respiratory Issues' },
    ],
  },
  {
    id: 'determinant',
    label: 'Upstream Determinants',
    keys: [
      { key: 'housing_instability', label: 'Housing Instability' },
      { key: 'food_insecurity', label: 'Food Insecurity' },
      { key: 'income_poverty', label: 'Income/Poverty' },
      { key: 'social_isolation', label: 'Social Isolation' },
      { key: 'employment_barriers', label: 'Employment Barriers' },
      { key: 'language_barriers', label: 'Language Barriers' },
      { key: 'transportation', label: 'Transportation Barriers' },
    ],
  },
];

export const MAP_STYLES: MapStyleConfig[] = [
  { id: 'dark',      label: 'Dark',   url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  { id: 'colorful',  label: 'Street', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  { id: 'light',     label: 'Light',  url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
];

export const VIZ_TYPES: VizTypeConfig[] = [
  { id: 'heatmap',    label: 'Heat Map' },
  { id: 'choropleth', label: 'Districts' },
];

export const DEFAULT_VIEW_STATE = {
  longitude: -123.12,
  latitude: 49.265,
  zoom: 11.5,
  pitch: 0,
  bearing: 0,
};
