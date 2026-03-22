import generateAnalyzedEncounterHandler from './generate_analyzed_encounter/generate_analyzed_encounter_handler';
import analysisDataHandler from './data/analysis_data_handler';

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
  const persistedAnalyzedEncounter =
    await analysisDataHandler.postAnalyzedEncounter(analyzedEncounter);

  return persistedAnalyzedEncounter;
};

const analysisManager = {
  getAnalyzedEncounters,
  createAnalyzedEncounter,
};

export default analysisManager;
