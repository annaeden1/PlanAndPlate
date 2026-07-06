import { GoogleGenerativeAI } from '@google/generative-ai';
import { type AlternativePromptInput } from '../utils/types/prompts';
import { getAlternativeProductsPrompt } from '../utils/aiPrompt';
import { type AlternativeAiProvider } from './aiProvider';

const GEMINI_MODEL = 'gemini-2.5-flash';

export class GeminiProvider implements AlternativeAiProvider {
  name = 'gemini';
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(promptInput: AlternativePromptInput): Promise<string | null> {
    try {
      const model = this.client.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(
        getAlternativeProductsPrompt(promptInput),
      );

      const text = result.response.text().trim();
      return text || null;
    } catch (error) {
      console.error('Gemini alternatives generation failed:', error);
      return null;
    }
  }
}
