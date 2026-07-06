import { CohereClient } from 'cohere-ai';
import { type AlternativePromptInput } from '../utils/types/prompts';
import { getAlternativeProductsPrompt } from '../utils/aiPrompt';
import { type AlternativeAiProvider } from './aiProvider';

const COHERE_MODEL = 'command-r-08-2024';

export class CohereProvider implements AlternativeAiProvider {
  name = 'cohere';
  private readonly client: CohereClient;

  constructor(apiKey: string) {
    this.client = new CohereClient({ token: apiKey });
  }

  async generate(promptInput: AlternativePromptInput): Promise<string | null> {
    try {
      const response = await this.client.chat({
        model: COHERE_MODEL,
        message: getAlternativeProductsPrompt(promptInput),
      });

      const text = (response.text || '').replace(/```json|```/g, '').trim();
      return text || null;
    } catch (error) {
      console.error('Cohere alternatives generation failed:', error);
      return null;
    }
  }
}
