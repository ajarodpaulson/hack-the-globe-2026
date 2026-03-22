import analyzedDataDdb from '../src/features/analysis/internal/data/ddb/analyzed_data_ddb.js';

const seedRecords = [
  {
    analyzedEncounterRn: 'RN:ANALYZEDENCOUNTER-V1-SEED-1',
    biographicFactors: {
      ageRange: '25-34',
      gender: 'woman',
      incomeLevel: 'low',
      housingStatus: 'unstable',
      employmentStatus: 'unemployed',
      language: 'english',
    },
    upstreamDeterminants: [
      { key: 'housing_instability', label: 'Housing instability' },
      { key: 'food_insecurity', label: 'Food insecurity' },
    ],
    healthIssues: [
      { key: 'anxiety', label: 'Anxiety' },
      { key: 'insomnia', label: 'Insomnia' },
    ],
  },
  {
    analyzedEncounterRn: 'RN:ANALYZEDENCOUNTER-V1-SEED-2',
    biographicFactors: {
      ageRange: '45-54',
      gender: 'man',
      incomeLevel: 'middle',
      employmentStatus: 'employed',
      language: 'english',
    },
    upstreamDeterminants: [
      { key: 'employment_stress', label: 'Employment stress' },
    ],
    healthIssues: [
      { key: 'hypertension', label: 'Hypertension' },
    ],
  },
  {
    analyzedEncounterRn: 'RN:ANALYZEDENCOUNTER-V1-SEED-3',
    biographicFactors: {
      ageRange: '65-74',
      gender: 'woman',
      incomeLevel: 'low',
      housingStatus: 'stable',
      employmentStatus: 'retired',
      language: 'english',
    },
    upstreamDeterminants: [
      { key: 'social_isolation', label: 'Social isolation' },
      { key: 'limited_income', label: 'Limited income' },
    ],
    healthIssues: [
      { key: 'diabetes', label: 'Diabetes' },
      { key: 'mobility_limitations', label: 'Mobility limitations' },
    ],
  },
];

const seedAnalysisData = async () => {
  for (const seedRecord of seedRecords) {
    await analyzedDataDdb.create(seedRecord);
    console.log(`Seeded ${seedRecord.analyzedEncounterRn}`);
  }

  console.log(`Seeded ${seedRecords.length} analyzed encounter records.`);
};

seedAnalysisData().catch((error) => {
  console.error('Failed to seed analysis data:', error);
  process.exit(1);
});
