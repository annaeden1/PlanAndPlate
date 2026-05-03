const mockFind = jest.fn();
const mockBulkWrite = jest.fn();
const mockConvert = jest.fn();

jest.mock('../../models/marketMapping.model', () => ({
  MarketMapping: {
    find: (...args: unknown[]) => ({ lean: () => mockFind(...args) }),
    bulkWrite: (...args: unknown[]) => mockBulkWrite(...args),
  },
}));

jest.mock('../../services/gemini.service', () => ({
  convertToMarketUnits: (...args: unknown[]) => mockConvert(...args),
}));

import { resolveMarketPackages } from '../../services/marketMapping.service';

describe('marketMapping.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached entries without calling Gemini', async () => {
    mockFind.mockResolvedValue([
      {
        name: 'tomato',
        unit: 'g',
        marketUnit: 'kg',
        marketQuantity: 1,
        marketSize: '1kg',
        marketSizeInRecipeUnits: 1000,
      },
    ]);

    const result = await resolveMarketPackages([
      { name: 'tomato', quantity: 200, unit: 'g' },
    ]);

    expect(result.get('tomato::g')!.marketUnit).toBe('kg');
    expect(mockConvert).not.toHaveBeenCalled();
    expect(mockBulkWrite).not.toHaveBeenCalled();
  });

  it('calls Gemini only for cache misses then upserts them', async () => {
    mockFind.mockResolvedValue([
      {
        name: 'tomato',
        unit: 'g',
        marketUnit: 'kg',
        marketQuantity: 1,
        marketSize: '1kg',
        marketSizeInRecipeUnits: 1000,
      },
    ]);
    mockConvert.mockResolvedValue([
      {
        name: 'guava',
        marketUnit: 'piece',
        marketQuantity: 1,
        marketSize: '1 piece',
        marketSizeInRecipeUnits: 1,
      },
    ]);
    mockBulkWrite.mockResolvedValue({});

    const result = await resolveMarketPackages([
      { name: 'tomato', quantity: 200, unit: 'g' },
      { name: 'guava', quantity: 2, unit: 'piece' },
    ]);

    expect(mockConvert).toHaveBeenCalledTimes(1);
    expect(mockConvert).toHaveBeenCalledWith([
      { name: 'guava', quantity: 2, unit: 'piece' },
    ]);
    expect(mockBulkWrite).toHaveBeenCalledTimes(1);
    expect(result.get('tomato::g')!.marketUnit).toBe('kg');
    expect(result.get('guava::piece')!.marketUnit).toBe('piece');
  });
});
