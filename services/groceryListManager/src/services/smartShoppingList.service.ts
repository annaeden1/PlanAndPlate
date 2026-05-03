import { Category, normalizeAisle } from '../types/categories';
import {
  InventoryEntry,
  RequiredIngredient,
  ShoppingLineItem,
  SmartShoppingResult,
  SpoonacularRecipeInput,
} from '../types/smartShoppingList.types';
import { resolveMarketPackages } from './marketMapping.service';

const norm = (s: string): string => s.toLowerCase().trim();

export const aggregateRequirements = (
  recipes: SpoonacularRecipeInput[],
): Map<string, { totalRequired: number; unit: string; category: Category; name: string }> => {
  const agg = new Map<
    string,
    { totalRequired: number; unit: string; category: Category; name: string }
  >();

  for (const recipe of recipes) {
    const scale =
      recipe.servingsPlanned && recipe.servingsOriginal && recipe.servingsOriginal > 0
        ? recipe.servingsPlanned / recipe.servingsOriginal
        : 1;

    for (const ing of recipe.ingredients) {
      const name = norm(ing.name);
      const unit = norm(ing.unit || 'piece');
      const key = `${name}::${unit}`;
      const qty = ing.amount * scale;
      const category = normalizeAisle(ing.aisle ?? '');

      if (agg.has(key)) {
        agg.get(key)!.totalRequired += qty;
      } else {
        agg.set(key, { totalRequired: qty, unit, category, name });
      }
    }
  }
  return agg;
};

export const applyInventory = (
  required: ReturnType<typeof aggregateRequirements>,
  inventory: InventoryEntry[],
): RequiredIngredient[] => {
  const invMap = new Map<string, number>();
  for (const inv of inventory) {
    invMap.set(`${norm(inv.name)}::${norm(inv.unit)}`, inv.quantity);
  }

  const out: RequiredIngredient[] = [];
  for (const [key, r] of required) {
    const inventoryAvailable = invMap.get(key) ?? 0;
    const deficit = Math.max(0, r.totalRequired - inventoryAvailable);
    out.push({
      name: r.name,
      unit: r.unit,
      category: r.category,
      totalRequired: r.totalRequired,
      inventoryAvailable,
      deficit,
    });
  }
  return out;
};

const buildLine = (
  req: RequiredIngredient,
  pkg: {
    marketUnit: string | null;
    marketQuantity: number | null;
    marketSize: string | null;
    marketSizeInRecipeUnits: number | null;
  } | null,
): ShoppingLineItem => {
  // Deterministic package count + leftover math.
  // Ignore pkg.marketQuantity from LLM — recompute from deficit / sizeInRecipeUnits.
  let marketQuantity = 0;
  let totalAfterPurchase = req.inventoryAvailable;
  let leftoverAfterCooking = req.inventoryAvailable - req.totalRequired;

  if (
    pkg &&
    pkg.marketUnit &&
    pkg.marketSizeInRecipeUnits != null &&
    pkg.marketSizeInRecipeUnits > 0
  ) {
    marketQuantity = Math.ceil(req.deficit / pkg.marketSizeInRecipeUnits);
    const purchased = marketQuantity * pkg.marketSizeInRecipeUnits;
    totalAfterPurchase = req.inventoryAvailable + purchased;
    leftoverAfterCooking = totalAfterPurchase - req.totalRequired;
  } else if (req.deficit > 0) {
    // No mapping resolvable → fall back to raw deficit as "1 unit of unit".
    marketQuantity = 1;
    totalAfterPurchase = req.inventoryAvailable + req.deficit;
    leftoverAfterCooking = 0;
  }

  return {
    name: req.name,
    unit: req.unit,
    category: req.category,
    totalRequired: req.totalRequired,
    inventoryAvailable: req.inventoryAvailable,
    deficit: req.deficit,
    marketUnit: pkg?.marketUnit ?? null,
    marketQuantity,
    marketSize: pkg?.marketSize ?? null,
    marketSizeInRecipeUnits: pkg?.marketSizeInRecipeUnits ?? null,
    totalAfterPurchase,
    leftoverAfterCooking: Math.max(0, leftoverAfterCooking),
  };
};

export const generateSmartShoppingList = async (
  recipes: SpoonacularRecipeInput[],
  inventory: InventoryEntry[],
): Promise<SmartShoppingResult> => {
  const aggregated = aggregateRequirements(recipes);
  const required = applyInventory(aggregated, inventory);

  const alreadyCovered = required.filter((r) => r.deficit <= 0);
  const needsBuy = required.filter((r) => r.deficit > 0);

  const pkgMap = await resolveMarketPackages(
    needsBuy.map((r) => ({ name: r.name, quantity: r.deficit, unit: r.unit })),
  );

  const toBuy: ShoppingLineItem[] = needsBuy.map((r) => {
    const pkg = pkgMap.get(`${r.name}::${r.unit}`) ?? null;
    return buildLine(r, pkg);
  });

  const projectedInventory: InventoryEntry[] = [
    ...alreadyCovered.map((r) => ({
      name: r.name,
      unit: r.unit,
      quantity: Math.max(0, r.inventoryAvailable - r.totalRequired),
    })),
    ...toBuy.map((l) => ({
      name: l.name,
      unit: l.unit,
      quantity: l.leftoverAfterCooking,
    })),
  ];

  return { toBuy, alreadyCovered, projectedInventory };
};
