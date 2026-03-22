'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PathOptions } from 'leaflet';

import { useEncounterData } from './data';
import { MAP_STYLES, DEFAULT_VIEW_STATE } from './config';
import { Sidebar } from './Sidebar';
import { DevTools } from './DevTools';
import { buildFeatureBboxIndex, findDauid } from './geo-utils';
import type { AnalyzedEncounter, DemographicFilters, MapMetric, VisualizationType } from '@/lib/types';

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

const GENDER_DISPLAY_MAP: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  man: 'Man',
  woman: 'Woman',
  non_binary: 'Non-binary',
  prefer_not_to_say: 'Prefer not to say',
};

const INCOME_LEVEL_DISPLAY_MAP: Record<string, string> = {
  very_low: 'Very Low',
  low: 'Low',
  lower_middle: 'Lower Middle',
  middle: 'Middle',
  upper_middle: 'Upper Middle',
  high: 'High',
};

const HOUSING_STATUS_DISPLAY_MAP: Record<string, string> = {
  stable: 'Stable',
  unstable: 'Unstable',
  homeless: 'Homeless',
  sheltered: 'Sheltered',
  unknown: 'Unknown',
};

const EMPLOYMENT_STATUS_DISPLAY_MAP: Record<string, string> = {
  employed: 'Employed',
  unemployed: 'Unemployed',
  underemployed: 'Underemployed',
  student: 'Student',
  retired: 'Retired',
  unable_to_work: 'Unable to Work',
  unknown: 'Unknown',
};

function formatStoredValue(value?: string, mapping?: Record<string, string>): string {
  if (!value) return 'Unknown';
  if (mapping?.[value]) return mapping[value];

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatEncounterDate(value?: string): string | null {
  if (!value) return null;

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate.toLocaleString();
}

function renderClassificationSummary(items: AnalyzedEncounter['healthIssues']): string {
  if (!items.length) return 'None recorded';

  return items.map((item) => item.label).join(', ');
}

function EncounterPopup({ encounter }: { encounter: AnalyzedEncounter }) {
  const createdAt = formatEncounterDate(encounter.createdAt);

  return (
    <div style={{ minWidth: 240, maxWidth: 280, color: '#0f172a' }}>
      {createdAt && (
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 10, fontWeight: 700 }}>
          {createdAt}
        </div>
      )}
      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
        <div><strong>Age:</strong> {formatStoredValue(encounter.biographicFactors?.ageRange)}</div>
        <div><strong>Gender:</strong> {formatStoredValue(encounter.biographicFactors?.gender, GENDER_DISPLAY_MAP)}</div>
        <div><strong>Housing:</strong> {formatStoredValue(encounter.biographicFactors?.housingStatus, HOUSING_STATUS_DISPLAY_MAP)}</div>
        <div><strong>Employment:</strong> {formatStoredValue(encounter.biographicFactors?.employmentStatus, EMPLOYMENT_STATUS_DISPLAY_MAP)}</div>
        <div><strong>Income:</strong> {formatStoredValue(encounter.biographicFactors?.incomeLevel, INCOME_LEVEL_DISPLAY_MAP)}</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        <div style={{ marginBottom: 6 }}>
          <strong>Health Issues:</strong> {renderClassificationSummary(encounter.healthIssues ?? [])}
        </div>
        <div>
          <strong>Upstream Determinants:</strong> {renderClassificationSummary(encounter.upstreamDeterminants ?? [])}
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MapView() {
  const { encounters } = useEncounterData();

  const [metric, setMetric] = useState<MapMetric>('density');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [demographicFilters, setDemographicFilters] = useState<DemographicFilters>({
    age: [], gender: [], housingStatus: [], employmentStatus: [], incomeLevel: [],
  });
  const [vizType, setVizType] = useState<VisualizationType>('da');
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

  // ── Pre-compute bbox indexes (once per GeoJSON load) ─────────────────────
  const daIndex = useMemo(
    () => (daGeoJson ? buildFeatureBboxIndex(daGeoJson.features, 'DAUID') : []),
    [daGeoJson],
  );

  const neighbourhoodIndex = useMemo(
    () => (neighbourhoodGeoJson ? buildFeatureBboxIndex(neighbourhoodGeoJson.features, 'name') : []),
    [neighbourhoodGeoJson],
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

  // ── Pre-assign each encounter to a neighbourhood name ────────────────────
  const encounterNeighbourhoodMap = useMemo(() => {
    if (!neighbourhoodIndex.length) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const enc of encounters) {
      const { lat, lng } = enc.geographicData ?? {};
      if (lat == null || lng == null) continue;
      const name = findDauid([lng, lat], neighbourhoodIndex);
      if (name) map.set(enc.analyzedEncounterRn, name);
    }
    return map;
  }, [encounters, neighbourhoodIndex]);

  // ── Filter helper ────────────────────────────────────────────────────────
  const activeKeys = useMemo(
    () => (selectedKeys.length ? new Set(selectedKeys) : null),
    [selectedKeys],
  );

  function encounterMatches(enc: (typeof encounters)[0]): boolean {
    // metric filter
    if (activeKeys && metric !== 'density') {
      if (metric === 'healthIssue' && !(enc.healthIssues ?? []).some((h) => activeKeys.has(h.key))) return false;
      if (metric === 'determinant' && !(enc.upstreamDeterminants ?? []).some((d) => activeKeys.has(d.key))) return false;
    }
    // demographic filters (applied on top of metric filter)
    const bf = enc.biographicFactors;
    if (demographicFilters.age.length             && !demographicFilters.age.includes(bf?.ageRange ?? ''))            return false;
    if (demographicFilters.gender.length          && !demographicFilters.gender.includes(bf?.gender ?? ''))           return false;
    if (demographicFilters.housingStatus.length   && !demographicFilters.housingStatus.includes(bf?.housingStatus ?? ''))   return false;
    if (demographicFilters.employmentStatus.length && !demographicFilters.employmentStatus.includes(bf?.employmentStatus ?? '')) return false;
    if (demographicFilters.incomeLevel.length     && !demographicFilters.incomeLevel.includes(bf?.incomeLevel ?? '')) return false;
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
  }, [encounters, encounterDaMap, metric, activeKeys, demographicFilters]);

  const neighbourhoodCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const enc of encounters) {
      if (!encounterMatches(enc)) continue;
      const name = encounterNeighbourhoodMap.get(enc.analyzedEncounterRn);
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounters, encounterNeighbourhoodMap, metric, activeKeys, demographicFilters]);

  // Bubble view: aggregate by neighbourhood, position at geo_point_2d centroid
  const bubbleAggregates = useMemo(() => {
    if (!neighbourhoodGeoJson) return [];
    const counts = new Map<string, number>();
    for (const enc of encounters) {
      if (!encounterMatches(enc)) continue;
      const name = encounterNeighbourhoodMap.get(enc.analyzedEncounterRn);
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const centroids = new Map<string, { lat: number; lng: number }>();
    for (const f of neighbourhoodGeoJson.features) {
      const name = f.properties?.name as string;
      const pt = f.properties?.geo_point_2d as { lon: number; lat: number } | undefined;
      if (name && pt) centroids.set(name, { lat: pt.lat, lng: pt.lon });
    }
    return Array.from(counts.entries())
      .map(([name, count]) => {
        const c = centroids.get(name);
        return c ? { name, lat: c.lat, lng: c.lng, count } : null;
      })
      .filter((x): x is { name: string; lat: number; lng: number; count: number } => x !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounters, encounterNeighbourhoodMap, neighbourhoodGeoJson, metric, activeKeys, demographicFilters]);

  const pointEncounters = useMemo(
    () => encounters.filter((enc) => {
      const { lat, lng } = enc.geographicData ?? {};
      if (lat == null || lng == null) return false;
      return encounterMatches(enc);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [encounters, metric, activeKeys, demographicFilters],
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

  function makeBiographicKeys(getter: (enc: typeof encounters[0]) => string | undefined, displayMap?: Record<string, string>) {
    const seen = new Set<string>();
    const result: { key: string; label: string }[] = [];
    for (const enc of encounters) {
      const val = getter(enc);
      if (val && !seen.has(val)) {
        seen.add(val);
        result.push({ key: val, label: displayMap?.[val] ?? formatStoredValue(val) });
      }
    }
    return result;
  }

  const dynamicDemoOptions = useMemo(() => ({
    age:              makeBiographicKeys((e) => e.biographicFactors?.ageRange),
    gender:           makeBiographicKeys((e) => e.biographicFactors?.gender,           GENDER_DISPLAY_MAP),
    housingStatus:    makeBiographicKeys((e) => e.biographicFactors?.housingStatus,    HOUSING_STATUS_DISPLAY_MAP),
    employmentStatus: makeBiographicKeys((e) => e.biographicFactors?.employmentStatus, EMPLOYMENT_STATUS_DISPLAY_MAP),
    incomeLevel:      makeBiographicKeys((e) => e.biographicFactors?.incomeLevel,      INCOME_LEVEL_DISPLAY_MAP),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [encounters]);

  const filterKeys = useMemo(
    () =>
      metric === 'healthIssue'   ? dynamicHealthKeys
      : metric === 'determinant' ? dynamicDeterminantKeys
      : [],
    [metric, dynamicHealthKeys, dynamicDeterminantKeys],
  );

  // ── Derived totals & max for scaling ─────────────────────────────────────

  const totalCount = useMemo(() => {
    if (vizType === 'da') return [...daCounts.values()].reduce((s, c) => s + c, 0);
    if (vizType === 'neighbourhood') return [...neighbourhoodCounts.values()].reduce((s, c) => s + c, 0);
    if (vizType === 'points') return pointEncounters.length;
    return bubbleAggregates.reduce((s, d) => s + d.count, 0);
  }, [vizType, daCounts, neighbourhoodCounts, bubbleAggregates, pointEncounters]);

  const maxDa = useMemo(() => Math.max(1, ...daCounts.values()), [daCounts]);
  const maxNbhd = useMemo(() => Math.max(1, ...neighbourhoodCounts.values()), [neighbourhoodCounts]);
  const maxBubble = useMemo(() => Math.max(1, ...bubbleAggregates.map((d) => d.count)), [bubbleAggregates]);

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
          bubbleAggregates.map((d) => {
            const t = Math.sqrt(d.count / maxBubble);
            return (
              <CircleMarker
                key={d.name}
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
                      name: d.name,
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

        {vizType === 'points' &&
          pointEncounters.map((encounter) => (
            <CircleMarker
              key={encounter.analyzedEncounterRn}
              center={[encounter.geographicData!.lat, encounter.geographicData!.lng]}
              radius={6}
              pathOptions={{
                fillColor: 'rgb(0,201,167)',
                fillOpacity: 0.85,
                color: 'rgba(255,255,255,0.9)',
                weight: 1,
              }}
            >
              <Popup>
                <EncounterPopup encounter={encounter} />
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      <Sidebar
        metric={metric}
        onMetricChange={(m) => { setMetric(m); setSelectedKeys([]); }}
        selectedKeys={selectedKeys}
        onKeysChange={setSelectedKeys}
        filterKeys={filterKeys}
        demographicFilters={demographicFilters}
        onDemographicChange={setDemographicFilters}
        dynamicDemoOptions={dynamicDemoOptions}
        vizType={vizType}
        onVizTypeChange={setVizType}
        mapStyleId={mapStyleId}
        onMapStyleChange={setMapStyleId}
        totalCount={totalCount}
      />

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      {vizType !== 'points' && (
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
      )}

      <DevTools />

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
