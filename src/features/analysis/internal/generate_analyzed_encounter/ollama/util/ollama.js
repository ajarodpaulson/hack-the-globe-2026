const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const getBaseUrl = () => DEFAULT_BASE_URL;

const getModel = () => DEFAULT_MODEL;

const invokeStructuredModel = async ({
  prompt,
  outputSchema,
  model = getModel(),
  temperature = 0.2,
  maxTokens = 2500,
}) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('A prompt string is required');
  }

  if (!outputSchema || typeof outputSchema !== 'object' || Array.isArray(outputSchema)) {
    throw new Error('An output schema object is required');
  }

  const response = await fetch(new URL('/api/chat', getBaseUrl()), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: false,
      format: outputSchema,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options: {
        temperature,
        num_predict: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Ollama request failed with status ${response.status}: ${errorBody}`);
  }

  const responseBody = await response.json();
  const content = responseBody?.message?.content;

  if (!content || typeof content !== 'string') {
    throw new Error('Ollama returned no message content');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Ollama returned invalid JSON: ${error.message}`);
  }
};

const ollama = {
  invokeStructuredModel,
  getBaseUrl,
  getModel,
};

export {
  invokeStructuredModel,
  getBaseUrl,
  getModel,
};

export default ollama;
