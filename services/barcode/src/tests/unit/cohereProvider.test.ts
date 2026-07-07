import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CohereClient } from 'cohere-ai';
import { CohereProvider } from '../../ai/cohereProvider';
import { getAlternativeProductsPrompt } from '../../utils/aiPrompt';
import { type AlternativePromptInput } from '../../utils/types/prompts';

jest.mock('cohere-ai', () => ({
  CohereClient: jest.fn(),
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

describe('CohereProvider', () => {
  const mockChat = jest.fn<
    (request?: unknown) => Promise<{ text: string }>
  >();

  beforeEach(() => {
    jest.clearAllMocks();
    (CohereClient as unknown as jest.Mock).mockImplementation(() => ({
      chat: mockChat,
    }));
    (getAlternativeProductsPrompt as jest.Mock).mockReturnValue('mock prompt');
  });

  it('returns cleaned text when cohere call succeeds', async () => {
    const provider = new CohereProvider('test-key');
    mockChat.mockResolvedValue({
      text: '```json\n{"alternatives": []}\n```',
    });

    const result = await provider.generate(mockPromptInput);

    expect(getAlternativeProductsPrompt).toHaveBeenCalledWith(mockPromptInput);
    expect(mockChat).toHaveBeenCalledWith({
      model: 'command-r-08-2024',
      message: 'mock prompt',
    });
    expect(result).toBe('{"alternatives": []}');
  });

  it('returns null when cohere returns empty text', async () => {
    const provider = new CohereProvider('test-key');
    mockChat.mockResolvedValue({ text: '' });

    const result = await provider.generate(mockPromptInput);

    expect(result).toBeNull();
  });

  it('returns null when cohere request fails', async () => {
    const provider = new CohereProvider('test-key');
    mockChat.mockRejectedValue('cohere down');

    const result = await provider.generate(mockPromptInput);

    expect(result).toBeNull();
  });
});
