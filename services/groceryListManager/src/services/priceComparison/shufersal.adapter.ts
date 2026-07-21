import axios from 'axios';
import { ChainAdapter, ChainProduct } from '../../types/priceComparison.types';
import { parsePackageSize } from '../../utils/packageSize';

const SEARCH_URL = 'https://www.shufersal.co.il/online/he/search/results';
const REQUEST_TIMEOUT_MS = 10_000;

interface RawShufersalProduct {
  code?: string;
  name?: string;
  sku?: string;
  price?: { value?: number };
}

interface SearchResponse {
  results?: RawShufersalProduct[];
}

const toChainProduct = (raw: RawShufersalProduct): ChainProduct | null => {
  const price = raw.price?.value;
  if (typeof price !== 'number' || !raw.code) return null;
  // sku sometimes holds a valid 12-13 digit barcode (UPC/EAN)
  const sku = raw.sku ?? '';
  const name = raw.name ?? '';
  return {
    code: raw.code,
    barcode: /^\d{12,13}$/.test(sku) ? sku : null,
    name,
    price,
    ...parsePackageSize(name),
  };
};

const searchResults = async (query: string): Promise<ChainProduct[]> => {
  const res = await axios.get<SearchResponse>(SEARCH_URL, {
    params: { q: `${query}:relevance`, limit: 20 },
    headers: { Accept: 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
  });

  return (res.data.results ?? [])
    .map(toChainProduct)
    .filter((p): p is ChainProduct => p !== null);
};

export const shufersalAdapter: ChainAdapter = {
  id: 'shufersal',
  displayName: 'שופרסל',
  delivery: { fee: 50.9, note: 'כולל דמי שירות 15 ₪ להזמנות עד 750 ₪' },
  barcodeSearchable: false,

  search: searchResults,

  getByCode: async (code: string): Promise<ChainProduct | null> => {
    const numeric = code.replace(/^P_/, '');
    const results = await searchResults(numeric);
    return results.find((p) => p.code === code) ?? null;
  },

  getByBarcode: async (barcode: string): Promise<ChainProduct | null> => {
    const results = await searchResults(barcode);
    return results.find((p) => p.barcode === barcode) ?? null;
  },
};
