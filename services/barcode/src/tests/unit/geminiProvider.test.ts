import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiProvider } from '../../ai/geminiProvider';
import { getAlternativeProductsPrompt } from '../../utils/aiPrompt';
import { type AlternativePromptInput } from '../../utils/types/prompts';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

jest.mock('../../utils/aiPrompt', () => ({
  getAlternativeProductsPrompt: jest.fn(),
}));

const mockPromptInput: AlternativePromptInput = {
  productName: 'Chocolate Bar',
  brand: 'BrandX',
  originalProductCountries: ['United States'],
  userPreferences: ['vegan'],
  userAllergies: ['dairy'],
  userHealthGoals: ['lowSugar'],
  validationIssues: ['dairy free failed'],
};

describe('GeminiProvider', () => {
  const mockGenerateContent = jest.fn<
    (prompt?: unknown) => Promise<{ response: { text: () => string } }>
  >();
  const mockGetGenerativeModel = jest.fn<
    (
      config?: unknown,
    ) => { generateContent: typeof mockGenerateContent }
  >(() => ({
    generateContent: mockGenerateContent,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));
    (getAlternativeProductsPrompt as jest.Mock).mockReturnValue('mock prompt');
  });

  it('returns trimmed text when gemini call succeeds', async () => {
    const provider = new GeminiProvider('test-key');
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '  {"alternatives": []}  ',
      },
    });

    const result = await provider.generate(mockPromptInput);

    expect(getAlternativeProductsPrompt).toHaveBeenCalledWith(mockPromptInput);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
    expect(mockGenerateContent).toHaveBeenCalledWith('mock prompt');
    expect(result).toBe('{"alternatives": []}');
  });

  it('returns null when gemini returns empty text', async () => {
    const provider = new GeminiProvider('test-key');
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '   ',
      },
    });

    const result = await provider.generate(mockPromptInput);

    expect(result).toBeNull();
  });

  it('returns null when gemini request fails', async () => {
    const provider = new GeminiProvider('test-key');
    mockGenerateContent.mockRejectedValue('gemini down');

    const result = await provider.generate(mockPromptInput);

    expect(result).toBeNull();
  });
});
