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
  postalCodePrefix: string;
  lat?: number;
  lng?: number;
};

export type AnalyzedEncounter = {
  analyzedEncounterRn: string;
  biographicFactors?: BiographicFactors;
  geographicData?: GeographicData;
  upstreamDeterminants: Classification[];
  healthIssues: Classification[];
};

export type MapMetric = 'density' | 'healthIssue' | 'determinant';

export type VisualizationType = 'heatmap' | 'choropleth';

export type FsaAggregate = {
  fsa: string;
  lat: number;
  lng: number;
  count: number;
};
