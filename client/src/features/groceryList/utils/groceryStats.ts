import type { GroceryItemGroup } from '@/features/groceryList/types/grocery';

export interface GroceryStats {
  totalItems: number;
  inStockItems: number;
  itemsToBuy: number;
  percentage: number;

  hasInStockItems: boolean;
}

export const computeGroceryStats = (groups: GroceryItemGroup[]): GroceryStats => {
  const allItems = groups.flatMap((g) => g.items);
  const total = allItems.length;
  const inStock = allItems.filter((item) => item.inventoryQuantity >= item.quantity).length;

  return {
    totalItems: total,
    inStockItems: inStock,
    itemsToBuy: total - inStock,
    percentage: total === 0 ? 0 : Math.round((inStock / total) * 100),
    hasInStockItems: allItems.some(
      (item) => item.inventoryQuantity >= item.quantity || item.checked,
    ),
  };
};
