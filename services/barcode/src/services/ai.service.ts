import { GoogleGenerativeAI } from '@google/generative-ai';
import { type AlternativePromptInput } from '../utils/types/prompts';
import { getAlternativeProductsPrompt } from '../utils/aiPrompt';
import { type SuggestedAlternative } from '../utils/types/alternatives';

const INVALID_BRAND_PATTERNS = [
  /generic/i,
  /store brand/i,
  /house brand/i,
  /private label/i,
  /supermarket brand/i,
  /grocery brand/i,
];

const hasValidBrand = (brand: string): boolean => {
  const normalizedBrand = brand.trim();

  if (!normalizedBrand) {
    return false;
  }

  return !INVALID_BRAND_PATTERNS.some((pattern) =>
    pattern.test(normalizedBrand),
  );
};

export class AIService {
  private genAI(): GoogleGenerativeAI | null {
    if (process.env.GEMINI_API_KEY) {
      return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return null;
  }

  async generateAlternativeProducts(
    promptInput: AlternativePromptInput,
  ): Promise<SuggestedAlternative[]> {
    const genAI = this.genAI();
    if (!genAI) {
      console.warn('GEMINI_API_KEY is not set, skipping AI suggestions');
      return [];
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    try {
      const result = await model.generateContent(
        getAlternativeProductsPrompt(promptInput),
      );

      const text = result.response.text();
      console.log('Gemini raw alternatives response:', text);

      const parsed = this.parseAlternatives(text);
      console.log('Gemini parsed alternatives:', parsed);

      return parsed.slice(0, 5);
    } catch (error) {
      console.error('Gemini alternatives generation failed:', error);
      return [];
    }
  }

  private parseAlternatives(raw: string): SuggestedAlternative[] {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Gemini response did not contain a JSON object');
      return [];
    }

    try {
      const data = JSON.parse(jsonMatch[0]) as {
        alternatives?: Array<Partial<SuggestedAlternative>>;
      };

      const alternatives = data.alternatives || [];

      return alternatives
        .map((item) => ({
          productName: String(item.productName || '').trim(),
          brand: String(item.brand || '').trim(),
          reason: String(item.reason || '').trim(),
        }))
        .filter(
          (item) =>
            item.productName.length > 0 &&
            hasValidBrand(item.brand) &&
            item.reason.length > 0,
        );
    } catch (error) {
      console.warn('Failed to parse Gemini alternatives JSON:', error);
      return [];
    }
  }
}
