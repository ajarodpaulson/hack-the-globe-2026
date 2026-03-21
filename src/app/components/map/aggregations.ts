import { VANCOUVER_FSA_CENTROIDS } from '@/lib/vancouver-fsas';
import type { AnalyzedEncounter, FsaAggregate, MapMetric } from '@/lib/types';

/**
 * Aggregates raw encounters into per-FSA counts for the chosen metric.
 * Pure function — no side effects. Swap metric/key to re-aggregate without refetching.
 */
export function aggregateByFsa(
  encounters: AnalyzedEncounter[],
  metric: MapMetric,
  key?: string,
): FsaAggregate[] {
  const counts = new Map<string, number>();

  for (const encounter of encounters) {
    const fsa = encounter.geographicData?.postalCodePrefix;
    if (!fsa || !VANCOUVER_FSA_CENTROIDS[fsa]) continue;

    let increment = 0;

    if (metric === 'density') {
      increment = 1;
    } else if (metric === 'healthIssue') {
      const items = key
        ? encounter.healthIssues.filter((h) => h.key === key)
        : encounter.healthIssues;
      increment = items.length;
    } else if (metric === 'determinant') {
      const items = key
        ? encounter.upstreamDeterminants.filter((d) => d.key === key)
        : encounter.upstreamDeterminants;
      increment = items.length;
    }

    if (increment > 0) counts.set(fsa, (counts.get(fsa) ?? 0) + increment);
  }

  return Array.from(counts.entries()).map(([fsa, count]) => {
    const [lat, lng] = VANCOUVER_FSA_CENTROIDS[fsa];
    return { fsa, lat, lng, count };
  });
}
