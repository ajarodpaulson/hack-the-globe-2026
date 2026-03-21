import generateAnalyzedEncounterHandler from './generate_analyzed_encounter/generate_analyzed_encounter_handler';
import analysisDataHandler from './data/analysis_data_handler';

const getAnalyzedEncounters = async () => analysisDataHandler.getAnalyzedEncounters();

const createAnalyzedEncounter = async (anonymizedEncounter) => {
  const analyzedEncounter = await generateAnalyzedEncounterHandler.generateAnalyzedEncounter(anonymizedEncounter);
  return analysisDataHandler.postAnalyzedEncounter(analyzedEncounter);
};

const analysisManager = {
  getAnalyzedEncounters,
  createAnalyzedEncounter,
};

export default analysisManager;
