'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PathOptions } from 'leaflet';

import { useEncounterData } from './data';
import { aggregateByFsa } from './aggregations';
import { MAP_STYLES, DEFAULT_VIEW_STATE } from './config';
import { Sidebar } from './Sidebar';
import { FSA_TO_NEIGHBORHOOD } from '@/lib/fsa-to-neighborhood';
import { buildFeatureBboxIndex, findDauid } from './geo-utils';
import type { MapMetric, VisualizationType } from '@/lib/types';

// ── Colour helpers ─────────────────────────────────────────────────────────

function choroplethColor(count: number, max: number): PathOptions {
  if (count === 0) {
    return { fillColor: 'transparent', fillOpacity: 0, color: 'rgba(255,255,255,0.08)', weight: 0.5 };
  }
  // sqrt scale for better visual distribution across a skewed dataset
  const t = Math.sqrt(count / max);
  // teal (0,201,167) → orange (255,140,0) → red (220,38,38)
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 201 - t * 2 * 201 : 140 - (t - 0.5) * 2 * 140);
  const b = Math.round(t < 0.5 ? 167 - t * 2 * 167 : 0);
  return {
    fillColor: `rgb(${r},${g},${b})`,
    fillOpacity: 0.25 + t * 0.55,
    color: 'rgba(255,255,255,0.15)',
    weight: 0.8,
  };
}

function bubbleColor(t: number): string {
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 201 - t * 2 * 201 : 140 - (t - 0.5) * 2 * 140);
  const b = Math.round(t < 0.5 ? 167 - t * 2 * 167 : 0);
  return `rgb(${r},${g},${b})`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MapView() {
  const { encounters } = useEncounterData();

  const [metric, setMetric] = useState<MapMetric>('density');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [vizType, setVizType] = useState<VisualizationType>('neighbourhood');
  const [mapStyleId, setMapStyleId] = useState('dark');

  const [neighbourhoodGeoJson, setNeighbourhoodGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [daGeoJson, setDaGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  const [hover, setHover] = useState<{ name: string; count: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/vancouver-neighborhoods.geojson').then((r) => r.json()).then(setNeighbourhoodGeoJson).catch(() => null);
  }, []);

  useEffect(() => {
    fetch('/data/vancouver-das.geojson').then((r) => r.json()).then(setDaGeoJson).catch(() => null);
  }, []);

  // ── Pre-compute DA bbox index (once per GeoJSON load) ────────────────────
  const daIndex = useMemo(
    () => (daGeoJson ? buildFeatureBboxIndex(daGeoJson.features, 'DAUID') : []),
    [daGeoJson],
  );

  // ── Pre-assign each encounter to a DAUID (expensive, runs once) ──────────
  const encounterDaMap = useMemo(() => {
    if (!daIndex.length) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const enc of encounters) {
      const { lat, lng } = enc.geographicData ?? {};
      if (lat == null || lng == null) continue;
      const dauid = findDauid([lng, lat], daIndex);
      if (dauid) map.set(enc.analyzedEncounterRn, dauid);
    }
    return map;
  }, [encounters, daIndex]);

  // ── Filter helper ────────────────────────────────────────────────────────
  const activeKeys = useMemo(
    () => (selectedKeys.length ? new Set(selectedKeys) : null),
    [selectedKeys],
  );

  function encounterMatches(enc: (typeof encounters)[0]): boolean {
    if (!activeKeys || metric === 'density') return true;
    if (metric === 'healthIssue') return (enc.healthIssues ?? []).some((h) => activeKeys.has(h.key));
    if (metric === 'determinant') return (enc.upstreamDeterminants ?? []).some((d) => activeKeys.has(d.key));
    return true;
  }

  // ── Aggregations ─────────────────────────────────────────────────────────

  const daCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const enc of encounters) {
      if (!encounterMatches(enc)) continue;
      const dauid = encounterDaMap.get(enc.analyzedEncounterRn);
      if (dauid) counts.set(dauid, (counts.get(dauid) ?? 0) + 1);
    }
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounters, encounterDaMap, metric, activeKeys]);

  const neighbourhoodCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const enc of encounters) {
      if (!encounterMatches(enc)) continue;
      const fsa = enc.geographicData?.postalCodePrefix;
      if (!fsa) continue;
      const nbhd = FSA_TO_NEIGHBORHOOD[fsa as keyof typeof FSA_TO_NEIGHBORHOOD];
      if (nbhd) counts.set(nbhd, (counts.get(nbhd) ?? 0) + 1);
    }
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounters, metric, activeKeys]);

  const fsaAggregates = useMemo(
    () => aggregateByFsa(encounters, metric, selectedKeys.length ? selectedKeys : undefined),
    [encounters, metric, selectedKeys],
  );

  // ── Dynamic filter keys derived from real encounter data ─────────────────

  const dynamicHealthKeys = useMemo(() => {
    const keyMap = new Map<string, string>();
    for (const enc of encounters) {
      for (const h of enc.healthIssues ?? []) {
        if (!keyMap.has(h.key)) keyMap.set(h.key, h.label);
      }
    }
    return Array.from(keyMap.entries()).map(([key, label]) => ({ key, label }));
  }, [encounters]);

  const dynamicDeterminantKeys = useMemo(() => {
    const keyMap = new Map<string, string>();
    for (const enc of encounters) {
      for (const d of enc.upstreamDeterminants ?? []) {
        if (!keyMap.has(d.key)) keyMap.set(d.key, d.label);
      }
    }
    return Array.from(keyMap.entries()).map(([key, label]) => ({ key, label }));
  }, [encounters]);

  const filterKeys = useMemo(
    () =>
      metric === 'healthIssue' ? dynamicHealthKeys
      : metric === 'determinant' ? dynamicDeterminantKeys
      : [],
    [metric, dynamicHealthKeys, dynamicDeterminantKeys],
  );

  // ── Derived totals & max for scaling ─────────────────────────────────────

  const totalCount = useMemo(() => {
    if (vizType === 'da') return [...daCounts.values()].reduce((s, c) => s + c, 0);
    if (vizType === 'neighbourhood') return [...neighbourhoodCounts.values()].reduce((s, c) => s + c, 0);
    return fsaAggregates.reduce((s, d) => s + d.count, 0);
  }, [vizType, daCounts, neighbourhoodCounts, fsaAggregates]);

  const maxDa = useMemo(() => Math.max(1, ...daCounts.values()), [daCounts]);
  const maxNbhd = useMemo(() => Math.max(1, ...neighbourhoodCounts.values()), [neighbourhoodCounts]);
  const maxBubble = useMemo(() => Math.max(1, ...fsaAggregates.map((d) => d.count)), [fsaAggregates]);

  // ── GeoJSON style callbacks ───────────────────────────────────────────────

  const daStyleKey = `${metric}-${selectedKeys.join(',')}-${daCounts.size}`;
  const nbhdStyleKey = `${metric}-${selectedKeys.join(',')}-${neighbourhoodCounts.size}`;

  const tileUrl = MAP_STYLES.find((s) => s.id === mapStyleId)?.url ?? MAP_STYLES[0].url;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: 'calc(100vh - 64px)' }}
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setHover((h) => h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
      }}
    >
      <MapContainer
        center={[DEFAULT_VIEW_STATE.latitude, DEFAULT_VIEW_STATE.longitude]}
        zoom={DEFAULT_VIEW_STATE.zoom}
        zoomControl={false}
        style={{ position: 'absolute', inset: 0, background: '#0b1d3a' }}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* ── Dissemination Area choropleth ─────────────────────────────── */}
        {vizType === 'da' && daGeoJson && (
          <GeoJSON
            key={`da-${daStyleKey}`}
            data={daGeoJson}
            style={(feature) => choroplethColor(daCounts.get(feature?.properties?.DAUID as string) ?? 0, maxDa)}
            onEachFeature={(feature, layer) => {
              layer.on({
                mouseover: (e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const count = daCounts.get(feature.properties?.DAUID as string) ?? 0;
                  setHover({
                    name: `DA ${feature.properties?.DAUID as string}`,
                    count,
                    x: e.originalEvent.clientX - rect.left,
                    y: e.originalEvent.clientY - rect.top,
                  });
                },
                mouseout: () => setHover(null),
              });
            }}
          />
        )}

        {/* ── Neighbourhood choropleth ──────────────────────────────────── */}
        {vizType === 'neighbourhood' && neighbourhoodGeoJson && (
          <GeoJSON
            key={`nbhd-${nbhdStyleKey}`}
            data={neighbourhoodGeoJson}
            style={(feature) =>
              choroplethColor(neighbourhoodCounts.get(feature?.properties?.name as string) ?? 0, maxNbhd)
            }
            onEachFeature={(feature, layer) => {
              layer.on({
                mouseover: (e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const name = feature.properties?.name as string;
                  const count = neighbourhoodCounts.get(name) ?? 0;
                  setHover({
                    name,
                    count,
                    x: e.originalEvent.clientX - rect.left,
                    y: e.originalEvent.clientY - rect.top,
                  });
                },
                mouseout: () => setHover(null),
              });
            }}
          />
        )}

        {/* ── Bubble map ───────────────────────────────────────────────── */}
        {vizType === 'bubble' &&
          fsaAggregates.map((d) => {
            const t = Math.sqrt(d.count / maxBubble);
            return (
              <CircleMarker
                key={d.fsa}
                center={[d.lat, d.lng]}
                radius={Math.max(5, t * 36)}
                pathOptions={{
                  fillColor: bubbleColor(t),
                  fillOpacity: 0.65,
                  color: 'rgba(255,255,255,0.25)',
                  weight: 1,
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setHover({
                      name: d.fsa,
                      count: d.count,
                      x: e.originalEvent.clientX - rect.left,
                      y: e.originalEvent.clientY - rect.top,
                    });
                  },
                  mouseout: () => setHover(null),
                }}
              />
            );
          })}
      </MapContainer>

      <Sidebar
        metric={metric}
        onMetricChange={(m) => { setMetric(m); setSelectedKeys([]); }}
        selectedKeys={selectedKeys}
        onKeysChange={setSelectedKeys}
        filterKeys={filterKeys}
        vizType={vizType}
        onVizTypeChange={setVizType}
        mapStyleId={mapStyleId}
        onMapStyleChange={setMapStyleId}
        totalCount={totalCount}
      />

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute bottom-8 right-4 z-[1000] rounded-lg px-3 py-2 text-xs"
        style={{ background: 'rgba(11,29,58,0.88)', border: '1px solid var(--gray-600)', minWidth: 130 }}
      >
        <p className="mb-1 font-semibold" style={{ color: 'var(--gray-300)' }}>
          {vizType === 'bubble' ? 'Encounter density' : 'Encounters per area'}
        </p>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--gray-400)' }}>Low</span>
          <div
            style={{
              height: 8, flex: 1, borderRadius: 4,
              background: 'linear-gradient(to right, rgb(0,201,167), rgb(255,140,0), rgb(220,38,38))',
            }}
          />
          <span style={{ color: 'var(--gray-400)' }}>High</span>
        </div>
      </div>

      {/* ── Hover tooltip ───────────────────────────────────────────────── */}
      {hover && (
        <div
          className="pointer-events-none absolute z-[1000] rounded-lg px-3 py-2 text-sm"
          style={{
            left: hover.x + 14,
            top: hover.y - 10,
            background: 'rgba(11,29,58,0.95)',
            border: '1px solid var(--gray-600)',
          }}
        >
          <p className="font-semibold" style={{ color: 'var(--white)' }}>{hover.name}</p>
          <p style={{ color: 'var(--gray-300)' }}>
            {hover.count} encounter{hover.count !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
