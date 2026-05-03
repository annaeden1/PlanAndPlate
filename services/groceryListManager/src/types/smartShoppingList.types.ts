import { Category } from './categories';

export interface SpoonacularIngredient {
  id?: number;
  name: string;
  amount: number;
  unit: string;
  aisle?: string;
}

export interface SpoonacularRecipeInput {
  recipeId: string;
  servingsPlanned?: number;
  servingsOriginal?: number;
  ingredients: SpoonacularIngredient[];
}

export interface InventoryEntry {
  name: string;
  quantity: number;
  unit: string;
}

export interface RequiredIngredient {
  name: string;
  totalRequired: number;
  unit: string;
  category: Category;
  inventoryAvailable: number;
  deficit: number;
}

export interface MarketPackage {
  name: string;
  marketUnit: string | null;
  marketQuantity: number | null;
  marketSize: string | null;
  marketSizeInRecipeUnits: number | null;
}

export interface ShoppingLineItem {
  name: string;
  unit: string;
  category: Category;
  totalRequired: number;
  inventoryAvailable: number;
  deficit: number;
  marketUnit: string | null;
  marketQuantity: number;
  marketSize: string | null;
  marketSizeInRecipeUnits: number | null;
  totalAfterPurchase: number;
  leftoverAfterCooking: number;
}

export interface SmartShoppingResult {
  toBuy: ShoppingLineItem[];
  alreadyCovered: RequiredIngredient[];
  projectedInventory: InventoryEntry[];
}
