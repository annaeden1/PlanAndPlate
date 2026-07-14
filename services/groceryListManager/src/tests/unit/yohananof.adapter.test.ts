import axios from 'axios';
import { yohananofAdapter } from '../../services/priceComparison/yohananof.adapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const gqlResponse = (items: unknown[]) => ({
  data: { data: { products: { items } } },
});

const rawMilk = {
  sku: '7290004131074',
  name: 'חלב תנובה טרי 1 ל קרטון 3%',
  price_range: { minimum_price: { final_price: { value: 7.35 } } },
};

describe('yohananofAdapter', () => {
  beforeEach(() => jest.resetAllMocks());

  it('exposes chain metadata', () => {
    expect(yohananofAdapter.id).toBe('yohananof');
    expect(yohananofAdapter.displayName).toBe('יוחננוף');
  });

  describe('search', () => {
    it('POSTs a GraphQL search query and maps products', async () => {
      mockedAxios.post.mockResolvedValue(gqlResponse([rawMilk]));

      const results = await yohananofAdapter.search('חלב');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.yochananof.co.il/graphql',
        { query: expect.stringContaining('search: "חלב"') },
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
      expect(results).toEqual([
        {
          code: '7290004131074',
          barcode: '7290004131074',
          name: 'חלב תנובה טרי 1 ל קרטון 3%',
          price: 7.35,
        },
      ]);
    });

    it('escapes quotes in the search term', async () => {
      mockedAxios.post.mockResolvedValue(gqlResponse([]));
      await yohananofAdapter.search('חלב "טרי"');
      const body = mockedAxios.post.mock.calls[0][1] as { query: string };
      expect(body.query).toContain('search: "חלב \\"טרי\\""');
    });

    it('returns [] on malformed response', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });
      expect(await yohananofAdapter.search('xyz')).toEqual([]);
    });
  });

  describe('getByCode', () => {
    it('filters by sku and returns the match', async () => {
      mockedAxios.post.mockResolvedValue(gqlResponse([rawMilk]));

      const product = await yohananofAdapter.getByCode('7290004131074');

      const body = mockedAxios.post.mock.calls[0][1] as { query: string };
      expect(body.query).toContain('sku: {eq: "7290004131074"}');
      expect(product?.price).toBe(7.35);
    });

    it('returns null when sku not found', async () => {
      mockedAxios.post.mockResolvedValue(gqlResponse([]));
      expect(await yohananofAdapter.getByCode('000')).toBeNull();
    });
  });

  describe('getByBarcode', () => {
    it('filters by sku (= EAN) and returns the match', async () => {
      mockedAxios.post.mockResolvedValue(gqlResponse([rawMilk]));

      const product = await yohananofAdapter.getByBarcode('7290004131074');

      const body = mockedAxios.post.mock.calls[0][1] as { query: string };
      expect(body.query).toContain('sku: {eq: "7290004131074"}');
      expect(product?.barcode).toBe('7290004131074');
    });

    it('returns null when the barcode is not stocked', async () => {
      mockedAxios.post.mockResolvedValue(gqlResponse([]));
      expect(await yohananofAdapter.getByBarcode('000')).toBeNull();
    });
  });
});
