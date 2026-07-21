import axios from 'axios';
import { shufersalAdapter } from '../../services/priceComparison/shufersal.adapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const searchResponse = (results: unknown[]) => ({ data: { results } });

const rawMilk = {
  code: 'P_4131074',
  name: 'חלב בקרטון 3% שומן',
  sku: '4131074',
  price: { value: 7.35 },
};

describe('shufersalAdapter', () => {
  beforeEach(() => jest.resetAllMocks());

  it('exposes chain metadata', () => {
    expect(shufersalAdapter.id).toBe('shufersal');
    expect(shufersalAdapter.displayName).toBe('שופרסל');
    expect(shufersalAdapter.delivery.fee).toBe(50.9);
  });

  describe('search', () => {
    it('GETs the search endpoint and maps products', async () => {
      mockedAxios.get.mockResolvedValue(searchResponse([rawMilk]));

      const results = await shufersalAdapter.search('חלב');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.shufersal.co.il/online/he/search/results',
        expect.objectContaining({
          params: { q: 'חלב:relevance', limit: 20 },
        }),
      );
      expect(results).toEqual([
        {
          code: 'P_4131074',
          barcode: null, // short sku is an internal code, not an EAN
          name: 'חלב בקרטון 3% שומן',
          price: 7.35,
        },
      ]);
    });

    it('keeps a 13-digit sku as barcode', async () => {
      mockedAxios.get.mockResolvedValue(
        searchResponse([
          { ...rawMilk, code: 'P_7290107932080', sku: '7290107932080' },
        ]),
      );
      const [p] = await shufersalAdapter.search('חלב');
      expect(p.barcode).toBe('7290107932080');
    });

    it('returns [] on missing results array', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      expect(await shufersalAdapter.search('xyz')).toEqual([]);
    });
  });

  describe('getByCode', () => {
    it('searches by the numeric part and matches the full code', async () => {
      mockedAxios.get.mockResolvedValue(searchResponse([rawMilk]));

      const product = await shufersalAdapter.getByCode('P_4131074');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { q: '4131074:relevance', limit: 20 },
        }),
      );
      expect(product?.code).toBe('P_4131074');
    });

    it('returns null when no result matches', async () => {
      mockedAxios.get.mockResolvedValue(searchResponse([]));
      expect(await shufersalAdapter.getByCode('P_999')).toBeNull();
    });
  });

  describe('getByBarcode', () => {
    it('matches when a result exposes the EAN as sku', async () => {
      mockedAxios.get.mockResolvedValue(
        searchResponse([
          { ...rawMilk, code: 'P_7290107932080', sku: '7290107932080' },
        ]),
      );
      const product = await shufersalAdapter.getByBarcode('7290107932080');
      expect(product?.barcode).toBe('7290107932080');
    });

    it('returns null when the barcode is only an internal (non-EAN) code', async () => {
      // rawMilk.sku is "4131074" (internal), never an EAN barcode
      mockedAxios.get.mockResolvedValue(searchResponse([rawMilk]));
      expect(await shufersalAdapter.getByBarcode('7290001794852')).toBeNull();
    });
  });
});
