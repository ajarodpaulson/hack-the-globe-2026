'use client';

import { useState } from 'react';
import { METRIC_CONFIGS, MAP_STYLES, VIZ_TYPES } from './config';
import type { MapMetric, VisualizationType } from '@/lib/types';

type SidebarProps = {
  metric: MapMetric;
  onMetricChange: (m: MapMetric) => void;
  selectedKey: string;
  onKeyChange: (k: string) => void;
  vizType: VisualizationType;
  onVizTypeChange: (v: VisualizationType) => void;
  mapStyleId: string;
  onMapStyleChange: (id: string) => void;
  totalCount: number;
};

export function Sidebar({
  metric,
  onMetricChange,
  selectedKey,
  onKeyChange,
  vizType,
  onVizTypeChange,
  mapStyleId,
  onMapStyleChange,
  totalCount,
}: SidebarProps) {
  const [open, setOpen] = useState(true);

  const filterKeys = METRIC_CONFIGS.find((m) => m.id === metric)?.keys ?? [];

  return (
    <div className="absolute top-4 left-4 z-10 flex items-start gap-1.5">
      {open && (
        <div
          className="w-60 rounded-xl p-4 space-y-4 text-sm"
          style={{
            background: 'rgba(11, 29, 58, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-300)' }}>
              Community Pulse
            </p>
            <p className="font-semibold" style={{ color: 'var(--white)' }}>
              Vancouver Health Map
            </p>
          </div>

          <SidebarSection label="Metric">
            <div className="flex flex-col gap-1">
              {METRIC_CONFIGS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { onMetricChange(id); onKeyChange(''); }}
                  className="rounded-lg px-3 py-1.5 text-left text-sm transition-colors"
                  style={
                    metric === id
                      ? { background: 'rgba(0,201,167,0.15)', border: '1px solid rgba(0,201,167,0.4)', color: 'var(--teal)' }
                      : { color: 'var(--gray-300)', border: '1px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </SidebarSection>

          {filterKeys.length > 0 && (
            <SidebarSection label="Filter">
              <select
                value={selectedKey}
                onChange={(e) => onKeyChange(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                style={{
                  background: 'var(--navy-light)',
                  border: '1px solid var(--gray-600)',
                  color: 'var(--white)',
                }}
              >
                <option value="">All</option>
                {filterKeys.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </SidebarSection>
          )}

          <SidebarSection label="Visualization">
            <div className="flex gap-2">
              {VIZ_TYPES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onVizTypeChange(id)}
                  className="flex-1 rounded-lg py-1.5 text-sm transition-colors"
                  style={
                    vizType === id
                      ? { background: 'var(--gray-500)', color: 'var(--white)' }
                      : { background: 'var(--navy-light)', color: 'var(--gray-300)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection label="Map Style">
            <div className="flex gap-1.5">
              {MAP_STYLES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onMapStyleChange(id)}
                  className="flex-1 rounded-lg py-1.5 text-xs transition-colors"
                  style={
                    mapStyleId === id
                      ? { background: 'rgba(0,201,167,0.15)', border: '1px solid rgba(0,201,167,0.4)', color: 'var(--teal)' }
                      : { background: 'var(--navy-light)', border: '1px solid transparent', color: 'var(--gray-300)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </SidebarSection>

          {totalCount > 0 && (
            <div style={{ borderTop: '1px solid var(--gray-600)', paddingTop: '12px' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>Showing</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--white)' }}>{totalCount}</p>
              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                {metric === 'density' ? 'encounters' : 'occurrences'}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors"
        style={{
          background: 'rgba(11, 29, 58, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--gray-300)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {open ? '←' : '→'}
      </button>
    </div>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>{label}</p>
      {children}
    </div>
  );
}
