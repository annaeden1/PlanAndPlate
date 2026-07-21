export type ChainId = 'rami-levy' | 'shufersal' | 'yohananof' | 'osher-ad';

export interface ComparedItem {
  itemName: string; // original grocery-list name (English)
  matchedProductName: string; // Hebrew product name at the chain
  code: string;
  unitPrice: number;
  packagesAssumed: number;
  lineTotal: number;
  note?: string; // e.g. "likely a different package size at this chain"
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
  pricesAsOf: string; // ISO timestamp
  disclaimer: string;
}
