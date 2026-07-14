import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.5-flash';

let client: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
};

/** Sends a prompt, expects a JSON response. Returns raw text or null on failure. */
export const generateJson = async (prompt: string): Promise<string | null> => {
  try {
    const model = getClient().getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || null;
  } catch (error) {
    console.error('Gemini price-comparison call failed:', error);
    return null;
  }
};
