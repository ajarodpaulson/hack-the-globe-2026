/**
 * Seed DynamoDB Local with realistic Vancouver encounter data.
 *
 * Uses the same hotspot zones, FSA health/determinant weights, and seeded LCG
 * as the front-end mock data — so the seeded DB looks identical to the mock
 * map, just stored in real DynamoDB records.
 *
 * Usage:
 *   node scripts/seed-analysis-data.mjs          # 500 records (default)
 *   node scripts/seed-analysis-data.mjs 200      # custom count
 */

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import analyzedDataDdb from '../src/features/analysis/internal/data/ddb/analyzed_data_ddb.js';

const TOTAL = parseInt(process.argv[2] ?? '500', 10);

// ── Reset table ───────────────────────────────────────────────────────────
const dynamo = new DynamoDB({
  endpoint: 'http://127.0.0.1:8000',
  region: 'us-west-2',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

console.log('Resetting table…');
await dynamo.deleteTable({ TableName: 'Analyzed_Encounter' }).catch((e) => {
  if (e.name !== 'ResourceNotFoundException') throw e;
});
await new Promise((r) => setTimeout(r, 1000));
await dynamo.createTable({
  TableName: 'Analyzed_Encounter',
  AttributeDefinitions: [{ AttributeName: 'analyzedEncounterRn', AttributeType: 'S' }],
  KeySchema: [{ AttributeName: 'analyzedEncounterRn', KeyType: 'HASH' }],
  BillingMode: 'PAY_PER_REQUEST',
});
console.log('Table ready.');

// ── Seeded LCG — deterministic results every run ───────────────────────────
function makeLcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function pickWeighted(table, rng) {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of table) { r -= w; if (r <= 0) return item; }
  return table[table.length - 1][0];
}
function gaussian(mean, std, rng) {
  const u = 1 - rng(), v = rng();
  return mean + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * std;
}
function pickWeightedSome(items, weights, count, rng) {
  const pool = items.map((item) => [item, weights[item.key] ?? 1]);
  const result = [];
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

// ── Vancouver hotspot zones ────────────────────────────────────────────────
// Centres are real intersection coordinates.
// weight = relative encounter frequency (BC CDC / VCH HEAT map data).
const HOTSPOT_ZONES = [
  // DTES (V6A) — highest in Metro Vancouver
  { lat: 49.2818, lng: -123.0958, fsa: 'V6A', weight: 22, std: 0.003 },
  { lat: 49.2801, lng: -123.1012, fsa: 'V6A', weight: 18, std: 0.003 },
  { lat: 49.2836, lng: -123.0901, fsa: 'V6A', weight: 14, std: 0.002 },
  { lat: 49.2780, lng: -123.1060, fsa: 'V6A', weight: 12, std: 0.002 },
  { lat: 49.2848, lng: -123.0840, fsa: 'V6A', weight:  8, std: 0.002 },
  // Downtown core (V6B)
  { lat: 49.2827, lng: -123.1207, fsa: 'V6B', weight: 10, std: 0.003 },
  { lat: 49.2796, lng: -123.1180, fsa: 'V6B', weight:  7, std: 0.002 },
  { lat: 49.2860, lng: -123.1150, fsa: 'V6B', weight:  5, std: 0.002 },
  // Coal Harbour (V6C)
  { lat: 49.2895, lng: -123.1225, fsa: 'V6C', weight:  6, std: 0.002 },
  { lat: 49.2920, lng: -123.1100, fsa: 'V6C', weight:  4, std: 0.002 },
  // West End (V6E)
  { lat: 49.2855, lng: -123.1338, fsa: 'V6E', weight:  6, std: 0.003 },
  { lat: 49.2880, lng: -123.1395, fsa: 'V6E', weight:  4, std: 0.002 },
  // Hastings-Sunrise (V5K)
  { lat: 49.2834, lng: -123.0560, fsa: 'V5K', weight: 12, std: 0.003 },
  { lat: 49.2810, lng: -123.0490, fsa: 'V5K', weight:  8, std: 0.002 },
  { lat: 49.2790, lng: -123.0620, fsa: 'V5K', weight:  6, std: 0.002 },
  // Grandview-Woodland (V5L)
  { lat: 49.2724, lng: -123.0700, fsa: 'V5L', weight: 10, std: 0.003 },
  { lat: 49.2695, lng: -123.0655, fsa: 'V5L', weight:  7, std: 0.002 },
  { lat: 49.2750, lng: -123.0760, fsa: 'V5L', weight:  5, std: 0.002 },
  // Kensington-Cedar Cottage (V5N)
  { lat: 49.2490, lng: -123.0680, fsa: 'V5N', weight:  8, std: 0.003 },
  { lat: 49.2440, lng: -123.0600, fsa: 'V5N', weight:  7, std: 0.002 },
  { lat: 49.2520, lng: -123.0750, fsa: 'V5N', weight:  5, std: 0.002 },
  // Renfrew-Collingwood north (V5M)
  { lat: 49.2620, lng: -123.0430, fsa: 'V5M', weight:  8, std: 0.003 },
  { lat: 49.2580, lng: -123.0390, fsa: 'V5M', weight:  6, std: 0.002 },
  // Renfrew-Collingwood south (V5R)
  { lat: 49.2380, lng: -123.0410, fsa: 'V5R', weight:  7, std: 0.003 },
  { lat: 49.2340, lng: -123.0450, fsa: 'V5R', weight:  5, std: 0.002 },
  // Mount Pleasant east (V5T)
  { lat: 49.2650, lng: -123.0965, fsa: 'V5T', weight:  8, std: 0.003 },
  { lat: 49.2680, lng: -123.0920, fsa: 'V5T', weight:  5, std: 0.002 },
  // Victoria-Fraserview (V5P)
  { lat: 49.2240, lng: -123.0630, fsa: 'V5P', weight:  6, std: 0.003 },
  { lat: 49.2195, lng: -123.0580, fsa: 'V5P', weight:  5, std: 0.002 },
  // Riley Park (V5V)
  { lat: 49.2570, lng: -123.1020, fsa: 'V5V', weight:  6, std: 0.003 },
  { lat: 49.2530, lng: -123.0980, fsa: 'V5V', weight:  5, std: 0.002 },
  // South Cambie / Mount Pleasant west (V5Y)
  { lat: 49.2658, lng: -123.1132, fsa: 'V5Y', weight:  7, std: 0.003 },
  { lat: 49.2620, lng: -123.1075, fsa: 'V5Y', weight:  5, std: 0.002 },
  // Fairview (V5Z)
  { lat: 49.2640, lng: -123.1240, fsa: 'V5Z', weight:  6, std: 0.003 },
  { lat: 49.2605, lng: -123.1185, fsa: 'V5Z', weight:  4, std: 0.002 },
  // Sunset west (V5W)
  { lat: 49.2300, lng: -123.0890, fsa: 'V5W', weight:  6, std: 0.003 },
  { lat: 49.2250, lng: -123.0840, fsa: 'V5W', weight:  4, std: 0.002 },
  // Killarney east (V5S)
  { lat: 49.2240, lng: -123.0370, fsa: 'V5S', weight:  5, std: 0.003 },
  { lat: 49.2195, lng: -123.0420, fsa: 'V5S', weight:  4, std: 0.002 },
  // Killarney west (V5X)
  { lat: 49.2240, lng: -123.0680, fsa: 'V5X', weight:  5, std: 0.003 },
  { lat: 49.2175, lng: -123.0720, fsa: 'V5X', weight:  3, std: 0.002 },
  // South Granville / Shaughnessy (V6H)
  { lat: 49.2565, lng: -123.1360, fsa: 'V6H', weight:  4, std: 0.003 },
  { lat: 49.2520, lng: -123.1310, fsa: 'V6H', weight:  3, std: 0.002 },
  // Marpole / Oakridge (V6P)
  { lat: 49.2170, lng: -123.1080, fsa: 'V6P', weight:  4, std: 0.003 },
  { lat: 49.2140, lng: -123.1165, fsa: 'V6P', weight:  3, std: 0.002 },
  // Kitsilano (V6J / V6K)
  { lat: 49.2660, lng: -123.1505, fsa: 'V6J', weight:  3, std: 0.003 },
  { lat: 49.2660, lng: -123.1600, fsa: 'V6K', weight:  4, std: 0.003 },
  // West side (V6M, V6R, V6S)
  { lat: 49.2490, lng: -123.1540, fsa: 'V6M', weight:  2, std: 0.003 },
  { lat: 49.2690, lng: -123.1820, fsa: 'V6R', weight:  2, std: 0.003 },
  { lat: 49.2530, lng: -123.1790, fsa: 'V6S', weight:  2, std: 0.003 },
  // UBC (V6T)
  { lat: 49.2606, lng: -123.2460, fsa: 'V6T', weight:  2, std: 0.004 },
];

// ── Health issues & upstream determinants ─────────────────────────────────
const HEALTH_ISSUES = [
  { key: 'mental_health',  label: 'Mental Health' },
  { key: 'substance_use',  label: 'Substance Use' },
  { key: 'chronic_pain',   label: 'Chronic Pain' },
  { key: 'diabetes',       label: 'Diabetes' },
  { key: 'hypertension',   label: 'Hypertension' },
  { key: 'respiratory',    label: 'Respiratory Issues' },
];

const DETERMINANTS = [
  { key: 'housing_instability',  label: 'Housing Instability' },
  { key: 'food_insecurity',      label: 'Food Insecurity' },
  { key: 'income_poverty',       label: 'Income/Poverty' },
  { key: 'social_isolation',     label: 'Social Isolation' },
  { key: 'employment_barriers',  label: 'Employment Barriers' },
  { key: 'language_barriers',    label: 'Language Barriers' },
  { key: 'transportation',       label: 'Transportation Barriers' },
];

// ── Per-FSA weights (reflects health equity literature) ───────────────────
const FSA_HEALTH_WEIGHTS = {
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

const FSA_DETERM_WEIGHTS = {
  V6A: { housing_instability:80, food_insecurity:65, income_poverty:55, social_isolation:30, employment_barriers:25, language_barriers:10, transportation:8 },
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

const DEFAULT_HEALTH = { mental_health:20, substance_use:20, chronic_pain:20, diabetes:20, hypertension:20, respiratory:20 };
const DEFAULT_DETERM = { housing_instability:15, food_insecurity:15, income_poverty:15, social_isolation:15, employment_barriers:15, language_barriers:15, transportation:10 };

// ── Biographic distributions ──────────────────────────────────────────────
const AGE_RANGES   = ['18-24','25-34','35-44','45-54','55-64','65-74','75+'];
const GENDERS      = [['male',45],['female',40],['non-binary',10],['other',5]];
const INCOME       = [['very_low',40],['low',35],['lower_middle',15],['middle',8],['upper_middle',2]];
const HOUSING      = [['unstable',35],['homeless',28],['sheltered',20],['stable',17]];
const EMPLOYMENT   = [['unemployed',30],['unable_to_work',20],['underemployed',20],['employed',20],['retired',10]];
const LANGUAGES    = ['english','cantonese','mandarin','punjabi','spanish','tagalog','vietnamese','french'];
const ETHNICITIES  = ['White','Indigenous','South Asian','Chinese','Filipino','Black','Latin American','Southeast Asian'];

// ── Generate and seed ─────────────────────────────────────────────────────
const rng = makeLcg(0xc0ffee42);
const zoneTable = HOTSPOT_ZONES.map((z) => [z, z.weight]);

let seeded = 0;
let failed = 0;

console.log(`Seeding ${TOTAL} encounters into DynamoDB Local…`);

for (let seq = 1; seq <= TOTAL; seq++) {
  const zone = pickWeighted(zoneTable, rng);
  const lat  = gaussian(zone.lat, zone.std, rng);
  const lng  = gaussian(zone.lng, zone.std, rng);
  const hw   = FSA_HEALTH_WEIGHTS[zone.fsa] ?? DEFAULT_HEALTH;
  const dw   = FSA_DETERM_WEIGHTS[zone.fsa] ?? DEFAULT_DETERM;

  const record = {
    analyzedEncounterRn: `RN:ANALYZEDENCOUNTER-V1-SEED-${String(seq).padStart(5, '0')}`,
    geographicData: { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) },
    biographicFactors: {
      ageRange:         pick(AGE_RANGES, rng),
      gender:           pickWeighted(GENDERS, rng),
      incomeLevel:      pickWeighted(INCOME, rng),
      housingStatus:    pickWeighted(HOUSING, rng),
      employmentStatus: pickWeighted(EMPLOYMENT, rng),
      language:         pick(LANGUAGES, rng),
      raceEthnicity:    [pick(ETHNICITIES, rng)],
    },
    healthIssues:        pickWeightedSome(HEALTH_ISSUES, hw, 1 + Math.floor(rng() * 3), rng),
    upstreamDeterminants: pickWeightedSome(DETERMINANTS, dw, 2 + Math.floor(rng() * 3), rng),
  };

  try {
    await analyzedDataDdb.create(record);
    seeded++;
    if (seeded % 50 === 0) console.log(`  ${seeded}/${TOTAL}…`);
  } catch (err) {
    // Skip duplicates (re-running the script)
    if (err?.code === 'ConditionalCheckFailedException') {
      seeded++;
    } else {
      console.error(`  Failed record ${seq}:`, err.message);
      failed++;
    }
  }
}

console.log(`Done. ${seeded} seeded, ${failed} failed.`);
