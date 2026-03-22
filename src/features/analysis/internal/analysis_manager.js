import generateAnalyzedEncounterHandler from './generate_analyzed_encounter/generate_analyzed_encounter_handler.js';
import analysisDataHandler from './data/analysis_data_handler.js';

const getAnalyzedEncounters = async () => {
  const analyzedEncounters =
    await analysisDataHandler.getAnalyzedEncounters();

  return analyzedEncounters;
};

const createAnalyzedEncounter = async (anonymizedEncounter) => {
  const analyzedEncounter =
    await generateAnalyzedEncounterHandler.generateAnalyzedEncounter(
      anonymizedEncounter,
    );

  const geographicData =
    anonymizedEncounter?.lat != null && anonymizedEncounter?.lng != null
      ? {
          lat: anonymizedEncounter.lat,
          lng: anonymizedEncounter.lng,
        }
      : anonymizedEncounter?.geographicData;

  const persistedAnalyzedEncounter =
    await analysisDataHandler.postAnalyzedEncounter({
      ...analyzedEncounter,
      ...(geographicData ? { geographicData } : {}),
    });

  return persistedAnalyzedEncounter;
};

const analysisManager = {
  getAnalyzedEncounters,
  createAnalyzedEncounter,
};

export default analysisManager;
