'use client';

import useSWR from 'swr';
import { mockEncounters } from '@/lib/mock-data';
import type { AnalyzedEncounter } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => {
      if (d.ok) return d.data as AnalyzedEncounter[];
      throw new Error(d.error ?? 'API error');
    });

/**
 * Fetches encounters from the real API (/api/analysis).
 * Falls back to mock data when the API is unavailable or returns an empty set,
 * so the map remains usable during development without a live backend.
 */
export function useEncounterData(): {
  encounters: AnalyzedEncounter[];
  loading: boolean;
  error: Error | null;
  isLive: boolean;
} {
  const { data, isLoading, error } = useSWR<AnalyzedEncounter[]>(
    '/api/analysis',
    fetcher,
    { revalidateOnFocus: false },
  );

  const isLive = !error && Array.isArray(data) && data.length > 0;
  const encounters = isLive ? data! : mockEncounters;

  return { encounters, loading: isLoading, error: error ?? null, isLive };
}
