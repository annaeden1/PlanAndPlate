import axios from 'axios';
import { ChainAdapter, ChainProduct } from '../../types/priceComparison.types';

const CATALOG_URL = 'https://www.rami-levy.co.il/api/catalog';
const ONLINE_STORE_ID = '331'; // online store; prices are uniform across stores
const REQUEST_TIMEOUT_MS = 10_000;

interface RawCatalogProduct {
  id: number;
  barcode: number;
  name?: string;
  price?: { price?: number };
  gs?: { internal_product_description?: string };
}

interface CatalogResponse {
  status: number;
  total: number;
  data?: RawCatalogProduct[];
}

const toChainProduct = (raw: RawCatalogProduct): ChainProduct | null => {
  const price = raw.price?.price;
  if (typeof price !== 'number' || !raw.barcode) return null;
  return {
    code: String(raw.barcode), // Rami Levy's catalog is queryable by barcode
    barcode: String(raw.barcode),
    name: raw.name ?? raw.gs?.internal_product_description ?? '',
    price,
  };
};

const searchCatalog = async (query: string): Promise<ChainProduct[]> => {
  const res = await axios.post<CatalogResponse>(
    CATALOG_URL,
    { q: query, store: ONLINE_STORE_ID, from: 0, aggs: 1 },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  return (res.data.data ?? [])
    .map(toChainProduct)
    .filter((p): p is ChainProduct => p !== null);
};

export const ramiLevyAdapter: ChainAdapter = {
  id: 'rami-levy',
  displayName: 'רמי לוי',
  // Online delivery fee, verified 2026-07-13 (raised May 2026, no minimum order).
  delivery: { fee: 35.9 },

  search: searchCatalog,

  getByCode: async (code: string): Promise<ChainProduct | null> => {
    const results = await searchCatalog(code);
    return results.find((p) => p.code === code) ?? null;
  },

  // Rami Levy's catalog is queryable by barcode (code === barcode).
  getByBarcode: async (barcode: string): Promise<ChainProduct | null> => {
    const results = await searchCatalog(barcode);
    return results.find((p) => p.barcode === barcode) ?? null;
  },
};
