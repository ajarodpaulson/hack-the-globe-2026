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

// ---------------------------------------------------------------------------
// Encounter distribution — based on Vancouver DTES health equity data
// (see: City of Vancouver Homeless Count, VCH HEAT maps, BC CDC data)
// ---------------------------------------------------------------------------
// FSA → encounter count.  East/inner-city FSAs reflect documented higher rates
// of substance use, homelessness and upstream determinants.
const FSA_COUNTS: readonly [string, number][] = [
  ['V6A', 52],  // Downtown Eastside — highest service demand in Metro Van
  ['V5K', 24],  // Hastings-Sunrise (east)
  ['V5L', 20],  // Hastings-Sunrise / Grandview boundary
  ['V5N', 20],  // Kensington-Cedar Cottage
  ['V5M', 17],  // Renfrew-Collingwood (north)
  ['V6B', 18],  // Downtown core
  ['V5R', 16],  // Renfrew-Collingwood (south)
  ['V5T', 16],  // Mount Pleasant (east)
  ['V5P', 14],  // Victoria-Fraserview
  ['V5V', 14],  // Riley Park
  ['V5Y', 14],  // South Cambie / Mount Pleasant west
  ['V6C', 13],  // Coal Harbour / downtown north
  ['V5W', 12],  // Sunset (west)
  ['V5Z', 12],  // Fairview
  ['V5S', 11],  // Killarney (east)
  ['V6E', 11],  // West End
  ['V5X', 10],  // Killarney (west)
  ['V6H', 9],   // South Granville / Shaughnessy border
  ['V6P', 8],   // Marpole / Oakridge
  ['V6J', 7],   // Kitsilano (east)
  ['V6K', 8],   // Kitsilano
  ['V6G', 6],   // Coal Harbour / Stanley Park fringe
  ['V6L', 6],   // Arbutus Ridge
  ['V6N', 6],   // Kerrisdale / Marpole
  ['V6M', 5],   // Arbutus / Shaughnessy
  ['V6S', 5],   // Dunbar-Southlands
  ['V6R', 4],   // West Point Grey (near Kitsilano)
  ['V6T', 3],   // UBC / University Endowment Lands
];

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
// Generator
// ---------------------------------------------------------------------------
function generateEncounters(): AnalyzedEncounter[] {
  const rng = makeLcg(0xc0ffee42);
  const encounters: AnalyzedEncounter[] = [];
  let seq = 0;

  for (const [fsa, count] of FSA_COUNTS) {
    for (let i = 0; i < count; i++) {
      seq += 1;
      encounters.push({
        analyzedEncounterRn: `ENC-${String(seq).padStart(4, '0')}`,
        geographicData: { postalCodePrefix: fsa },
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
  }

  return encounters;
}

export const mockEncounters: AnalyzedEncounter[] = generateEncounters();
