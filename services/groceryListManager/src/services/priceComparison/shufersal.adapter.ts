import axios from 'axios';
import { ChainAdapter, ChainProduct } from '../../types/priceComparison.types';

const SEARCH_URL = 'https://www.shufersal.co.il/online/he/search/results';
const REQUEST_TIMEOUT_MS = 10_000;

interface RawShufersalProduct {
  code?: string; // e.g. "P_4131074"
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
  const sku = raw.sku ?? '';
  return {
    code: raw.code,
    // sku is a full EAN only when 13 digits; short values are internal codes
    barcode: /^\d{12,13}$/.test(sku) ? sku : null,
    name: raw.name ?? '',
    price,
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
  // Delivery 35.90 + 15 service fee on orders under 750, verified 2026-07-13.
  delivery: { fee: 50.9, note: 'כולל דמי שירות 15 ₪ להזמנות עד 750 ₪' },

  search: searchResults,

  getByCode: async (code: string): Promise<ChainProduct | null> => {
    // Their search indexes the internal numeric code ("P_4131074" -> "4131074").
    const numeric = code.replace(/^P_/, '');
    const results = await searchResults(numeric);
    return results.find((p) => p.code === code) ?? null;
  },

  // Shufersal codes are internal, not EANs. Barcode search works only when a
  // product happens to expose its EAN as sku; often returns null (that's fine
  // — the caller falls back to a name search for this chain).
  getByBarcode: async (barcode: string): Promise<ChainProduct | null> => {
    const results = await searchResults(barcode);
    return results.find((p) => p.barcode === barcode) ?? null;
  },
};
