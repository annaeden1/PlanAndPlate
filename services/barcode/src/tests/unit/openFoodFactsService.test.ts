import axios from 'axios';

jest.mock('axios');

const mockGet = jest.fn();
(axios.create as jest.Mock).mockReturnValue({ get: mockGet });

// Import the service AFTER axios.create is stubbed so the module-level
// http client picks up our mocked `get`.
let offService: typeof import('../../services/openFoodFactsService');
beforeAll(() => {
  offService = require('../../services/openFoodFactsService');
});

const setIsAxiosError = (value: boolean) => {
  (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(value);
};

describe('openFoodFactsService', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setIsAxiosError(false);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('fetchProductByBarcode', () => {
    it('returns the product when status === 1', async () => {
      mockGet.mockResolvedValueOnce({
        data: { status: 1, product: { product_name: 'Milk' } },
      });
      const result = await offService.fetchProductByBarcode('123');
      expect(result).toEqual({ product_name: 'Milk' });
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/v0/product/123.json'),
      );
    });

    it('returns null when status !== 1', async () => {
      mockGet.mockResolvedValueOnce({ data: { status: 0 } });
      const result = await offService.fetchProductByBarcode('404');
      expect(result).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('returns [] for an empty/whitespace query without calling the API', async () => {
      const result = await offService.searchProducts('   ');
      expect(result).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('returns products on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { products: [{ product_name: 'A' }, { product_name: 'B' }] },
      });
      const result = await offService.searchProducts('unique-query-1');
      expect(result).toHaveLength(2);
    });

    it('returns [] when the API payload has no products array', async () => {
      mockGet.mockResolvedValueOnce({ data: {} });
      const result = await offService.searchProducts('unique-query-2');
      expect(result).toEqual([]);
    });

    it('serves a cached result on the second identical call', async () => {
      mockGet.mockResolvedValueOnce({
        data: { products: [{ product_name: 'Cached' }] },
      });
      const first = await offService.searchProducts('milk');
      const second = await offService.searchProducts('milk');
      expect(first).toEqual(second);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('returns [] and warns with a status reason when the request fails', async () => {
      setIsAxiosError(true);
      mockGet.mockRejectedValue({ response: { status: 500 } });
      const result = await offService.searchProducts('failing-query-500');
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('status 500'),
      );
    });

    it('reports the error code when there is no HTTP status', async () => {
      setIsAxiosError(true);
      mockGet.mockRejectedValue({ code: 'ETIMEDOUT' });
      const result = await offService.searchProducts('failing-query-code');
      expect(result).toEqual([]);
      // no status -> shouldRetryRequest retries, then final throw is caught.
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ETIMEDOUT'));
    });

    it('reports "unknown error" for a non-axios failure', async () => {
      setIsAxiosError(false);
      mockGet.mockRejectedValue(new Error('boom'));
      const result = await offService.searchProducts('failing-query-unknown');
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown error'),
      );
    });
  });

  describe('fetchWithRetry (via fetchProductByBarcode)', () => {
    it('retries on a 429 and then succeeds', async () => {
      setIsAxiosError(true);
      mockGet
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({ data: { status: 1, product: { id: 'ok' } } });

      const result = await offService.fetchProductByBarcode('retry-1');
      expect(result).toEqual({ id: 'ok' });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('does not retry on a non-retryable status and throws', async () => {
      setIsAxiosError(true);
      mockGet.mockRejectedValueOnce({ response: { status: 404 } });
      await expect(offService.fetchProductByBarcode('no-retry')).rejects.toEqual({
        response: { status: 404 },
      });
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('gives up after exhausting retries', async () => {
      setIsAxiosError(true);
      mockGet.mockRejectedValue({ response: { status: 503 } });
      await expect(offService.fetchProductByBarcode('always-503')).rejects.toEqual({
        response: { status: 503 },
      });
      // initial attempt + 2 retries
      expect(mockGet).toHaveBeenCalledTimes(3);
    });
  });
});
