import { GroceryList } from '../../models/groceryList.model';
import { NotFoundError } from '../../types/errors';
import { GroceryItem } from '../../types/groceryList.types';
import {
  ChainAdapter,
  ChainComparison,
  ComparedItem,
  PriceComparisonResult,
} from '../../types/priceComparison.types';
import { mapLimit } from '../../utils/concurrency';
import { CHAIN_ADAPTERS } from './chains';
import {
  CanonicalMatch,
  getHebrewQuery,
  resolveCanonical,
  resolveItemForChain,
} from './resolver.service';

const REFERENCE_CHAIN_ID = 'rami-levy';

const ITEM_RESOLUTION_CONCURRENCY = 5;

interface ItemContext {
  item: GroceryItem;
  hebrewQuery: string | null;
  canonical: CanonicalMatch | null;
}

const DISCLAIMER =
  'המחירים הם הערכה בלבד ועשויים להשתנות באתר הרשת. מבצעים ומחירי מועדון אינם כלולים.';

const round2 = (n: number): number => Math.round(n * 100) / 100;

const OUTLIER_RATIO = 1.5;
const OUTLIER_NOTE =
  'ייתכן שהמוצר שנמצא כאן הוא בגודל אריזה שונה (בדרך כלל גדול יותר) מאשר ברשתות האחרות, ולכן המחיר גבוה יותר';

const flagPackageSizeOutliers = (chains: ChainComparison[]): void => {
  const pricesByItem = new Map<string, number[]>();
  for (const chain of chains) {
    for (const item of chain.items) {
      const prices = pricesByItem.get(item.itemName) ?? [];
      prices.push(item.unitPrice);
      pricesByItem.set(item.itemName, prices);
    }
  }

  for (const chain of chains) {
    for (const item of chain.items) {
      const prices = pricesByItem.get(item.itemName);
      if (!prices || prices.length < 2) continue;
      const sorted = [...prices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      if (median > 0 && item.unitPrice > median * OUTLIER_RATIO) {
        item.note = OUTLIER_NOTE;
      }
    }
  }
};

const toComparedItem = (
  item: GroceryItem,
  product: { name: string; code: string; price: number },
): ComparedItem => {
  const packagesAssumed = 1; 
  return {
    itemName: item.name,
    matchedProductName: product.name,
    code: product.code,
    unitPrice: product.price,
    packagesAssumed,
    lineTotal: round2(product.price * packagesAssumed),
  };
};

/**
 * Prices one item at one chain. Tries the shared canonical barcode first
 * (no LLM); only falls back to a per-chain name search + LLM pick when the
 * barcode isn't stocked here. Returns null when the item can't be priced.
 */
const priceItemAtChain = async (
  chain: ChainAdapter,
  { item, hebrewQuery, canonical }: ItemContext,
): Promise<ComparedItem | null> => {
  // Fast path: reuse the canonical product, no LLM call.
  if (canonical) {
    // The reference chain already fetched this product while resolving the
    // canonical — reuse it instead of searching a second time.
    if (chain.id === REFERENCE_CHAIN_ID && canonical.referenceProduct) {
      return toComparedItem(item, canonical.referenceProduct);
    }
    // Skip the barcode lookup on chains whose catalog isn't EAN-searchable
    // (e.g. Shufersal) — it would almost always miss. Go to the name fallback.
    if (chain.barcodeSearchable !== false) {
      const byBarcode = await chain.getByBarcode(canonical.barcode);
      if (byBarcode) return toComparedItem(item, byBarcode);
    }
  }

  // Fallback: this chain doesn't stock the barcode — resolve it on its own.
  if (!hebrewQuery) return null;
  const match = await resolveItemForChain(item, chain, hebrewQuery);
  if (!match) return null;
  // A fresh resolution already fetched the product (with its live price);
  // only fall back to getByCode on a cache hit, where the price isn't in hand.
  const product = match.product ?? (await chain.getByCode(match.code));
  return product ? toComparedItem(item, product) : null;
};

/** Prices the basket at one chain. Never throws — a failing chain reports all items missing. */
const compareChain = async (
  chain: ChainAdapter,
  items: ItemContext[],
): Promise<ChainComparison> => {
  const compared: ComparedItem[] = [];
  const missing: string[] = [];

  for (const ctx of items) {
    try {
      const line = await priceItemAtChain(chain, ctx);
      if (line) compared.push(line);
      else missing.push(ctx.item.name);
    } catch (error) {
      console.error(
        `price comparison: chain ${chain.id} failed for "${ctx.item.name}":`,
        error,
      );
      missing.push(ctx.item.name);
    }
  }

  const subtotal = round2(compared.reduce((sum, line) => sum + line.lineTotal, 0));

  return {
    chain: chain.id,
    displayName: chain.displayName,
    items: compared,
    missing,
    subtotal,
    estimatedDelivery: chain.delivery.fee,
    ...(chain.delivery.note ? { deliveryNote: chain.delivery.note } : {}),
    total: round2(subtotal + chain.delivery.fee),
  };
};

export const comparePrices = async (
  userId: string,
): Promise<PriceComparisonResult> => {
  const list = await GroceryList.findOne({ userId });
  if (!list || list.items.length === 0) {
    throw new NotFoundError('Grocery list is empty');
  }

  const toBuy = list.items.filter((item) => !item.checked);
  const referenceChain = CHAIN_ADAPTERS.find(
    (c) => c.id === REFERENCE_CHAIN_ID,
  );

  // Per item: translate once, then resolve one canonical product (1 LLM pick)
  // whose barcode is reused to price every chain. Both are shared across chains.
  const contexts: ItemContext[] = await mapLimit(
    toBuy,
    ITEM_RESOLUTION_CONCURRENCY,
    async (item): Promise<ItemContext> => {
      const hebrewQuery = await getHebrewQuery(item.name.toLowerCase().trim());
      const canonical =
        hebrewQuery && referenceChain
          ? await resolveCanonical(item, referenceChain, hebrewQuery)
          : null;
      return { item, hebrewQuery, canonical };
    },
  );

  const chains = await Promise.all(
    CHAIN_ADAPTERS.map((chain) => compareChain(chain, contexts)),
  );

  flagPackageSizeOutliers(chains);

  // Complete baskets first (fewest missing items), then cheapest.
  // An incomplete basket's low total is not comparable to a full one.
  chains.sort(
    (a, b) => a.missing.length - b.missing.length || a.total - b.total,
  );

  return {
    currency: 'ILS',
    chains,
    pricesAsOf: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
};
