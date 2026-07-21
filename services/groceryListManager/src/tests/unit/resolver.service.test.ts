import {
  getHebrewQuery,
  resolveCanonical,
  resolveItemForChain,
} from '../../services/priceComparison/resolver.service';
import { ProductMatch } from '../../models/productMatch.model';
import * as gemini from '../../services/priceComparison/gemini.client';
import { GroceryItem } from '../../types/groceryList.types';
import { ChainAdapter } from '../../types/priceComparison.types';

jest.mock('../../models/productMatch.model');
jest.mock('../../services/priceComparison/gemini.client');

const mockedProductMatch = ProductMatch as jest.Mocked<typeof ProductMatch>;
const mockedGemini = gemini as jest.Mocked<typeof gemini>;

const item: GroceryItem = {
  name: 'whole milk',
  quantity: 1,
  unit: 'liter',
  category: 'Dairy' as GroceryItem['category'],
  inventoryQuantity: 0,
  checked: false,
  recipeCount: 1,
};

const milkProduct = {
  code: '7290001794852',
  barcode: '7290001794852',
  name: 'חלב טרי 3% 1 ליטר רמי לוי',
  price: 7.2,
};

const makeChain = (
  searchResults: Array<{
    code: string;
    barcode: string | null;
    name: string;
    price: number;
  }>,
): ChainAdapter => ({
  id: 'rami-levy',
  displayName: 'רמי לוי',
  delivery: { fee: 35.9 },
  search: jest.fn().mockResolvedValue(searchResults),
  getByCode: jest.fn(),
  getByBarcode: jest.fn(),
});

describe('getHebrewQuery', () => {
  beforeEach(() => jest.resetAllMocks());

  it('reuses a cached translation from any chain', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ hebrewQuery: 'חלב' }),
    });

    expect(await getHebrewQuery('whole milk')).toBe('חלב');
    expect(mockedGemini.generateJson).not.toHaveBeenCalled();
  });

  it('translates via Gemini on cache miss', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    mockedGemini.generateJson.mockResolvedValue('{"query": "חלב"}');

    expect(await getHebrewQuery('whole milk')).toBe('חלב');
  });

  it('returns null on Gemini failure', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    mockedGemini.generateJson.mockResolvedValue(null);

    expect(await getHebrewQuery('whole milk')).toBeNull();
  });
});

describe('resolveCanonical', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (mockedProductMatch.findOneAndUpdate as jest.Mock).mockResolvedValue({});
  });

  it('returns cached canonical without searching or calling Gemini', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue({
      chainId: '__canonical__',
      code: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
    });
    const chain = makeChain([milkProduct]);

    const result = await resolveCanonical(item, chain, 'חלב');

    expect(result).toEqual({
      barcode: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
    });
    expect(chain.search).not.toHaveBeenCalled();
    expect(mockedGemini.generateJson).not.toHaveBeenCalled();
  });

  it('returns null on fresh cached negative canonical', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue({
      chainId: '__canonical__',
      code: null,
      resolvedAt: new Date(),
    });
    const chain = makeChain([milkProduct]);
    expect(await resolveCanonical(item, chain, 'חלב')).toBeNull();
    expect(chain.search).not.toHaveBeenCalled();
  });

  it('re-resolves when the negative cache is stale', async () => {
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue({
      chainId: '__canonical__',
      code: null,
      resolvedAt: old,
    });
    mockedGemini.generateJson.mockResolvedValue(
      '{"code": "7290001794852", "confidence": 0.9}',
    );
    const chain = makeChain([milkProduct]);

    const result = await resolveCanonical(item, chain, 'חלב');

    expect(chain.search).toHaveBeenCalled(); // stale negative -> retried
    expect(result?.barcode).toBe('7290001794852');
  });

  it('searches the reference chain, picks, and caches the barcode', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValue(
      '{"code": "7290001794852", "confidence": 0.9}',
    );
    const chain = makeChain([milkProduct]);

    const result = await resolveCanonical(item, chain, 'חלב');

    expect(chain.search).toHaveBeenCalledWith('חלב');
    expect(result).toMatchObject({
      barcode: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      referenceProduct: milkProduct, // fresh resolution carries the product for reuse
    });
    expect(mockedProductMatch.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: '__canonical__' }),
      expect.objectContaining({
        $set: expect.objectContaining({ code: '7290001794852' }),
      }),
      expect.anything(),
    );
  });

  it('returns null when the chosen candidate has no barcode', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValue(
      '{"code": "x1", "confidence": 0.9}',
    );
    const chain = makeChain([
      { code: 'x1', barcode: null, name: 'שקית ירקות', price: 3 },
    ]);

    expect(await resolveCanonical(item, chain, 'חלב')).toBeNull();
    expect(mockedProductMatch.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('caches a negative canonical when the reference search is empty', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    const chain = makeChain([]);

    expect(await resolveCanonical(item, chain, 'אבקת חד קרן')).toBeNull();
    expect(mockedProductMatch.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: '__canonical__' }),
      expect.objectContaining({ $set: expect.objectContaining({ code: null }) }),
      expect.anything(),
    );
  });
});

describe('resolveItemForChain', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (mockedProductMatch.findOneAndUpdate as jest.Mock).mockResolvedValue({});
  });

  it('returns cached match without searching or calling Gemini', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue({
      itemName: 'whole milk',
      chainId: 'rami-levy',
      code: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      confidence: 0.95,
    });
    const chain = makeChain([milkProduct]);

    const result = await resolveItemForChain(item, chain, 'חלב');

    expect(result).toEqual({
      code: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      confidence: 0.95,
    });
    expect(chain.search).not.toHaveBeenCalled();
    expect(mockedGemini.generateJson).not.toHaveBeenCalled();
  });

  it('returns null on fresh cached negative match', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue({
      itemName: 'whole milk',
      chainId: 'rami-levy',
      code: null,
      matchedName: null,
      confidence: 0,
      resolvedAt: new Date(),
    });
    const chain = makeChain([milkProduct]);

    expect(await resolveItemForChain(item, chain, 'חלב')).toBeNull();
    expect(chain.search).not.toHaveBeenCalled();
  });

  it('searches, picks and caches on cache miss', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValue(
      '{"code": "7290001794852", "confidence": 0.9}',
    );
    const chain = makeChain([milkProduct]);

    const result = await resolveItemForChain(item, chain, 'חלב');

    expect(chain.search).toHaveBeenCalledWith('חלב');
    // Fresh resolution returns the priced product so the pricer can skip a
    // redundant getByCode.
    expect(result).toEqual({
      code: '7290001794852',
      matchedName: 'חלב טרי 3% 1 ליטר רמי לוי',
      confidence: 0.9,
      product: milkProduct,
    });
    expect(mockedProductMatch.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ itemName: 'whole milk', chainId: 'rami-levy' }),
      expect.objectContaining({
        $set: expect.objectContaining({
          hebrewQuery: 'חלב',
          code: '7290001794852',
          confidence: 0.9,
        }),
      }),
      expect.anything(),
    );
  });

  it('rejects a code the LLM invented (not in candidates)', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValue(
      '{"code": "9999999999999", "confidence": 0.9}',
    );
    const chain = makeChain([milkProduct]);

    expect(await resolveItemForChain(item, chain, 'חלב')).toBeNull();
    expect(mockedProductMatch.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('caches a negative result when search returns nothing', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    const chain = makeChain([]);

    expect(await resolveItemForChain(item, chain, 'אבקת חד קרן')).toBeNull();
    expect(mockedProductMatch.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ itemName: 'whole milk', chainId: 'rami-levy' }),
      expect.objectContaining({ $set: expect.objectContaining({ code: null }) }),
      expect.anything(),
    );
  });

  it('returns null without caching when the pick call fails (transient)', async () => {
    (mockedProductMatch.findOne as jest.Mock).mockResolvedValue(null);
    mockedGemini.generateJson.mockResolvedValue(null);
    const chain = makeChain([milkProduct]);

    expect(await resolveItemForChain(item, chain, 'חלב')).toBeNull();
    expect(mockedProductMatch.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
