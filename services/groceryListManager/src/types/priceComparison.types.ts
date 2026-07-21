export type ChainId = 'rami-levy' | 'shufersal' | 'yohananof' | 'osher-ad';

export interface ChainProduct {
  code: string;
  barcode: string | null;
  name: string;
  price: number;
  packageQty?: number;
  packageUnit?: 'g' | 'kg' | 'ml' | 'l' | 'piece';
}

export interface ChainAdapter {
  id: ChainId;
  displayName: string;
  delivery: {
    fee: number;
    note?: string;
  };
  barcodeSearchable?: boolean;
  search(term: string): Promise<ChainProduct[]>;
  getByCode(code: string): Promise<ChainProduct | null>;
  getByBarcode(barcode: string): Promise<ChainProduct | null>;
}

export interface ResolvedMatch {
  code: string;
  matchedName: string;
  confidence: number;
  product?: ChainProduct;
}

export interface ComparedItem {
  itemName: string;
  matchedProductName: string;
  code: string;
  unitPrice: number;
  packagesAssumed: number;
  lineTotal: number;
  note?: string;
}

export interface ChainComparison {
  chain: ChainId;
  displayName: string;
  items: ComparedItem[];
  missing: string[];
  subtotal: number;
  estimatedDelivery: number;
  deliveryNote?: string;
  total: number;
}

export interface PriceComparisonResult {
  currency: 'ILS';
  chains: ChainComparison[];
  pricesAsOf: string;
  disclaimer: string;
}
