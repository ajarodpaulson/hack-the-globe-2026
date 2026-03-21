'use client';

import { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useEncounterData } from './data';
import { aggregateByFsa } from './aggregations';
import { LAYER_BUILDERS } from './layers';
import type { HoverInfo } from './layers';
import { MAP_STYLES, DEFAULT_VIEW_STATE } from './config';
import { Sidebar } from './Sidebar';
import type { MapMetric, VisualizationType } from '@/lib/types';

export default function MapView() {
  const { encounters } = useEncounterData();

  const [metric, setMetric] = useState<MapMetric>('density');
  const [selectedKey, setSelectedKey] = useState('');
  const [vizType, setVizType] = useState<VisualizationType>('heatmap');
  const [mapStyleId, setMapStyleId] = useState('dark');
  const [hover, setHover] = useState<HoverInfo>(null);
  const [neighborhoodGeoJson, setNeighborhoodGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/data/vancouver-neighborhoods.geojson')
      .then((r) => r.json())
      .then(setNeighborhoodGeoJson)
      .catch(() => null);
  }, []);

  const aggregated = useMemo(
    () => aggregateByFsa(encounters, metric, selectedKey || undefined),
    [encounters, metric, selectedKey],
  );

  const mapStyleUrl = MAP_STYLES.find((s) => s.id === mapStyleId)?.url ?? MAP_STYLES[0].url;

  const layers = useMemo(
    () => LAYER_BUILDERS[vizType](aggregated, { onHover: setHover, neighborhoodGeoJson }),
    [vizType, aggregated, neighborhoodGeoJson],
  );

  const totalCount = useMemo(() => aggregated.reduce((s, d) => s + d.count, 0), [aggregated]);

  return (
    <div className="relative flex-1">
      <DeckGL
        initialViewState={DEFAULT_VIEW_STATE}
        controller
        layers={layers}
        style={{ position: 'absolute', top: '0', right: '0', bottom: '0', left: '0' }}
      >
        <Map mapStyle={mapStyleUrl} />
      </DeckGL>

      <Sidebar
        metric={metric}
        onMetricChange={setMetric}
        selectedKey={selectedKey}
        onKeyChange={setSelectedKey}
        vizType={vizType}
        onVizTypeChange={setVizType}
        mapStyleId={mapStyleId}
        onMapStyleChange={setMapStyleId}
        totalCount={totalCount}
      />

      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg px-3 py-2 text-sm"
          style={{
            left: hover.x + 12,
            top: hover.y - 10,
            background: 'rgba(11, 29, 58, 0.95)',
            border: '1px solid var(--gray-600)',
          }}
        >
          <p className="font-semibold" style={{ color: 'var(--white)' }}>{hover.fsa}</p>
          <p style={{ color: 'var(--gray-300)' }}>
            {hover.count} {metric === 'density' ? 'encounter' : 'occurrence'}
            {hover.count !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
