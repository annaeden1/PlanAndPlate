import { comparePrices } from '../../services/priceComparison/priceComparison.service';
import { GroceryList } from '../../models/groceryList.model';
import * as resolver from '../../services/priceComparison/resolver.service';
import { CHAIN_ADAPTERS } from '../../services/priceComparison/chains';
import { NotFoundError } from '../../types/errors';
import { ChainAdapter, ChainProduct } from '../../types/priceComparison.types';

jest.mock('../../models/groceryList.model');
jest.mock('../../services/priceComparison/resolver.service');
jest.mock('../../services/priceComparison/chains', () => ({
  CHAIN_ADAPTERS: [] as unknown[],
}));

const mockedList = GroceryList as jest.Mocked<typeof GroceryList>;
const mockedResolver = resolver as jest.Mocked<typeof resolver>;

const listWith = (items: unknown[]) =>
  (mockedList.findOne as jest.Mock).mockResolvedValue({ items });

const groceryItem = (name: string, checked = false) => ({
  name,
  quantity: 1,
  unit: 'piece',
  category: 'Other',
  inventoryQuantity: 0,
  checked,
  recipeCount: 1,
});

const product = (code: string, price: number): ChainProduct => ({
  code,
  barcode: code,
  name: `מוצר ${code}`,
  price,
});

/**
 * Chain whose getByBarcode/getByCode return a price from lookup maps.
 * byBarcode drives the canonical fast path; byCode drives the LLM fallback.
 */
const makeChain = (
  id: string,
  displayName: string,
  fee: number,
  maps: { byBarcode?: Record<string, number>; byCode?: Record<string, number> } = {},
): ChainAdapter => ({
  id: id as ChainAdapter['id'],
  displayName,
  delivery: { fee },
  search: jest.fn().mockResolvedValue([]),
  getByBarcode: jest.fn(async (bc: string) =>
    maps.byBarcode && bc in maps.byBarcode ? product(bc, maps.byBarcode[bc]) : null,
  ),
  getByCode: jest.fn(async (code: string) =>
    maps.byCode && code in maps.byCode ? product(code, maps.byCode[code]) : null,
  ),
});

const setChains = (...chains: ChainAdapter[]) => {
  (CHAIN_ADAPTERS as unknown as ChainAdapter[]).length = 0;
  (CHAIN_ADAPTERS as unknown as ChainAdapter[]).push(...chains);
};

describe('comparePrices', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedResolver.getHebrewQuery.mockResolvedValue('חלב');
    mockedResolver.resolveCanonical.mockResolvedValue({
      barcode: 'BC',
      matchedName: 'חלב',
    });
    mockedResolver.resolveItemForChain.mockResolvedValue({
      code: 'FB',
      matchedName: 'חלב',
      confidence: 0.9,
    });
  });

  it('throws NotFoundError when the list is empty or absent', async () => {
    (mockedList.findOne as jest.Mock).mockResolvedValue(null);
    await expect(comparePrices('u1')).rejects.toThrow(NotFoundError);
  });

  it('prices every chain from the canonical barcode without a per-chain LLM pick', async () => {
    listWith([groceryItem('milk')]);
    setChains(
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }),
      makeChain('shufersal', 'שופרסל', 50.9, { byBarcode: { BC: 9 } }),
    );

    const result = await comparePrices('u1');

    expect(result.chains[0].chain).toBe('rami-levy'); // 7 + 35.9 = 42.9
    expect(result.chains[0].total).toBe(42.9);
    expect(result.chains[1].total).toBe(59.9); // 9 + 50.9
    expect(mockedResolver.resolveItemForChain).not.toHaveBeenCalled();
  });

  it('translates and resolves the canonical once, reused across chains', async () => {
    listWith([groceryItem('milk')]);
    setChains(
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }),
      makeChain('shufersal', 'שופרסל', 50.9, { byBarcode: { BC: 9 } }),
    );

    await comparePrices('u1');

    expect(mockedResolver.getHebrewQuery).toHaveBeenCalledTimes(1);
    expect(mockedResolver.resolveCanonical).toHaveBeenCalledTimes(1);
  });

  it('falls back to a per-chain LLM pick when the barcode is not stocked', async () => {
    listWith([groceryItem('milk')]);
    setChains(
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }),
      // shufersal doesn't stock the canonical barcode, but a name search finds FB
      makeChain('shufersal', 'שופרסל', 50.9, { byCode: { FB: 9 } }),
    );

    const result = await comparePrices('u1');

    const shuf = result.chains.find((c) => c.chain === 'shufersal')!;
    expect(shuf.items).toHaveLength(1);
    expect(shuf.items[0].unitPrice).toBe(9);
    expect(mockedResolver.resolveItemForChain).toHaveBeenCalledTimes(1);
  });

  it('marks the item missing when both barcode and fallback fail', async () => {
    listWith([groceryItem('milk')]);
    setChains(
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }),
      makeChain('osher-ad', 'אושר עד', 0, {}), // no barcode, no fallback code
    );

    const result = await comparePrices('u1');

    const osherAd = result.chains.find((c) => c.chain === 'osher-ad')!;
    expect(osherAd.missing).toEqual(['milk']);
  });

  it('uses per-chain fallback for all chains when there is no canonical', async () => {
    listWith([groceryItem('milk')]);
    mockedResolver.resolveCanonical.mockResolvedValue(null);
    setChains(
      makeChain('rami-levy', 'רמי לוי', 35.9, { byCode: { FB: 7 } }),
    );

    const result = await comparePrices('u1');

    expect(result.chains[0].items[0].unitPrice).toBe(7);
    expect(mockedResolver.resolveItemForChain).toHaveBeenCalledTimes(1);
  });

  it('marks all items missing (no LLM) when translation fails', async () => {
    listWith([groceryItem('milk')]);
    mockedResolver.getHebrewQuery.mockResolvedValue(null);
    setChains(makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }));

    const result = await comparePrices('u1');

    expect(result.chains[0].missing).toEqual(['milk']);
    expect(mockedResolver.resolveCanonical).not.toHaveBeenCalled();
    expect(mockedResolver.resolveItemForChain).not.toHaveBeenCalled();
  });

  it('ranks complete baskets above cheaper incomplete ones', async () => {
    listWith([groceryItem('milk')]);
    setChains(
      makeChain('osher-ad', 'אושר עד', 0, {}), // total 0 but item missing
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }),
    );

    const result = await comparePrices('u1');

    expect(result.chains[0].chain).toBe('rami-levy');
    expect(result.chains[1].chain).toBe('osher-ad');
  });

  it('flags an item whose price is a cross-chain outlier (likely a bigger package)', async () => {
    listWith([groceryItem('milk')]);
    setChains(
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 14.7 } }),
      makeChain('shufersal', 'שופרסל', 50.9, { byBarcode: { BC: 7.35 } }),
      makeChain('yohananof', 'יוחננוף', 35.9, { byBarcode: { BC: 7.35 } }),
    );

    const result = await comparePrices('u1');

    const rami = result.chains.find((c) => c.chain === 'rami-levy')!;
    const shuf = result.chains.find((c) => c.chain === 'shufersal')!;
    expect(rami.items[0].note).toContain('גודל אריזה');
    expect(shuf.items[0].note).toBeUndefined();
  });

  it('a chain adapter throwing does not break the other chains', async () => {
    listWith([groceryItem('milk')]);
    const broken = makeChain('shufersal', 'שופרסל', 50.9, { byBarcode: { BC: 9 } });
    (broken.getByBarcode as jest.Mock).mockRejectedValue(new Error('site down'));
    setChains(
      broken,
      makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }),
    );

    const result = await comparePrices('u1');

    const rami = result.chains.find((c) => c.chain === 'rami-levy')!;
    const shuf = result.chains.find((c) => c.chain === 'shufersal')!;
    expect(rami.items).toHaveLength(1);
    expect(shuf.missing).toEqual(['milk']);
  });

  it('skips checked items entirely', async () => {
    listWith([groceryItem('milk', true)]);
    setChains(makeChain('rami-levy', 'רמי לוי', 35.9, { byBarcode: { BC: 7 } }));

    const result = await comparePrices('u1');

    expect(mockedResolver.resolveCanonical).not.toHaveBeenCalled();
    expect(mockedResolver.resolveItemForChain).not.toHaveBeenCalled();
    expect(result.chains[0].items).toEqual([]);
    expect(result.chains[0].missing).toEqual([]);
  });
});
