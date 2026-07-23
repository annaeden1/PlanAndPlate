jest.mock('../../services/openFoodFactsService', () => ({
  searchProducts: jest.fn(),
}));
jest.mock('../../services/ai.service', () => ({
  AIService: jest.fn().mockImplementation(() => ({
    generateAlternativeProducts: jest.fn(),
  })),
}));

import { generateAlternativeSuggestions } from '../../services/alternativeProductsService';
import { searchProducts } from '../../services/openFoodFactsService';
import { AIService } from '../../services/ai.service';
import type { ProductNutrition } from '../../utils/types/product';
import type { PreferenceMatch } from '../../utils/types/preferences';

const mockSearch = searchProducts as jest.Mock;
// The service instantiates AIService once at module load; reach that instance.
const mockGenerate = (AIService as jest.Mock).mock.results[0].value
  .generateAlternativeProducts as jest.Mock;

const failing: PreferenceMatch[] = [{ label: 'dairy free', status: 'mismatch' }];
const passing: PreferenceMatch[] = [{ label: 'dairy free', status: 'match' }];

const baseProduct: ProductNutrition = {
  product_name: 'Cow Milk',
  brands: 'DairyCo',
  countries_tags: ['en:united-kingdom', 'en:', 'spain'],
  countries: 'France,,Germany',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('generateAlternativeSuggestions', () => {
  it('returns [] immediately when no preferences failed', async () => {
    const result = await generateAlternativeSuggestions(baseProduct, {}, passing);
    expect(result).toEqual([]);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns [] when the AI produces no suggestions', async () => {
    mockGenerate.mockResolvedValue([]);
    const result = await generateAlternativeSuggestions(baseProduct, {}, failing);
    expect(result).toEqual([]);
  });

  it('builds the prompt with countries derived from tags and text', async () => {
    mockGenerate.mockResolvedValue([]);
    await generateAlternativeSuggestions(
      baseProduct,
      { diet: ['vegan'], allergies: ['dairy'], healthGoal: 'weight_loss' },
      failing,
    );
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: 'Cow Milk',
        brand: 'DairyCo',
        originalProductCountries: expect.arrayContaining([
          'United Kingdom',
          'Spain',
          'France',
          'Germany',
        ]),
        userPreferences: ['vegan'],
        userAllergies: ['dairy'],
        userHealthGoals: ['weight_loss'],
        validationIssues: ['dairy free failed'],
      }),
    );
  });

  it('returns a verified OpenFoodFacts match (high-confidence, single query)', async () => {
    mockGenerate.mockResolvedValue([
      { productName: 'Oat Milk', brand: 'Oatly', reason: 'plant based' },
    ]);
    // Duplicate candidate exercises the de-duplication path.
    mockSearch.mockResolvedValue([
      { product_name: 'Oat Milk', brands: 'Oatly' },
      { product_name: 'Oat Milk', brands: 'Oatly' },
    ]);

    const result = await generateAlternativeSuggestions(baseProduct, {}, failing);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      productName: 'Oat Milk',
      brand: 'Oatly',
      source: 'openfoodfacts',
      verified: true,
    });
    // High-confidence match stops after the first query.
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  it('collapses queries when the product name already starts with the brand', async () => {
    mockGenerate.mockResolvedValue([
      { productName: 'Oatly Barista', brand: 'Oatly', reason: 'r' },
    ]);
    mockSearch.mockResolvedValue([{ product_name: 'Oatly Barista', brands: 'Oatly' }]);

    await generateAlternativeSuggestions(baseProduct, {}, failing);

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith('Oatly Barista');
  });

  it('runs a second query and merges candidates when the first is only a partial match', async () => {
    mockGenerate.mockResolvedValue([
      { productName: 'Special Drink', brand: 'Brand', reason: 'r' },
    ]);
    mockSearch
      .mockResolvedValueOnce([{ product_name: 'Special Drink X', brands: 'Nope' }])
      .mockResolvedValueOnce([{ product_name: 'Special Drink', brands: 'Brand' }]);

    const result = await generateAlternativeSuggestions(baseProduct, {}, failing);

    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(result[0]).toMatchObject({
      productName: 'Special Drink',
      verified: true,
    });
  });

  it('returns an unverified AI suggestion when no candidate scores high enough', async () => {
    mockGenerate.mockResolvedValue([
      { productName: 'Zzz Unique', brand: '', reason: 'because' },
    ]);
    mockSearch.mockResolvedValue([
      { product_name: 'Completely Different', brands: 'Other' },
    ]);

    const result = await generateAlternativeSuggestions(baseProduct, {}, failing);

    expect(result).toEqual([
      {
        productName: 'Zzz Unique',
        brand: '',
        reason: 'because',
        source: 'ai',
        verified: false,
      },
    ]);
  });

  it('returns an unverified AI suggestion when the search yields no candidates', async () => {
    mockGenerate.mockResolvedValue([
      { productName: 'Ghost Product', brand: 'Ghost', reason: 'r' },
    ]);
    mockSearch.mockResolvedValue([]);

    const result = await generateAlternativeSuggestions(baseProduct, {}, failing);

    expect(result[0]).toMatchObject({ source: 'ai', verified: false });
  });

  it('sorts verified matches ahead of unverified ones', async () => {
    mockGenerate.mockResolvedValue([
      { productName: 'Zzz Unique', brand: '', reason: 'r1' },
      { productName: 'Oat Milk', brand: 'Oatly', reason: 'r2' },
    ]);
    mockSearch.mockImplementation(async (query: string) => {
      if (query.toLowerCase().includes('oat milk')) {
        return [{ product_name: 'Oat Milk', brands: 'Oatly' }];
      }
      return [];
    });

    const result = await generateAlternativeSuggestions(baseProduct, {}, failing);

    expect(result).toHaveLength(2);
    expect(result[0].verified).toBe(true);
    expect(result[1].verified).toBe(false);
  });

  it('handles a product with no country metadata', async () => {
    mockGenerate.mockResolvedValue([]);
    await generateAlternativeSuggestions(
      { product_name: 'X', brands: 'Y' },
      {},
      failing,
    );
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ originalProductCountries: [] }),
    );
  });
});
