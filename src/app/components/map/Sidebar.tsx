'use client';

import { useState } from 'react';
import { METRIC_CONFIGS, MAP_STYLES, VIZ_TYPES } from './config';
import type { MapMetric, VisualizationType } from '@/lib/types';

type SidebarProps = {
  metric: MapMetric;
  onMetricChange: (m: MapMetric) => void;
  selectedKeys: string[];
  onKeysChange: (keys: string[]) => void;
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

export function Sidebar({
  metric,
  onMetricChange,
  selectedKeys,
  onKeysChange,
  vizType,
  onVizTypeChange,
  mapStyleId,
  onMapStyleChange,
  totalCount,
}: SidebarProps) {
  const [open, setOpen] = useState(true);

  const filterKeys = METRIC_CONFIGS.find((m) => m.id === metric)?.keys ?? [];

  function toggleKey(key: string) {
    onKeysChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key],
    );
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
        <div className="flex flex-col w-60 h-full text-sm overflow-y-auto" style={PANEL}>

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

          {/* ── Spacer pushes the rest to the bottom ─────────────────────── */}
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
