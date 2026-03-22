/**
 * Vancouver encounter generator.
 * Two modes:
 *   generateRandomClusterRecords(n) — random clusters each call, different spatial pattern per run
 *   generateSeedRecords(n)          — fixed Vancouver health-equity hotspot zones (deterministic)
 */

import type { AnalyzedEncounter } from './types';

// ── LCG helpers ────────────────────────────────────────────────────────────
function makeLcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
}
function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
function pickWeighted<T>(table: readonly [T, number][], rng: () => number): T {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of table) { r -= w; if (r <= 0) return item; }
  return table[table.length - 1][0];
}
function gaussian(mean: number, std: number, rng: () => number): number {
  const u = 1 - rng(), v = rng();
  return mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * std;
}
function pickWeightedSome<T extends { key: string }>(
  items: readonly T[], weights: Record<string, number>, count: number, rng: () => number,
): T[] {
  const pool: [T, number][] = items.map((item) => [item, weights[item.key] ?? 1]);
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let r = rng() * total;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j][1];
      if (r <= 0) { result.push(pool[j][0]); pool.splice(j, 1); break; }
    }
  }
  return result;
}

// ── Shared classification lists ────────────────────────────────────────────
const HEALTH_ISSUES = [
  { key: 'mental_health',  label: 'Mental Health' },
  { key: 'substance_use',  label: 'Substance Use' },
  { key: 'chronic_pain',   label: 'Chronic Pain' },
  { key: 'diabetes',       label: 'Diabetes' },
  { key: 'hypertension',   label: 'Hypertension' },
  { key: 'respiratory',    label: 'Respiratory Issues' },
] as const;

const DETERMINANTS = [
  { key: 'housing_instability',  label: 'Housing Instability' },
  { key: 'food_insecurity',      label: 'Food Insecurity' },
  { key: 'income_poverty',       label: 'Income/Poverty' },
  { key: 'social_isolation',     label: 'Social Isolation' },
  { key: 'employment_barriers',  label: 'Employment Barriers' },
  { key: 'language_barriers',    label: 'Language Barriers' },
  { key: 'transportation',       label: 'Transportation Barriers' },
] as const;

type HealthKey = typeof HEALTH_ISSUES[number]['key'];
type DetermKey = typeof DETERMINANTS[number]['key'];

const GENDERS:    readonly [string, number][] = [['male',45],['female',40],['non-binary',10],['other',5]];
const LANGUAGES  = ['english','cantonese','mandarin','punjabi','spanish','tagalog','vietnamese','french'] as const;
const ETHNICITIES = ['White','Indigenous','South Asian','Chinese','Filipino','Black','Latin American','Southeast Asian'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// RANDOM CLUSTER MODE
// ═══════════════════════════════════════════════════════════════════════════

// Land anchor points covering all Vancouver neighbourhoods.
// Dense enough that 35–55 random picks will blanket the whole city.
const VANCOUVER_LAND_ANCHORS = [
  // Downtown / Robson / Coal Harbour
  { lat: 49.2830, lng: -123.1207 },
  { lat: 49.2855, lng: -123.1270 },
  { lat: 49.2820, lng: -123.1150 },
  // West End / Davie / Denman
  { lat: 49.2795, lng: -123.1350 },
  { lat: 49.2810, lng: -123.1430 },
  { lat: 49.2855, lng: -123.1338 },
  { lat: 49.2840, lng: -123.1480 },
  // Yaletown / False Creek North
  { lat: 49.2760, lng: -123.1175 },
  { lat: 49.2730, lng: -123.1240 },
  // Gastown / DTES / Strathcona
  { lat: 49.2818, lng: -123.0958 },
  { lat: 49.2801, lng: -123.1012 },
  { lat: 49.2836, lng: -123.0901 },
  { lat: 49.2748, lng: -123.0840 },
  { lat: 49.2700, lng: -123.0800 },
  // Grandview-Woodland / Commercial Drive
  { lat: 49.2724, lng: -123.0700 },
  { lat: 49.2750, lng: -123.0760 },
  { lat: 49.2695, lng: -123.0655 },
  // Hastings-Sunrise / Renfrew
  { lat: 49.2834, lng: -123.0560 },
  { lat: 49.2810, lng: -123.0490 },
  { lat: 49.2790, lng: -123.0390 },
  { lat: 49.2760, lng: -123.0380 },
  // Kensington–Cedar Cottage
  { lat: 49.2490, lng: -123.0680 },
  { lat: 49.2520, lng: -123.0750 },
  { lat: 49.2550, lng: -123.0820 },
  // Renfrew–Collingwood / Killarney
  { lat: 49.2380, lng: -123.0450 },
  { lat: 49.2340, lng: -123.0450 },
  { lat: 49.2440, lng: -123.0600 },
  { lat: 49.2300, lng: -123.0550 },
  // East Van mid
  { lat: 49.2620, lng: -123.0430 },
  { lat: 49.2580, lng: -123.0390 },
  { lat: 49.2650, lng: -123.0510 },
  // Victoria-Fraserview / Champlain Heights
  { lat: 49.2240, lng: -123.0370 },
  { lat: 49.2200, lng: -123.0430 },
  { lat: 49.2240, lng: -123.0500 },
  // South Vancouver / Sunset
  { lat: 49.2240, lng: -123.0630 },
  { lat: 49.2195, lng: -123.0580 },
  { lat: 49.2175, lng: -123.0720 },
  { lat: 49.2200, lng: -123.0800 },
  // Marpole
  { lat: 49.2140, lng: -123.1165 },
  { lat: 49.2170, lng: -123.1080 },
  { lat: 49.2120, lng: -123.1250 },
  // Oakridge / Langara
  { lat: 49.2300, lng: -123.0890 },
  { lat: 49.2250, lng: -123.0840 },
  { lat: 49.2330, lng: -123.1020 },
  { lat: 49.2270, lng: -123.1100 },
  // Riley Park / Mt Pleasant
  { lat: 49.2570, lng: -123.1020 },
  { lat: 49.2530, lng: -123.0980 },
  { lat: 49.2658, lng: -123.1075 },
  // Cambie corridor / South Cambie
  { lat: 49.2565, lng: -123.1230 },
  { lat: 49.2450, lng: -123.1160 },
  { lat: 49.2380, lng: -123.1160 },
  // Fairview
  { lat: 49.2640, lng: -123.1240 },
  { lat: 49.2605, lng: -123.1185 },
  // South Granville / Shaughnessy
  { lat: 49.2490, lng: -123.1380 },
  { lat: 49.2565, lng: -123.1360 },
  { lat: 49.2420, lng: -123.1420 },
  { lat: 49.2350, lng: -123.1380 },
  // Kitsilano
  { lat: 49.2660, lng: -123.1600 },
  { lat: 49.2640, lng: -123.1505 },
  { lat: 49.2680, lng: -123.1700 },
  { lat: 49.2620, lng: -123.1650 },
  // Arbutus Ridge / Kerrisdale
  { lat: 49.2490, lng: -123.1540 },
  { lat: 49.2380, lng: -123.1600 },
  { lat: 49.2430, lng: -123.1680 },
  { lat: 49.2310, lng: -123.1560 },
  // Dunbar / Southlands
  { lat: 49.2490, lng: -123.1850 },
  { lat: 49.2450, lng: -123.1780 },
  { lat: 49.2350, lng: -123.1850 },
  { lat: 49.2530, lng: -123.1950 },
  // Point Grey (capped at -123.200 to stay within Vancouver limits)
  { lat: 49.2690, lng: -123.1820 },
  { lat: 49.2530, lng: -123.1790 },
  { lat: 49.2600, lng: -123.1980 },
  { lat: 49.2550, lng: -123.2050 },
] as const;

// Eight distinct community archetypes.
// Each has strongly differentiated health + determinant profiles,
// plus correlated demographic weights. This ensures that filtering
// by a health condition or determinant reveals spatially distinct clusters.
type ArchetypeProfile = {
  healthWeights:    Record<HealthKey, number>;
  determWeights:    Record<DetermKey, number>;
  ageWeights:       readonly [string, number][];
  housingWeights:   readonly [string, number][];
  employmentWeights: readonly [string, number][];
  incomeWeights:    readonly [string, number][];
};

// Each archetype has ONE dominant health issue (weight 100) and ONE dominant determinant pair.
// All other conditions are near-zero (weight 1-2) so a single health issue pick almost always
// lands on the defining condition. This makes filter selection show dramatically different areas.
const CLUSTER_ARCHETYPES: readonly ArchetypeProfile[] = [
  // 1. Substance use — street-involved, homeless, young adult
  {
    healthWeights: { substance_use:100, mental_health:2, chronic_pain:1, respiratory:1, diabetes:1, hypertension:1 },
    determWeights: { housing_instability:100, food_insecurity:80, income_poverty:2, social_isolation:2, employment_barriers:2, language_barriers:1, transportation:1 },
    ageWeights:        [['18-24',25],['25-34',38],['35-44',25],['45-54',10],['55-64',2]],
    housingWeights:    [['homeless',50],['sheltered',28],['unstable',18],['stable',4]],
    employmentWeights: [['unemployed',42],['unable_to_work',38],['underemployed',14],['employed',5],['retired',1]],
    incomeWeights:     [['very_low',70],['low',25],['lower_middle',4],['middle',1],['upper_middle',0]],
  },
  // 2. Mental health — young adult, housing instability, social isolation
  {
    healthWeights: { mental_health:100, substance_use:2, chronic_pain:1, respiratory:1, diabetes:1, hypertension:1 },
    determWeights: { social_isolation:100, employment_barriers:80, housing_instability:2, income_poverty:2, food_insecurity:2, language_barriers:1, transportation:1 },
    ageWeights:        [['13-17',8],['18-24',32],['25-34',35],['35-44',18],['45-54',7]],
    housingWeights:    [['unstable',42],['homeless',20],['sheltered',18],['stable',20]],
    employmentWeights: [['unemployed',35],['underemployed',26],['unable_to_work',22],['student',12],['employed',5]],
    incomeWeights:     [['very_low',42],['low',35],['lower_middle',14],['middle',8],['upper_middle',1]],
  },
  // 3. Diabetes — immigrant family, language barriers, middle-age
  {
    healthWeights: { diabetes:100, hypertension:2, chronic_pain:1, respiratory:1, mental_health:1, substance_use:1 },
    determWeights: { language_barriers:100, transportation:80, employment_barriers:2, income_poverty:2, food_insecurity:2, social_isolation:1, housing_instability:1 },
    ageWeights:        [['25-34',22],['35-44',32],['45-54',28],['55-64',12],['65-74',6]],
    housingWeights:    [['stable',48],['unstable',28],['sheltered',14],['homeless',5],['unknown',5]],
    employmentWeights: [['underemployed',38],['employed',28],['unemployed',22],['unable_to_work',8],['retired',4]],
    incomeWeights:     [['lower_middle',36],['low',32],['very_low',18],['middle',12],['upper_middle',2]],
  },
  // 4. Hypertension — elderly, socially isolated, stable housing
  {
    healthWeights: { hypertension:100, diabetes:2, chronic_pain:1, respiratory:1, mental_health:1, substance_use:1 },
    determWeights: { social_isolation:100, transportation:80, income_poverty:2, language_barriers:2, food_insecurity:2, employment_barriers:1, housing_instability:1 },
    ageWeights:        [['45-54',8],['55-64',22],['65-74',38],['75+',32]],
    housingWeights:    [['stable',58],['unstable',22],['sheltered',14],['homeless',4],['unknown',2]],
    employmentWeights: [['retired',62],['unable_to_work',26],['unemployed',8],['employed',3],['underemployed',1]],
    incomeWeights:     [['low',36],['lower_middle',28],['very_low',22],['middle',12],['upper_middle',2]],
  },
  // 5. Chronic pain — working poor, underemployed, income poverty
  {
    healthWeights: { chronic_pain:100, hypertension:2, mental_health:1, respiratory:1, diabetes:1, substance_use:1 },
    determWeights: { income_poverty:100, employment_barriers:80, food_insecurity:2, housing_instability:2, transportation:2, social_isolation:1, language_barriers:1 },
    ageWeights:        [['25-34',18],['35-44',32],['45-54',30],['55-64',14],['65-74',6]],
    housingWeights:    [['unstable',42],['stable',32],['sheltered',16],['homeless',10]],
    employmentWeights: [['underemployed',44],['employed',26],['unemployed',20],['unable_to_work',8],['retired',2]],
    incomeWeights:     [['low',42],['very_low',28],['lower_middle',22],['middle',7],['upper_middle',1]],
  },
  // 6. Respiratory — near industrial / traffic corridors, families with children
  {
    healthWeights: { respiratory:100, hypertension:2, chronic_pain:1, diabetes:1, mental_health:1, substance_use:1 },
    determWeights: { transportation:100, food_insecurity:80, income_poverty:2, employment_barriers:2, language_barriers:2, social_isolation:1, housing_instability:1 },
    ageWeights:        [['0-4',12],['5-12',14],['13-17',10],['18-24',14],['25-34',22],['35-44',18],['45-54',10]],
    housingWeights:    [['stable',42],['unstable',34],['sheltered',14],['homeless',10]],
    employmentWeights: [['employed',30],['underemployed',30],['unemployed',20],['unable_to_work',12],['student',8]],
    incomeWeights:     [['low',38],['very_low',30],['lower_middle',22],['middle',8],['upper_middle',2]],
  },
  // 7. Substance use + mental health — co-occurring, youth/young adult
  {
    healthWeights: { substance_use:60, mental_health:40, chronic_pain:1, respiratory:1, diabetes:1, hypertension:1 },
    determWeights: { housing_instability:60, social_isolation:40, food_insecurity:2, income_poverty:2, employment_barriers:2, transportation:1, language_barriers:1 },
    ageWeights:        [['13-17',15],['18-24',42],['25-34',30],['35-44',10],['45-54',3]],
    housingWeights:    [['homeless',38],['unstable',36],['sheltered',20],['stable',6]],
    employmentWeights: [['unemployed',38],['student',22],['unable_to_work',22],['underemployed',14],['employed',4]],
    incomeWeights:     [['very_low',60],['low',30],['lower_middle',8],['middle',2],['upper_middle',0]],
  },
  // 8. Diabetes + hypertension — metabolic, newcomer elderly, food insecurity
  {
    healthWeights: { diabetes:55, hypertension:45, chronic_pain:1, respiratory:1, mental_health:1, substance_use:1 },
    determWeights: { language_barriers:55, food_insecurity:45, income_poverty:2, transportation:2, social_isolation:2, employment_barriers:1, housing_instability:1 },
    ageWeights:        [['35-44',15],['45-54',25],['55-64',30],['65-74',22],['75+',8]],
    housingWeights:    [['stable',50],['unstable',28],['sheltered',14],['homeless',4],['unknown',4]],
    employmentWeights: [['retired',42],['underemployed',26],['employed',18],['unable_to_work',10],['unemployed',4]],
    incomeWeights:     [['low',35],['lower_middle',30],['very_low',20],['middle',13],['upper_middle',2]],
  },
];

export function generateRandomClusterRecords(count: number): Omit<AnalyzedEncounter, 'analyzedEncounterRn'>[] {
  // True randomness: seed from both clock and Math.random to avoid same-millisecond collisions
  const rng = makeLcg((Date.now() ^ (Math.random() * 0xffffffff | 0)) >>> 0);

  // 65–80 clusters so most of the city gets coverage at 10k+ records
  const numClusters = 65 + Math.floor(rng() * 16);
  const clusters = Array.from({ length: numClusters }, () => {
    const anchor = VANCOUVER_LAND_ANCHORS[Math.floor(rng() * VANCOUVER_LAND_ANCHORS.length)];
    return {
      lat:       anchor.lat,
      lng:       anchor.lng,
      std:       0.002 + rng() * 0.003,                   // 220 m – 550 m spread per cluster
      weight:    Math.exp(rng() * 2.5),                   // log-normal size variance
      archetype: CLUSTER_ARCHETYPES[Math.floor(rng() * CLUSTER_ARCHETYPES.length)],
    };
  });

  const clusterTable = clusters.map((c) => [c, c.weight] as [typeof c, number]);
  const records: Omit<AnalyzedEncounter, 'analyzedEncounterRn'>[] = [];

  for (let i = 0; i < count; i++) {
    const cluster = pickWeighted(clusterTable as readonly [typeof clusters[0], number][], rng);
    const { archetype } = cluster;

    // Clamp to Vancouver land bbox so no point ends up in the ocean or surrounding cities
    const rawLat = gaussian(cluster.lat, cluster.std, rng);
    const rawLng = gaussian(cluster.lng, cluster.std, rng);
    const lat = parseFloat(Math.min(Math.max(rawLat, 49.200), 49.285).toFixed(6));
    const lng = parseFloat(Math.min(Math.max(rawLng, -123.212), -123.033).toFixed(6));

    records.push({
      geographicData: { lat, lng },
      biographicFactors: {
        ageRange:         pickWeighted(archetype.ageWeights,       rng),
        gender:           pickWeighted(GENDERS,                    rng),
        incomeLevel:      pickWeighted(archetype.incomeWeights,     rng),
        housingStatus:    pickWeighted(archetype.housingWeights,    rng),
        employmentStatus: pickWeighted(archetype.employmentWeights, rng),
        language:         pick(LANGUAGES,                          rng),
        raceEthnicity:    [pick(ETHNICITIES,                       rng)],
      },
      healthIssues:         pickWeightedSome(HEALTH_ISSUES, archetype.healthWeights, 1, rng),
      upstreamDeterminants: pickWeightedSome(DETERMINANTS,  archetype.determWeights, 1 + Math.floor(rng() * 2), rng),
    });
  }

  return records;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEIGHTED EXAMPLE MODE  (fixed Vancouver health-equity hotspot zones)
// ═══════════════════════════════════════════════════════════════════════════

const HOTSPOT_ZONES = [
  { lat: 49.2818, lng: -123.0958, fsa: 'V6A', weight: 22, std: 0.003 },
  { lat: 49.2801, lng: -123.1012, fsa: 'V6A', weight: 18, std: 0.003 },
  { lat: 49.2836, lng: -123.0901, fsa: 'V6A', weight: 14, std: 0.002 },
  { lat: 49.2780, lng: -123.1060, fsa: 'V6A', weight: 12, std: 0.002 },
  { lat: 49.2848, lng: -123.0840, fsa: 'V6A', weight:  8, std: 0.002 },
  { lat: 49.2827, lng: -123.1207, fsa: 'V6B', weight: 10, std: 0.003 },
  { lat: 49.2796, lng: -123.1180, fsa: 'V6B', weight:  7, std: 0.002 },
  { lat: 49.2860, lng: -123.1150, fsa: 'V6B', weight:  5, std: 0.002 },
  { lat: 49.2895, lng: -123.1225, fsa: 'V6C', weight:  6, std: 0.002 },
  { lat: 49.2920, lng: -123.1100, fsa: 'V6C', weight:  4, std: 0.002 },
  { lat: 49.2855, lng: -123.1338, fsa: 'V6E', weight:  6, std: 0.003 },
  { lat: 49.2880, lng: -123.1395, fsa: 'V6E', weight:  4, std: 0.002 },
  { lat: 49.2834, lng: -123.0560, fsa: 'V5K', weight: 12, std: 0.003 },
  { lat: 49.2810, lng: -123.0490, fsa: 'V5K', weight:  8, std: 0.002 },
  { lat: 49.2790, lng: -123.0620, fsa: 'V5K', weight:  6, std: 0.002 },
  { lat: 49.2724, lng: -123.0700, fsa: 'V5L', weight: 10, std: 0.003 },
  { lat: 49.2695, lng: -123.0655, fsa: 'V5L', weight:  7, std: 0.002 },
  { lat: 49.2750, lng: -123.0760, fsa: 'V5L', weight:  5, std: 0.002 },
  { lat: 49.2490, lng: -123.0680, fsa: 'V5N', weight:  8, std: 0.003 },
  { lat: 49.2440, lng: -123.0600, fsa: 'V5N', weight:  7, std: 0.002 },
  { lat: 49.2520, lng: -123.0750, fsa: 'V5N', weight:  5, std: 0.002 },
  { lat: 49.2620, lng: -123.0430, fsa: 'V5M', weight:  8, std: 0.003 },
  { lat: 49.2580, lng: -123.0390, fsa: 'V5M', weight:  6, std: 0.002 },
  { lat: 49.2380, lng: -123.0410, fsa: 'V5R', weight:  7, std: 0.003 },
  { lat: 49.2340, lng: -123.0450, fsa: 'V5R', weight:  5, std: 0.002 },
  { lat: 49.2650, lng: -123.0965, fsa: 'V5T', weight:  8, std: 0.003 },
  { lat: 49.2680, lng: -123.0920, fsa: 'V5T', weight:  5, std: 0.002 },
  { lat: 49.2240, lng: -123.0630, fsa: 'V5P', weight:  6, std: 0.003 },
  { lat: 49.2195, lng: -123.0580, fsa: 'V5P', weight:  5, std: 0.002 },
  { lat: 49.2570, lng: -123.1020, fsa: 'V5V', weight:  6, std: 0.003 },
  { lat: 49.2530, lng: -123.0980, fsa: 'V5V', weight:  5, std: 0.002 },
  { lat: 49.2658, lng: -123.1132, fsa: 'V5Y', weight:  7, std: 0.003 },
  { lat: 49.2620, lng: -123.1075, fsa: 'V5Y', weight:  5, std: 0.002 },
  { lat: 49.2640, lng: -123.1240, fsa: 'V5Z', weight:  6, std: 0.003 },
  { lat: 49.2605, lng: -123.1185, fsa: 'V5Z', weight:  4, std: 0.002 },
  { lat: 49.2300, lng: -123.0890, fsa: 'V5W', weight:  6, std: 0.003 },
  { lat: 49.2250, lng: -123.0840, fsa: 'V5W', weight:  4, std: 0.002 },
  { lat: 49.2240, lng: -123.0370, fsa: 'V5S', weight:  5, std: 0.003 },
  { lat: 49.2195, lng: -123.0420, fsa: 'V5S', weight:  4, std: 0.002 },
  { lat: 49.2240, lng: -123.0680, fsa: 'V5X', weight:  5, std: 0.003 },
  { lat: 49.2175, lng: -123.0720, fsa: 'V5X', weight:  3, std: 0.002 },
  { lat: 49.2565, lng: -123.1360, fsa: 'V6H', weight:  4, std: 0.003 },
  { lat: 49.2520, lng: -123.1310, fsa: 'V6H', weight:  3, std: 0.002 },
  { lat: 49.2170, lng: -123.1080, fsa: 'V6P', weight:  4, std: 0.003 },
  { lat: 49.2140, lng: -123.1165, fsa: 'V6P', weight:  3, std: 0.002 },
  { lat: 49.2660, lng: -123.1505, fsa: 'V6J', weight:  3, std: 0.003 },
  { lat: 49.2660, lng: -123.1600, fsa: 'V6K', weight:  4, std: 0.003 },
  { lat: 49.2490, lng: -123.1540, fsa: 'V6M', weight:  2, std: 0.003 },
  { lat: 49.2690, lng: -123.1820, fsa: 'V6R', weight:  2, std: 0.003 },
  { lat: 49.2530, lng: -123.1790, fsa: 'V6S', weight:  2, std: 0.003 },
  { lat: 49.2606, lng: -123.2460, fsa: 'V6T', weight:  2, std: 0.004 },
] as const;

const FSA_HEALTH_WEIGHTS: Record<string, Record<HealthKey, number>> = {
  V6A: { substance_use:80, mental_health:65, chronic_pain:30, hypertension:10, diabetes:8,  respiratory:15 },
  V6B: { mental_health:55, substance_use:40, chronic_pain:20, hypertension:20, diabetes:10, respiratory:15 },
  V6C: { mental_health:50, substance_use:35, chronic_pain:18, hypertension:20, diabetes:10, respiratory:10 },
  V6E: { mental_health:55, substance_use:35, chronic_pain:18, hypertension:18, diabetes:8,  respiratory:12 },
  V5K: { mental_health:50, chronic_pain:40, substance_use:25, hypertension:30, diabetes:20, respiratory:20 },
  V5L: { mental_health:48, chronic_pain:38, substance_use:22, hypertension:28, diabetes:22, respiratory:18 },
  V5N: { mental_health:40, chronic_pain:35, hypertension:32, diabetes:28, substance_use:18, respiratory:22 },
  V5M: { mental_health:42, chronic_pain:36, hypertension:34, diabetes:25, substance_use:18, respiratory:20 },
  V5R: { mental_health:38, chronic_pain:34, hypertension:35, diabetes:30, substance_use:15, respiratory:22 },
  V5T: { mental_health:45, substance_use:30, chronic_pain:32, hypertension:25, diabetes:18, respiratory:18 },
  V5P: { diabetes:65, hypertension:55, respiratory:30, chronic_pain:25, mental_health:18, substance_use:8  },
  V5W: { diabetes:62, hypertension:52, respiratory:32, chronic_pain:22, mental_health:16, substance_use:7  },
  V5X: { diabetes:60, hypertension:50, respiratory:28, chronic_pain:20, mental_health:15, substance_use:6  },
  V5S: { diabetes:60, hypertension:50, respiratory:30, chronic_pain:22, mental_health:16, substance_use:7  },
  V5V: { diabetes:40, hypertension:40, chronic_pain:35, mental_health:30, substance_use:15, respiratory:20 },
  V5Y: { mental_health:38, chronic_pain:30, hypertension:32, diabetes:28, substance_use:18, respiratory:18 },
  V6H: { hypertension:40, diabetes:35, chronic_pain:28, mental_health:28, respiratory:20, substance_use:10 },
  V6P: { diabetes:45, hypertension:42, respiratory:25, chronic_pain:22, mental_health:22, substance_use:8  },
  V6J: { hypertension:35, mental_health:32, chronic_pain:28, diabetes:25, respiratory:18, substance_use:12 },
  V6K: { hypertension:35, mental_health:30, chronic_pain:26, diabetes:24, respiratory:16, substance_use:10 },
  V6M: { hypertension:40, diabetes:35, chronic_pain:22, mental_health:25, respiratory:15, substance_use:7  },
  V6R: { hypertension:35, diabetes:30, mental_health:28, chronic_pain:20, respiratory:15, substance_use:8  },
  V6S: { hypertension:36, diabetes:32, mental_health:26, chronic_pain:20, respiratory:14, substance_use:7  },
  V6T: { mental_health:35, hypertension:25, diabetes:22, chronic_pain:18, respiratory:12, substance_use:10 },
};

const FSA_DETERM_WEIGHTS: Record<string, Record<DetermKey, number>> = {
  V6A: { housing_instability:80, food_insecurity:65, income_poverty:55, social_isolation:30, employment_barriers:25, language_barriers:10, transportation:8  },
  V6B: { housing_instability:60, social_isolation:50, income_poverty:40, food_insecurity:35, employment_barriers:20, language_barriers:10, transportation:10 },
  V6C: { housing_instability:55, social_isolation:48, income_poverty:38, food_insecurity:30, employment_barriers:18, language_barriers:12, transportation:12 },
  V6E: { housing_instability:55, social_isolation:52, income_poverty:35, food_insecurity:28, employment_barriers:18, language_barriers:8,  transportation:10 },
  V5K: { employment_barriers:50, income_poverty:45, housing_instability:38, food_insecurity:32, social_isolation:22, language_barriers:20, transportation:18 },
  V5L: { employment_barriers:48, income_poverty:42, housing_instability:35, food_insecurity:30, social_isolation:20, language_barriers:22, transportation:20 },
  V5N: { employment_barriers:45, income_poverty:40, language_barriers:30, food_insecurity:28, housing_instability:30, social_isolation:18, transportation:22 },
  V5M: { employment_barriers:44, income_poverty:38, language_barriers:28, food_insecurity:26, housing_instability:28, social_isolation:16, transportation:20 },
  V5R: { employment_barriers:42, income_poverty:38, language_barriers:30, food_insecurity:25, housing_instability:25, social_isolation:15, transportation:22 },
  V5T: { employment_barriers:42, housing_instability:35, income_poverty:35, food_insecurity:28, social_isolation:20, language_barriers:15, transportation:18 },
  V5P: { language_barriers:70, transportation:55, income_poverty:40, food_insecurity:35, employment_barriers:38, social_isolation:30, housing_instability:18 },
  V5W: { language_barriers:68, transportation:52, income_poverty:38, food_insecurity:32, employment_barriers:35, social_isolation:28, housing_instability:16 },
  V5X: { language_barriers:65, transportation:50, income_poverty:36, food_insecurity:30, employment_barriers:34, social_isolation:26, housing_instability:15 },
  V5S: { language_barriers:65, transportation:52, income_poverty:36, food_insecurity:30, employment_barriers:32, social_isolation:25, housing_instability:14 },
  V5V: { income_poverty:38, employment_barriers:35, language_barriers:32, food_insecurity:28, housing_instability:24, social_isolation:22, transportation:28 },
  V5Y: { income_poverty:35, employment_barriers:32, housing_instability:28, food_insecurity:25, social_isolation:22, language_barriers:18, transportation:20 },
  V6H: { social_isolation:40, income_poverty:30, language_barriers:28, transportation:25, employment_barriers:22, food_insecurity:18, housing_instability:15 },
  V6P: { language_barriers:45, transportation:40, income_poverty:28, social_isolation:28, employment_barriers:25, food_insecurity:20, housing_instability:12 },
  V6J: { social_isolation:38, transportation:30, income_poverty:22, language_barriers:18, employment_barriers:18, food_insecurity:14, housing_instability:12 },
  V6K: { social_isolation:40, transportation:28, income_poverty:20, language_barriers:16, employment_barriers:16, food_insecurity:12, housing_instability:10 },
  V6M: { social_isolation:42, transportation:32, income_poverty:18, language_barriers:15, employment_barriers:14, food_insecurity:10, housing_instability:8  },
  V6R: { social_isolation:38, transportation:28, income_poverty:18, language_barriers:14, employment_barriers:14, food_insecurity:10, housing_instability:10 },
  V6S: { social_isolation:40, transportation:30, income_poverty:16, language_barriers:12, employment_barriers:12, food_insecurity:8,  housing_instability:8  },
  V6T: { social_isolation:35, transportation:22, income_poverty:20, language_barriers:12, employment_barriers:16, food_insecurity:10, housing_instability:8  },
};

const DEFAULT_HEALTH: Record<HealthKey, number> = { mental_health:20, substance_use:20, chronic_pain:20, diabetes:20, hypertension:20, respiratory:20 };
const DEFAULT_DETERM: Record<DetermKey, number> = { housing_instability:15, food_insecurity:15, income_poverty:15, social_isolation:15, employment_barriers:15, language_barriers:15, transportation:10 };

const AGE_RANGES   = ['18-24','25-34','35-44','45-54','55-64','65-74','75+'] as const;
const INCOME:      readonly [string, number][] = [['very_low',40],['low',35],['lower_middle',15],['middle',8],['upper_middle',2]];
const HOUSING:     readonly [string, number][] = [['unstable',35],['homeless',28],['sheltered',20],['stable',17]];
const EMPLOYMENT:  readonly [string, number][] = [['unemployed',30],['unable_to_work',20],['underemployed',20],['employed',20],['retired',10]];

export function generateSeedRecords(count: number): Omit<AnalyzedEncounter, 'analyzedEncounterRn'>[] {
  const rng = makeLcg(0xc0ffee42);
  const zoneTable = HOTSPOT_ZONES.map((z) => [z, z.weight] as [typeof z, number]);
  const records: Omit<AnalyzedEncounter, 'analyzedEncounterRn'>[] = [];

  for (let i = 0; i < count; i++) {
    const zone = pickWeighted(zoneTable as readonly [typeof HOTSPOT_ZONES[number], number][], rng);
    const lat  = parseFloat(gaussian(zone.lat, zone.std, rng).toFixed(6));
    const lng  = parseFloat(gaussian(zone.lng, zone.std, rng).toFixed(6));
    const hw   = FSA_HEALTH_WEIGHTS[zone.fsa] ?? DEFAULT_HEALTH;
    const dw   = FSA_DETERM_WEIGHTS[zone.fsa] ?? DEFAULT_DETERM;

    records.push({
      geographicData: { lat, lng },
      biographicFactors: {
        ageRange:         pick(AGE_RANGES, rng),
        gender:           pickWeighted(GENDERS,     rng),
        incomeLevel:      pickWeighted(INCOME,      rng),
        housingStatus:    pickWeighted(HOUSING,     rng),
        employmentStatus: pickWeighted(EMPLOYMENT,  rng),
        language:         pick(LANGUAGES,           rng),
        raceEthnicity:    [pick(ETHNICITIES,        rng)],
      },
      healthIssues:         pickWeightedSome(HEALTH_ISSUES, hw, 1 + Math.floor(rng() * 3), rng),
      upstreamDeterminants: pickWeightedSome(DETERMINANTS,  dw, 2 + Math.floor(rng() * 3), rng),
    });
  }

  return records;
}
