import { useMemo } from 'react';
import { mockEncounters } from '@/lib/mock-data';
import type { AnalyzedEncounter } from '@/lib/types';

/**
 * Returns all raw encounter records.
 *
 * TO SWAP TO REAL API:
 *   Replace the body with your data fetching logic, e.g.:
 *
 *   const { data, isLoading, error } = useSWR<AnalyzedEncounter[]>('/api/encounters', fetcher);
 *   return { encounters: data ?? [], loading: isLoading, error: error ?? null };
 *
 * The rest of the map feature (aggregations, layers, sidebar) requires no changes.
 */
export function useEncounterData(): {
  encounters: AnalyzedEncounter[];
  loading: boolean;
  error: Error | null;
} {
  const encounters = useMemo(() => mockEncounters, []);
  return { encounters, loading: false, error: null };
}
