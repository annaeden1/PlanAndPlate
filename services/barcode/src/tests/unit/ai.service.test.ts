import { AIService } from '../../services/ai.service';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { type AlternativeAiProvider } from '../../ai/aiProvider';
import { type SuggestedAlternative } from '../../utils/types/alternatives';
import { type AlternativePromptInput } from '../../utils/types/prompts';

const basePromptInput: AlternativePromptInput = {
  productName: 'Chocolate Bar',
  brand: 'BrandX',
  originalProductCountries: ['United States'],
  userPreferences: ['vegan'],
  userAllergies: ['dairy'],
  userHealthGoals: ['lowSugar'],
  validationIssues: ['dairy free failed'],
};

const darkChocolateAlternative: SuggestedAlternative = {
  productName: 'Dark Chocolate 90%',
  brand: 'Lindt',
  reason: 'No dairy ingredients listed',
};

const oatChocolateAlternative: SuggestedAlternative = {
  productName: 'Oat Chocolate Bar',
  brand: 'Nomo',
  reason: 'Dairy-free alternative',
};

const validAlternative: SuggestedAlternative = {
  productName: 'Valid Bar',
  brand: 'RealBrand',
  reason: 'Fits user preferences',
};

const filteredAlternativesInput: Array<Partial<SuggestedAlternative>> = [
  validAlternative,
  {
    productName: 'Rejected Generic',
    brand: 'Generic',
    reason: 'Bad brand',
  },
  {
    productName: '',
    brand: 'NoName',
    reason: 'Missing product name',
  },
  {
    productName: 'Missing reason',
    brand: 'BrandY',
    reason: '',
  },
];

const bulkAlternativesInput: SuggestedAlternative[] = [
  { productName: 'A1', brand: 'B1', reason: 'R1' },
  { productName: 'A2', brand: 'B2', reason: 'R2' },
  { productName: 'A3', brand: 'B3', reason: 'R3' },
  { productName: 'A4', brand: 'B4', reason: 'R4' },
  { productName: 'A5', brand: 'B5', reason: 'R5' },
  { productName: 'A6', brand: 'B6', reason: 'R6' },
];

const createProvider = (
  name: string,
  implementation: (
    promptInput: AlternativePromptInput,
  ) => Promise<string | null>,
): AlternativeAiProvider => ({
  name,
  generate: jest.fn(implementation),
});

const buildAlternativesResponse = (
  alternatives: Array<Partial<SuggestedAlternative>>,
): string => JSON.stringify({ alternatives });

describe('AIService - Unit Tests', () => {
  afterEach(() => {
    delete process.env.AI_PROVIDER_TIMEOUT_MS;
    jest.clearAllMocks();
  });

  it('uses fallback provider when primary returns empty response', async () => {
    const primary = createProvider('primary', async () => null);
    const fallback = createProvider('fallback', async () =>
      buildAlternativesResponse([darkChocolateAlternative]),
    );

    const service = new AIService([primary, fallback]);
    const result = await service.generateAlternativeProducts(basePromptInput);

    expect(primary.generate).toHaveBeenCalledTimes(1);
    expect(fallback.generate).toHaveBeenCalledTimes(1);
    expect(result).toEqual([darkChocolateAlternative]);
  });

  it('uses fallback provider when primary times out', async () => {
    process.env.AI_PROVIDER_TIMEOUT_MS = '1';

    const slowPrimary = createProvider(
      'slow-primary',
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('{"alternatives": []}'), 25);
        }),
    );

    const fallback = createProvider('fallback', async () =>
      buildAlternativesResponse([oatChocolateAlternative]),
    );

    const service = new AIService([slowPrimary, fallback]);
    const result = await service.generateAlternativeProducts(basePromptInput);

    expect(slowPrimary.generate).toHaveBeenCalledTimes(1);
    expect(fallback.generate).toHaveBeenCalledTimes(1);
    expect(result[0].productName).toBe(oatChocolateAlternative.productName);
  });

  it('filters invalid alternatives and keeps only valid brand/product/reason entries', async () => {
    const provider = createProvider('provider-1', async () =>
      buildAlternativesResponse(filteredAlternativesInput),
    );

    const service = new AIService([provider]);
    const result = await service.generateAlternativeProducts(basePromptInput);

    expect(result).toEqual([validAlternative]);
  });

  it('returns at most five alternatives', async () => {
    const provider = createProvider('provider-1', async () =>
      buildAlternativesResponse(bulkAlternativesInput),
    );

    const service = new AIService([provider]);
    const result = await service.generateAlternativeProducts(basePromptInput);

    expect(result).toHaveLength(5);
    expect(result.map((item) => item.productName)).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
    ]);
  });

  it('returns empty array when all providers fail or return invalid output', async () => {
    const providerOne = createProvider(
      'provider-1',
      async () => 'not json at all',
    );
    const providerTwo = createProvider('provider-2', async () =>
      buildAlternativesResponse([
        { productName: 'x', brand: 'store brand', reason: 'y' },
      ]),
    );

    const service = new AIService([providerOne, providerTwo]);
    const result = await service.generateAlternativeProducts(basePromptInput);

    expect(result).toEqual([]);
  });
});
