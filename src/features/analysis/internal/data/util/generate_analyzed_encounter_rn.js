import { nanoid } from 'nanoid';

const generateAnalyzedEncounterRn = () => `RN:ANALYZEDENCOUNTER-V1-${nanoid()}`;

export { generateAnalyzedEncounterRn };

export default generateAnalyzedEncounterRn;
