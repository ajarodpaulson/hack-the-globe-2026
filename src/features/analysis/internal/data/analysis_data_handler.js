import analyzedDataDdb from './ddb/analyzed_data_ddb';
import generateAnalyzedEncounterRn from './util/generate_analyzed_encounter_rn';

const postAnalyzedEncounter = async (analyzedEncounter) => {
  const completedAnalyzedEncounter = {
    analyzedEncounterRn: generateAnalyzedEncounterRn(),
    ...analyzedEncounter,
  };

  return analyzedDataDdb.create(completedAnalyzedEncounter);
};

const getAnalyzedEncounters = async () => analyzedDataDdb.getAll();

const analysisDataHandler = {
  postAnalyzedEncounter,
  getAnalyzedEncounters,
};

export {
  postAnalyzedEncounter,
  getAnalyzedEncounters,
};

export default analysisDataHandler;
