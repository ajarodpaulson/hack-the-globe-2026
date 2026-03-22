export type Classification = {
  key: string;
  label: string;
};

export type BiographicFactors = {
  ageRange?: string;
  gender?: string;
  incomeLevel?: string;
  raceEthnicity?: string[];
  housingStatus?: string;
  employmentStatus?: string;
  language?: string;
};

export type GeographicData = {
  lat: number;
  lng: number;
};

export type AnalyzedEncounter = {
  analyzedEncounterRn: string;
  createdAt?: string;
  biographicFactors?: BiographicFactors;
  geographicData?: GeographicData;
  upstreamDeterminants: Classification[];
  healthIssues: Classification[];
};

export type MapMetric = 'density' | 'healthIssue' | 'determinant';

export type VisualizationType = 'da' | 'neighbourhood' | 'bubble' | 'points';
