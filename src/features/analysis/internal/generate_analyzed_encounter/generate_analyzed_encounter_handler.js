import aiEncounterAnalyzer from './ollama/ai_encounter_analyzer';
import analysisOutputProcessor from "./analysis_output_processor/analysis_output_processor";

const generateAnalyzedEncounter = async (anonymizedEncounter) => {
  const encounterContext = anonymizedEncounter; // todo: strip off fields unnecessary for agent context

  const analyzedEncounter =
    await aiEncounterAnalyzer.generate(encounterContext);

  console.log(
    'Raw analyzed encounter output:',
    JSON.stringify(analyzedEncounter, null, 2),
  );

  const processedAnalysis = analysisOutputProcessor.process(analyzedEncounter);

  return processedAnalysis;
};

const analyzeEncounterHandler = {
  generateAnalyzedEncounter,
};

export default analyzeEncounterHandler;
