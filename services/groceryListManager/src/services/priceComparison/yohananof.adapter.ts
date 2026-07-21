import axios from 'axios';
import { ChainAdapter, ChainProduct } from '../../types/priceComparison.types';
import { parsePackageSize } from '../../utils/packageSize';

const GRAPHQL_URL = 'https://api.yochananof.co.il/graphql';
const REQUEST_TIMEOUT_MS = 10_000;

interface RawYohananofProduct {
  sku?: string;
  name?: string;
  price_range?: { minimum_price?: { final_price?: { value?: number } } };
}

interface GraphQLResponse {
  data?: { products?: { items?: RawYohananofProduct[] } };
}

const toChainProduct = (raw: RawYohananofProduct): ChainProduct | null => {
  const price = raw.price_range?.minimum_price?.final_price?.value;
  if (typeof price !== 'number' || !raw.sku) return null;
  const name = raw.name ?? '';
  return {
    code: raw.sku,
    barcode: raw.sku,
    name,
    price,
    ...parsePackageSize(name),
  };
};

const PRODUCT_FIELDS =
  'items { sku name price_range { minimum_price { final_price { value } } } }';

const runQuery = async (query: string): Promise<ChainProduct[]> => {
  const res = await axios.post<GraphQLResponse>(
    GRAPHQL_URL,
    { query },
    {
      headers: { Origin: 'https://yochananof.co.il' },
      timeout: REQUEST_TIMEOUT_MS,
    },
  );

  return (res.data.data?.products?.items ?? [])
    .map(toChainProduct)
    .filter((p): p is ChainProduct => p !== null);
};

const quote = (s: string): string => JSON.stringify(s);

export const yohananofAdapter: ChainAdapter = {
  id: 'yohananof',
  displayName: 'יוחננוף',
  delivery: { fee: 35.9, note: 'דמי משלוח משוערים' },

  search: (term: string) =>
    runQuery(
      `{ products(search: ${quote(term)}, pageSize: 20) { ${PRODUCT_FIELDS} } }`,
    ),

  getByCode: async (code: string): Promise<ChainProduct | null> => {
    const results = await runQuery(
      `{ products(filter: {sku: {eq: ${quote(code)}}}) { ${PRODUCT_FIELDS} } }`,
    );
    return results.find((p) => p.code === code) ?? null;
  },

  getByBarcode: async (barcode: string): Promise<ChainProduct | null> => {
    const results = await runQuery(
      `{ products(filter: {sku: {eq: ${quote(barcode)}}}) { ${PRODUCT_FIELDS} } }`,
    );
    return results.find((p) => p.barcode === barcode) ?? null;
  },
};
