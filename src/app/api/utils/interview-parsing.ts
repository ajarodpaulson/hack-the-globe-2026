import { Ollama } from "ollama";

const ollama = new Ollama({ host: "http://localhost:11434" });

const MODEL = "llama3";

// --- Types ---

export type Classification = {
  key: string;
  label: string;
};

export type BiographicFactors = {
  ageRange?: string;
  gender?: string;
  incomeLevel?: string;
  housingStatus?: string;
  employmentStatus?: string;
  raceEthnicity?: string[];
  language?: string;
};

export type GeographicData = {
  lat: number;
  lng: number;
};

export type EncounterRecord = {
  analyzedEncounterRn: string;
  biographicFactors?: BiographicFactors;
  geographicData?: GeographicData;
  upstreamDeterminants: Classification[];
  healthIssues: Classification[];
};

// --- PII Masking ---

const PII_SYSTEM_PROMPT = `You are a PII/PHI redaction engine. Your ONLY job is to take the user's text and return it with all personally identifiable information replaced by placeholders.

Replace the following types of PII:
- Person names → [NAME]
- Street addresses → [ADDRESS]
- Phone numbers → [PHONE]
- Email addresses → [EMAIL]
- Dates of birth → [DOB]
- Social Security Numbers → [SSN]
- Medical record numbers → [MRN]
- Any other identifying numbers → [ID]

Rules:
1. Return ONLY the redacted text. No explanations, no commentary.
2. Preserve the original sentence structure and all non-PII words exactly.
3. If no PII is found, return the text unchanged.`;

export async function maskPII(transcript: string): Promise<string> {
  const response = await ollama.chat({
    model: MODEL,
    messages: [
      { role: "system", content: PII_SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    options: { temperature: 0 },
  });

  return response.message.content.trim();
}

// --- Transcript Classification ---

const CLASSIFY_SYSTEM_PROMPT = `You are a social determinants of health (SDOH) classifier. Analyze the provided transcript and extract two things:

1. **upstreamDeterminants**: Social/environmental factors affecting health. Use snake_case keys. Examples:
   - food_insecurity, housing_instability, unemployment, lack_of_transportation, social_isolation, financial_strain, lack_of_education, substance_abuse, domestic_violence, neighborhood_safety, lack_of_health_insurance, language_barrier, immigration_status

2. **healthIssues**: Medical or health conditions mentioned or implied. Use snake_case keys. Examples:
   - diabetes, hypertension, mental_health, chronic_pain, obesity, asthma, heart_disease, depression, anxiety, substance_use_disorder, malnutrition

Rules:
1. Return ONLY valid JSON — no markdown, no explanation, no extra text.
2. Each item must have a "key" (snake_case identifier) and "label" (human-readable name).
3. Only include determinants and issues clearly supported by the transcript. Do NOT guess or infer.
4. If none are found for a category, return an empty array.

Response format:
{"upstreamDeterminants":[{"key":"...","label":"..."}],"healthIssues":[{"key":"...","label":"..."}]}`;

export async function classifyTranscript(
  maskedText: string
): Promise<{ upstreamDeterminants: Classification[]; healthIssues: Classification[] }> {
  const response = await ollama.chat({
    model: MODEL,
    messages: [
      { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
      { role: "user", content: maskedText },
    ],
    options: { temperature: 0 },
    format: "json",
  });

  try {
    const parsed = JSON.parse(response.message.content.trim());
    return {
      upstreamDeterminants: Array.isArray(parsed.upstreamDeterminants)
        ? parsed.upstreamDeterminants
        : [],
      healthIssues: Array.isArray(parsed.healthIssues)
        ? parsed.healthIssues
        : [],
    };
  } catch {
    return { upstreamDeterminants: [], healthIssues: [] };
  }
}
