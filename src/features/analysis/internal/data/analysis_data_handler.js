import analyzedDataDdb from './ddb/analyzed_data_ddb';
import generateAnalyzedEncounterRn from './util/generate_analyzed_encounter_rn';

const postAnalyzedEncounter = async (analyzedEncounter) => {
  const completedAnalyzedEncounter = {
    analyzedEncounterRn: generateAnalyzedEncounterRn(),
    ...analyzedEncounter,
  };

  const persistedAnalyzedEncounter =
    await analyzedDataDdb.create(completedAnalyzedEncounter);

  return persistedAnalyzedEncounter;
};

const getAnalyzedEncounters = async () => {
  const analyzedEncounters = await analyzedDataDdb.getAll();

  return analyzedEncounters;
};

const analysisDataHandler = {
  postAnalyzedEncounter,
  getAnalyzedEncounters,
};

export {
  postAnalyzedEncounter,
  getAnalyzedEncounters,
};

export default analysisDataHandler;
