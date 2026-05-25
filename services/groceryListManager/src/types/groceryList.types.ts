import { Category } from './categories';

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  inventoryQuantity: number;
  category: Category;
  checked: boolean;
  recipeCount: number;
}

export interface GroceryItemGroup {
  category: Category;
  count: number;
  items: GroceryItem[];
}
