import analyzedDataDdb from './ddb/analyzed_data_ddb';
import generateAnalyzedEncounterRn from './util/generate_analyzed_encounter_rn';

const postAnalyzedEncounter = async (analyzedEncounter) => {
  const completedAnalyzedEncounter = {
    analyzedEncounterRn: generateAnalyzedEncounterRn(),
    ...analyzedEncounter,
  };

  console.log(
    'Persisting analyzed encounter:',
    JSON.stringify(completedAnalyzedEncounter, null, 2),
  );

  let persistedAnalyzedEncounter;

  try {
    persistedAnalyzedEncounter =
      await analyzedDataDdb.create(completedAnalyzedEncounter);
  } catch (error) {
    console.error('Failed to persist analyzed encounter:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      analyzedEncounterRn: completedAnalyzedEncounter.analyzedEncounterRn,
    });
    throw error;
  }

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
