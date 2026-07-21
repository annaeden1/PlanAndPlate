import axios from 'axios';
import { ramiLevyAdapter } from '../../services/priceComparison/ramiLevy.adapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const catalogResponse = (products: unknown[]) => ({
  data: { status: 200, total: products.length, data: products },
});

const rawMilk = {
  id: 419939,
  barcode: 7290001794852,
  name: 'חלב טרי 3% 1 ליטר רמי לוי',
  price: { price: 7.2 },
};

describe('ramiLevyAdapter', () => {
  beforeEach(() => jest.resetAllMocks());

  it('exposes chain metadata', () => {
    expect(ramiLevyAdapter.id).toBe('rami-levy');
    expect(ramiLevyAdapter.displayName).toBe('רמי לוי');
    expect(ramiLevyAdapter.delivery.fee).toBe(35.9);
  });

  describe('search', () => {
    it('POSTs the query to the catalog endpoint and maps products', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));

      const results = await ramiLevyAdapter.search('חלב');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.rami-levy.co.il/api/catalog',
        { q: 'חלב', store: '331', from: 0, aggs: 1 },
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
      expect(results).toEqual([
        {
          code: '7290001794852',
          barcode: '7290001794852',
          name: 'חלב טרי 3% 1 ליטר רמי לוי',
          price: 7.2,
          packageQty: 1,
          packageUnit: 'l',
        },
      ]);
    });

    it('returns [] when the response has no data array', async () => {
      mockedAxios.post.mockResolvedValue({ data: { status: 200, total: 0 } });
      expect(await ramiLevyAdapter.search('xyz')).toEqual([]);
    });

    it('skips products without a valid price', async () => {
      mockedAxios.post.mockResolvedValue(
        catalogResponse([{ ...rawMilk, price: {} }]),
      );
      expect(await ramiLevyAdapter.search('חלב')).toEqual([]);
    });
  });

  describe('getByCode', () => {
    it('returns the exact code match', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));
      const product = await ramiLevyAdapter.getByCode('7290001794852');
      expect(product?.code).toBe('7290001794852');
      expect(product?.price).toBe(7.2);
    });

    it('returns null when nothing matches the code exactly', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));
      expect(await ramiLevyAdapter.getByCode('0000000000000')).toBeNull();
    });
  });

  describe('getByBarcode', () => {
    it('returns the product matching the barcode', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));
      const product = await ramiLevyAdapter.getByBarcode('7290001794852');
      expect(product?.barcode).toBe('7290001794852');
      expect(product?.price).toBe(7.2);
    });

    it('returns null when the barcode is not stocked', async () => {
      mockedAxios.post.mockResolvedValue(catalogResponse([rawMilk]));
      expect(await ramiLevyAdapter.getByBarcode('0000000000000')).toBeNull();
    });
  });
});
