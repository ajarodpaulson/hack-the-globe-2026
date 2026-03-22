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
