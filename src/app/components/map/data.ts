'use client';

import useSWR from 'swr';
import type { AnalyzedEncounter } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => {
      if (d.ok) return d.data as AnalyzedEncounter[];
      throw new Error(d.error ?? 'API error');
    });

export function useEncounterData(): {
  encounters: AnalyzedEncounter[];
  loading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useSWR<AnalyzedEncounter[]>(
    '/api/analysis',
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    encounters: data ?? [],
    loading: isLoading,
    error: error ?? null,
  };
}
