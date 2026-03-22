'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';

type Status = 'idle' | 'loading' | 'done' | 'error';

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [countStr, setCountStr] = useState('100');
  const [weighted, setWeighted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const { mutate } = useSWRConfig();

  async function runAction(url: string, body?: object) {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (json.ok) {
        setStatus('done');
        const base = json.inserted != null ? `Inserted ${json.inserted} records.` : 'Done.';
        setMessage(json.capped ? `${base} (capped at ${json.max})` : base);
        mutate('/api/analysis');
      } else {
        setStatus('error');
        setMessage(json.error ?? 'Unknown error');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Dev Tools"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          background: 'rgba(30,30,30,0.92)',
          color: '#aaa',
          border: '1px solid #444',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        🛠 Dev
      </button>
    );
  }

  const busy = status === 'loading';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: 'rgba(18,18,18,0.96)',
        color: '#e0e0e0',
        border: '1px solid #444',
        borderRadius: 10,
        padding: 16,
        width: 220,
        fontSize: 13,
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontWeight: 600, color: '#fff' }}>Dev Tools</span>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <label style={{ display: 'block', marginBottom: 4, color: '#aaa', fontSize: 11 }}>
        Records to seed
      </label>
      <input
        type="number"
        min={1}
        max={100000}
        value={countStr}
        onChange={(e) => setCountStr(e.target.value)}
        disabled={busy}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '5px 8px',
          borderRadius: 5,
          border: '1px solid #555',
          background: '#2a2a2a',
          color: '#fff',
          fontSize: 13,
          marginBottom: 10,
        }}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, cursor: 'pointer', color: '#aaa', fontSize: 12 }}>
        <input
          type="checkbox"
          checked={weighted}
          onChange={(e) => setWeighted(e.target.checked)}
          disabled={busy}
          style={{ accentColor: '#0070f3', cursor: 'pointer' }}
        />
        Example weighted distribution
      </label>

      <button
        onClick={() => runAction('/api/dev/seed', {
          count: parseInt(countStr, 10) || 100,
          mode: weighted ? 'weighted' : 'random',
        })}
        disabled={busy}
        style={{
          width: '100%',
          padding: '7px 0',
          borderRadius: 5,
          border: 'none',
          background: busy ? '#555' : '#0070f3',
          color: '#fff',
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
          marginBottom: 6,
          fontSize: 13,
        }}
      >
        {busy ? 'Working…' : '⬆ Seed DB'}
      </button>

      <button
        onClick={() => runAction('/api/dev/reset')}
        disabled={busy}
        style={{
          width: '100%',
          padding: '7px 0',
          borderRadius: 5,
          border: '1px solid #c0392b',
          background: 'transparent',
          color: busy ? '#888' : '#e74c3c',
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
          fontSize: 13,
        }}
      >
        {busy ? 'Working…' : '🗑 Reset DB'}
      </button>

      {message && (
        <div
          style={{
            marginTop: 10,
            padding: '6px 8px',
            borderRadius: 5,
            background: status === 'error' ? 'rgba(192,57,43,0.2)' : 'rgba(39,174,96,0.2)',
            color: status === 'error' ? '#e74c3c' : '#2ecc71',
            fontSize: 11,
            wordBreak: 'break-word',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
