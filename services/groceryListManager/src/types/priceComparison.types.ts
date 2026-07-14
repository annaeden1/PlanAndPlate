export type ChainId = 'rami-levy' | 'shufersal' | 'yohananof' | 'osher-ad';

/** A product as returned by a supermarket chain's catalog. */
export interface ChainProduct {
  code: string; // chain-specific product code — the re-pricing key at that chain
  barcode: string | null; // EAN when the chain exposes it (not all do)
  name: string;
  price: number; // ILS
}

/** One supermarket chain integration. */
export interface ChainAdapter {
  id: ChainId;
  displayName: string; // Hebrew, for the UI
  delivery: {
    fee: number; // ILS, 0 when the chain has no online delivery
    note?: string; // e.g. service fees, or "in-store prices"
  };
  // False when the chain's catalog can't be searched by EAN (its codes are
  // internal, e.g. Shufersal). Lets the pricer skip a getByBarcode that would
  // almost always miss and go straight to the name-search fallback.
  barcodeSearchable?: boolean;
  search(term: string): Promise<ChainProduct[]>;
  getByCode(code: string): Promise<ChainProduct | null>;
  // Look up a product by its EAN barcode. Returns null when the chain does
  // not stock (or cannot be searched by) that barcode. Enables cross-chain
  // reuse of one canonical product without a per-chain LLM pick.
  getByBarcode(barcode: string): Promise<ChainProduct | null>;
}

/** A grocery-list item resolved to a product at a specific chain. */
export interface ResolvedMatch {
  code: string;
  matchedName: string;
  confidence: number; // 0..1 from the LLM pick
  // The priced product, present only on a fresh (non-cached) resolution — the
  // search already fetched it, so the caller can skip a redundant getByCode.
  product?: ChainProduct;
}

export interface ComparedItem {
  itemName: string; // original grocery-list name (English)
  matchedProductName: string; // Hebrew product name at the chain
  code: string;
  unitPrice: number;
  packagesAssumed: number; // always 1 in v1
  lineTotal: number;
  // Set when this item's price is a cross-chain outlier — likely a different
  // package size was matched at this chain, not a real price difference.
  note?: string;
}

/** One chain's priced basket. */
export interface ChainComparison {
  chain: ChainId;
  displayName: string;
  items: ComparedItem[];
  missing: string[]; // grocery item names we could not price at this chain
  subtotal: number;
  estimatedDelivery: number;
  deliveryNote?: string;
  total: number;
}

/** Full multi-chain comparison, ranked cheapest-first. */
export interface PriceComparisonResult {
  currency: 'ILS';
  chains: ChainComparison[];
  pricesAsOf: string; // ISO timestamp
  disclaimer: string;
}
