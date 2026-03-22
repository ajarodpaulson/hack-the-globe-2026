import aiEncounterAnalyzer from './ollama/ai_encounter_analyzer';
import analysisOutputProcessor from "./analysis_output_processor/analysis_output_processor";

const generateAnalyzedEncounter = async (anonymizedEncounter) => {
  const encounterContext = anonymizedEncounter; // todo: strip off fields unnecessary for agent context

  console.log('Generating analyzed encounter from context:', {
    keys: Object.keys(encounterContext ?? {}),
    hasTranscript: typeof encounterContext?.transcript === 'string',
    transcriptLength:
      typeof encounterContext?.transcript === 'string'
        ? encounterContext.transcript.length
        : 0,
    ageRange: encounterContext?.ageRange,
    gender: encounterContext?.gender,
  });

  const analyzedEncounter =
    await aiEncounterAnalyzer.generate(encounterContext);

  console.log(
    'Raw analyzed encounter output:',
    JSON.stringify(analyzedEncounter, null, 2),
  );

  const processedAnalysis = analysisOutputProcessor.process(analyzedEncounter);

  console.log(
    'Processed analyzed encounter output:',
    JSON.stringify(processedAnalysis, null, 2),
  );

  return processedAnalysis;
};

const analyzeEncounterHandler = {
  generateAnalyzedEncounter,
};

export default analyzeEncounterHandler;
