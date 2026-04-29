import { Category } from './categories';

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  inventoryQuantity: number;
  category: Category;
  checked: boolean;
  marketUnit?: string;
  marketQuantity?: number;
  marketSize?: string;
  marketSizeInRecipeUnits?: number;
}

export interface GroceryItemGroup {
  category: Category;
  count: number;
  items: GroceryItem[];
}
