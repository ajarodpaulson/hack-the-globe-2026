'use client';

import { useState } from 'react';
import { METRIC_CONFIGS, MAP_STYLES, VIZ_TYPES } from './config';
import type { DemographicFilters, MapMetric, VisualizationType } from '@/lib/types';

type DemoOption = { key: string; label: string };

type SidebarProps = {
  metric: MapMetric;
  onMetricChange: (m: MapMetric) => void;
  selectedKeys: string[];
  onKeysChange: (keys: string[]) => void;
  filterKeys: { key: string; label: string }[];
  demographicFilters: DemographicFilters;
  onDemographicChange: (filters: DemographicFilters) => void;
  dynamicDemoOptions: {
    age: DemoOption[];
    gender: DemoOption[];
    housingStatus: DemoOption[];
    employmentStatus: DemoOption[];
    incomeLevel: DemoOption[];
  };
  vizType: VisualizationType;
  onVizTypeChange: (v: VisualizationType) => void;
  mapStyleId: string;
  onMapStyleChange: (id: string) => void;
  totalCount: number;
};

const TEAL_ACTIVE = {
  background: 'rgba(0,201,167,0.15)',
  border: '1px solid rgba(0,201,167,0.5)',
  color: 'var(--teal)',
} as const;

const GHOST = {
  background: 'transparent',
  border: '1px solid transparent',
  color: 'var(--gray-300)',
} as const;

const CHIP_ACTIVE = {
  background: 'rgba(0,201,167,0.2)',
  border: '1px solid rgba(0,201,167,0.55)',
  color: 'var(--teal)',
} as const;

const CHIP_IDLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--gray-300)',
} as const;

const DEMO_LABELS: Record<keyof DemographicFilters, string> = {
  age:              'Age Range',
  gender:           'Gender',
  housingStatus:    'Housing Status',
  employmentStatus: 'Employment',
  incomeLevel:      'Income Level',
};

function DemoFilterGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: DemoOption[];
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  if (!options.length) return null;

  function toggle(key: string) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)' }}>
          {label}
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            style={{ fontSize: 10, color: 'var(--gray-500)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
          >
            clear
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {options.map(({ key, label: optLabel }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              ...(selected.includes(key) ? CHIP_ACTIVE : CHIP_IDLE),
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {optLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({
  metric,
  onMetricChange,
  selectedKeys,
  onKeysChange,
  filterKeys,
  demographicFilters,
  onDemographicChange,
  dynamicDemoOptions,
  vizType,
  onVizTypeChange,
  mapStyleId,
  onMapStyleChange,
  totalCount,
}: SidebarProps) {
  const [open, setOpen] = useState(true);
  const [demoOpen, setDemoOpen] = useState(true);

  const hasDemoFilters = Object.values(demographicFilters).some((v) => v.length > 0);

  function toggleKey(key: string) {
    onKeysChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key],
    );
  }

  function setDemoField<K extends keyof DemographicFilters>(field: K, keys: string[]) {
    onDemographicChange({ ...demographicFilters, [field]: keys });
  }

  function clearAllDemo() {
    onDemographicChange({ age: [], gender: [], housingStatus: [], employmentStatus: [], incomeLevel: [] });
  }

  const PANEL: React.CSSProperties = {
    background: 'rgba(11, 29, 58, 0.94)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="absolute top-0 left-0 bottom-0 z-[1000] flex">
      {open && (
        <div className="flex flex-col w-64 h-full text-sm overflow-y-auto" style={PANEL}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="px-4 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--teal)' }}>
              Community Pulse
            </p>
            <p className="font-bold text-base leading-tight" style={{ color: 'var(--white)' }}>
              Vancouver Health Map
            </p>
          </div>

          {/* ── Metric tabs ───────────────────────────────────────────────── */}
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gray-400)' }}>
              View by
            </p>
            <div className="flex flex-col gap-1">
              {METRIC_CONFIGS.map(({ id, label }) => {
                const shortLabel = id === 'density' ? 'Encounter Density'
                  : id === 'healthIssue' ? 'Health Issues'
                  : 'Determinants';
                return (
                  <button
                    key={id}
                    onClick={() => onMetricChange(id)}
                    className="rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                    style={metric === id ? TEAL_ACTIVE : GHOST}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Filter chips (only for health / determinant tabs) ─────────── */}
          {filterKeys.length > 0 && (
            <div className="px-3 pt-3 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
                  Filter
                </p>
                {selectedKeys.length > 0 && (
                  <button
                    onClick={() => onKeysChange([])}
                    className="text-xs rounded px-1.5 py-0.5 transition-colors"
                    style={{ color: 'var(--gray-400)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterKeys.map(({ key, label }) => {
                  const active = selectedKeys.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleKey(key)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                      style={active ? CHIP_ACTIVE : CHIP_IDLE}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedKeys.length === 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--gray-500)' }}>
                  All — tap chips to narrow
                </p>
              )}
            </div>
          )}

          {/* ── Demographics ─────────────────────────────────────────────── */}
          <div className="px-3 pt-3 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button
                onClick={() => setDemoOpen((o) => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
                  Demographics
                </p>
                <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>{demoOpen ? '▲' : '▼'}</span>
              </button>
              {hasDemoFilters && (
                <button
                  onClick={clearAllDemo}
                  className="text-xs rounded px-1.5 py-0.5"
                  style={{ color: 'var(--gray-400)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {demoOpen && (
              <div>
                {(Object.keys(DEMO_LABELS) as (keyof DemographicFilters)[]).map((field) => (
                  <DemoFilterGroup
                    key={field}
                    label={DEMO_LABELS[field]}
                    options={dynamicDemoOptions[field]}
                    selected={demographicFilters[field]}
                    onChange={(keys) => setDemoField(field, keys)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Spacer ────────────────────────────────────────────────────── */}
          <div className="flex-1" />

          {/* ── Visualization ────────────────────────────────────────────── */}
          <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gray-400)' }}>
              Visualization
            </p>
            <div className="flex flex-col gap-1">
              {VIZ_TYPES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onVizTypeChange(id)}
                  className="rounded-lg py-1.5 text-xs font-medium transition-colors text-left px-2"
                  style={
                    vizType === id
                      ? { background: 'rgba(255,255,255,0.12)', color: 'var(--white)' }
                      : { background: 'rgba(255,255,255,0.04)', color: 'var(--gray-400)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Map style ────────────────────────────────────────────────── */}
          <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gray-400)' }}>
              Map Style
            </p>
            <div className="flex gap-1.5">
              {MAP_STYLES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onMapStyleChange(id)}
                  className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
                  style={mapStyleId === id ? TEAL_ACTIVE : CHIP_IDLE}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Count ────────────────────────────────────────────────────── */}
          <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
              Showing
            </p>
            <p className="text-3xl font-bold mt-0.5" style={{ color: 'var(--white)' }}>
              {totalCount.toLocaleString()}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>
              {metric === 'density' ? 'encounters' : 'encounters matched'}
            </p>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ───────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="self-center flex items-center justify-center h-10 w-5 text-xs transition-colors"
        style={{
          background: 'rgba(11, 29, 58, 0.9)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0 6px 6px 0',
          color: 'var(--gray-400)',
        }}
        title={open ? 'Collapse' : 'Expand'}
      >
        {open ? '‹' : '›'}
      </button>
    </div>
  );
}
