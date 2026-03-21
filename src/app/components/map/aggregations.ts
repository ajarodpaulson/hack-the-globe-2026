import { VANCOUVER_FSA_CENTROIDS } from '@/lib/vancouver-fsas';
import type { AnalyzedEncounter, FsaAggregate, MapMetric } from '@/lib/types';

/**
 * Aggregates raw encounters into per-FSA counts for the chosen metric.
 *
 * keys behaviour:
 *   undefined / empty → count all encounters (broadest view)
 *   one key           → only encounters that have that condition
 *   multiple keys     → encounters that have ANY of the conditions (OR)
 *   all keys selected → same result as empty (every encounter matches)
 */
export function aggregateByFsa(
  encounters: AnalyzedEncounter[],
  metric: MapMetric,
  keys?: string[],
): FsaAggregate[] {
  const counts = new Map<string, number>();
  const activeKeys = keys && keys.length > 0 ? new Set(keys) : null;

  for (const encounter of encounters) {
    const fsa = encounter.geographicData?.postalCodePrefix;
    if (!fsa || !VANCOUVER_FSA_CENTROIDS[fsa]) continue;

    let matches = false;

    if (metric === 'density') {
      matches = true;
    } else if (metric === 'healthIssue') {
      matches = activeKeys
        ? encounter.healthIssues.some((h) => activeKeys.has(h.key))
        : true;
    } else if (metric === 'determinant') {
      matches = activeKeys
        ? encounter.upstreamDeterminants.some((d) => activeKeys.has(d.key))
        : true;
    }

    if (matches) counts.set(fsa, (counts.get(fsa) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([fsa, count]) => {
    const [lat, lng] = VANCOUVER_FSA_CENTROIDS[fsa];
    return { fsa, lat, lng, count };
  });
}
