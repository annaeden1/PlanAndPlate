import { GroceryList } from '../../models/groceryList.model';
import { NotFoundError } from '../../types/errors';
import { GroceryItem } from '../../types/groceryList.types';
import {
  ChainAdapter,
  ChainComparison,
  ChainProduct,
  ComparedItem,
  PriceComparisonResult,
} from '../../types/priceComparison.types';
import { mapLimit } from '../../utils/concurrency';
import { packagesNeeded } from '../../utils/packageSize';
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

const toComparedItem = (item: GroceryItem, product: ChainProduct): ComparedItem => {
  // Package size is parsed once, in the adapter. Normalize the needed amount to
  // a whole number of packages; fall back to one when it's unknown or the units
  // aren't comparable (e.g. a needed count against a by-weight package).
  const packagesAssumed =
    product.packageQty && product.packageUnit
      ? packagesNeeded(item.quantity, item.unit, {
          packageQty: product.packageQty,
          packageUnit: product.packageUnit,
        }) ?? 1
      : 1;
  return {
    itemName: item.name,
    matchedProductName: product.name,
    code: product.code,
    unitPrice: product.price,
    packagesAssumed,
    lineTotal: round2(product.price * packagesAssumed),
  };
};

const priceItemAtChain = async (
  chain: ChainAdapter,
  { item, hebrewQuery, canonical }: ItemContext,
): Promise<ComparedItem | null> => {
  if (canonical) {
    if (chain.id === REFERENCE_CHAIN_ID && canonical.referenceProduct) {
      return toComparedItem(item, canonical.referenceProduct);
    }
    if (chain.barcodeSearchable !== false) {
      const byBarcode = await chain.getByBarcode(canonical.barcode);
      if (byBarcode) return toComparedItem(item, byBarcode);
    }
  }

  if (!hebrewQuery) return null;
  const match = await resolveItemForChain(item, chain, hebrewQuery);
  if (!match) return null;
  const product = match.product ?? (await chain.getByCode(match.code));
  return product ? toComparedItem(item, product) : null;
};

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
