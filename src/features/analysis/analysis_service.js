import analysisManager from "./internal/analysis_manager.js";

const analysisService = {
  getAnalyzedEncounters: analysisManager.getAnalyzedEncounters,
  createAnalyzedEncounter: analysisManager.createAnalyzedEncounter,
};

export default analysisService;