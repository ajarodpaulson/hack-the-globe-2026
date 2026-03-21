import type { AnalyzedEncounter } from './types';

// ---------------------------------------------------------------------------
// Seeded LCG — deterministic "random" so the dataset is identical every build
// ---------------------------------------------------------------------------
function makeLcg(seed: number) {
  let s = seed >>> 0;
  return function rng(): number {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted<T>(table: readonly [T, number][], rng: () => number): T {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of table) {
    r -= w;
    if (r <= 0) return item;
  }
  return table[table.length - 1][0];
}

/** Pick 0–max items from an array without replacement. */
function pickSome<T>(arr: readonly T[], max: number, rng: () => number): T[] {
  const n = Math.floor(rng() * (max + 1));
  if (n === 0) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** Box-Muller — normally distributed value with given mean and std. */
function gaussian(mean: number, std: number, rng: () => number): number {
  const u = 1 - rng();
  const v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
}

// ---------------------------------------------------------------------------
// Real Vancouver street-level hotspot zones
//
// Centres are actual intersection / block coordinates.
// weight = relative encounter frequency (reflects health-equity inequality
//   data: BC CDC, VCH HEAT maps, City of Vancouver Homeless Count).
// fsa = Forward Sortation Area (for choropleth roll-up).
// std = Gaussian spread in degrees (≈ 0.002° ≈ 200m, 0.004° ≈ 400m).
// ---------------------------------------------------------------------------
const HOTSPOT_ZONES = [
  // ── Downtown Eastside (V6A) — highest in Metro Van ─────────────────────
  { lat: 49.2818, lng: -123.0958, fsa: 'V6A', weight: 22, std: 0.003 }, // Hastings & Main
  { lat: 49.2801, lng: -123.1012, fsa: 'V6A', weight: 18, std: 0.003 }, // Oppenheimer Park
  { lat: 49.2836, lng: -123.0901, fsa: 'V6A', weight: 14, std: 0.002 }, // Hastings & Gore
  { lat: 49.2780, lng: -123.1060, fsa: 'V6A', weight: 12, std: 0.002 }, // Powell & Columbia
  { lat: 49.2848, lng: -123.0840, fsa: 'V6A', weight:  8, std: 0.002 }, // Strathcona / Prior

  // ── Downtown core (V6B) ─────────────────────────────────────────────────
  { lat: 49.2827, lng: -123.1207, fsa: 'V6B', weight: 10, std: 0.003 }, // Granville Strip
  { lat: 49.2796, lng: -123.1180, fsa: 'V6B', weight:  7, std: 0.002 }, // BC Place / Stadium
  { lat: 49.2860, lng: -123.1150, fsa: 'V6B', weight:  5, std: 0.002 }, // Robson & Granville

  // ── Coal Harbour / downtown north (V6C) ────────────────────────────────
  { lat: 49.2895, lng: -123.1225, fsa: 'V6C', weight:  6, std: 0.002 }, // Burrard Station area
  { lat: 49.2920, lng: -123.1100, fsa: 'V6C', weight:  4, std: 0.002 }, // Waterfront / CRAB Park

  // ── West End (V6E) ──────────────────────────────────────────────────────
  { lat: 49.2855, lng: -123.1338, fsa: 'V6E', weight:  6, std: 0.003 }, // Davie Village
  { lat: 49.2880, lng: -123.1395, fsa: 'V6E', weight:  4, std: 0.002 }, // English Bay beach

  // ── Hastings-Sunrise east (V5K) ─────────────────────────────────────────
  { lat: 49.2834, lng: -123.0560, fsa: 'V5K', weight: 12, std: 0.003 }, // Hastings & Renfrew
  { lat: 49.2810, lng: -123.0490, fsa: 'V5K', weight:  8, std: 0.002 }, // Hastings & Boundary
  { lat: 49.2790, lng: -123.0620, fsa: 'V5K', weight:  6, std: 0.002 }, // Nanaimo & 1st

  // ── Grandview-Woodland (V5L) ────────────────────────────────────────────
  { lat: 49.2724, lng: -123.0700, fsa: 'V5L', weight: 10, std: 0.003 }, // Commercial Drive & Venables
  { lat: 49.2695, lng: -123.0655, fsa: 'V5L', weight:  7, std: 0.002 }, // Commercial & Broadway
  { lat: 49.2750, lng: -123.0760, fsa: 'V5L', weight:  5, std: 0.002 }, // Clark & Hastings

  // ── Kensington-Cedar Cottage (V5N) ─────────────────────────────────────
  { lat: 49.2490, lng: -123.0680, fsa: 'V5N', weight:  8, std: 0.003 }, // Kingsway & Knight
  { lat: 49.2440, lng: -123.0600, fsa: 'V5N', weight:  7, std: 0.002 }, // Kingsway & Boundary
  { lat: 49.2520, lng: -123.0750, fsa: 'V5N', weight:  5, std: 0.002 }, // Victoria & Kingsway

  // ── Renfrew-Collingwood north (V5M) ────────────────────────────────────
  { lat: 49.2620, lng: -123.0430, fsa: 'V5M', weight:  8, std: 0.003 }, // Kingsway & Rupert
  { lat: 49.2580, lng: -123.0390, fsa: 'V5M', weight:  6, std: 0.002 }, // Joyce & Kingsway

  // ── Renfrew-Collingwood south (V5R) ────────────────────────────────────
  { lat: 49.2380, lng: -123.0410, fsa: 'V5R', weight:  7, std: 0.003 }, // Kingsway & Nanaimo
  { lat: 49.2340, lng: -123.0450, fsa: 'V5R', weight:  5, std: 0.002 }, // 29th Ave & Kingsway

  // ── Mount Pleasant east (V5T) ───────────────────────────────────────────
  { lat: 49.2650, lng: -123.0965, fsa: 'V5T', weight:  8, std: 0.003 }, // Main & Broadway
  { lat: 49.2680, lng: -123.0920, fsa: 'V5T', weight:  5, std: 0.002 }, // Main & 12th

  // ── Victoria-Fraserview (V5P) ───────────────────────────────────────────
  { lat: 49.2240, lng: -123.0630, fsa: 'V5P', weight:  6, std: 0.003 }, // Victoria & 49th
  { lat: 49.2195, lng: -123.0580, fsa: 'V5P', weight:  5, std: 0.002 }, // Victoria & Marine

  // ── Riley Park (V5V) ────────────────────────────────────────────────────
  { lat: 49.2570, lng: -123.1020, fsa: 'V5V', weight:  6, std: 0.003 }, // Main & 33rd
  { lat: 49.2530, lng: -123.0980, fsa: 'V5V', weight:  5, std: 0.002 }, // Main & 41st

  // ── South Cambie / Mount Pleasant west (V5Y) ───────────────────────────
  { lat: 49.2658, lng: -123.1132, fsa: 'V5Y', weight:  7, std: 0.003 }, // Broadway & Cambie
  { lat: 49.2620, lng: -123.1075, fsa: 'V5Y', weight:  5, std: 0.002 }, // Cambie & King Edward

  // ── Fairview (V5Z) ──────────────────────────────────────────────────────
  { lat: 49.2640, lng: -123.1240, fsa: 'V5Z', weight:  6, std: 0.003 }, // Broadway & Granville
  { lat: 49.2605, lng: -123.1185, fsa: 'V5Z', weight:  4, std: 0.002 }, // Granville & 12th

  // ── Sunset west (V5W) ───────────────────────────────────────────────────
  { lat: 49.2300, lng: -123.0890, fsa: 'V5W', weight:  6, std: 0.003 }, // Fraser & 49th
  { lat: 49.2250, lng: -123.0840, fsa: 'V5W', weight:  4, std: 0.002 }, // Fraser & Marine

  // ── Killarney east (V5S) ────────────────────────────────────────────────
  { lat: 49.2240, lng: -123.0370, fsa: 'V5S', weight:  5, std: 0.003 }, // 49th & Boundary
  { lat: 49.2195, lng: -123.0420, fsa: 'V5S', weight:  4, std: 0.002 }, // Killarney & 54th

  // ── Killarney west (V5X) ────────────────────────────────────────────────
  { lat: 49.2240, lng: -123.0680, fsa: 'V5X', weight:  5, std: 0.003 }, // Kingsway & 49th
  { lat: 49.2175, lng: -123.0720, fsa: 'V5X', weight:  3, std: 0.002 }, // Kerr & Marine

  // ── South Granville / Shaughnessy (V6H) ────────────────────────────────
  { lat: 49.2565, lng: -123.1360, fsa: 'V6H', weight:  4, std: 0.003 }, // Granville & 41st
  { lat: 49.2520, lng: -123.1310, fsa: 'V6H', weight:  3, std: 0.002 }, // Granville & 49th

  // ── Marpole / Oakridge (V6P) ────────────────────────────────────────────
  { lat: 49.2170, lng: -123.1080, fsa: 'V6P', weight:  4, std: 0.003 }, // Cambie & Marine
  { lat: 49.2140, lng: -123.1165, fsa: 'V6P', weight:  3, std: 0.002 }, // Granville & 70th

  // ── Kitsilano east (V6J) ────────────────────────────────────────────────
  { lat: 49.2660, lng: -123.1505, fsa: 'V6J', weight:  3, std: 0.003 }, // Broadway & Macdonald
  { lat: 49.2695, lng: -123.1458, fsa: 'V6J', weight:  3, std: 0.002 }, // Burrard & 4th

  // ── Kitsilano (V6K) ─────────────────────────────────────────────────────
  { lat: 49.2660, lng: -123.1600, fsa: 'V6K', weight:  4, std: 0.003 }, // Broadway & Vine
  { lat: 49.2700, lng: -123.1560, fsa: 'V6K', weight:  3, std: 0.002 }, // 4th & Blenheim

  // ── Dunbar / Kerrisdale / west-side (V6M, V6N, V6R, V6S) ──────────────
  { lat: 49.2490, lng: -123.1540, fsa: 'V6M', weight:  2, std: 0.003 }, // Arbutus & 41st
  { lat: 49.2250, lng: -123.1360, fsa: 'V6N', weight:  2, std: 0.003 }, // Kerrisdale & 49th
  { lat: 49.2690, lng: -123.1820, fsa: 'V6R', weight:  2, std: 0.003 }, // Point Grey & 4th
  { lat: 49.2530, lng: -123.1790, fsa: 'V6S', weight:  2, std: 0.003 }, // Dunbar & 32nd

  // ── UBC / Endowment Lands (V6T) ─────────────────────────────────────────
  { lat: 49.2606, lng: -123.2460, fsa: 'V6T', weight:  2, std: 0.004 }, // UBC campus
] as const;

// ---------------------------------------------------------------------------
// Demographic distribution tables (same as before, unchanged)
// ---------------------------------------------------------------------------
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

const AGE_RANGES   = ['18–24','25–34','35–44','45–54','55–64','65+'] as const;
const GENDERS: readonly [string, number][] = [['Male',45],['Female',40],['Non-binary',10],['Other',5]];
const INCOME: readonly [string, number][]  = [['Very Low',40],['Low',35],['Moderate',20],['No Income',5]];
const HOUSING: readonly [string, number][] = [['Unstably Housed',35],['Homeless',28],['Sheltered',20],['Stably Housed',17]];
const EMPLOYMENT = ['Unemployed','Part-time','Full-time','Unable to Work','Retired'] as const;
const LANGUAGES  = ['English','Cantonese','Mandarin','Punjabi','Spanish','Tagalog','Vietnamese','French'] as const;
const ETHNICITIES = ['White','Indigenous','South Asian','Chinese','Filipino','Black','Latin American','Southeast Asian'] as const;

// ---------------------------------------------------------------------------
// Total encounter count (same as before)
// ---------------------------------------------------------------------------
const TOTAL_ENCOUNTERS = 465;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------
function generateEncounters(): AnalyzedEncounter[] {
  const rng = makeLcg(0xc0ffee42);
  const encounters: AnalyzedEncounter[] = [];

  // Build weighted zone table for encounter placement
  const zoneTable = HOTSPOT_ZONES.map(
    (z) => [z, z.weight] as [typeof z, number],
  ) as readonly [typeof HOTSPOT_ZONES[number], number][];

  for (let seq = 1; seq <= TOTAL_ENCOUNTERS; seq++) {
    const zone = pickWeighted(zoneTable, rng);

    // Scatter within the zone using a tight Gaussian (~200–400m radius)
    const lat = gaussian(zone.lat, zone.std, rng);
    const lng = gaussian(zone.lng, zone.std, rng);

    encounters.push({
      analyzedEncounterRn: `ENC-${String(seq).padStart(4, '0')}`,
      geographicData: { postalCodePrefix: zone.fsa, lat, lng },
      biographicFactors: {
        ageRange:         pick(AGE_RANGES, rng),
        gender:           pickWeighted(GENDERS, rng),
        incomeLevel:      pickWeighted(INCOME, rng),
        housingStatus:    pickWeighted(HOUSING, rng),
        employmentStatus: pick(EMPLOYMENT, rng),
        language:         pick(LANGUAGES, rng),
        raceEthnicity:    [pick(ETHNICITIES, rng)],
      },
      healthIssues:         pickSome(HEALTH_ISSUES, 3, rng),
      upstreamDeterminants: pickSome(DETERMINANTS, 4, rng),
    });
  }

  return encounters;
}

export const mockEncounters: AnalyzedEncounter[] = generateEncounters();
