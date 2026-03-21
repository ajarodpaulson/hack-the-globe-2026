import { Ollama } from "ollama";

const ollama = new Ollama({ host: "http://localhost:11434" });

const MODEL = "llama3";

const SYSTEM_PROMPT = `You are a PII/PHI redaction engine. Your ONLY job is to take the user's text and return it with all personally identifiable information replaced by placeholders.

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
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    options: { temperature: 0 },
  });

  return response.message.content.trim();
}